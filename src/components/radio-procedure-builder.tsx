import { View } from 'react-native';
import Animated, { interpolate, useAnimatedStyle } from 'react-native-reanimated';

import { ThemedPressable, ThemedText, ThemedView, type Tone } from '@/components/themed';
import { RHYTHM, useRhythm } from '@/lib/rhythm';

/**
 * Tap-to-order VHF call construction (radio_procedure items — see
 * content/AUTHORING.md). Tap-to-select rather than drag-and-drop: more
 * reliable on mobile, and tests exactly the same knowledge (does the
 * student know the correct order) without a fiddlier interaction.
 *
 * Placed blocks are always tappable to remove and retry, until disabled
 * (post-submit). Correctness only appears once submitted — per-block
 * status colors the constructed message the same way mcq colors its
 * options, and the block-slotting itself gets no bespoke animation
 * because ThemedPressable's existing press-scale already is that
 * feedback (see PressableScale) — inventing a second one would be
 * decoration, not meaning.
 */

interface PlacedBlock {
  id: string;
  text: string;
  status?: 'correct' | 'wrong';
}

interface RadioProcedureBuilderProps {
  poolBlocks: { id: string; text: string }[];
  placedBlocks: PlacedBlock[];
  onPlace: (id: string) => void;
  onRemove: (id: string) => void;
  disabled: boolean;
  /** True once submitted and the whole sequence is correct — plays the
   * settled Iso confidence pulse on the constructed-message box (see
   * DESIGN-RHYTHM.md's RHYTHM.correct, defined but unapplied until now). */
  fullyCorrect: boolean;
}

const AnimatedThemedView = Animated.createAnimatedComponent(ThemedView);

export function RadioProcedureBuilder({
  poolBlocks,
  placedBlocks,
  onPlace,
  onRemove,
  disabled,
  fullyCorrect,
}: RadioProcedureBuilderProps) {
  const { value: pulse } = useRhythm(RHYTHM.correct, { enabled: fullyCorrect });
  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(pulse.value, [0, 1], [1, 1.015]) }],
  }));

  return (
    <View>
      <ThemedText tone="fog" className="text-caption font-mono uppercase tracking-widest mb-2">
        Ditt anrop
      </ThemedText>
      <AnimatedThemedView
        bg="surface"
        borderTone="fog"
        borderOpacity={15}
        className="rounded-xl border px-4 py-4"
        style={pulseStyle}
      >
        {placedBlocks.length === 0 ? (
          <ThemedText tone="fog" className="text-small font-sans">
            Tryck på fraserna nedan i den ordning de hör hemma i anropet.
          </ThemedText>
        ) : (
          <View className="flex-row flex-wrap gap-2">
            {placedBlocks.map((b, i) => {
              const tone: Tone = b.status === 'correct' ? 'starboard' : b.status === 'wrong' ? 'port' : 'brass';
              return (
                <ThemedPressable
                  key={b.id}
                  disabled={disabled}
                  onPress={() => onRemove(b.id)}
                  bg={tone}
                  bgOpacity={b.status ? 12 : 14}
                  borderTone={tone}
                  borderOpacity={b.status ? undefined : 35}
                  className="flex-row items-center rounded-lg border px-3 py-2 active:opacity-80"
                >
                  <ThemedText tone="fog" className="text-caption font-mono mr-2">
                    {i + 1}
                  </ThemedText>
                  <ThemedText className="text-small font-sans">{b.text}</ThemedText>
                </ThemedPressable>
              );
            })}
          </View>
        )}
      </AnimatedThemedView>

      <ThemedText tone="fog" className="text-caption font-mono uppercase tracking-widest mt-5 mb-2">
        Tillgängliga fraser
      </ThemedText>
      <View className="flex-row flex-wrap gap-2">
        {poolBlocks.map((b) => (
          <ThemedPressable
            key={b.id}
            disabled={disabled}
            onPress={() => onPlace(b.id)}
            borderTone="fog"
            borderOpacity={20}
            className="rounded-lg border px-3 py-2 active:opacity-80"
          >
            <ThemedText className="text-small font-sans">{b.text}</ThemedText>
          </ThemedPressable>
        ))}
      </View>
    </View>
  );
}
