import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { PressableScale } from '@/components/pressable-scale';
import { ThemedPressable, ThemedText, ThemedView } from '@/components/themed';

interface TermCardProps {
  termSv: string;
  termEn?: string;
  definitionSv: string;
  definitionEn?: string;
  lang: 'sv' | 'en';
  onToggleLang: () => void;
  flipped: boolean;
  onPress: () => void;
}

const FLIP_MS = 260;
const CARD_HEIGHT = 260;

/**
 * A flashcard: front shows the term, back shows its definition (reusing
 * explanationSv/explanationEn — see content/types.ts). Tapping the card
 * flips it; a restrained rotateY, not a bouncy game-card animation —
 * quick, linear, instrument-panel register. Under reduced motion the
 * flip is instant with no rotation, same content either way.
 *
 * Both faces are always absolutely stacked inside a fixed-height
 * container, rather than swapping position:absolute/relative on flip —
 * that would move the layout's height source mid-rotation and cause a
 * visible jump before the flip even finished turning.
 */
export function TermCard({
  termSv,
  termEn,
  definitionSv,
  definitionEn,
  lang,
  onToggleLang,
  flipped,
  onPress,
}: TermCardProps) {
  const reducedMotion = useReducedMotion();
  const rotation = useSharedValue(flipped ? 180 : 0);

  // Writing to a shared value directly in the render body (as this was
  // originally) is undefined behavior under frequent re-renders — see the
  // same fix and its explanation in animated-light.tsx, found via this
  // component while investigating why AnimatedLight silently never
  // rendered inside the Phase 6 sprint screen's per-second countdown.
  useEffect(() => {
    const target = flipped ? 180 : 0;
    rotation.value = reducedMotion
      ? target
      : withTiming(target, { duration: FLIP_MS, easing: Easing.inOut(Easing.quad) });
  }, [flipped, reducedMotion, rotation]);

  const frontStyle = useAnimatedStyle(() => ({
    transform: [{ perspective: 1200 }, { rotateY: `${rotation.value}deg` }],
    opacity: rotation.value < 90 ? 1 : 0,
  }));
  const backStyle = useAnimatedStyle(() => ({
    transform: [{ perspective: 1200 }, { rotateY: `${rotation.value + 180}deg` }],
    opacity: rotation.value >= 90 ? 1 : 0,
  }));

  const term = lang === 'en' && termEn ? termEn : termSv;
  const definition = lang === 'en' && definitionEn ? definitionEn : definitionSv;
  const showLangToggle = Boolean(termEn);

  return (
    <View>
      {showLangToggle ? (
        <View className="flex-row justify-end mb-2">
          <ThemedPressable
            onPress={onToggleLang}
            borderTone="fog"
            borderOpacity={40}
            className="rounded-full border px-3 py-1 active:opacity-80"
          >
            <ThemedText tone="fog" className="text-caption font-mono uppercase tracking-widest">
              {lang === 'sv' ? 'SV' : 'EN'}
            </ThemedText>
          </ThemedPressable>
        </View>
      ) : null}

      <PressableScale onPress={onPress} style={{ height: CARD_HEIGHT }}>
        <Animated.View
          style={[frontStyle, { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }]}
        >
          <ThemedView
            bg="surface"
            borderTone="fog"
            borderOpacity={15}
            className="flex-1 rounded-xl border px-6 items-center justify-center"
          >
            <ThemedText tone="fog" className="text-caption font-mono uppercase tracking-widest mb-3">
              Begrepp
            </ThemedText>
            <ThemedText className="text-display font-display text-center">{term}</ThemedText>
          </ThemedView>
        </Animated.View>

        <Animated.View
          style={[backStyle, { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }]}
        >
          <ThemedView
            bg="surface"
            borderTone="brass"
            borderOpacity={40}
            className="flex-1 rounded-xl border px-6 justify-center"
          >
            <ThemedText tone="brass" className="text-caption font-mono uppercase tracking-widest mb-3">
              {term}
            </ThemedText>
            <ThemedText className="text-body font-sans">{definition}</ThemedText>
          </ThemedView>
        </Animated.View>
      </PressableScale>
    </View>
  );
}
