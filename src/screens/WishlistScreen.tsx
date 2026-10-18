import { useEffect, useState } from 'react';
import { diffDays, theDay, todayISO } from '../dates';
import { save, useModel } from '../store';
import type { WishItem } from '../types';
import { Icon } from '../ui/Icon';

const WAIT = 30;
const msg = 'Lista dei 30 giorni';

export function WishlistScreen() {
  const { wishlist } = useModel();
  const [draft, setDraft] = useState('');
  const [undo, setUndo] = useState<WishItem | null>(null);
  useEffect(() => { if (!undo) return; const t = window.setTimeout(() => setUndo(null), 5000); return () => window.clearTimeout(t); }, [undo]);
  const today = todayISO();
  const active = wishlist.items.filter((i) => !i.removed);

  const add = () => {
    const name = draft.trim();
    if (!name) return;
    const item: WishItem = { id: Math.random().toString(36).slice(2, 8), name, added: today };
    void save('wishlist.json', { items: [...wishlist.items, item] }, msg);
    setDraft('');
  };
  const drop = (item: WishItem) => {
    void save('wishlist.json', { items: wishlist.items.map((i) => (i.id === item.id ? { ...i, removed: today } : i)) }, msg);
    setUndo(item);
  };
  const restore = (item: WishItem) => {
    void save('wishlist.json', { items: wishlist.items.map((i) => (i.id === item.id ? { id: i.id, name: i.name, added: i.added } : i)) }, msg);
    setUndo(null);
  };

  return (
    <>
      <h1 className="page-title" style={{ marginTop: 8 }}>Lista dei 30 giorni</h1>
      <p className="muted" style={{ padding: '2px 4px 0' }}>Quello che vuoi comprare aspetta qui 30 giorni. Se dopo lo vuoi ancora e ha un uso concreto, valuti.</p>

      <form className="add-row" style={{ marginTop: 20 }} onSubmit={(e) => { e.preventDefault(); add(); }}>
        <label className="sr" htmlFor="nuovo-oggetto">Cosa vuoi comprare</label>
        <input id="nuovo-oggetto" value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Cosa vuoi comprare?" enterKeyHint="done" />
        <button className="btn" type="submit" disabled={!draft.trim()}><Icon name="plus" size={18} />Aggiungi</button>
      </form>

      <p className="sec-label"><span>In attesa</span><span>{active.length}</span></p>
      {active.length === 0 && <p className="empty card">Niente in lista. Quando ti viene voglia di comprare qualcosa, scrivilo qui sopra.</p>}
      {active.map((item) => {
        const left = WAIT - diffDays(item.added, today);
        return (
          <div key={item.id} style={{ marginBottom: 8 }}>
            <div className="wish">
              <span className="txt"><b>{item.name}</b><small>Aggiunto {theDay(item.added)}</small></span>
              {left > 0
                ? <span className="count"><b>{left}</b><small>{left === 1 ? 'giorno' : 'giorni'}</small></span>
                : <span className="chip win">Da valutare</span>}
            </div>
            <div className="wish-acts"><button onClick={() => drop(item)}>Non mi serve più</button></div>
          </div>
        );
      })}

      {undo && <div className="toast" role="status">Tolto: {undo.name}<button onClick={() => restore(undo)}>Annulla</button></div>}
    </>
  );
}
