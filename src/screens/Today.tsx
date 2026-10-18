import { useEffect, useState, type ReactNode } from 'react';
import { addDays, todayISO, weekdayDate } from '../dates';
import { dayIndex, emptyDay, episodeOf, MAX_PER_DAY, seasonNumber, tint, votes } from '../season';
import { dayPath, save, useModel } from '../store';
import type { Day, Season, Verdict } from '../types';
import { Dial } from '../ui/Dial';
import { Icon } from '../ui/Icon';


function Story({ season, days, iso, today }: { season: Season; days: Record<string, Day>; iso: string; today: string }) {
  const idx = dayIndex(season, iso), max = MAX_PER_DAY(season);
  if (idx < 0) return <>Episodio pilota. La Stagione {seasonNumber(season)}, <b>{season.title}</b>, parte {weekdayDate(season.start)}.</>;
  if (idx === 0) return <>Primo giorno della stagione: non c'è ancora una puntata precedente. Oggi si gira la prima scena.</>;
  const prev = days[addDays(iso, -1)];
  const when = iso === today ? 'Ieri' : 'Il giorno prima';
  const done = season.scenes.filter((s) => prev?.scenes[s.key]);
  const won = season.antagonists.filter((a) => prev?.antagonists[a.key] === 'win');
  const lost = season.antagonists.filter((a) => prev?.antagonists[a.key] === 'lose');
  const chip = (key: string, label: string, cls: string) => <span key={key} className={`chip inline ${cls}`}><Icon name={key} size={17} />{label}</span>;
  const join = (items: ReactNode[]) => items.flatMap((x, i) => (i === 0 ? [x] : [i === items.length - 1 ? ' e ' : ', ', x]));
  const n = episodeOf(season, iso), first = addDays(season.start, (n - 1) * 7);
  let epVotes = 0;
  for (let d = first; d <= iso; d = addDays(d, 1)) epVotes += votes(days[d]);
  const possible = (dayIndex(season, iso) % 7 + 1) * max;
  return (
    <>
      {done.length
        ? <>{when} hai dato <b>{done.length} {done.length === 1 ? 'voto' : 'voti'} su {max}</b>: {join(done.map((s) => chip(s.key, s.label, tint(season, s.identity))))}. </>
        : <>{when} non hai segnato scene. </>}
      {won.length > 0 && <>Hai battuto {join(won.map((a) => chip(a.key, a.label, 'win')))}. </>}
      {lost.length > 0 && <>Hai perso con {join(lost.map((a) => chip(a.key, a.label, 'lose')))}. </>}
      {iso === first
        ? <>Oggi inizia l'episodio {n}.</>
        : <>In questo episodio hai <b>{epVotes} voti su {possible}</b> possibili finora.</>}
    </>
  );
}

export function Today({ sync }: { sync: ReactNode }) {
  const { season, days } = useModel();
  const [today, setToday] = useState(todayISO);
  const [iso, setIso] = useState(today);
  // Se l'app resta aperta oltre la mezzanotte, "oggi" si sposta da solo.
  useEffect(() => {
    const t = window.setInterval(() => { const n = todayISO(); if (n !== today) { setToday(n); setIso((cur) => (cur === today ? n : cur)); } }, 60000);
    return () => window.clearInterval(t);
  }, [today]);
  if (!season) return null;

  const day: Day = days[iso] ?? emptyDay(season, iso);
  const write = (next: Day) => void save(dayPath(iso), next, `Giorno ${iso}`);
  const toggle = (key: string) => write({ ...day, scenes: { ...day.scenes, [key]: !day.scenes[key] }, source: { ...day.source, [key]: 'app' } });
  // Tocchi Vinto o Perso; ritoccare la scelta attiva la toglie (torna "non segnato").
  const pick = (key: string, v: Verdict) => write({ ...day, antagonists: { ...day.antagonists, [key]: day.antagonists[key] === v ? null : v } });
  const min = addDays(season.start, -1);

  return (
    <>
      <div className="daynav">
        <button className="icon-btn" onClick={() => setIso(addDays(iso, -1))} disabled={iso <= min} aria-label="Giorno precedente"><Icon name="left" /></button>
        <span className="lbl" aria-live="polite">{iso === today ? 'Oggi' : iso === addDays(today, -1) ? 'Ieri' : 'Giorno passato'}<small>{weekdayDate(iso)}</small></span>
        <button className="icon-btn" onClick={() => setIso(addDays(iso, 1))} disabled={iso >= today} aria-label="Giorno successivo"><Icon name="right" /></button>
      </div>
      {iso !== today && <button className="back-today" onClick={() => setIso(today)}>Torna a oggi</button>}

      <Dial season={season} days={days} selected={iso} today={today} />

      <div className="card story" style={{ marginTop: 20 }}>
        <span className="chip ink"><Icon name="episodio" size={16} />Nella puntata precedente</span>
        <p><Story season={season} days={days} iso={iso} today={today} /></p>
      </div>

      <p className="sec-label"><span>{iso === today ? 'Le scene di oggi' : 'Le scene del giorno'}</span><span>{votes(day)} {votes(day) === 1 ? 'voto' : 'voti'} su {MAX_PER_DAY(season)}</span></p>
      <div className="scenes">
        {season.scenes.map((s) => (
          <button key={s.key} className={`scene ${tint(season, s.identity)}`} aria-pressed={Boolean(day.scenes[s.key])} onClick={() => toggle(s.key)}>
            <span className="dot-ic"><Icon name={s.key} /></span>
            <span className="txt"><b>{s.label}{day.scenes[s.key] && day.source[s.key] === 'diario' && <span className="src">dal diario</span>}</b><small>{s.hint}</small></span>
            <span className="box"><Icon name="check" size={16} /></span>
          </button>
        ))}
      </div>

      <p className="sec-label"><span>Tu contro</span><span>com'è andata?</span></p>
      <div className="scenes">
        {season.antagonists.map((a) => {
          const v = day.antagonists[a.key] ?? null;
          return (
            <div key={a.key} className="vs" role="group" aria-label={`Tu contro ${a.label}`}>
              <div className="vs-head">
                <span className="me">Tu</span><span className="x">vs</span>
                <span className="txt">{a.label}{a.hint && <small>{a.hint}</small>}</span>
                {v === null && <span className="chip none">Non segnato</span>}
              </div>
              <div className="pick">
                <button className="win" aria-pressed={v === 'win'} onClick={() => pick(a.key, 'win')}><Icon name="check" size={18} />Vinto</button>
                <button className="lose" aria-pressed={v === 'lose'} onClick={() => pick(a.key, 'lose')}><Icon name="x" size={18} />Perso</button>
              </div>
            </div>
          );
        })}
      </div>

      <Tell key={iso} iso={iso} day={day} />

      <div className="foot">{sync}</div>
    </>
  );
}

function Tell({ iso, day }: { iso: string; day: Day }) {
  const [text, setText] = useState(day.story ?? '');
  const id = `racconta-${iso}`;
  return (
    <div className="card mt" style={{ marginTop: 20 }}>
      <label className="field" htmlFor={id}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 8, font: 'var(--t-head)' }}><Icon name="episodio" size={20} />Racconta</span>
      </label>
      <div className="field">
        <textarea id={id} value={text} placeholder="Com'è andata? Scrivilo come viene."
          onChange={(e) => { setText(e.target.value); void save(dayPath(iso), { ...day, story: e.target.value }, `Giorno ${iso}`); }} />
        <small>Stasera alle 23:30 Claude lo legge e lo unisce al diario.</small>
      </div>
    </div>
  );
}
