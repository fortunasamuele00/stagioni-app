import { useSyncExternalStore } from 'react';
import { db } from './db';
import { merge } from './merge';
import { applyRemote, setFlusher } from './store';
import type { Settings } from './types';

export interface SyncState { pending: number; busy: boolean; error: string | null; configured: boolean; pulledAt: number | null }
let state: SyncState = { pending: 0, busy: false, error: null, configured: false, pulledAt: null };
const subs = new Set<() => void>();
function set(patch: Partial<SyncState>) { state = { ...state, ...patch }; subs.forEach((f) => f()); }
export const useSync = () => useSyncExternalStore((f) => { subs.add(f); return () => subs.delete(f); }, () => state);

export const isConfigured = (s: Settings) => Boolean(s.owner.trim() && s.repo.trim() && s.token.trim());

class SyncError extends Error {}

function encode(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}
function decode(b64: string): string {
  const bin = atob(b64.replace(/\s/g, ''));
  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
}

// Il token viaggia solo nell'header Authorization: mai in messaggi, log o URL.
async function api(s: Settings, path: string, init?: RequestInit): Promise<Response> {
  const url = `https://api.github.com/repos/${encodeURIComponent(s.owner.trim())}/${encodeURIComponent(s.repo.trim())}/contents/${path.split('/').filter(Boolean).map(encodeURIComponent).join('/')}`;
  let res: Response;
  try {
    res = await fetch(url, {
      ...init,
      cache: 'no-store',
      headers: { Accept: 'application/vnd.github+json', Authorization: `Bearer ${s.token.trim()}`, 'X-GitHub-Api-Version': '2022-11-28' },
    });
  } catch {
    throw new SyncError('Sei offline: le modifiche restano in coda e partono appena torna la rete.');
  }
  if (res.status === 401) throw new SyncError('GitHub rifiuta il token. Controllalo nelle impostazioni.');
  if (res.status === 403) {
    const write = init?.method === 'PUT';
    throw new SyncError(write
      ? 'Il token legge il repo ma non può scriverci: nel token metti Contents su "Read and write".'
      : 'Il token non può leggere il repo: manca il permesso Contents, oppure il repo non è tra quelli scelti nel token.');
  }
  return res;
}

interface RemoteFile { data: unknown; sha: string }

async function getFile(s: Settings, path: string): Promise<RemoteFile | null> {
  const res = await api(s, path);
  if (res.status === 404) return null;
  if (!res.ok) throw new SyncError(`GitHub ha risposto ${res.status} leggendo ${path}.`);
  const j = (await res.json()) as { content?: string; sha: string };
  try {
    return { data: JSON.parse(decode(j.content ?? '')), sha: j.sha };
  } catch {
    throw new SyncError(`${path} sul repo non è un JSON valido.`);
  }
}

async function listDir(s: Settings, dir: string): Promise<{ path: string; sha: string }[]> {
  const res = await api(s, dir);
  if (res.status === 404) return [];
  if (!res.ok) throw new SyncError(`GitHub ha risposto ${res.status} leggendo ${dir}/.`);
  const list = (await res.json()) as { type: string; path: string; sha: string }[];
  return Array.isArray(list) ? list.filter((f) => f.type === 'file' && f.path.endsWith('.json')) : [];
}

export async function refreshSync() {
  const [q, s] = await Promise.all([db.queue(), db.settings()]);
  set({ pending: q.length, configured: isConfigured(s) });
}

/** Legge dal repo le versioni più recenti, comprese quelle scritte dalle attività pianificate. */
export async function pull(): Promise<void> {
  const s = await db.settings();
  await refreshSync();
  if (!isConfigured(s) || !navigator.onLine || state.busy) return;
  set({ busy: true, error: null });
  try {
    const pending = new Set((await db.queue()).map((q) => q.path));
    const stored = new Map((await db.files()).map((f) => [f.path, f.sha]));
    const take = async (path: string, sha?: string) => {
      if (pending.has(path) || (sha && stored.get(path) === sha)) return;
      const f = await getFile(s, path);
      if (f) await applyRemote(path, f.data, f.sha);
    };
    await take('season.json');
    await take('wishlist.json');
    for (const dir of ['episodes', 'days']) for (const f of await listDir(s, dir)) await take(f.path, f.sha);
    set({ pulledAt: Date.now() });
  } catch (e) {
    set({ error: e instanceof SyncError ? e.message : 'Lettura dal repo non riuscita. Riprovo alla prossima apertura.' });
  } finally {
    set({ busy: false });
  }
  await flush();
}

/** Svuota la coda. Senza rete o senza token non fa nulla: le modifiche aspettano. */
export async function flush(): Promise<void> {
  if (state.busy) return;
  const s = await db.settings();
  await refreshSync();
  if (!isConfigured(s) || !navigator.onLine) return;
  set({ busy: true, error: null });
  try {
    for (const item of await db.queue()) {
      const local = await db.file(item.path);
      if (!local) { await db.dequeue(item.path); continue; }
      const remote = await getFile(s, item.path);
      let data = local.data;
      if (remote && remote.sha !== local.sha) {
        data = merge(item.path, local.data, remote.data);
        await applyRemote(item.path, data, local.sha);
      }
      const body = JSON.stringify(data, null, 2) + '\n';
      const res = await api(s, item.path, { method: 'PUT', body: JSON.stringify({ message: item.message, content: encode(body), sha: remote?.sha }) });
      if (res.status === 404) throw new SyncError('Repo non trovato: controlla utente e nome del repo, e che il token lo copra.');
      if (res.status === 409 || res.status === 422) throw new SyncError(`${item.path} è cambiato sul repo mentre salvavo. Riprovo tra poco.`);
      if (!res.ok) throw new SyncError(`GitHub ha risposto ${res.status} salvando ${item.path}.`);
      const sha = ((await res.json()) as { content: { sha: string } }).content.sha;
      // Se nel frattempo l'hai modificato di nuovo, resta in coda per il prossimo giro.
      const now = await db.file(item.path);
      await db.putFile({ path: item.path, data: now?.data ?? data, sha });
      if (JSON.stringify(now?.data) === JSON.stringify(data)) await db.dequeue(item.path);
      await refreshSync();
    }
  } catch (e) {
    set({ error: e instanceof SyncError ? e.message : 'Invio non riuscito. Riprovo alla prossima modifica.' });
  } finally {
    set({ busy: false });
    await refreshSync();
  }
  if (state.pending > 0 && !state.error) scheduleFlush(2000);
}

let timer: number | undefined;
/** Le modifiche ravvicinate (per esempio mentre scrivi) partono insieme dopo un attimo di pausa. */
export function scheduleFlush(ms = 1200) {
  window.clearTimeout(timer);
  timer = window.setTimeout(() => void flush(), ms);
}
setFlusher(() => { void refreshSync(); scheduleFlush(); });

/** Prova il token leggendo la radice del repo, senza scrivere nulla. */
export async function testConnection(s: Settings): Promise<string> {
  if (!isConfigured(s)) return 'Compila utente, repo e token.';
  try {
    const res = await api(s, '');
    if (res.ok) return 'Collegato: il repo risponde.';
    if (res.status === 404) return 'Repo non trovato: controlla il nome, e che il token lo includa.';
    return `GitHub ha risposto ${res.status}.`;
  } catch (e) {
    return e instanceof Error ? e.message : 'Collegamento non riuscito.';
  }
}
