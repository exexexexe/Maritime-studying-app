import { router, Stack } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, View } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LanternDiagram } from '@/components/lantern-diagram';
import { NumericReadout } from '@/components/numeric-readout';
import { ThemedPressable, ThemedText, type Tone } from '@/components/themed';
import { itemsForTrack } from '@/content';
import type { Item, LanternScene } from '@/content/types';
import { RHYTHM, useRhythm } from '@/lib/rhythm';
import { attemptSeed, seededShuffle } from '@/lib/shuffle';
import { characteristicOf, lanternSprintItems, sprintChoices } from '@/lib/sprint';
import { useAppColorScheme } from '@/state/theme-context';
import { useTrack } from '@/state/track-context';
import { palette } from '@/theme/tokens';

/**
 * Timed light-characteristic identification sprint — a drill *mode* on
 * existing lantern content (UI rework Phase 6), not a new content type or
 * a second review pipeline. Deliberately does not call recordAnswer/SM-2:
 * under time pressure a miss can mean "rushed," not "didn't know it," and
 * this content is already scheduled normally via the regular drill — the
 * sprint is a separate speed/confidence exercise layered on top, with its
 * own local, non-persisted score.
 *
 * Register: a stopwatch drill, not a game — no confetti, no points-first
 * framing. Scoring is a plain time/accuracy readout.
 */

const SPRINT_SECONDS = 60;
const FEEDBACK_MS = 350;
const URGENT_AT = 10;

type Phase = 'ready' | 'running' | 'done';

