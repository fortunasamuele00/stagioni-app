import { useEffect, useState } from 'react';
import { EpisodeScreen } from './screens/EpisodeScreen';
import { SeasonScreen } from './screens/SeasonScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { Today } from './screens/Today';
import { WishlistScreen } from './screens/WishlistScreen';
import { useModel } from './store';
import { pull, useSync } from './sync';
import { Icon } from './ui/Icon';

const TABS = [['oggi', 'Oggi'], ['stagione', 'Stagione'], ['episodio', 'Episodio'], ['lista', 'Lista']] as const;
type Tab = (typeof TABS)[number][0] | 'impostazioni';
const fromHash = (): Tab => { const h = location.hash.slice(1); return (TABS.some(([k]) => k === h) || h === 'impostazioni' ? h : 'oggi') as Tab; };

function SyncChip({ onClick }: { onClick: () => void }) {
  const s = useSync();
  const [online, setOnline] = useState(navigator.onLine);
  useEffect(() => {
    const on = () => setOnline(navigator.onLine);
    window.addEventListener('online', on); window.addEventListener('offline', on);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', on); };
  }, []);
  const [cls, text] = !s.configured ? ['wait', 'Non collegato']
    : s.error ? ['err', 'Sync da controllare']
      : s.busy ? ['wait', 'Sincronizzo…']
        : s.pending ? ['wait', online ? `${s.pending} in coda` : `Offline · ${s.pending} in coda`]
          : ['', online ? 'Sincronizzato' : 'Offline'];
  return (
    <button className={`sync-row ${cls}`} onClick={onClick} aria-label={`${text}. Apri le impostazioni`}>
      <span className="state"><i />{text}</span>
      <span className="go"><Icon name="impostazioni" size={18} />Impostazioni</span>
    </button>
  );
}

export function App() {
  const { ready, season } = useModel();
  const sync = useSync();
  const [tab, setTab] = useState<Tab>(fromHash);
  useEffect(() => { const f = () => setTab(fromHash()); window.addEventListener('hashchange', f); return () => window.removeEventListener('hashchange', f); }, []);
  const go = (t: Tab) => { location.hash = t; setTab(t); window.scrollTo(0, 0); };

  // All'apertura e quando l'app torna in primo piano legge il repo: così vede anche cosa hanno scritto le attività pianificate.
  useEffect(() => {
    const refresh = () => { if (document.visibilityState === 'visible') void pull(); };
    document.addEventListener('visibilitychange', refresh);
    window.addEventListener('online', refresh);
    return () => { document.removeEventListener('visibilitychange', refresh); window.removeEventListener('online', refresh); };
  }, []);

  if (!ready) return null;
  if (!season) {
    return (
      <main className="app">
        {sync.busy ? <p className="empty">Leggo la stagione dal repo…</p> : <SettingsScreen first />}
        {sync.error && <p className="status err" style={{ padding: '0 4px' }}>{sync.error}</p>}
      </main>
    );
  }

  return (
    <>
      <main className="app">
        {tab === 'oggi' && <Today sync={<SyncChip onClick={() => go('impostazioni')} />} />}
        {tab === 'stagione' && <SeasonScreen />}
        {tab === 'episodio' && <EpisodeScreen />}
        {tab === 'lista' && <WishlistScreen />}
        {tab === 'impostazioni' && <SettingsScreen onClose={() => go('oggi')} />}
      </main>
      <nav className="seg" aria-label="Sezioni">
        {TABS.map(([k, label]) => <button key={k} aria-current={tab === k ? 'page' : undefined} onClick={() => go(k)}>{label}</button>)}
      </nav>
    </>
  );
}
