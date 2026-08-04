import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, useColorScheme, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Image } from 'expo-image';

import { BuoyDiagram } from '@/components/buoy-diagram';
import { ChartRequiredBanner } from '@/components/chart-required-banner';
import { LanternDiagram } from '@/components/lantern-diagram';
import { MapAnswerInput } from '@/components/map-answer-input';
import { StabilityDiagram } from '@/components/stability-diagram';
import { ThemedPressable, ThemedText, ThemedView, type Tone } from '@/components/themed';
import { moduleBySlug, questionText } from '@/content';
import { generateCalculation } from '@/content/generators/navcalc';
import { contentImages } from '@/content/images';
import type { BuoyScene, LanternScene, Option, StabilityScene } from '@/content/types';
import { recordAnswer } from '@/db/reviews';
import {
  formatMapAnswerExpected,
  formatMapAnswerGiven,
  gradeMapAnswer,
  initialMapAnswerValue,
  isMapAnswerComplete,
  type MapAnswerValue,
} from '@/lib/map-answer';
import { attemptSeed, seededShuffle } from '@/lib/shuffle';
import { buildSession, buildTopicSession } from '@/srs/session';
import { markActivity } from '@/state/activity';
import { useTrack } from '@/state/track-context';
import { palette } from '@/theme/tokens';

