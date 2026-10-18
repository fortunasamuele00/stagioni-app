import type { PointerEvent } from 'react';
import { addDays } from '../dates';
import { moodClass } from '../mood';
import { episodeCount, seasonLength } from '../season';
import type { Day, Season } from '../types';

/** Umore giorno per giorno: un punto per giorno, alto quanto l'umore, e la media mobile a 7 giorni. */
export function MoodChart({ season, days, today, picked, onPick }: { season: Season; days: Record<string, Day>; today: string; picked: number | null; onPick: (i: number) => void }) {
  const len = seasonLength(season), eps = episodeCount(season);
  const W = 358, H = 132, pad = 20, gap = 1, plot = H - pad;
  const bw = (W - gap * (len - 1)) / len;
  const x = (i: number) => i * (bw + gap) + bw / 2;
  const y = (v: number) => 8 + ((3 - v) / 6) * (plot - 16);
  const els = [];
  for (let v = -3; v <= 3; v++) els.push(<line key={`g${v}`} className={v === 0 ? 'c-zero-line' : 'c-grid'} x1={0} x2={W} y1={y(v)} y2={y(v)} />);
  for (let e = 1; e < eps; e++) els.push(<line key={`s${e}`} className="c-sep" x1={x(e * 7) - bw / 2 - gap / 2} x2={x(e * 7) - bw / 2 - gap / 2} y1={0} y2={plot} />);
  const ma: string[] = [];
  for (let i = 0; i < len; i++) {
    const iso = addDays(season.start, i);
    if (iso > today) break;
    if (picked === i) els.push(<rect key={`p${i}`} className="c-sel" x={x(i) - bw / 2 - 1} y={0} width={bw + 2} height={plot} rx={1} />);
    const m = days[iso]?.mood;
    if (m != null) els.push(<circle key={`d${i}`} className={`c-mood ${moodClass(m)}`} cx={x(i)} cy={y(m)} r={2.8} />);
    let sum = 0, n = 0;
    for (let j = Math.max(0, i - 6); j <= i; j++) { const v = days[addDays(season.start, j)]?.mood; if (v != null) { sum += v; n++; } }
    if (n) ma.push(`${x(i).toFixed(2)},${y(sum / n).toFixed(2)}`);
  }
  if (ma.length > 1) els.push(<polyline key="ma" className="c-ma" points={ma.join(' ')} />);
  for (let e = 1; e <= eps; e++) els.push(<text key={`l${e}`} className="c-lbl" x={x((e - 1) * 7 + 3)} y={H - 5} textAnchor="middle">{e}</text>);

  const pick = (ev: PointerEvent<SVGSVGElement>) => {
    const r = ev.currentTarget.getBoundingClientRect();
    const i = Math.floor(((ev.clientX - r.left) / r.width) * len);
    if (i >= 0 && i < len) onPick(i);
  };
  return (
    <svg className="chart" viewBox={`0 0 ${W} ${H}`} onPointerDown={pick} role="img" aria-label="Umore giorno per giorno sulla stagione, con la media degli ultimi 7 giorni. Tocca un giorno per vederlo.">
      {els}
    </svg>
  );
}
