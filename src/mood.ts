// Scala dell'umore a 7 livelli, dal più spiacevole al più piacevole.
export const MOODS = [
  { v: -3, label: 'Molto spiacevole' },
  { v: -2, label: 'Spiacevole' },
  { v: -1, label: 'Leggermente spiacevole' },
  { v: 0, label: 'Neutro' },
  { v: 1, label: 'Leggermente piacevole' },
  { v: 2, label: 'Piacevole' },
  { v: 3, label: 'Molto piacevole' },
] as const;

export const moodLabel = (v: number) => MOODS.find((m) => m.v === Math.round(v))?.label ?? '';
/** Classe CSS del colore: m-3 … m3. */
export const moodClass = (v: number) => `m${Math.round(v)}`;
