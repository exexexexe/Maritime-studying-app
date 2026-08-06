import type { Item } from '@/content/types';

import { orbitTrainerItems } from '../orbit';

function lanternItem(id: string, lightSectors?: unknown[]): Item {
  return {
    id,
    topicId: 'top-lan-maskin',
    tracks: ['klass8'],
    type: 'lantern',
    options: [],
    explanationSv: 'test',
    authorReviewed: false,
    payload: {
      questionSv: 'test',
      scene: { lights: [], lightSectors },
    },
  };
}

describe('orbitTrainerItems', () => {
  it('includes only lantern items with non-empty lightSectors', () => {
    const items: Item[] = [
      lanternItem('with-sectors', [{ lightId: 'a', startDeg: 0, endDeg: 90 }]),
      lanternItem('empty-sectors', []),
      lanternItem('no-sectors', undefined),
      { ...lanternItem('mcq-item'), type: 'mcq' },
    ];
    expect(orbitTrainerItems(items).map((i) => i.id)).toEqual(['with-sectors']);
  });

  it('returns an empty array when nothing qualifies', () => {
    expect(orbitTrainerItems([lanternItem('no-sectors')])).toEqual([]);
  });
});
