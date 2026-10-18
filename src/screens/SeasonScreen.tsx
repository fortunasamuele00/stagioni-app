import { useState } from 'react';
import { addDays, todayISO, weekdayDate } from '../dates';
import { dayIndex, MAX_PER_DAY, seasonLength, seasonNumber, seasonVotes, streak, tint, votes } from '../season';
import { useModel } from '../store';
import { moodLabel } from '../mood';
import { Chart } from '../ui/Chart';
import { MoodChart } from '../ui/MoodChart';
import { Icon } from '../ui/Icon';

export function SeasonScreen() {
  const { season, days } = useModel();
  const [picked, setPicked] = useState<number | null>(null);
  if (!season) return null;
  const today = todayISO();
  const len = seasonLength(season), max = MAX_PER_DAY(season);
  const elapsed = Math.min(Math.max(dayIndex(season, today) + 1, 0), len);
  const end = today > season.end ? season.end : today;
  const total = seasonVotes(season, days);
  const scroll = season.antagonists.find((a) => a.key === 'scroll');
  const sfida = season.antagonists.find((a) => a.key === 'sfida');
  const pickedIso = picked == null ? null : addDays(season.start, picked);
  const pickedDay = pickedIso ? days[pickedIso] : undefined;
  const week = Array.from({ length: 7 }, (_, k) => days[addDays(end, -k)]?.mood).filter((m): m is number => m != null);
  const weekMood = week.length ? week.reduce((a, b) => a + b, 0) / week.length : null;

  return (
    <>
      <h1 className="page-title" style={{ marginTop: 8 }}>Stagione {seasonNumber(season)}</h1>
      <p className="muted" style={{ padding: '2px 4px 0' }}>{season.title} · {elapsed > 0 ? `giorno ${elapsed} di ${len}` : `parte ${weekdayDate(season.start)}`}</p>

      <div className="card chart-card" style={{ marginTop: 20 }}>
        <div className="top"><span className="chip ink"><Icon name="stagione" size={16} />Voti giornalieri</span><span>tocca un giorno</span></div>
        <Chart season={season} days={days} today={end} picked={picked} onPick={setPicked} />
        <p className="picked" aria-live="polite">
          {pickedIso
            ? pickedIso > today ? <>{weekdayDate(pickedIso)}: ancora da girare</>
              : <><b>{weekdayDate(pickedIso)}</b>: {votes(pickedDay)} {votes(pickedDay) === 1 ? 'voto' : 'voti'} su {max}{pickedDay?.mood != null && <> · {moodLabel(pickedDay.mood).toLowerCase()}</>}</>
            : <>I numeri sotto le barre sono gli episodi.</>}
        </p>
        <div className="legend">
          {season.identities.map((id) => <span key={id}><i style={{ background: `var(--${tint(season, id)})` }} />{id}</span>)}
          <span><i className="l" />media 7 giorni</span>
        </div>
      </div>

      <div className="card chart-card mt">
        <div className="top"><span className="chip ink">Umore</span><span>{weekMood != null ? <>ultimi 7 giorni: <b style={{ color: 'var(--ink)', fontWeight: 500 }}>{moodLabel(weekMood).toLowerCase()}</b></> : 'ancora nessun giorno segnato'}</span></div>
        <div className="mood-axis"><span>Molto piacevole</span></div>
        <MoodChart season={season} days={days} today={end} picked={picked} onPick={setPicked} />
        <div className="mood-axis"><span>Molto spiacevole</span></div>
        <div className="legend"><span><i className="dot m-3" />spiacevole</span><span><i className="dot m0" />neutro</span><span><i className="dot m3" />piacevole</span><span><i className="l" />media 7 giorni</span></div>
      </div>

      <div className="duo">
        <div className="mini"><span className="chip ink">Voti totali</span><b>{total}<small>su {elapsed * max}</small></b></div>
        <div className="mini"><span className="chip t0">Con una scena</span><b>{streak(days, end, (d) => votes(d) > 0, season.start)}<small>giorni di fila</small></b></div>
        {scroll && <div className="mini"><span className="chip win"><Icon name="scroll" size={16} />{scroll.label}</span><b>{streak(days, end, (d) => d?.antagonists[scroll.key] === 'win', season.start)}<small>vinti di fila</small></b></div>}
        {sfida && <div className="mini"><span className="chip win"><Icon name="sfida" size={16} />{sfida.label}</span><b>{streak(days, end, (d) => d?.antagonists[sfida.key] === 'win', season.start)}<small>vinti di fila</small></b></div>}
      </div>
    </>
  );
}
