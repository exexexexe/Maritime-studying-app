import type { FeedbackFlagRecord } from '@/db/storage';

import { formatFeedbackExport } from '../feedback-export';

const META = { appVersion: '0.1.0', exportedAt: 1_700_000_000_000 };

describe('formatFeedbackExport', () => {
  it('reports an empty export clearly', () => {
    const out = formatFeedbackExport([], META);
    expect(out).toContain('Antal poster: 0');
    expect(out).toContain('Inga flaggade poster');
  });

  it('includes item context for a per-item flag', () => {
    const flag: FeedbackFlagRecord = {
      id: 'fb-1',
      createdAt: 1_700_000_000_000,
      category: 'wrong_answer',
      note: 'Facit verkar fel',
      itemId: 'vhf-may-008',
      topicId: 'top-vhf-mayday',
      itemType: 'radio_procedure',
    };
    const out = formatFeedbackExport([flag], META);
    expect(out).toContain('Fel svar');
    expect(out).toContain('vhf-may-008');
    expect(out).toContain('radio_procedure');
    expect(out).toContain('top-vhf-mayday');
    expect(out).toContain('Facit verkar fel');
  });

  it('marks general feedback distinctly from per-item flags', () => {
    const flag: FeedbackFlagRecord = {
      id: 'fb-2',
      createdAt: 1_700_000_000_000,
      category: 'other',
      note: null,
      itemId: null,
      topicId: null,
      itemType: null,
    };
    const out = formatFeedbackExport([flag], META);
    expect(out).toContain('Allmän feedback');
  });

  it('omits the note line entirely when there is no note', () => {
    const flag: FeedbackFlagRecord = {
      id: 'fb-3',
      createdAt: 1_700_000_000_000,
      category: 'confusing',
      note: null,
      itemId: 'item-x',
      topicId: 'topic-x',
      itemType: 'mcq',
    };
    const out = formatFeedbackExport([flag], META);
    expect(out).not.toContain('Anteckning:');
  });

  it('orders newest flag first', () => {
    const older: FeedbackFlagRecord = {
      id: 'fb-old',
      createdAt: 1_000,
      category: 'other',
      note: 'older',
      itemId: null,
      topicId: null,
      itemType: null,
    };
    const newer: FeedbackFlagRecord = {
      id: 'fb-new',
      createdAt: 2_000,
      category: 'other',
      note: 'newer',
      itemId: null,
      topicId: null,
      itemType: null,
    };
    const out = formatFeedbackExport([older, newer], META);
    expect(out.indexOf('newer')).toBeLessThan(out.indexOf('older'));
  });

  it('includes the app version and count in the header', () => {
    const out = formatFeedbackExport([], { appVersion: '1.2.3', exportedAt: 0 });
    expect(out).toContain('1.2.3');
  });
});
