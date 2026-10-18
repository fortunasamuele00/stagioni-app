import { useSyncExternalStore } from 'react';
import { db } from './db';
import type { Day, Episode, Season, Wishlist } from './types';

/** Tutto quello che l'app mostra, ricostruito dalla copia locale dei file del repo. */
export interface Model {
  ready: boolean;
  season?: Season;
  days: Record<string, Day>;
  episodes: Record<number, Episode>;
  wishlist: Wishlist;
}

const files = new Map<string, unknown>();
let model: Model = { ready: false, days: {}, episodes: {}, wishlist: { items: [] } };
const subs = new Set<() => void>();

function rebuild() {
  const days: Record<string, Day> = {};
  const episodes: Record<number, Episode> = {};
  for (const [path, data] of files) {
    const d = /^days\/(\d{4}-\d{2}-\d{2})\.json$/.exec(path);
    if (d) { days[d[1]] = data as Day; continue; }
    const e = /^episodes\/e(\d+)\.json$/.exec(path);
    if (e) episodes[Number(e[1])] = data as Episode;
  }
  model = {
    ready: true,
    season: files.get('season.json') as Season | undefined,
    days,
    episodes,
    wishlist: (files.get('wishlist.json') as Wishlist | undefined) ?? { items: [] },
  };
  subs.forEach((f) => f());
}

export const useModel = () => useSyncExternalStore((f) => { subs.add(f); return () => subs.delete(f); }, () => model);
export const getModel = () => model;

export async function loadLocal() {
  for (const f of await db.files()) files.set(f.path, f.data);
  rebuild();
}

/** Scrive una versione arrivata da GitHub (o unita con quella locale) senza metterla in coda. */
export async function applyRemote(path: string, data: unknown, sha?: string) {
  files.set(path, data);
  await db.putFile({ path, data, sha });
  rebuild();
}

let flusher: () => void = () => {};
export const setFlusher = (f: () => void) => { flusher = f; };

/** Salva una modifica fatta dall'app: copia locale subito, coda per GitHub, invio appena possibile. */
export async function save(path: string, data: unknown, message: string) {
  files.set(path, data);
  rebuild();
  const prev = await db.file(path);
  await db.putFile({ path, data, sha: prev?.sha });
  await db.enqueue({ path, message });
  flusher();
}

export const dayPath = (iso: string) => `days/${iso}.json`;
export const episodePath = (n: number) => `episodes/e${String(n).padStart(2, '0')}.json`;
