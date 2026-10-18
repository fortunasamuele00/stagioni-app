import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import { App } from './App';
import { db } from './db';
import { applyRemote, getModel, loadLocal } from './store';
import { isConfigured, pull } from './sync';
import './styles.css';

registerSW({ immediate: true });

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
