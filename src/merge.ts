import type { Day, Episode, Wishlist } from './types';

/*
  Quando un file in coda è cambiato anche su GitHub (lo hanno scritto le attività pianificate),
  prima di inviarlo si uniscono le due versioni. Regole:
  - giorni: vince l'app, tranne le spunte con source "diario" su scene che dall'app non sono mai state toccate;
  - episodi: vince l'app, ma la Nota del regista è sempre quella del repo;
  - lista: si tengono gli oggetti di entrambe, e un oggetto tolto da una parte resta tolto.
*/

function mergeDay(local: Day, remote: Day): Day {
  const out: Day = { ...local, scenes: { ...local.scenes }, antagonists: { ...local.antagonists }, source: { ...local.source } };
  for (const [k, v] of Object.entries(remote.scenes ?? {})) {
    if (v && remote.source?.[k] === 'diario' && local.source?.[k] !== 'app') {
      out.scenes[k] = true;
      out.source[k] = 'diario';
    }
  }
  for (const [k, v] of Object.entries(remote.antagonists ?? {})) {
    if (out.antagonists[k] == null && v != null && local.source?.[k] !== 'app') { out.antagonists[k] = v; if (remote.source?.[k]) out.source[k] = remote.source[k]; }
  }
  if (!out.story && remote.story) out.story = remote.story;
  if (out.mood == null && remote.mood != null) out.mood = remote.mood;
  return out;
}

function mergeEpisode(local: Episode, remote: Episode): Episode {
  return { ...local, directorNote: remote.directorNote ?? local.directorNote };
}

function mergeWishlist(local: Wishlist, remote: Wishlist): Wishlist {
  const byId = new Map(local.items.map((i) => [i.id, { ...i }]));
  for (const r of remote.items ?? []) {
    const l = byId.get(r.id);
    if (!l) byId.set(r.id, r);
    else if (!l.removed && r.removed) l.removed = r.removed;
  }
  return { items: [...byId.values()].sort((a, b) => a.added.localeCompare(b.added)) };
}

export function merge(path: string, local: unknown, remote: unknown): unknown {
  if (path.startsWith('days/')) return mergeDay(local as Day, remote as Day);
  if (path.startsWith('episodes/')) return mergeEpisode(local as Episode, remote as Episode);
  if (path === 'wishlist.json') return mergeWishlist(local as Wishlist, remote as Wishlist);
  return local;
}
