import { useEffect, useState } from 'react';
import { diffDays, theDay, todayISO } from '../dates';
import { save, useModel } from '../store';
import type { WishItem } from '../types';
import { Icon } from '../ui/Icon';

const WAIT = 30;
const msg = 'Lista dei 30 giorni';
const euro = (n: number) => n.toLocaleString('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: n % 1 ? 2 : 0 });
/** "89", "12,50", "1.200" → numero. Vuoto o non valido → null. */
function parsePrice(t: string): number | null {
  const clean = t.replace(/[€\s]/g, '').replace(/\.(?=\d{3}(\D|$))/g, '').replace(',', '.');
  const n = Number(clean);
  return clean && Number.isFinite(n) && n >= 0 ? Math.round(n * 100) / 100 : null;
}

export function WishlistScreen() {
  const { wishlist } = useModel();
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [undo, setUndo] = useState<WishItem | null>(null);
  useEffect(() => { if (!undo) return; const t = window.setTimeout(() => setUndo(null), 5000); return () => window.clearTimeout(t); }, [undo]);
  const today = todayISO();
  const active = wishlist.items.filter((i) => !i.removed);
  const waiting = active.reduce((a, i) => a + (i.price ?? 0), 0);
  const saved = wishlist.items.filter((i) => i.removed).reduce((a, i) => a + (i.price ?? 0), 0);
  const p = parsePrice(price);
  const ready = name.trim() && p != null;

  const add = () => {
    if (!ready) return;
    const item: WishItem = { id: Math.random().toString(36).slice(2, 8), name: name.trim(), added: today, price: p };
    void save('wishlist.json', { items: [...wishlist.items, item] }, msg);
    setName(''); setPrice('');
  };
  const drop = (item: WishItem) => {
    void save('wishlist.json', { items: wishlist.items.map((i) => (i.id === item.id ? { ...i, removed: today } : i)) }, msg);
    setUndo(item);
  };
  const restore = (item: WishItem) => {
    void save('wishlist.json', { items: wishlist.items.map((i) => (i.id === item.id ? (({ removed: _, ...rest }) => rest)(i) : i)) }, msg);
    setUndo(null);
  };

  return (
    <>
      <h1 className="page-title" style={{ marginTop: 8 }}>Lista dei 30 giorni</h1>
      <p className="muted" style={{ padding: '2px 4px 0' }}>Quello che vuoi comprare aspetta qui 30 giorni. Se dopo lo vuoi ancora e ha un uso concreto, valuti. Se non ti serve più, quei soldi li hai risparmiati.</p>

      <div className="duo">
        <div className="mini"><span className="chip ink">In attesa</span><b className="money">{euro(waiting)}<small>{active.length} {active.length === 1 ? 'oggetto' : 'oggetti'}</small></b></div>
        <div className="mini"><span className="chip win">Risparmiati</span><b className="money">{euro(saved)}<small>con "Non mi serve più"</small></b></div>
      </div>

      <form className="card wish-form mt" onSubmit={(e) => { e.preventDefault(); add(); }}>
        <label className="field"><span>Cosa vuoi comprare?</span>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="es. Cuffie da studio" enterKeyHint="next" />
        </label>
        <label className="field"><span>Quanto costa?</span>
          <div className="price-in"><input value={price} onChange={(e) => setPrice(e.target.value)} inputMode="decimal" placeholder="0" enterKeyHint="done" aria-describedby="prezzo-aiuto" /><span aria-hidden="true">€</span></div>
          {price && p == null && <small id="prezzo-aiuto" className="err">Scrivi solo il numero, per esempio 89 o 12,50.</small>}
        </label>
        <button className="btn" type="submit" disabled={!ready}><Icon name="plus" size={18} />Aggiungi alla lista</button>
      </form>

      <p className="sec-label"><span>In attesa</span><span>{active.length}</span></p>
      {active.length === 0 && <p className="empty card">Niente in lista. Quando ti viene voglia di comprare qualcosa, scrivilo qui sopra con il prezzo.</p>}
      {active.map((item) => {
        const left = WAIT - diffDays(item.added, today);
        return (
          <div key={item.id} style={{ marginBottom: 8 }}>
            <div className="wish">
              <span className="txt"><b>{item.name}</b><small>{item.price != null ? `${euro(item.price)} · ` : ''}aggiunto {theDay(item.added)}</small></span>
              {left > 0
                ? <span className="count"><b>{left}</b><small>{left === 1 ? 'giorno' : 'giorni'}</small></span>
                : <span className="chip win">Da valutare</span>}
            </div>
            <div className="wish-acts"><button onClick={() => drop(item)}>Non mi serve più</button></div>
          </div>
        );
      })}

      {undo && <div className="toast" role="status">{undo.price != null ? `Risparmiati ${euro(undo.price)}: ${undo.name}` : `Tolto: ${undo.name}`}<button onClick={() => restore(undo)}>Annulla</button></div>}
    </>
  );
}
