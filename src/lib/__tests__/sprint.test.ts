import type { Item } from '@/content/types';

import { characteristicOf, lanternSprintItems, sprintChoices } from '../sprint';

function lanternItem(id: string, characteristic: string | null): Item {
  return {
    id,
    topicId: 'top-buoy-fyrar-bild',
    tracks: ['klass8'],
    type: 'lantern',
    payload: characteristic
      ? { questionSv: 'q', scene: { lights: [{ color: 'white', x: 50, y: 28, characteristic }] } }
      : { questionSv: 'q', scene: { lights: [{ color: 'white', x: 50, y: 28 }] } },
    options: [],
    explanationSv: 'explanation',
    authorReviewed: false,
  };
}

function mcqItem(id: string): Item {
  return {
    id,
    topicId: 'top-col-vajning',
    tracks: ['klass8'],
    type: 'mcq',
    payload: { questionSv: 'q' },
    options: [{ text: 'a', isCorrect: true }],
    explanationSv: 'explanation',
    authorReviewed: false,
  };
}

describe('characteristicOf', () => {
  it('reads the notation off a lantern item with an animated light', () => {
    expect(characteristicOf(lanternItem('a', 'Fl 3s'))).toBe('Fl 3s');
  });

  it('is null for a lantern item with no characteristic set', () => {
    expect(characteristicOf(lanternItem('a', null))).toBeNull();
  });

  it('is null for non-lantern item types', () => {
    expect(characteristicOf(mcqItem('a'))).toBeNull();
  });
});

describe('lanternSprintItems', () => {
  it('keeps only items with an animated characteristic', () => {
    const pool = [lanternItem('a', 'Fl 3s'), lanternItem('b', null), mcqItem('c')];
    expect(lanternSprintItems(pool).map((i) => i.id)).toEqual(['a']);
  });
});

describe('sprintChoices', () => {
  const pool = [
    lanternItem('a', 'Fl 3s'),
    lanternItem('b', 'Oc 5s'),
    lanternItem('c', 'Iso 5s'),
    lanternItem('d', 'Q'),
    lanternItem('e', 'VQ'),
  ];

  it('includes exactly one correct choice matching the item', () => {
    const choices = sprintChoices(pool[0], pool, 1);
    const correct = choices.filter((c) => c.isCorrect);
    expect(correct).toHaveLength(1);
    expect(correct[0].text).toBe('Fl 3s');
  });

  it('returns 4 choices with no duplicates', () => {
    const choices = sprintChoices(pool[0], pool, 1);
    expect(choices).toHaveLength(4);
    expect(new Set(choices.map((c) => c.text)).size).toBe(4);
  });

  it('is stable for the same seed, varies across seeds', () => {
    const a = sprintChoices(pool[0], pool, 42).map((c) => c.text);
    const b = sprintChoices(pool[0], pool, 42).map((c) => c.text);
    const c = sprintChoices(pool[0], pool, 43).map((c) => c.text);
    expect(a).toEqual(b);
    expect(a).not.toEqual(c);
  });

  it('is empty for an item with no characteristic', () => {
    expect(sprintChoices(lanternItem('x', null), pool, 1)).toEqual([]);
  });
});
