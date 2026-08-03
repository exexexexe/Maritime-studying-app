import type { Track } from '@/content/types';
import type { ModuleResult } from '@/exam/assemble';

import { getStorage } from './index';
import type { ExamSessionRecord } from './storage';

export type { ExamSessionRecord } from './storage';

/** Persist a finished exam simulation. */
export function recordExamSession(args: {
  track: Track;
  mode: 'quick' | 'full';
  startedAt: number;
  finishedAt: number;
  itemsAttempted: number;
  correct: number;
  passPct: number;
  moduleResults: ModuleResult[];
}): ExamSessionRecord {
  const scorePct =
    args.itemsAttempted === 0 ? 0 : (args.correct / args.itemsAttempted) * 100;
  const record: ExamSessionRecord = {
    id: `exam-${args.startedAt}-${Math.floor(Math.random() * 1e6)}`,
    track: args.track,
    mode: args.mode,
    startedAt: args.startedAt,
    finishedAt: args.finishedAt,
    itemsAttempted: args.itemsAttempted,
    correct: args.correct,
    scorePct,
    passed: scorePct >= args.passPct,
    moduleResults: JSON.stringify(args.moduleResults),
  };
  getStorage().upsertExamSession(record);
  return record;
}

export function listExamSessions(track: Track): ExamSessionRecord[] {
  return getStorage().listExamSessions(track);
}