export default function DrillScreen() {
  const { slug, topic } = useLocalSearchParams<{ slug: string; topic?: string }>();
  const { track } = useTrack();
  const p = palette(useColorScheme());

  // Session is fixed at mount; attemptKey seeds this attempt's option order.
  const [session] = useState(() => {
    const module = moduleBySlug(slug);
    const items = module
      ? topic
        ? buildTopicSession(topic, track, Date.now())
        : buildSession(module.id, track, Date.now())
      : [];
    return {
      module,
      items,
      attemptKey: Date.now(),
    };
  });

  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [mapValue, setMapValue] = useState<MapAnswerValue | null>(() =>
    initialMapAnswerValue(session.items[0]),
  );
  const [mapSubmitted, setMapSubmitted] = useState(false);
  const [mapCorrect, setMapCorrect] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [finished, setFinished] = useState(false);

  const item = session.items[index];
  const isMapNumeric = item?.type === 'map_question' && item.answerMode === 'numeric_tolerance';

  // Calculation items generate fresh numbers per attempt from the same seed
  // that also drives option order — stable on screen, new next time.
  const generated = useMemo(() => {
    if (item?.type !== 'calculation') return null;
    const generatorId = (item.payload as { generator?: string }).generator;
    return generatorId
      ? generateCalculation(generatorId, attemptSeed(item.id, session.attemptKey))
      : null;
  }, [item, session.attemptKey]);

  const options: Option[] = useMemo(
    () =>
      item
        ? seededShuffle(generated?.options ?? item.options, attemptSeed(item.id, session.attemptKey))
        : [],
    [item, generated, session.attemptKey],
  );

  if (!session.module || session.items.length === 0) {
    return (
      <SafeAreaView
        className="flex-1 items-center justify-center px-8"
        style={{ backgroundColor: p.bg }}
      >
        <Stack.Screen options={{ headerShown: false }} />
        <ThemedText tone="fog" className="text-body font-sans text-center">
          Inget att öva just nu — alla frågor är schemalagda framåt i tiden.
        </ThemedText>
        <ThemedPressable
          borderTone="fog"
          borderOpacity={25}
          className="mt-6 rounded-xl border px-6 py-3 active:opacity-80"
          onPress={() => router.back()}
        >
          <ThemedText className="text-body font-sans">Tillbaka</ThemedText>
        </ThemedPressable>
      </SafeAreaView>
    );
  }

  if (finished) {
    const total = session.items.length;
    const pct = Math.round((correctCount / total) * 100);
    return (
      <SafeAreaView className="flex-1 px-6" style={{ backgroundColor: p.bg }} edges={['top', 'bottom']}>
        <Stack.Screen options={{ headerShown: false }} />
        <View className="flex-1 items-center justify-center">
          <ThemedText tone="fog" className="text-caption font-mono uppercase tracking-widest">
            Passet klart
          </ThemedText>
          <ThemedText className="text-display-xl font-display mt-4">
            {correctCount} av {total} rätt
          </ThemedText>
          <ThemedText tone={pct >= 80 ? 'starboard' : 'brass'} className="text-data-lg font-mono-medium mt-2">
            {pct} %
          </ThemedText>
          <ThemedText tone="fog" className="text-small font-sans mt-6 text-center">
            Repetitionerna är schemalagda. Frågor du missade kommer tillbaka
            direkt i nästa pass.
          </ThemedText>
        </View>
        <ThemedPressable
          bg="brass"
          className="rounded-xl py-4 items-center active:opacity-90 mb-4"
          onPress={() => router.back()}
        >
          <ThemedText tone="bg" className="text-body font-sans-semibold">Klar</ThemedText>
        </ThemedPressable>
      </SafeAreaView>
    );
  }

  const answered = isMapNumeric ? mapSubmitted : selected !== null;
  const lanternScene =
    item.type === 'lantern'
      ? (item.payload as { scene?: LanternScene }).scene
      : undefined;
  const buoyScene =
    item.type === 'buoy' ? (item.payload as { scene?: BuoyScene }).scene : undefined;
  const stabilityScene =
    item.type === 'stability_diagram'
      ? (item.payload as { scene?: StabilityScene }).scene
      : undefined;

  function answer(optionIndex: number) {
    if (answered) return;
    setSelected(optionIndex);
    const correct = options[optionIndex].isCorrect;
    if (correct) setCorrectCount((c) => c + 1);
    const now = Date.now();
    recordAnswer(item.id, track, correct, now);
    markActivity(now);
  }

  function submitMapAnswer() {
    if (mapSubmitted || !isMapNumeric || item.type !== 'map_question' || !item.answer || !mapValue) {
      return;
    }
    const correct = gradeMapAnswer(item.answer, mapValue);
    setMapSubmitted(true);
    setMapCorrect(correct);
    if (correct) setCorrectCount((c) => c + 1);
    const now = Date.now();
    recordAnswer(item.id, track, correct, now);
    markActivity(now);
  }

  function next() {
    if (index + 1 >= session.items.length) {
      setFinished(true);
    } else {
      const nextItem = session.items[index + 1];
      setIndex(index + 1);
      setSelected(null);
      setMapValue(initialMapAnswerValue(nextItem));
      setMapSubmitted(false);
      setMapCorrect(false);
    }
  }

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: p.bg }} edges={['top', 'bottom']}>
      <Stack.Screen options={{ headerShown: false }} />
      <View className="flex-row items-center justify-between px-6 pt-2">
        <ThemedPressable hitSlop={8} onPress={() => router.back()}>
          <ThemedText tone="fog" className="text-small font-sans">Avbryt</ThemedText>
        </ThemedPressable>
        <ThemedText tone="fog" className="text-caption font-mono tracking-widest">
          {String(index + 1).padStart(2, '0')} / {String(session.items.length).padStart(2, '0')}
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
        {item.imageAsset ? (
          <ThemedView
            borderTone="fog"
            borderOpacity={15}
            className="mt-5 rounded-xl overflow-hidden border"
          >
            {contentImages[item.imageAsset] ? (
              <Image
                source={contentImages[item.imageAsset]}
                style={{ width: '100%', aspectRatio: 800 / 520 }}
                contentFit="contain"
              />
            ) : (
              <ThemedView bg="surface" className="items-center py-10">
                <ThemedText tone="fog" className="text-small font-sans">
                  Bild saknas: {item.imageAsset}
                </ThemedText>
              </ThemedView>
            )}
          </ThemedView>
        ) : null}

        {isMapNumeric && item.type === 'map_question' && item.answer && mapValue ? (
          <View className="mt-5">
            <MapAnswerInput
              answer={item.answer}
              value={mapValue}
              onChange={setMapValue}
              disabled={mapSubmitted}
            />
          </View>
        ) : null}

        <View className="mt-6">
          {options.map((opt, i) => {
            const correctReveal = answered && opt.isCorrect;
            const wrongSelected = answered && i === selected;
            const tone: Tone = correctReveal ? 'starboard' : wrongSelected ? 'port' : 'fog';
            const borderOpacity = correctReveal || wrongSelected ? undefined : 15;
            const bg: Tone = correctReveal ? 'starboard' : wrongSelected ? 'port' : 'surface';
            const bgOpacity = correctReveal || wrongSelected ? 10 : undefined;
            return (
              <ThemedPressable
                key={i}
                disabled={answered}
                onPress={() => answer(i)}
                bg={bg}
                bgOpacity={bgOpacity}
                borderTone={tone}
                borderOpacity={borderOpacity}
                className="rounded-xl border px-5 py-4 mb-3 active:opacity-80"
              >
                <ThemedText className="text-body font-sans">{opt.text}</ThemedText>
              </ThemedPressable>
            );
          })}
        </View>

        {answered ? (
          <ThemedView
            bg="surface"
            borderTone="fog"
            borderOpacity={15}
            className="rounded-xl border px-5 py-4 mt-2"
          >
            <ThemedText
              tone={(isMapNumeric ? mapCorrect : options[selected!].isCorrect) ? 'starboard' : 'port'}
              className="text-caption font-mono uppercase tracking-widest"
            >
              {(isMapNumeric ? mapCorrect : options[selected!].isCorrect) ? 'Rätt' : 'Fel'}
            </ThemedText>
            {isMapNumeric && item.type === 'map_question' && item.answer && mapValue ? (
              <ThemedText tone="fog" className="text-small font-mono mt-1">
                Ditt svar: {formatMapAnswerGiven(mapValue)} · Rätt svar:{' '}
                {formatMapAnswerExpected(item.answer)}
              </ThemedText>
            ) : null}
            <ThemedText className="text-small font-sans mt-2">
              {generated?.explanationSv ?? item.explanationSv}
            </ThemedText>
          </ThemedView>
        ) : null}
      </ScrollView>

      {answered ? (
        <View className="px-6 pb-4">
          <ThemedPressable
            bg="brass"
            className="rounded-xl py-4 items-center active:opacity-90"
            onPress={next}
          >
            <ThemedText tone="bg" className="text-body font-sans-semibold">
              {index + 1 >= session.items.length ? 'Visa resultat' : 'Nästa'}
            </ThemedText>
          </ThemedPressable>
        </View>
      ) : isMapNumeric ? (
        <View className="px-6 pb-4">
          <ThemedPressable
            disabled={!mapValue || !isMapAnswerComplete(mapValue)}
            bg={mapValue && isMapAnswerComplete(mapValue) ? 'brass' : 'surface'}
            borderTone={mapValue && isMapAnswerComplete(mapValue) ? undefined : 'fog'}
            borderOpacity={15}
            className={`rounded-xl py-4 items-center ${
              mapValue && isMapAnswerComplete(mapValue) ? 'active:opacity-90' : 'border'
            }`}
            onPress={submitMapAnswer}
          >
            <ThemedText
              tone={mapValue && isMapAnswerComplete(mapValue) ? 'bg' : 'fog'}
              className="text-body font-sans-semibold"
            >
              Svara
            </ThemedText>
          </ThemedPressable>
        </View>
      ) : null}
    </SafeAreaView>
  );
}
