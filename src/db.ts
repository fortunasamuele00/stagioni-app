import { openDB, type DBSchema } from 'idb';
import type { Settings } from './types';

/** Copia locale di un file del repo. `sha` è quello dell'ultima versione vista su GitHub. */
export interface StoredFile { path: string; data: unknown; sha?: string }
/** Un file da mandare su GitHub. Il contenuto si prende dalla copia locale al momento dell'invio. */
export interface QueueItem { path: string; message: string }

interface Schema extends DBSchema {
  files: { key: string; value: StoredFile };
  queue: { key: string; value: QueueItem };
  kv: { key: string; value: unknown };
}

const dbp = openDB<Schema>('stagioni', 1, {
  upgrade(db) {
    db.createObjectStore('files', { keyPath: 'path' });
    db.createObjectStore('queue', { keyPath: 'path' });
    db.createObjectStore('kv');
  },
});

export const defaultSettings: Settings = { owner: '', repo: 'stagioni-data', token: '' };

export const db = {
  async files() { return (await dbp).getAll('files'); },
  async file(path: string) { return (await dbp).get('files', path); },
  async putFile(f: StoredFile) { await (await dbp).put('files', f); },
  async queue() { return (await dbp).getAll('queue'); },
  async enqueue(item: QueueItem) { await (await dbp).put('queue', item); },
  async dequeue(path: string) { await (await dbp).delete('queue', path); },
  async settings(): Promise<Settings> { return { ...defaultSettings, ...((await (await dbp).get('kv', 'settings')) as Partial<Settings> | undefined) }; },
  async saveSettings(s: Settings) { await (await dbp).put('kv', s, 'settings'); },
};