export default function LanternSprintScreen() {
  const { track } = useTrack();
  const p = palette(useAppColorScheme().scheme);
  const attemptKey = useRef(Date.now()).current;

  const [pool] = useState<Item[]>(() =>
    seededShuffle(lanternSprintItems(itemsForTrack(track)), attemptKey),
  );

  const [phase, setPhase] = useState<Phase>('ready');
  const [round, setRound] = useState(0);
  const [index, setIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(SPRINT_SECONDS);
  const [selected, setSelected] = useState<string | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [attempted, setAttempted] = useState(0);

  const item = pool[index];
  const scene = item ? (item.payload as { scene?: LanternScene }).scene : undefined;
  const choices = useMemo(
    () => (item ? sprintChoices(item, pool, attemptSeed(item.id, attemptKey + round)) : []),
    [item, pool, attemptKey, round],
  );

  const urgent = secondsLeft <= URGENT_AT && phase === 'running';
  const { value: urgentPulse } = useRhythm(RHYTHM.urgent, { loop: true, enabled: urgent });
  const urgentStyle = useAnimatedStyle(() => ({ opacity: 0.55 + urgentPulse.value * 0.45 }));

  // Countdown.
  useEffect(() => {
    if (phase !== 'running') return;
    const t = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(t);
          setPhase('done');
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [phase]);

  if (pool.length === 0) {
    return (
      <SafeAreaView
        className="flex-1 items-center justify-center px-8"
        style={{ backgroundColor: p.bg }}
      >
        <Stack.Screen options={{ headerShown: false }} />
        <ThemedText tone="fog" className="text-body font-sans text-center">
          Inga ljuskaraktärer att öva just nu för det här spåret.
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

  function choose(choiceText: string) {
    if (selected || !item) return;
    setSelected(choiceText);
    const correct = choiceText === characteristicOf(item);
    setAttempted((a) => a + 1);
    if (correct) setCorrectCount((c) => c + 1);
    setTimeout(() => {
      setSelected(null);
      if (index + 1 >= pool.length) {
        setIndex(0);
        setRound((r) => r + 1);
      } else {
        setIndex((i) => i + 1);
      }
    }, FEEDBACK_MS);
  }

  if (phase === 'ready') {
    return (
      <SafeAreaView className="flex-1 px-6" style={{ backgroundColor: p.bg }} edges={['top', 'bottom']}>
        <Stack.Screen options={{ headerShown: false }} />
        <View className="flex-1 items-center justify-center">
          <ThemedText tone="fog" className="text-caption font-mono uppercase tracking-widest">
            Snabbtest
          </ThemedText>
          <ThemedText className="text-display font-display mt-2 text-center">
            Ljuskaraktärer
          </ThemedText>
          <ThemedText tone="fog" className="text-small font-sans mt-4 text-center max-w-xs">
            Identifiera så många fyrkaraktärer du kan på {SPRINT_SECONDS} sekunder. Facit
            visas inte förrän du svarat — träffar och missar registreras inte i
            repetitionsschemat, det här är ett rent snabbhetstest.
          </ThemedText>
        </View>
        <ThemedPressable
          bg="brass"
          className="rounded-xl py-4 items-center active:opacity-90 mb-4"
          onPress={() => setPhase('running')}
        >
          <ThemedText tone="bg" className="text-body font-sans-semibold">Starta</ThemedText>
        </ThemedPressable>
      </SafeAreaView>
    );
  }

  if (phase === 'done') {
    const pct = attempted > 0 ? Math.round((correctCount / attempted) * 100) : 0;
    return (
      <SafeAreaView className="flex-1 px-6" style={{ backgroundColor: p.bg }} edges={['top', 'bottom']}>
        <Stack.Screen options={{ headerShown: false }} />
        <View className="flex-1 items-center justify-center">
          <ThemedText tone="fog" className="text-caption font-mono uppercase tracking-widest">
            Tiden är ute
          </ThemedText>
          <ThemedText className="text-display-xl font-display mt-4">
            {correctCount} av {attempted} rätt
          </ThemedText>
          <ThemedText tone={pct >= 80 ? 'starboard' : 'brass'} className="text-data-lg font-mono-medium mt-2">
            {pct} %
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

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: p.bg }} edges={['top', 'bottom']}>
      <Stack.Screen options={{ headerShown: false }} />
      {/* The countdown is this screen's one instrument — everything else
          (cancel, running score) stays a thin utility row above it, so the
          clock the whole drill is paced against gets the confident
          treatment instead of competing for space with it. */}
      <View className="px-6 pt-2">
        <View className="flex-row items-center justify-between">
          <ThemedPressable hitSlop={8} onPress={() => router.back()}>
            <ThemedText tone="fog" className="text-small font-sans">Avbryt</ThemedText>
          </ThemedPressable>
          <ThemedText tone="fog" className="text-caption font-mono tracking-widest">
            {correctCount}/{attempted}
          </ThemedText>
        </View>
        <View className="items-center">
          <Animated.View style={urgent ? urgentStyle : undefined}>
            <NumericReadout
              value={String(secondsLeft).padStart(2, '0')}
              variant="mono"
              tone={urgent ? 'urgent' : 'ink'}
              className="tracking-widest"
            />
          </Animated.View>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-6 pt-6 pb-4"
        showsVerticalScrollIndicator={false}
      >
        {scene ? <LanternDiagram scene={scene} /> : null}

        <View className="mt-6">
          {choices.map((choice) => {
            const isSelected = selected === choice.text;
            const revealed = selected !== null && (isSelected || choice.isCorrect);
            const tone: Tone = revealed ? (choice.isCorrect ? 'starboard' : 'port') : 'fog';
            const bg: Tone | undefined = revealed ? (choice.isCorrect ? 'starboard' : 'port') : 'surface';
            const bgOpacity = revealed ? 10 : undefined;
            const borderOpacity = revealed ? undefined : 15;
            return (
              <ThemedPressable
                key={choice.text}
                disabled={selected !== null}
                onPress={() => choose(choice.text)}
                bg={bg}
                bgOpacity={bgOpacity}
                borderTone={tone}
                borderOpacity={borderOpacity}
                className="rounded-xl border px-5 py-4 mb-3 items-center active:opacity-80"
              >
                <ThemedText className="text-body font-mono-medium">{choice.text}</ThemedText>
              </ThemedPressable>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
