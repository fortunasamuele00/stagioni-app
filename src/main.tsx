import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import { App } from './App';
import { db } from './db';
import { applyRemote, getModel, loadLocal } from './store';
import { isConfigured, pull } from './sync';
import './styles.css';

// Su iPhone l'app installata può restare ferma su una versione vecchia: cerco aggiornamenti
// all'apertura e ogni volta che torna in primo piano. Con autoUpdate la pagina si ricarica da sola.
registerSW({
  immediate: true,
  onRegisteredSW(_url, reg) {
    if (!reg) return;
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') void reg.update(); });
  },
});

// Solo in sviluppo e senza repo collegato: carica i file di seed-data/ per provare l'app in locale.
async function devSeed() {
  if (!import.meta.env.DEV || getModel().season || isConfigured(await db.settings())) return;
  for (const path of ['season.json', 'wishlist.json', 'episodes/e01.json']) {
    const res = await fetch(`/seed/${path}`);
    if (res.ok) await applyRemote(path, await res.json());
  }
}

void loadLocal().then(devSeed).then(() => pull());

createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>);
