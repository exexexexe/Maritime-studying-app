import { Link, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, useColorScheme, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedPressable, ThemedText, ThemedView } from '@/components/themed';
import { itemsForTrack } from '@/content';
import type { Track } from '@/content/types';
import { listExamSessions, type ExamSessionRecord } from '@/db/exams';
import { assembleExam, examConfig, type ExamMode } from '@/exam/assemble';
import { TRACK_NAMES, useTrack } from '@/state/track-context';
import { palette } from '@/theme/tokens';

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
  const p = palette(useColorScheme());
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
    <SafeAreaView className="flex-1" style={{ backgroundColor: p.bg }} edges={['top']}>
      <ScrollView contentContainerClassName="px-6 pt-10 pb-8">
        <ThemedText className="text-display font-display">Provläge</ThemedText>
        <ThemedText tone="fog" className="text-small font-sans mt-1">
          Simulerar provet för {TRACK_NAMES[track]} — utan facit under tiden,
          rättning först när du lämnar in.
        </ThemedText>

        {modes.map(({ mode, titleSv, descSv }) => {
          const m = config[mode];
          const count = Math.min(m.questions, poolSize);
          const chartCount = chartRequiredEstimate(track, mode);
          return (
            <ThemedView
              key={mode}
              bg="surface"
              borderTone="fog"
              borderOpacity={15}
              className="mt-5 rounded-xl border px-5 py-5"
            >
              <ThemedText className="text-title font-sans-semibold">{titleSv}</ThemedText>
              <ThemedText tone="fog" className="text-small font-sans mt-1">{descSv}</ThemedText>
              <View className="flex-row mt-3">
                {(
                  [
                    [String(count), 'frågor'],
                    [String(m.minutes), 'minuter'],
                    [`${m.passPct} %`, 'för godkänt'],
                  ] as const
                ).map(([value, label]) => (
                  <View key={label} className="mr-6">
                    <ThemedText tone="brass" className="text-body font-mono-medium">{value}</ThemedText>
                    <ThemedText tone="fog" className="text-caption font-mono uppercase tracking-widest">
                      {label}
                    </ThemedText>
                  </View>
                ))}
              </View>
              {count < m.questions ? (
                <ThemedText tone="fog" className="text-caption font-sans mt-2">
                  Frågebanken har {poolSize} frågor än så länge — provet använder alla.
                </ThemedText>
              ) : null}
              {chartCount > 0 ? (
                <ThemedText tone="brass" className="text-caption font-sans mt-2">
                  Ungefär {chartCount} av {count} frågor kräver sjökort SE61/SE93 — ha dem redo
                  innan du börjar.
                </ThemedText>
              ) : null}
              <Link href={{ pathname: '/exam-run/[mode]', params: { mode } }} asChild>
                <ThemedPressable
                  bg="brass"
                  className="rounded-xl py-3.5 items-center mt-4 active:opacity-90"
                >
                  <ThemedText tone="bg" className="text-body font-sans-semibold">
                    Starta {titleSv.toLowerCase()}
                  </ThemedText>
                </ThemedPressable>
              </Link>
            </ThemedView>
          );
        })}

        {history.length > 0 ? (
          <View className="mt-6">
            <ThemedText tone="fog" className="text-caption font-mono uppercase tracking-widest mb-3">
              Tidigare prov
            </ThemedText>
            <ThemedView
              bg="surface"
              borderTone="fog"
              borderOpacity={15}
              className="rounded-xl border overflow-hidden"
            >
              {history.slice(0, 8).map((s, i) => (
                <ThemedView
                  key={s.id}
                  borderTone="fog"
                  borderOpacity={10}
                  style={{ borderTopWidth: i > 0 ? 1 : 0 }}
                  className="flex-row items-center px-5 py-3.5"
                >
                  <ThemedText tone="fog" className="text-small font-mono w-28">
                    {fmtDate(s.startedAt)}
                  </ThemedText>
                  <ThemedText className="text-small font-sans flex-1">
                    {s.mode === 'full' ? 'Full simulering' : 'Snabbprov'}
                  </ThemedText>
                  <ThemedText
                    tone={s.passed ? 'starboard' : 'port'}
                    className="text-small font-mono-medium"
                  >
                    {Math.round(s.scorePct ?? 0)} %
                  </ThemedText>
                </ThemedView>
              ))}
            </ThemedView>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
