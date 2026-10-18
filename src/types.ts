// Schema dei file del repo stagioni-data. Il README del repo lo descrive per chi lo legge da fuori.

export interface Scene { key: string; label: string; identity: string; hint: string }
export interface Antagonist { key: string; label: string; hint?: string }

export interface Season {
  id: string;
  title: string;
  start: string;
  end: string;
  arc: string;
  identities: string[];
  scenes: Scene[];
  antagonists: Antagonist[];
  baseGoals: string[];
  extraGoals: Record<string, string[]>;
}

export type Verdict = 'win' | 'lose' | null;
export type Source = 'app' | 'diario';

export interface Day {
  date: string;
  scenes: Record<string, boolean>;
  antagonists: Record<string, Verdict>;
  story: string;
  source: Record<string, Source>;
  /** Umore della giornata, da -3 (molto spiacevole) a 3 (molto piacevole). Assente o null = non segnato. */
  mood?: number | null;
}

export interface Goal { text: string; done: boolean }

export interface Episode {
  n: number;
  start: string;
  end: string;
  goals: Goal[];
  recap: string;
  directorNote: string;
}

export interface WishItem { id: string; name: string; added: string; removed?: string; /** prezzo in euro */ price?: number }
export interface Wishlist { items: WishItem[] }

export interface Settings { owner: string; repo: string; token: string }
