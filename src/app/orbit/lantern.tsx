import { router, Stack } from 'expo-router';
import { useState } from 'react';
import { Dimensions, ScrollView, useColorScheme, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS, useAnimatedReaction, useSharedValue } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CompassReadout } from '@/components/compass-readout';
import { FeedbackFlagButton } from '@/components/feedback-flag-button';
import { LanternDiagram } from '@/components/lantern-diagram';
import { NumericReadout } from '@/components/numeric-readout';
import { ThemedPressable, ThemedText } from '@/components/themed';
import { itemsForTrack } from '@/content';
import type { LanternScene } from '@/content/types';
import { normalizeDeg, visibleLights } from '@/lantern/sectors';
import { orbitTrainerItems } from '@/lib/orbit';
import { useTrack } from '@/state/track-context';
import { palette } from '@/theme/tokens';

/**
 * Free-exploration sector trainer (IDEAS.md point 2 — "känns 3D utan
 * 3D-kostnad"): drag horizontally to sweep a relative bearing around a
 * vessel; lights switch on and off exactly at their real COLREG sector
 * boundaries (src/lantern/sectors.ts). No 3D rendering — the vessel
 * silhouette never rotates or gets perspective; the "orbit" feeling comes
 * entirely from which lights the sector math currently shows, reusing
 * LanternDiagram/AnimatedLight unchanged.
 *
 * A drill *mode* on existing lantern content, same pattern as the sprint
 * screen — not a new content type, not SM-2-scored. Only lantern items
 * authored with payload.scene.lightSectors are eligible (see
 * content/AUTHORING.md); most lantern items have none.
 *
 * The drag itself needs no reduced-motion handling: it's 1:1 user-driven
 * tracking (like scrolling or dragging a slider), not autoplaying motion —
 * nothing here animates on its own without a finger on the screen.
 */

const { width: SCREEN_WIDTH } = Dimensions.get('window');
// A full screen-width drag ≈ one full orbit — reads naturally against the
// "walk around the vessel" framing.
const DEG_PER_PX = 360 / SCREEN_WIDTH;

export default function LanternOrbitScreen() {
  const { track } = useTrack();
  const p = palette(useColorScheme());
  const [pool] = useState(() => orbitTrainerItems(itemsForTrack(track)));
  const [vesselIndex, setVesselIndex] = useState(0);
  const [bearing, setBearing] = useState(0);

  const angle = useSharedValue(0);
  const startAngle = useSharedValue(0);

  // Only the rounded integer degree is synced to React state — the
  // compass hand itself reads `angle` directly via useAnimatedStyle and
  // never touches the JS thread, so drag tracking stays native-smooth
  // regardless of how often the diagram below re-renders.
  useAnimatedReaction(
    () => Math.round(normalizeDeg(angle.value)),
    (current, previous) => {
      if (current !== previous) runOnJS(setBearing)(current);
    },
  );

  const pan = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .failOffsetY([-15, 15])
    .onStart(() => {
      startAngle.value = angle.value;
    })
    .onUpdate((e) => {
      angle.value = startAngle.value + e.translationX * DEG_PER_PX;
    });

  function selectVessel(i: number) {
    setVesselIndex(i);
    angle.value = 0;
    startAngle.value = 0;
    setBearing(0);
  }

  if (pool.length === 0) {
    return (
      <SafeAreaView
        className="flex-1 items-center justify-center px-8"
        style={{ backgroundColor: p.bg }}
      >
        <Stack.Screen options={{ headerShown: false }} />
        <ThemedText tone="fog" className="text-body font-sans text-center">
          Ingen orbit-tränardata tillgänglig för det här spåret ännu.
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

  const item = pool[vesselIndex];
  const scene = (item.payload as { scene?: LanternScene }).scene;
  const visibleScene: LanternScene = scene
    ? { ...scene, lights: visibleLights(scene, bearing) }
    : { lights: [] };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: p.bg }} edges={['top', 'bottom']}>
      <Stack.Screen options={{ headerShown: false }} />
      <View className="flex-row items-center justify-between px-6 pt-2">
        <ThemedPressable hitSlop={8} onPress={() => router.back()}>
          <ThemedText tone="fog" className="text-small font-sans">
            Avbryt
          </ThemedText>
        </ThemedPressable>
        <View className="flex-row items-center gap-4">
          <FeedbackFlagButton item={{ id: item.id, topicId: item.topicId, type: item.type }} />
          <ThemedText tone="fog" className="text-caption font-mono uppercase tracking-widest">
            Orbit-tränare
          </ThemedText>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-6 pt-4 pb-6"
        showsVerticalScrollIndicator={false}
      >
        <ThemedText className="text-title font-sans-medium">
          {scene?.captionSv ?? item.id}
        </ThemedText>
        <ThemedText tone="fog" className="text-small font-sans mt-1">
          Dra i bilden för att gå runt fartyget — lanternorna tänds och släcks efter sina
          verkliga sektorer.
        </ThemedText>

        <GestureDetector gesture={pan}>
          <View className="mt-5">
            <LanternDiagram scene={visibleScene} />
          </View>
        </GestureDetector>

        <View className="flex-row items-center justify-between mt-5 px-2">
          <CompassReadout angle={angle} color={p.brass} fogColor={p.fog} />
          <NumericReadout value={bearing} unit="°" variant="mono" size="large" tone="brass" />
        </View>

        {pool.length > 1 ? (
          <View className="mt-7">
            <ThemedText tone="fog" className="text-caption font-mono uppercase tracking-widest mb-2">
              Fartyg
            </ThemedText>
            <View className="flex-row flex-wrap gap-2">
              {pool.map((it, i) => {
                const s = (it.payload as { scene?: LanternScene }).scene;
                const active = i === vesselIndex;
                return (
                  <ThemedPressable
                    key={it.id}
                    onPress={() => selectVessel(i)}
                    bg={active ? 'brass' : undefined}
                    bgOpacity={active ? 14 : undefined}
                    borderTone={active ? 'brass' : 'fog'}
                    borderOpacity={active ? undefined : 20}
                    className="rounded-lg border px-3 py-2 active:opacity-80"
                  >
                    <ThemedText
                      tone={active ? 'brass' : 'ink'}
                      className="text-small font-sans"
                    >
                      {s?.captionSv ?? it.id}
                    </ThemedText>
                  </ThemedPressable>
                );
              })}
            </View>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
