import { addDays, diffDays } from './dates';
import type { Day, Episode, Season } from './types';

export const MAX_PER_DAY = (s: Season) => s.scenes.length;
export const seasonLength = (s: Season) => diffDays(s.start, s.end) + 1;
export const episodeCount = (s: Season) => Math.ceil(seasonLength(s) / 7);
export const dayIndex = (s: Season, iso: string) => diffDays(s.start, iso);
/** Numero di episodio (da 1). 0 = prima della stagione (episodio pilota). */
export const episodeOf = (s: Season, iso: string) => { const i = dayIndex(s, iso); return i < 0 ? 0 : Math.floor(i / 7) + 1; };
export const episodeStart = (s: Season, n: number) => addDays(s.start, (n - 1) * 7);
export const episodeEnd = (s: Season, n: number) => { const e = addDays(s.start, n * 7 - 1); return e > s.end ? s.end : e; };
export const seasonNumber = (s: Season) => Number(s.id.replace(/\D/g, '')) || 1;

export const votes = (d?: Day) => (d ? Object.values(d.scenes).filter(Boolean).length : 0);

export function emptyDay(s: Season, iso: string): Day {
  return {
    date: iso,
    scenes: Object.fromEntries(s.scenes.map((x) => [x.key, false])),
    antagonists: Object.fromEntries(s.antagonists.map((x) => [x.key, null])),
    story: '',
    source: {},
  };
}

export function defaultEpisode(s: Season, n: number): Episode {
  const texts = [...(s.extraGoals[String(n)] ?? []), ...s.baseGoals];
  return { n, start: episodeStart(s, n), end: episodeEnd(s, n), goals: texts.map((text) => ({ text, done: false })), recap: '', directorNote: '' };
}

/** Giorni di fila che soddisfano il test, all'indietro da oggi. Se oggi non lo soddisfa ancora, si parte da ieri. */
export function streak(days: Record<string, Day>, today: string, test: (d?: Day) => boolean, from: string): number {
  let n = 0;
  for (let iso = today; iso >= from; iso = addDays(iso, -1)) {
    if (test(days[iso])) n++;
    else if (iso === today) continue;
    else break;
  }
  return n;
}

export function seasonVotes(s: Season, days: Record<string, Day>): number {
  let t = 0;
  for (const [iso, d] of Object.entries(days)) if (iso >= s.start && iso <= s.end) t += votes(d);
  return t;
}

/** Colore dell'identità: l'ordine in season.identities decide la tinta. */
const TINTS = ['t0', 't1', 't2'];
export const tint = (s: Season, identity: string) => TINTS[Math.max(0, s.identities.indexOf(identity)) % TINTS.length];
