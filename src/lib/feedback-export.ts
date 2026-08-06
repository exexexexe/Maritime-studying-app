import type { FeedbackFlagRecord } from '@/db/storage';

/**
 * Plain text, not JSON — chosen because it's readable directly inside
 * whatever share target the tester picks (email body, a chat message),
 * with no extra step to open/format a file. See feedback-flag-button.tsx
 * and the Settings "Skicka feedback" action for where this is used.
 */

const CATEGORY_LABELS: Record<FeedbackFlagRecord['category'], string> = {
  wrong_answer: 'Fel svar',
  confusing: 'Otydligt',
  typo_translation: 'Stavfel/översättning',
  other: 'Övrigt',
};

function formatTimestamp(ms: number): string {
  return new Date(ms).toISOString().replace('T', ' ').replace(/\.\d+Z$/, ' UTC');
}

export function formatFeedbackExport(
  flags: FeedbackFlagRecord[],
  meta: { appVersion: string; exportedAt: number },
): string {
  const lines: string[] = [
    'Plugga Sjöexamen — testfeedback',
    `Appversion: ${meta.appVersion}`,
    `Exporterad: ${formatTimestamp(meta.exportedAt)}`,
    `Antal poster: ${flags.length}`,
  ];

  if (flags.length === 0) {
    lines.push('', '(Inga flaggade poster.)');
    return lines.join('\n');
  }

  const sorted = [...flags].sort((a, b) => b.createdAt - a.createdAt);
  for (const f of sorted) {
    lines.push('', '---', `Tid: ${formatTimestamp(f.createdAt)}`);
    lines.push(`Kategori: ${CATEGORY_LABELS[f.category] ?? f.category}`);
    lines.push(
      f.itemId
        ? `Fråga: ${f.itemId} (typ: ${f.itemType ?? '?'}, ämne: ${f.topicId ?? '?'})`
        : 'Allmän feedback (ej kopplad till en specifik fråga)',
    );
    if (f.note) lines.push(`Anteckning: ${f.note}`);
  }

  return lines.join('\n');
}
