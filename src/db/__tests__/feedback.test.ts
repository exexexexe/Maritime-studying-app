/**
 * Integration test against real SQLite (see expo-sqlite-mock), same as
 * reviews.test.ts — this exercises the actual migration and SQL, not a
 * mock of the Storage interface.
 */
import { addFeedbackFlag, clearFeedbackFlags, countFeedbackFlags, listFeedbackFlags } from '../feedback';

describe('feedback flags (real SQLite via node:sqlite)', () => {
  it('starts empty', () => {
    expect(countFeedbackFlags()).toBe(0);
    expect(listFeedbackFlags()).toEqual([]);
  });

  it('stores a per-item flag with full context', () => {
    const rec = addFeedbackFlag({
      category: 'wrong_answer',
      note: 'Facit pekar på fel alternativ',
      itemId: 'lan-maskin-014',
      topicId: 'top-lan-maskin',
      itemType: 'lantern',
    });
    expect(rec.id).toMatch(/^fb-/);
    expect(countFeedbackFlags()).toBe(1);

    const [stored] = listFeedbackFlags();
    expect(stored.itemId).toBe('lan-maskin-014');
    expect(stored.topicId).toBe('top-lan-maskin');
    expect(stored.itemType).toBe('lantern');
    expect(stored.note).toBe('Facit pekar på fel alternativ');
  });

  it('stores general feedback with null item context', () => {
    addFeedbackFlag({ category: 'other', note: 'Krascha vid start ibland' });
    const general = listFeedbackFlags().find((f) => f.category === 'other');
    expect(general).toBeDefined();
    expect(general!.itemId).toBeNull();
    expect(general!.topicId).toBeNull();
    expect(general!.itemType).toBeNull();
  });

  it('trims whitespace-only notes down to null', () => {
    addFeedbackFlag({ category: 'confusing', note: '   ' });
    const found = listFeedbackFlags().find((f) => f.category === 'confusing');
    expect(found!.note).toBeNull();
  });

  it('lists newest first', () => {
    const before = countFeedbackFlags();
    addFeedbackFlag({ category: 'typo_translation', note: 'a' });
    addFeedbackFlag({ category: 'typo_translation', note: 'b' });
    const list = listFeedbackFlags();
    expect(list.length).toBe(before + 2);
    expect(list[0].createdAt).toBeGreaterThanOrEqual(list[1].createdAt);
  });

  it('clears all flags', () => {
    expect(countFeedbackFlags()).toBeGreaterThan(0);
    clearFeedbackFlags();
    expect(countFeedbackFlags()).toBe(0);
    expect(listFeedbackFlags()).toEqual([]);
  });
});
