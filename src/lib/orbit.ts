import type { Item, LanternScene } from '@/content/types';

/** Lantern items with sector data — the orbit trainer's content pool. Most
 * lantern items have no lightSectors and are excluded here; see
 * content/AUTHORING.md for which configurations are seeded. */
export function orbitTrainerItems(items: Item[]): Item[] {
  return items.filter((i) => {
    if (i.type !== 'lantern') return false;
    const scene = (i.payload as { scene?: LanternScene } | undefined)?.scene;
    return Boolean(scene?.lightSectors?.length);
  });
}
