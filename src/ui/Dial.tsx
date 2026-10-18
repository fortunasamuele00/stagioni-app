import { addDays } from '../dates';
import { dayIndex, episodeCount, episodeOf, MAX_PER_DAY, seasonLength, votes } from '../season';
import type { Day, Season } from '../types';

/** Quadrante: una tacca per giorno, raggruppate per episodio. La tacca si allunga con i voti. */
export function Dial({ season, days, selected, today }: { season: Season; days: Record<string, Day>; selected: string; today: string }) {
  const len = seasonLength(season), eps = episodeCount(season), max = MAX_PER_DAY(season);
  const cx = 150, cy = 150, r0 = 104, gapU = 1.6, total = len + eps * gapU;
  const angle = (u: number) => (u / total) * Math.PI * 2 - Math.PI / 2;
  const ticks = [];
  for (let i = 0; i < len; i++) {
    const iso = addDays(season.start, i);
    const d = days[iso], v = votes(d), past = iso <= today;
    const a = angle(i + Math.floor(i / 7) * gapU + gapU / 2);
    const l = !past ? 8 : v ? 10 + (v / max) * 32 : 6;
    const cls = iso === selected ? 'tk-t' : !past ? 'tk-f' : v ? 'tk-p' : 'tk-z';
    ticks.push(<line key={i} className={cls} strokeWidth={2.6} strokeLinecap="round"
      x1={cx + r0 * Math.cos(a)} y1={cy + r0 * Math.sin(a)} x2={cx + (r0 + l) * Math.cos(a)} y2={cy + (r0 + l) * Math.sin(a)} />);
  }
  const cur = episodeOf(season, selected);
  const nums = [];
  for (let e = 1; e <= eps; e++) {
    const a = angle((e - 1) * (7 + gapU) + gapU / 2 + 3.5);
    nums.push(<text key={e} className={`ep-n${e === cur ? ' cur' : ''}`} x={cx + 88 * Math.cos(a)} y={cy + 88 * Math.sin(a) + 3.5} textAnchor="middle">{e}</text>);
  }
  const idx = dayIndex(season, selected);
  const center = idx < 0
    ? <><small>episodio pilota</small><b>{-idx}</b><small>{idx === -1 ? 'giorno al via' : 'giorni al via'}</small></>
    : idx >= len
      ? <><small>stagione</small><b>fine</b><small>{len} giorni girati</small></>
      : <><small>giorno</small><b>{idx + 1}</b><small>di {len}</small><span>Episodio {cur}</span></>;
  return (
    <>
      <div className="dial">
        <svg viewBox="0 0 300 300" role="img" aria-label={idx >= 0 && idx < len ? `Giorno ${idx + 1} di ${len}, episodio ${cur} di ${eps}` : 'Quadrante della stagione'}>{ticks}{nums}</svg>
        <div className="dial-center">{center}</div>
      </div>
      <div className="dial-legend" aria-hidden="true">
        <span><i />voti del giorno</span><span><i className="t" />{selected === today ? 'oggi' : 'giorno scelto'}</span><span><i className="f" />da girare</span>
      </div>
    </>
  );
}
