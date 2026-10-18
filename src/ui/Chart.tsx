import type { PointerEvent } from 'react';
import { addDays, fmt } from '../dates';
import { episodeCount, episodeOf, MAX_PER_DAY, seasonLength, tint, votes } from '../season';
import type { Day, Season } from '../types';

/** Voti giornalieri sull'intera stagione: barre divise per identità, media mobile a 7 giorni, un separatore per episodio. */
export function Chart({ season, days, today, picked, onPick }: { season: Season; days: Record<string, Day>; today: string; picked: number | null; onPick: (i: number) => void }) {
  const len = seasonLength(season), max = MAX_PER_DAY(season), eps = episodeCount(season);
  const W = 358, H = 150, pad = 20, gap = 1, plot = H - pad;
  const bw = (W - gap * (len - 1)) / len;
  const x = (i: number) => i * (bw + gap);
  const unit = plot / max;
  const els = [];
  for (let k = 1; k < max; k++) els.push(<line key={`g${k}`} className="c-grid" x1={0} x2={W} y1={plot - unit * k} y2={plot - unit * k} />);
  for (let e = 1; e < eps; e++) els.push(<line key={`s${e}`} className="c-sep" x1={x(e * 7) - gap / 2} x2={x(e * 7) - gap / 2} y1={0} y2={plot} />);
  const ma: string[] = [];
  for (let i = 0; i < len; i++) {
    const iso = addDays(season.start, i);
    if (picked === i) els.push(<rect key={`p${i}`} className="c-sel" x={x(i) - 1} y={0} width={bw + 2} height={plot} rx={1} />);
    if (iso > today) { els.push(<rect key={`d${i}`} className="c-fut" x={x(i)} y={plot - 2} width={bw} height={2} rx={1} />); continue; }
    const d = days[iso];
    if (!votes(d)) els.push(<rect key={`d${i}`} className="c-zero" x={x(i)} y={plot - 2} width={bw} height={2} rx={1} />);
    let y = plot;
    for (const sc of season.scenes) if (d?.scenes[sc.key]) {
      y -= unit;
      els.push(<rect key={`d${i}${sc.key}`} className={`c-${tint(season, sc.identity)}`} x={x(i)} y={y + 0.5} width={bw} height={unit - 1} rx={1} />);
    }
    let sum = 0, n = 0;
    for (let j = Math.max(0, i - 6); j <= i; j++) { sum += votes(days[addDays(season.start, j)]); n++; }
    ma.push(`${(x(i) + bw / 2).toFixed(2)},${(plot - (sum / n) * unit).toFixed(2)}`);
  }
  if (ma.length > 1) els.push(<polyline key="ma" className="c-ma" points={ma.join(' ')} />);
  const cur = episodeOf(season, today);
  for (let e = 1; e <= eps; e++) els.push(<text key={`l${e}`} className={`c-lbl${e === cur ? ' cur' : ''}`} x={x((e - 1) * 7) + (7 * (bw + gap)) / 2} y={H - 5} textAnchor="middle">{e}</text>);

  const pick = (ev: PointerEvent<SVGSVGElement>) => {
    const r = ev.currentTarget.getBoundingClientRect();
    const i = Math.floor(((ev.clientX - r.left) / r.width) * len);
    if (i >= 0 && i < len) onPick(i);
  };
  const total = Object.values(days).reduce((a, d) => a + (d.date >= season.start && d.date <= today ? votes(d) : 0), 0);
  return (
    <svg className="chart" viewBox={`0 0 ${W} ${H}`} onPointerDown={pick} role="img"
      aria-label={`Voti giornalieri della stagione: ${total} voti fino a ${fmt(today, { day: 'numeric', month: 'long' })}. Tocca un giorno per vederne i voti.`}>
      {els}
    </svg>
  );
}
