import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, useColorScheme, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Image } from 'expo-image';

import { BuoyDiagram } from '@/components/buoy-diagram';
import { ChartRequiredBanner } from '@/components/chart-required-banner';
import { LanternDiagram } from '@/components/lantern-diagram';
import { MapAnswerInput } from '@/components/map-answer-input';
import { RadioProcedureBuilder } from '@/components/radio-procedure-builder';
import { StabilityDiagram } from '@/components/stability-diagram';
import { ThemedPressable, ThemedText, ThemedView, type Tone } from '@/components/themed';
import { TermCard } from '@/components/term-card';
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
import { gradeRadioProcedure } from '@/lib/radio-procedure';
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
  const [flipped, setFlipped] = useState(false);
  const [cardLang, setCardLang] = useState<'sv' | 'en'>('sv');
  const [correctCount, setCorrectCount] = useState(0);
  const [finished, setFinished] = useState(false);
  const [radioPlaced, setRadioPlaced] = useState<string[]>([]);
  const [radioSubmitted, setRadioSubmitted] = useState(false);
  const [radioCorrect, setRadioCorrect] = useState(false);
  const [radioFeedback, setRadioFeedback] = useState('');

  const item = session.items[index];
  const isMapNumeric = item?.type === 'map_question' && item.answerMode === 'numeric_tolerance';
  const isTermCard = item?.type === 'term_card';
  const isRadioProcedure = item?.type === 'radio_procedure';

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

  // Pool = requiredBlocks + distractorBlocks, shuffled per attempt exactly
  // like options above — stable on screen, new order next attempt.
  const radioPool = useMemo(() => {
    if (item?.type !== 'radio_procedure') return [];
    const all = [...(item.requiredBlocks ?? []), ...(item.distractorBlocks ?? [])];
    return seededShuffle(all, attemptSeed(item.id, session.attemptKey));
  }, [item, session.attemptKey]);

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

  const answered = isMapNumeric ? mapSubmitted : isRadioProcedure ? radioSubmitted : selected !== null;
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

  function submitRadioProcedure() {
    if (radioSubmitted || item.type !== 'radio_procedure' || radioPlaced.length === 0) return;
    const result = gradeRadioProcedure(item, radioPlaced);
    setRadioSubmitted(true);
    setRadioCorrect(result.correct);
    setRadioFeedback(result.feedbackSv);
    if (result.correct) setCorrectCount((c) => c + 1);
    const now = Date.now();
    recordAnswer(item.id, track, result.correct, now);
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
      setFlipped(false);
      setCardLang('sv');
      setRadioPlaced([]);
      setRadioSubmitted(false);
      setRadioCorrect(false);
      setRadioFeedback('');
    }
  }

  // Self-graded — the student already saw the definition on the back
  // before judging themselves, so (unlike mcq/map_question, where
  // answering and seeing the explanation happen together) there's no new
  // information an explicit "Nästa" tap would reveal. Advances straight
  // to the next card, Anki-style.
  function answerTermCard(knew: boolean) {
    if (!isTermCard) return;
    const now = Date.now();
    if (knew) setCorrectCount((c) => c + 1);
    recordAnswer(item.id, track, knew, now);
    markActivity(now);
    next();
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
        {isTermCard && item.type === 'term_card' ? (
          <TermCard
            termSv={item.termSv ?? ''}
            termEn={item.termEn}
            definitionSv={item.explanationSv}
            definitionEn={item.explanationEn}
            lang={cardLang}
            onToggleLang={() => setCardLang((l) => (l === 'sv' ? 'en' : 'sv'))}
            flipped={flipped}
            onPress={() => setFlipped((f) => !f)}
          />
        ) : (
          <>
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

            {isRadioProcedure && item.type === 'radio_procedure' ? (
              <View className="mt-5">
                <RadioProcedureBuilder
                  poolBlocks={radioPool.filter((b) => !radioPlaced.includes(b.id))}
                  placedBlocks={radioPlaced.map((id, i) => {
                    const block = radioPool.find((b) => b.id === id)!;
                    const req = item.requiredBlocks ?? [];
                    const distractorIds = new Set((item.distractorBlocks ?? []).map((b) => b.id));
                    // Compare by text, not id — see src/lib/radio-procedure.ts:
                    // a repeated phrase (MAYDAY ×3) has interchangeable blocks
                    // the student can't tell apart, so the per-block color
                    // must use the same text-based check as the grade itself,
                    // not an arbitrary id tie-break.
                    const status = radioSubmitted
                      ? !distractorIds.has(id) && req[i]?.text === block.text
                        ? ('correct' as const)
                        : ('wrong' as const)
                      : undefined;
                    return { id, text: block.text, status };
                  })}
                  onPlace={(id) => setRadioPlaced((p) => [...p, id])}
                  onRemove={(id) => setRadioPlaced((p) => p.filter((x) => x !== id))}
                  disabled={radioSubmitted}
                  fullyCorrect={radioSubmitted && radioCorrect}
                />
              </View>
            ) : null}

            <View className={options.length > 0 ? 'mt-6' : undefined}>
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
                  tone={
                    (isMapNumeric
                      ? mapCorrect
                      : isRadioProcedure
                        ? radioCorrect
                        : options[selected!].isCorrect)
                      ? 'starboard'
                      : 'port'
                  }
                  className="text-caption font-mono uppercase tracking-widest"
                >
                  {(isMapNumeric
                    ? mapCorrect
                    : isRadioProcedure
                      ? radioCorrect
                      : options[selected!].isCorrect)
                    ? 'Rätt'
                    : 'Fel'}
                </ThemedText>
                {isMapNumeric && item.type === 'map_question' && item.answer && mapValue ? (
                  <ThemedText tone="fog" className="text-small font-mono mt-1">
                    Ditt svar: {formatMapAnswerGiven(mapValue)} · Rätt svar:{' '}
                    {formatMapAnswerExpected(item.answer)}
                  </ThemedText>
                ) : null}
                {isRadioProcedure ? (
                  <ThemedText tone="fog" className="text-small font-mono mt-1">
                    {radioFeedback}
                  </ThemedText>
                ) : null}
                <ThemedText className="text-small font-sans mt-2">
                  {generated?.explanationSv ?? item.explanationSv}
                </ThemedText>
              </ThemedView>
            ) : null}
          </>
        )}
      </ScrollView>

      {isTermCard ? (
        <View className="px-6 pb-4">
          {flipped ? (
            <View className="flex-row gap-3">
              {/* flex-1 goes on a plain View, not ThemedPressable directly —
                  ThemedPressable's scale animation wraps its Pressable in an
                  Animated.View that className can't reach, so a flex-1
                  requesting equal sibling width has to land one level out;
                  RN's default cross-axis stretch then fills it from there.
                  Confirmed on device: without this wrapper, className="flex-1"
                  on the Animated.View's inner Pressable doesn't propagate
                  sizing to the actual flex-row sibling, and button text
                  either disappeared or was squashed to ~7px tall. */}
              <View className="flex-1">
                <ThemedPressable
                  borderTone="port"
                  onPress={() => answerTermCard(false)}
                  className="rounded-xl border py-4 items-center active:opacity-80"
                >
                  <ThemedText tone="port" className="text-body font-sans-semibold">
                    Visste inte
                  </ThemedText>
                </ThemedPressable>
              </View>
              <View className="flex-1">
                <ThemedPressable
                  bg="starboard"
                  onPress={() => answerTermCard(true)}
                  className="rounded-xl py-4 items-center active:opacity-90"
                >
                  <ThemedText tone="bg" className="text-body font-sans-semibold">Visste</ThemedText>
                </ThemedPressable>
              </View>
            </View>
          ) : (
            <ThemedPressable
              bg="brass"
              onPress={() => setFlipped(true)}
              className="rounded-xl py-4 items-center active:opacity-90"
            >
              <ThemedText tone="bg" className="text-body font-sans-semibold">Vänd kortet</ThemedText>
            </ThemedPressable>
          )}
        </View>
      ) : answered ? (
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
      ) : isRadioProcedure ? (
        <View className="px-6 pb-4">
          <ThemedPressable
            disabled={radioPlaced.length === 0}
            bg={radioPlaced.length > 0 ? 'brass' : 'surface'}
            borderTone={radioPlaced.length > 0 ? undefined : 'fog'}
            borderOpacity={15}
            className={`rounded-xl py-4 items-center ${
              radioPlaced.length > 0 ? 'active:opacity-90' : 'border'
            }`}
            onPress={submitRadioProcedure}
          >
            <ThemedText
              tone={radioPlaced.length > 0 ? 'bg' : 'fog'}
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
