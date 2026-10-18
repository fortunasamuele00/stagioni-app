import { useEffect, useState } from 'react';
import { db, defaultSettings } from '../db';
import { flush, pull, testConnection, useSync } from '../sync';
import type { Settings } from '../types';
import { Icon } from '../ui/Icon';

export function SettingsScreen({ onClose, first }: { onClose?: () => void; first?: boolean }) {
  const [s, setS] = useState<Settings>(defaultSettings);
  const [status, setStatus] = useState('');
  const sync = useSync();
  useEffect(() => { void db.settings().then(setS); }, []);

  const store = async () => { await db.saveSettings({ owner: s.owner.trim(), repo: s.repo.trim(), token: s.token.trim() }); };
  const test = async () => { await store(); setStatus('Provo…'); setStatus(await testConnection(s)); };
  const saveAndSync = async () => { await store(); setStatus('Salvato. Leggo il repo…'); await pull(); await flush(); setStatus('Fatto.'); };

  return (
    <div className="settings">
      <div className="topbar">
        <h1 className="page-title">{first ? 'Collega il repo' : 'Impostazioni'}</h1>
        {onClose && <button className="icon-btn" onClick={onClose} aria-label="Chiudi impostazioni"><Icon name="x" /></button>}
      </div>
      {first && <p className="muted" style={{ padding: '4px 4px 0' }}>La stagione, i giorni e gli episodi stanno nel repo privato su GitHub. Inserisci i dati una volta: restano su questo telefono.</p>}

      <div className="card" style={{ marginTop: 20, display: 'grid', gap: 16 }}>
        <label className="field"><span>Utente GitHub</span>
          <input value={s.owner} onChange={(e) => setS({ ...s, owner: e.target.value })} autoCapitalize="none" autoCorrect="off" spellCheck={false} placeholder="es. fortunasamuele00" />
        </label>
        <label className="field"><span>Repo dei dati</span>
          <input value={s.repo} onChange={(e) => setS({ ...s, repo: e.target.value })} autoCapitalize="none" autoCorrect="off" spellCheck={false} />
        </label>
        <label className="field"><span>Token</span>
          <input type="password" value={s.token} onChange={(e) => setS({ ...s, token: e.target.value })} autoComplete="off" autoCapitalize="none" spellCheck={false} placeholder="github_pat_…" />
          <small>Token fine-grained limitato a questo repo, con Contents su "Read and write". Resta solo su questo telefono, in IndexedDB.</small>
        </label>
        <div className="row" style={{ marginTop: 0 }}>
          <button className="btn" onClick={() => void saveAndSync()}>Salva e sincronizza</button>
          <button className="btn ghost" onClick={() => void test()}>Prova collegamento</button>
        </div>
        {status && <p className="status" role="status">{status}</p>}
      </div>

      {!first && (
        <div className="card mt">
          <p style={{ font: 'var(--t-head)' }}>Sincronizzazione</p>
          <p className="status">{sync.busy ? 'In corso…' : sync.pending ? `${sync.pending} ${sync.pending === 1 ? 'file' : 'file'} in coda` : 'Tutto inviato.'}</p>
          {sync.error && <p className="status err">{sync.error}</p>}
          <div className="row"><button className="btn ghost" onClick={() => void pull()}>Sincronizza ora</button></div>
        </div>
      )}
    </div>
  );
}
