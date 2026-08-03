import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Image } from 'expo-image';

import { BuoyDiagram } from '@/components/buoy-diagram';
import { LanternDiagram } from '@/components/lantern-diagram';
import { StabilityDiagram } from '@/components/stability-diagram';
import { modules, questionText } from '@/content';
import { generateCalculation } from '@/content/generators/navcalc';
import { contentImages } from '@/content/images';
import type { BuoyScene, Item, LanternScene, Option, StabilityScene } from '@/content/types';
import { recordExamSession } from '@/db/exams';
import { assembleExam, examConfig, tallyByModule, type ExamMode } from '@/exam/assemble';
import { attemptSeed, seededShuffle } from '@/lib/shuffle';
import { TRACK_NAMES, useTrack } from '@/state/track-context';

interface Answer {
  item: Item;
  correct: boolean;
}

function fmtClock(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function ExamRunScreen() {
  const { mode: modeParam } = useLocalSearchParams<{ mode: string }>();
  const mode: ExamMode = modeParam === 'full' ? 'full' : 'quick';
  const { track } = useTrack();

  const [exam] = useState(() => {
    const startedAt = Date.now();
    return {
      startedAt,
      config: examConfig(track)[mode],
      items: assembleExam(track, mode, startedAt),
    };
  });

  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const answersRef = useRef<Answer[]>([]);
  const [result, setResult] = useState<ReturnType<typeof recordExamSession> | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(exam.config.minutes * 60);

  const item: Item | undefined = exam.items[index];

  const generated = useMemo(() => {
    if (item?.type !== 'calculation') return null;
    const generatorId = (item.payload as { generator?: string }).generator;
    return generatorId
      ? generateCalculation(generatorId, attemptSeed(item.id, exam.startedAt))
      : null;
  }, [item, exam.startedAt]);

  const options: Option[] = useMemo(
    () =>
      item
        ? seededShuffle(generated?.options ?? item.options, attemptSeed(item.id, exam.startedAt))
        : [],
    [item, generated, exam.startedAt],
  );

  function finish() {
    if (result) return;
    const answers = answersRef.current;
    const tally = tallyByModule(answers);
    setResult(
      recordExamSession({
        track,
        mode,
        startedAt: exam.startedAt,
        finishedAt: Date.now(),
        itemsAttempted: answers.length,
        correct: answers.filter((a) => a.correct).length,
        passPct: exam.config.passPct,
        moduleResults: tally,
      }),
    );
  }

  // Countdown — auto-submits when time runs out.
  useEffect(() => {
    if (result) return;
    const t = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(t);
          finish();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result !== null]);

  if (result) {
    const pct = Math.round(result.scorePct ?? 0);
    const tally = tallyByModule(answersRef.current);
    const moduleName = (id: string) => modules.find((m) => m.id === id)?.titleSv ?? id;
    const weak = tally.filter((t) => t.correct < t.total).slice(0, 3);
    return (
      <SafeAreaView className="flex-1 bg-bg" edges={['top', 'bottom']}>
        <Stack.Screen options={{ headerShown: false }} />
        <ScrollView contentContainerClassName="flex-grow px-6 pt-14 pb-6">
          <View className="items-center">
            <Text className="text-caption font-mono text-fog uppercase tracking-widest">
              {mode === 'full' ? 'Full simulering' : 'Snabbprov'} · {TRACK_NAMES[track]}
            </Text>
            <Text
              className={`text-display-xl font-display mt-4 ${
                result.passed ? 'text-starboard' : 'text-port'
              }`}
            >
              {result.passed ? 'Godkänt' : 'Ej godkänt'}
            </Text>
            <Text className="text-data-lg font-mono-medium text-ink mt-2">{pct} %</Text>
            <Text className="text-small font-sans text-fog mt-1">
              {result.correct} rätt av {result.itemsAttempted} besvarade · gräns{' '}
              {exam.config.passPct} %
            </Text>
          </View>

          {weak.length > 0 ? (
            <View className="mt-8">
              <Text className="text-caption font-mono text-fog uppercase tracking-widest mb-3">
                Att öva mer på
              </Text>
              <View className="rounded-xl bg-surface border border-fog/15 overflow-hidden">
                {weak.map((w, i) => (
                  <View
                    key={w.moduleId}
                    className={`flex-row items-center px-5 py-3.5 ${
                      i > 0 ? 'border-t border-fog/10' : ''
                    }`}
                  >
                    <Text className="text-body font-sans text-ink flex-1">
                      {moduleName(w.moduleId)}
                    </Text>
                    <Text className="text-small font-mono text-port">
                      {w.correct}/{w.total} rätt
                    </Text>
                  </View>
                ))}
              </View>
              <Text className="text-small font-sans text-fog mt-2">
                Kör ett drillpass i modulerna ovan — frågorna du missade finns
                kvar i repetitionsschemat.
              </Text>
            </View>
          ) : null}

          <View className="flex-1" />
          <Pressable
            className="bg-brass rounded-xl py-4 items-center active:opacity-90 mt-8"
            onPress={() => router.back()}
          >
            <Text className="text-body font-sans-semibold text-bg">Klar</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (!item) {
    return (
      <SafeAreaView className="flex-1 bg-bg items-center justify-center">
        <Stack.Screen options={{ headerShown: false }} />
        <Text className="text-body font-sans text-fog">Inga frågor för spåret ännu.</Text>
      </SafeAreaView>
    );
  }

  const lanternScene =
    item.type === 'lantern' ? (item.payload as { scene?: LanternScene }).scene : undefined;
  const buoyScene =
    item.type === 'buoy' ? (item.payload as { scene?: BuoyScene }).scene : undefined;
  const stabilityScene =
    item.type === 'stability_diagram'
      ? (item.payload as { scene?: StabilityScene }).scene
      : undefined;

  function submitAnswer() {
    if (selected === null) return;
    answersRef.current.push({ item: item!, correct: options[selected].isCorrect });
    if (index + 1 >= exam.items.length) {
      finish();
    } else {
      setIndex(index + 1);
      setSelected(null);
    }
  }

  const low = secondsLeft <= 60;

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={['top', 'bottom']}>
      <Stack.Screen options={{ headerShown: false }} />
      <View className="flex-row items-center justify-between px-6 pt-2">
        <Pressable hitSlop={8} onPress={() => router.back()}>
          <Text className="text-small font-sans text-fog">Avbryt</Text>
        </Pressable>
        <Text
          className={`text-small font-mono-medium tracking-widest ${
            low ? 'text-port' : 'text-fog'
          }`}
        >
          {fmtClock(secondsLeft)}
        </Text>
        <Text className="text-caption font-mono text-fog tracking-widest">
          {String(index + 1).padStart(2, '0')} / {String(exam.items.length).padStart(2, '0')}
        </Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-6 pt-6 pb-4"
        showsVerticalScrollIndicator={false}
      >
        <Text className="text-title font-sans-medium text-ink">
          {generated?.questionSv ?? questionText(item)}
        </Text>

        {lanternScene ? (
          <View className="mt-5">
            <LanternDiagram scene={lanternScene} />
          </View>
        ) : null}
        {buoyScene ? (
          <View className="mt-5">
            <BuoyDiagram scene={buoyScene} />
          </View>
        ) : null}
        {stabilityScene ? (
          <View className="mt-5">
            <StabilityDiagram scene={stabilityScene} />
          </View>
        ) : null}
        {item.imageAsset && contentImages[item.imageAsset] ? (
          <View className="mt-5 rounded-xl overflow-hidden border border-fog/15">
            <Image
              source={contentImages[item.imageAsset]}
              style={{ width: '100%', aspectRatio: 800 / 520 }}
              contentFit="contain"
            />
          </View>
        ) : null}

        <View className="mt-6">
          {options.map((opt, i) => (
            <Pressable
              key={i}
              onPress={() => setSelected(i)}
              className={`rounded-xl border px-5 py-4 mb-3 active:opacity-80 ${
                i === selected ? 'border-brass bg-surface' : 'border-fog/15 bg-surface/60'
              }`}
            >
              <Text className="text-body font-sans text-ink">{opt.text}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      <View className="px-6 pb-4">
        <Pressable
          disabled={selected === null}
          className={`rounded-xl py-4 items-center ${
            selected === null ? 'bg-surface border border-fog/15' : 'bg-brass active:opacity-90'
          }`}
          onPress={submitAnswer}
        >
          <Text
            className={`text-body font-sans-semibold ${
              selected === null ? 'text-fog' : 'text-bg'
            }`}
          >
            {index + 1 >= exam.items.length ? 'Lämna in' : 'Nästa'}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
