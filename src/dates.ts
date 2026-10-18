// Date come stringhe AAAA-MM-GG nel fuso del telefono (Europe/Rome). I calcoli passano da UTC per evitare l'ora legale.

const pad = (n: number) => String(n).padStart(2, '0');

export function todayISO(): string {
  // Solo in sviluppo: localStorage "oggi" = AAAA-MM-GG simula un altro giorno.
  if (import.meta.env.DEV) { try { const o = localStorage.getItem('oggi'); if (o) return o; } catch { /* niente */ } }
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

const utc = (iso: string) => { const [y, m, d] = iso.split('-').map(Number); return Date.UTC(y, m - 1, d); };

export function addDays(iso: string, n: number): string {
  return new Date(utc(iso) + n * 86400000).toISOString().slice(0, 10);
}

export function diffDays(from: string, to: string): number {
  return Math.round((utc(to) - utc(from)) / 86400000);
}

export function fmt(iso: string, opts: Intl.DateTimeFormatOptions): string {
  return new Date(utc(iso)).toLocaleDateString('it-IT', { timeZone: 'UTC', ...opts });
}

export const weekdayDate = (iso: string) => fmt(iso, { weekday: 'long', day: 'numeric', month: 'long' });
export const dayMonth = (iso: string) => fmt(iso, { day: 'numeric', month: 'long' });

/** "il 28 ottobre", "l'8 novembre", "l'11 novembre". */
export const theDay = (iso: string) => { const d = Number(iso.slice(8)); return `${d === 8 || d === 11 ? "l'" : 'il '}${dayMonth(iso)}`; };
