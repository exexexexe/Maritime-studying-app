import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Image } from 'expo-image';

import { BuoyDiagram } from '@/components/buoy-diagram';
import { LanternDiagram } from '@/components/lantern-diagram';
import { StabilityDiagram } from '@/components/stability-diagram';
import { moduleBySlug, questionText } from '@/content';
import { generateCalculation } from '@/content/generators/navcalc';
import { contentImages } from '@/content/images';
import type { BuoyScene, LanternScene, Option, StabilityScene } from '@/content/types';
import { recordAnswer } from '@/db/reviews';
import { attemptSeed, seededShuffle } from '@/lib/shuffle';
import { buildSession } from '@/srs/session';
import { markActivity } from '@/state/activity';
import { useTrack } from '@/state/track-context';

export default function DrillScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { track } = useTrack();

  // Session is fixed at mount; attemptKey seeds this attempt's option order.
  const [session] = useState(() => {
    const module = moduleBySlug(slug);
    return {
      module,
      items: module ? buildSession(module.id, track, Date.now()) : [],
      attemptKey: Date.now(),
    };
  });

  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [finished, setFinished] = useState(false);

  const item = session.items[index];

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
      <SafeAreaView className="flex-1 bg-bg items-center justify-center px-8">
        <Stack.Screen options={{ headerShown: false }} />
        <Text className="text-body font-sans text-fog text-center">
          Inget att öva just nu — alla frågor är schemalagda framåt i tiden.
        </Text>
        <Pressable
          className="mt-6 rounded-xl border border-fog/25 px-6 py-3 active:opacity-80"
          onPress={() => router.back()}
        >
          <Text className="text-body font-sans text-ink">Tillbaka</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  if (finished) {
    const total = session.items.length;
    const pct = Math.round((correctCount / total) * 100);
    return (
      <SafeAreaView className="flex-1 bg-bg px-6" edges={['top', 'bottom']}>
        <Stack.Screen options={{ headerShown: false }} />
        <View className="flex-1 items-center justify-center">
          <Text className="text-caption font-mono text-fog uppercase tracking-widest">
            Passet klart
          </Text>
          <Text className="text-display-xl font-display text-ink mt-4">
            {correctCount} av {total} rätt
          </Text>
          <Text
            className={`text-data-lg font-mono-medium mt-2 ${
              pct >= 80 ? 'text-starboard' : 'text-brass'
            }`}
          >
            {pct} %
          </Text>
          <Text className="text-small font-sans text-fog mt-6 text-center">
            Repetitionerna är schemalagda. Frågor du missade kommer tillbaka
            direkt i nästa pass.
          </Text>
        </View>
        <Pressable
          className="bg-brass rounded-xl py-4 items-center active:opacity-90 mb-4"
          onPress={() => router.back()}
        >
          <Text className="text-body font-sans-semibold text-bg">Klar</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const answered = selected !== null;
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

  function next() {
    if (index + 1 >= session.items.length) {
      setFinished(true);
    } else {
      setIndex(index + 1);
      setSelected(null);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={['top', 'bottom']}>
      <Stack.Screen options={{ headerShown: false }} />
      <View className="flex-row items-center justify-between px-6 pt-2">
        <Pressable hitSlop={8} onPress={() => router.back()}>
          <Text className="text-small font-sans text-fog">Avbryt</Text>
        </Pressable>
        <Text className="text-caption font-mono text-fog tracking-widest">
          {String(index + 1).padStart(2, '0')} / {String(session.items.length).padStart(2, '0')}
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
        {item.imageAsset ? (
          <View className="mt-5 rounded-xl overflow-hidden border border-fog/15">
            {contentImages[item.imageAsset] ? (
              <Image
                source={contentImages[item.imageAsset]}
                style={{ width: '100%', aspectRatio: 800 / 520 }}
                contentFit="contain"
              />
            ) : (
              <View className="bg-surface items-center py-10">
                <Text className="text-small font-sans text-fog">
                  Bild saknas: {item.imageAsset}
                </Text>
              </View>
            )}
          </View>
        ) : null}

        <View className="mt-6">
          {options.map((opt, i) => {
            let frame = 'border-fog/15 bg-surface';
            if (answered && opt.isCorrect) frame = 'border-starboard bg-starboard/10';
            else if (answered && i === selected) frame = 'border-port bg-port/10';
            return (
              <Pressable
                key={i}
                disabled={answered}
                onPress={() => answer(i)}
                className={`rounded-xl border px-5 py-4 mb-3 active:opacity-80 ${frame}`}
              >
                <Text className="text-body font-sans text-ink">{opt.text}</Text>
              </Pressable>
            );
          })}
        </View>

        {answered ? (
          <View className="rounded-xl bg-surface border border-fog/15 px-5 py-4 mt-2">
            <Text
              className={`text-caption font-mono uppercase tracking-widest ${
                options[selected].isCorrect ? 'text-starboard' : 'text-port'
              }`}
            >
              {options[selected].isCorrect ? 'Rätt' : 'Fel'}
            </Text>
            <Text className="text-small font-sans text-ink mt-2">
              {generated?.explanationSv ?? item.explanationSv}
            </Text>
          </View>
        ) : null}
      </ScrollView>

      {answered ? (
        <View className="px-6 pb-4">
          <Pressable
            className="bg-brass rounded-xl py-4 items-center active:opacity-90"
            onPress={next}
          >
            <Text className="text-body font-sans-semibold text-bg">
              {index + 1 >= session.items.length ? 'Visa resultat' : 'Nästa'}
            </Text>
          </Pressable>
        </View>
      ) : null}
    </SafeAreaView>
  );
}
