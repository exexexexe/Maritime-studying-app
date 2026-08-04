import { Link, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { itemsForTrack } from '@/content';
import type { Track } from '@/content/types';
import { listExamSessions, type ExamSessionRecord } from '@/db/exams';
import { assembleExam, examConfig, type ExamMode } from '@/exam/assemble';
import { TRACK_NAMES, useTrack } from '@/state/track-context';

/**
 * Estimated count of map_question items an exam draw of this mode/track
 * would include — assembled with a fixed seed purely for this preview, so
 * a student can gather SE61/SE93 before starting. The real run seeds from
 * Date.now() and may land a slightly different count.
 */
function chartRequiredEstimate(track: Track, mode: ExamMode): number {
  return assembleExam(track, mode, 1).filter((i) => i.type === 'map_question').length;
}

function fmtDate(ts: number) {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate(),
  ).padStart(2, '0')}`;
}

export default function ExamScreen() {
  const { track } = useTrack();
  const config = examConfig(track);
  const poolSize = itemsForTrack(track).length;
  const [history, setHistory] = useState<ExamSessionRecord[]>([]);

  useFocusEffect(
    useCallback(() => {
      setHistory(listExamSessions(track).filter((s) => s.finishedAt !== null));
    }, [track]),
  );

  const modes: { mode: ExamMode; titleSv: string; descSv: string }[] = [
    {
      mode: 'quick',
      titleSv: 'Snabbprov',
      descSv: 'Kortare pass med samma frågemix som det riktiga provet.',
    },
    {
      mode: 'full',
      titleSv: 'Full simulering',
      descSv: 'Hela provet mot klockan, med gräns för godkänt.',
    },
  ];

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={['top']}>
      <ScrollView contentContainerClassName="px-6 pt-10 pb-8">
        <Text className="text-display font-display text-ink">Provläge</Text>
        <Text className="text-small font-sans text-fog mt-1">
          Simulerar provet för {TRACK_NAMES[track]} — utan facit under tiden,
          rättning först när du lämnar in.
        </Text>

        {modes.map(({ mode, titleSv, descSv }) => {
          const m = config[mode];
          const count = Math.min(m.questions, poolSize);
          const chartCount = chartRequiredEstimate(track, mode);
          return (
            <View
              key={mode}
              className="mt-5 rounded-xl bg-surface border border-fog/15 px-5 py-5"
            >
              <Text className="text-title font-sans-semibold text-ink">{titleSv}</Text>
              <Text className="text-small font-sans text-fog mt-1">{descSv}</Text>
              <View className="flex-row mt-3">
                {(
                  [
                    [String(count), 'frågor'],
                    [String(m.minutes), 'minuter'],
                    [`${m.passPct} %`, 'för godkänt'],
                  ] as const
                ).map(([value, label]) => (
                  <View key={label} className="mr-6">
                    <Text className="text-body font-mono-medium text-brass">{value}</Text>
                    <Text className="text-caption font-mono text-fog uppercase tracking-widest">
                      {label}
                    </Text>
                  </View>
                ))}
              </View>
              {count < m.questions ? (
                <Text className="text-caption font-sans text-fog mt-2">
                  Frågebanken har {poolSize} frågor än så länge — provet använder alla.
                </Text>
              ) : null}
              {chartCount > 0 ? (
                <Text className="text-caption font-sans text-brass mt-2">
                  Ungefär {chartCount} av {count} frågor kräver sjökort SE61/SE93 — ha dem redo
                  innan du börjar.
                </Text>
              ) : null}
              <Link href={{ pathname: '/exam-run/[mode]', params: { mode } }} asChild>
                <Pressable className="bg-brass rounded-xl py-3.5 items-center mt-4 active:opacity-90">
                  <Text className="text-body font-sans-semibold text-bg">Starta {titleSv.toLowerCase()}</Text>
                </Pressable>
              </Link>
            </View>
          );
        })}

        {history.length > 0 ? (
          <View className="mt-6">
            <Text className="text-caption font-mono text-fog uppercase tracking-widest mb-3">
              Tidigare prov
            </Text>
            <View className="rounded-xl bg-surface border border-fog/15 overflow-hidden">
              {history.slice(0, 8).map((s, i) => (
                <View
                  key={s.id}
                  className={`flex-row items-center px-5 py-3.5 ${
                    i > 0 ? 'border-t border-fog/10' : ''
                  }`}
                >
                  <Text className="text-small font-mono text-fog w-28">
                    {fmtDate(s.startedAt)}
                  </Text>
                  <Text className="text-small font-sans text-ink flex-1">
                    {s.mode === 'full' ? 'Full simulering' : 'Snabbprov'}
                  </Text>
                  <Text
                    className={`text-small font-mono-medium ${
                      s.passed ? 'text-starboard' : 'text-port'
                    }`}
                  >
                    {Math.round(s.scorePct ?? 0)} %
                  </Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
