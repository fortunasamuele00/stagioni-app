import { useState } from 'react';
import { addDays, dayMonth, todayISO } from '../dates';
import { defaultEpisode, episodeCount, episodeOf, MAX_PER_DAY, votes } from '../season';
import { episodePath, save, useModel } from '../store';
import type { Episode } from '../types';
import { Icon } from '../ui/Icon';

export function EpisodeScreen() {
  const { season, days, episodes } = useModel();
  const [n, setN] = useState(() => (season ? Math.min(Math.max(episodeOf(season, todayISO()), 1), episodeCount(season)) : 1));
  const [draft, setDraft] = useState('');
  if (!season) return null;
  const ep: Episode = episodes[n] ?? defaultEpisode(season, n);
  const write = (next: Episode) => void save(episodePath(n), next, `Episodio ${n}`);
  const done = ep.goals.filter((g) => g.done).length;
  let v = 0;
  for (let d = ep.start; d <= ep.end; d = addDays(d, 1)) v += votes(days[d]);

  const add = () => {
    const text = draft.trim();
    if (!text) return;
    write({ ...ep, goals: [...ep.goals, { text, done: false }] });
    setDraft('');
  };

  return (
    <>
      <div className="ep-nav" style={{ marginTop: 8 }}>
        <button className="icon-btn" onClick={() => setN(n - 1)} disabled={n <= 1} aria-label="Episodio precedente"><Icon name="left" /></button>
        <span className="lbl" aria-live="polite"><b>Episodio {n}</b><small>{dayMonth(ep.start)} – {dayMonth(ep.end)} · {v} voti su {7 * MAX_PER_DAY(season)}</small></span>
        <button className="icon-btn" onClick={() => setN(n + 1)} disabled={n >= episodeCount(season)} aria-label="Episodio successivo"><Icon name="right" /></button>
      </div>

      <p className="sec-label"><span>Obiettivi della settimana</span><span>{done} su {ep.goals.length}</span></p>
      <div className="card" style={{ paddingTop: 4, paddingBottom: 12 }}>
        {ep.goals.length === 0 && <p className="muted" style={{ padding: '12px 0' }}>Nessun obiettivo. Aggiungine uno qui sotto.</p>}
        {ep.goals.map((g, i) => (
          <div key={i} className="goal" data-done={g.done}>
            <button className="tap" aria-pressed={g.done} onClick={() => write({ ...ep, goals: ep.goals.map((x, j) => (j === i ? { ...x, done: !x.done } : x)) })}>
              <span className="box"><Icon name="check" size={16} /></span><span>{g.text}</span>
            </button>
            <button className="rm" onClick={() => write({ ...ep, goals: ep.goals.filter((_, j) => j !== i) })} aria-label={`Rimuovi "${g.text}"`}><Icon name="x" size={18} /></button>
          </div>
        ))}
        <form className="add-row" onSubmit={(e) => { e.preventDefault(); add(); }}>
          <label className="sr" htmlFor="nuovo-obiettivo">Nuovo obiettivo</label>
          <input id="nuovo-obiettivo" value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Nuovo obiettivo" enterKeyHint="done" />
          <button className="btn" type="submit" disabled={!draft.trim()}><Icon name="plus" size={18} />Aggiungi</button>
        </form>
      </div>

      {ep.directorNote.trim() && (
        <div className="note mt" style={{ marginTop: 20 }}>
          <span className="chip t1"><Icon name="episodio" size={16} />Nota del regista</span>
          <p>{ep.directorNote}</p>
        </div>
      )}

      <Recap key={n} ep={ep} onSave={(recap) => write({ ...ep, recap })} />
    </>
  );
}

function Recap({ ep, onSave }: { ep: Episode; onSave: (recap: string) => void }) {
  const [text, setText] = useState(ep.recap);
  return (
    <div className="card mt" style={{ marginTop: 20 }}>
      <label className="field">
        <span style={{ font: 'var(--t-head)' }}>Il mio recap</span>
        <textarea value={text} placeholder="Com'è andato questo episodio? Lo scrivi tu, la domenica sera." onChange={(e) => { setText(e.target.value); onSave(e.target.value); }} />
      </label>
    </div>
  );
}
