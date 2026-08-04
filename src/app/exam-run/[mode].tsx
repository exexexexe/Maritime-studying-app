import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, useColorScheme, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Image } from 'expo-image';

import { BuoyDiagram } from '@/components/buoy-diagram';
import { ChartRequiredBanner } from '@/components/chart-required-banner';
import { LanternDiagram } from '@/components/lantern-diagram';
import { MapAnswerInput } from '@/components/map-answer-input';
import { NumericReadout } from '@/components/numeric-readout';
import { StabilityDiagram } from '@/components/stability-diagram';
import { ThemedPressable, ThemedText, ThemedView, type Tone } from '@/components/themed';
import { modules, questionText } from '@/content';
import { generateCalculation } from '@/content/generators/navcalc';
import { contentImages } from '@/content/images';
import type { BuoyScene, Item, LanternScene, Option, StabilityScene } from '@/content/types';
import { recordExamSession } from '@/db/exams';
import { assembleExam, examConfig, tallyByModule, type ExamMode } from '@/exam/assemble';
import {
  gradeMapAnswer,
  initialMapAnswerValue,
  isMapAnswerComplete,
  type MapAnswerValue,
} from '@/lib/map-answer';
import { attemptSeed, seededShuffle } from '@/lib/shuffle';
import { markActivity } from '@/state/activity';
import { TRACK_NAMES, useTrack } from '@/state/track-context';
import { palette } from '@/theme/tokens';

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
  const p = palette(useColorScheme());

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
  const [mapValue, setMapValue] = useState<MapAnswerValue | null>(() =>
    initialMapAnswerValue(exam.items[0]),
  );
  const answersRef = useRef<Answer[]>([]);
  const [result, setResult] = useState<ReturnType<typeof recordExamSession> | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(exam.config.minutes * 60);

  const item: Item | undefined = exam.items[index];
  const isMapNumeric = item?.type === 'map_question' && item.answerMode === 'numeric_tolerance';

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
    markActivity(Date.now());
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
      <SafeAreaView className="flex-1" style={{ backgroundColor: p.bg }} edges={['top', 'bottom']}>
        <Stack.Screen options={{ headerShown: false }} />
        <ScrollView contentContainerClassName="flex-grow px-6 pt-14 pb-6">
          {/* The score is the dominant number on this screen — the pass/
              fail verdict is real information but secondary to it: still
              color-coded and legible, demoted to a label under the hero
              readout rather than competing with it at display-xl. */}
          <View className="items-center">
            <ThemedText tone="fog" className="text-caption font-mono uppercase tracking-widest">
              {mode === 'full' ? 'Full simulering' : 'Snabbprov'} · {TRACK_NAMES[track]}
            </ThemedText>
            <NumericReadout
              value={pct}
              unit="%"
              variant="mono"
              tone={result.passed ? 'starboard' : 'port'}
              className="mt-4"
            />
            <ThemedText
              tone={result.passed ? 'starboard' : 'port'}
              className="text-title font-sans-semibold mt-2 uppercase tracking-widest"
            >
              {result.passed ? 'Godkänt' : 'Ej godkänt'}
            </ThemedText>
            <ThemedText tone="fog" className="text-small font-sans mt-2">
              {result.correct} rätt av {result.itemsAttempted} besvarade · gräns{' '}
              {exam.config.passPct} %
            </ThemedText>
          </View>

          {weak.length > 0 ? (
            <View className="mt-8">
              <ThemedText tone="fog" className="text-caption font-mono uppercase tracking-widest mb-3">
                Att öva mer på
              </ThemedText>
              <ThemedView
                bg="surface"
                borderTone="fog"
                borderOpacity={15}
                className="rounded-xl border overflow-hidden"
              >
                {weak.map((w, i) => (
                  <ThemedView
                    key={w.moduleId}
                    borderTone="fog"
                    borderOpacity={10}
                    style={{ borderTopWidth: i > 0 ? 1 : 0 }}
                    className="flex-row items-center px-5 py-3.5"
                  >
                    <ThemedText className="text-body font-sans flex-1">
                      {moduleName(w.moduleId)}
                    </ThemedText>
                    <ThemedText tone="port" className="text-small font-mono">
                      {w.correct}/{w.total} rätt
                    </ThemedText>
                  </ThemedView>
                ))}
              </ThemedView>
              <ThemedText tone="fog" className="text-small font-sans mt-2">
                Kör ett drillpass i modulerna ovan — frågorna du missade finns
                kvar i repetitionsschemat.
              </ThemedText>
            </View>
          ) : null}

          <View className="flex-1" />
          <ThemedPressable
            bg="brass"
            className="rounded-xl py-4 items-center active:opacity-90 mt-8"
            onPress={() => router.back()}
          >
            <ThemedText tone="bg" className="text-body font-sans-semibold">Klar</ThemedText>
          </ThemedPressable>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (!item) {
    return (
      <SafeAreaView
        className="flex-1 items-center justify-center"
        style={{ backgroundColor: p.bg }}
      >
        <Stack.Screen options={{ headerShown: false }} />
        <ThemedText tone="fog" className="text-body font-sans">
          Inga frågor för spåret ännu.
        </ThemedText>
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
    if (isMapNumeric) {
      if (!item || item.type !== 'map_question' || !item.answer || !mapValue) return;
      answersRef.current.push({ item, correct: gradeMapAnswer(item.answer, mapValue) });
    } else {
      if (selected === null) return;
      answersRef.current.push({ item: item!, correct: options[selected].isCorrect });
    }
    if (index + 1 >= exam.items.length) {
      finish();
    } else {
      const nextItem = exam.items[index + 1];
      setIndex(index + 1);
      setSelected(null);
      setMapValue(initialMapAnswerValue(nextItem));
    }
  }

  const low = secondsLeft <= 60;

  const mapReady = isMapNumeric ? Boolean(mapValue && isMapAnswerComplete(mapValue)) : selected !== null;

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: p.bg }} edges={['top', 'bottom']}>
      <Stack.Screen options={{ headerShown: false }} />
      <View className="flex-row items-center justify-between px-6 pt-2">
        <ThemedPressable hitSlop={8} onPress={() => router.back()}>
          <ThemedText tone="fog" className="text-small font-sans">Avbryt</ThemedText>
        </ThemedPressable>
        <ThemedText
          tone={low ? 'port' : 'fog'}
          className="text-small font-mono-medium tracking-widest"
        >
          {fmtClock(secondsLeft)}
        </ThemedText>
        <ThemedText tone="fog" className="text-caption font-mono tracking-widest">
          {String(index + 1).padStart(2, '0')} / {String(exam.items.length).padStart(2, '0')}
        </ThemedText>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-6 pt-6 pb-4"
        showsVerticalScrollIndicator={false}
      >
        {item.type === 'map_question' && item.chartRef ? (
          <ChartRequiredBanner chartRef={item.chartRef} />
        ) : null}

        <ThemedText className="text-title font-sans-medium">
          {generated?.questionSv ?? questionText(item)}
        </ThemedText>

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
          <ThemedView
            borderTone="fog"
            borderOpacity={15}
            className="mt-5 rounded-xl overflow-hidden border"
          >
            <Image
              source={contentImages[item.imageAsset]}
              style={{ width: '100%', aspectRatio: 800 / 520 }}
              contentFit="contain"
            />
          </ThemedView>
        ) : null}

        {isMapNumeric && item.type === 'map_question' && item.answer && mapValue ? (
          <View className="mt-5">
            <MapAnswerInput answer={item.answer} value={mapValue} onChange={setMapValue} />
          </View>
        ) : null}

        <View className="mt-6">
          {options.map((opt, i) => {
            const isSelected = i === selected;
            const tone: Tone = isSelected ? 'brass' : 'fog';
            return (
              <ThemedPressable
                key={i}
                onPress={() => setSelected(i)}
                bg="surface"
                bgOpacity={isSelected ? undefined : 60}
                borderTone={tone}
                borderOpacity={isSelected ? undefined : 15}
                className="rounded-xl border px-5 py-4 mb-3 active:opacity-80"
              >
                <ThemedText className="text-body font-sans">{opt.text}</ThemedText>
              </ThemedPressable>
            );
          })}
        </View>
      </ScrollView>

      <View className="px-6 pb-4">
        <ThemedPressable
          disabled={!mapReady}
          bg={mapReady ? 'brass' : 'surface'}
          borderTone={mapReady ? undefined : 'fog'}
          borderOpacity={15}
          className={`rounded-xl py-4 items-center ${mapReady ? 'active:opacity-90' : 'border'}`}
          onPress={submitAnswer}
        >
          <ThemedText tone={mapReady ? 'bg' : 'fog'} className="text-body font-sans-semibold">
            {index + 1 >= exam.items.length ? 'Lämna in' : 'Nästa'}
          </ThemedText>
        </ThemedPressable>
      </View>
    </SafeAreaView>
  );
}
