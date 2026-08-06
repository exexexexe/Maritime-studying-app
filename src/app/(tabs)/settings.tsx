import Constants from 'expo-constants';
import { useCallback, useState } from 'react';
import { Alert, ScrollView, Share, useColorScheme, View } from 'react-native';
import Animated, { FadeInDown, useReducedMotion } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';

import { Disclaimer } from '@/components/disclaimer';
import { FeedbackFlagButton } from '@/components/feedback-flag-button';
import { ThemedPressable, ThemedText, ThemedView } from '@/components/themed';
import { itemsForTrack } from '@/content';
import { clearFeedbackFlags, countFeedbackFlags, listFeedbackFlags } from '@/db/feedback';
import { formatFeedbackExport } from '@/lib/feedback-export';
import { TRACK_NAMES, TRACK_ORDER, useTrack } from '@/state/track-context';
import { palette } from '@/theme/tokens';

export default function SettingsScreen() {
  const { track, setTrack } = useTrack();
  const p = palette(useColorScheme());
  const reducedMotion = useReducedMotion();
  const [flagCount, setFlagCount] = useState(0);

  useFocusEffect(
    useCallback(() => {
      setFlagCount(countFeedbackFlags());
    }, []),
  );

  async function sendFeedback() {
    const text = formatFeedbackExport(listFeedbackFlags(), {
      appVersion: Constants.expoConfig?.version ?? '—',
      exportedAt: Date.now(),
    });
    try {
      await Share.share({ message: text });
    } catch {
      // user cancelled the share sheet or it failed to open — nothing to do
    }
  }

  function clearFeedback() {
    Alert.alert('Rensa sparad feedback?', 'Detta går inte att ångra.', [
      { text: 'Avbryt', style: 'cancel' },
      {
        text: 'Rensa',
        style: 'destructive',
        onPress: () => {
          clearFeedbackFlags();
          setFlagCount(0);
        },
      },
    ]);
  }

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: p.bg }} edges={['top']}>
      <ScrollView contentContainerClassName="flex-grow px-6 pt-10">
        <Animated.View entering={reducedMotion ? undefined : FadeInDown.duration(280).delay(60)}>
          <ThemedText className="text-display font-display">Inställningar</ThemedText>
        </Animated.View>

        <ThemedView
          bg="surface"
          borderTone="fog"
          borderOpacity={15}
          className="mt-8 rounded-xl border px-5 py-5"
        >
          <ThemedText tone="fog" className="text-caption font-mono uppercase tracking-widest">
            Aktivt spår
          </ThemedText>
          <ThemedText tone="fog" className="text-small font-sans mt-2 mb-3">
            Varje spår har sitt eget innehåll och sitt eget repetitionsschema —
            framsteg i ett spår påverkar inte de andra.
          </ThemedText>
          {TRACK_ORDER.map((t) => {
            const active = t === track;
            return (
              <ThemedPressable
                key={t}
                onPress={() => setTrack(t)}
                borderTone={active ? 'brass' : 'fog'}
                borderOpacity={active ? undefined : 15}
                className="flex-row items-center justify-between rounded-lg border px-4 py-3 mb-2 active:opacity-80"
              >
                <ThemedText
                  tone={active ? 'brass' : 'ink'}
                  className={`text-body ${active ? 'font-sans-semibold' : 'font-sans'}`}
                >
                  {TRACK_NAMES[t]}
                </ThemedText>
                <ThemedText tone="fog" className="text-caption font-mono">
                  {itemsForTrack(t).length} frågor
                </ThemedText>
              </ThemedPressable>
            );
          })}
        </ThemedView>

        {/* Utseende had zero interactivity — pure disclosure text, no
            control — so it competed for weight with Aktivt spår (the only
            genuinely interactive thing on this screen) without earning it.
            Merged into Om appen; both are the same kind of static fact. */}
        <ThemedView bg="surface" bgOpacity={45} className="mt-4 rounded-xl px-5 py-4">
          <ThemedText tone="fog" className="text-caption font-mono uppercase tracking-widest">
            Om appen
          </ThemedText>
          <ThemedText tone="fog" className="text-small font-sans mt-2">
            Version {Constants.expoConfig?.version ?? '—'} · Följer systemets
            mörka/ljusa läge (mörkt är standard) · All data sparas lokalt på
            enheten. Appen kräver ingen nätverksanslutning.
          </ThemedText>
        </ThemedView>

        {/* Testing tool, not a student-facing feature — see
            src/db/feedback.ts. Flags are stored locally only; nothing is
            sent anywhere until "Skicka feedback" opens the share sheet. */}
        <ThemedView
          bg="surface"
          borderTone="fog"
          borderOpacity={15}
          className="mt-4 rounded-xl border px-5 py-5"
        >
          <ThemedText tone="fog" className="text-caption font-mono uppercase tracking-widest">
            Testfeedback
          </ThemedText>
          <ThemedText tone="fog" className="text-small font-sans mt-2 mb-4">
            {flagCount === 0
              ? 'Inga flaggor sparade ännu.'
              : `${flagCount} ${flagCount === 1 ? 'flagga' : 'flaggor'} sparade lokalt.`}
          </ThemedText>

          <FeedbackFlagButton
            onSaved={() => setFlagCount((c) => c + 1)}
            trigger={({ onPress, confirmed }) => (
              <ThemedPressable
                onPress={onPress}
                borderTone="fog"
                borderOpacity={20}
                className="rounded-lg border px-4 py-3 mb-2 active:opacity-80"
              >
                <ThemedText className="text-body font-sans">
                  {confirmed ? 'Sparat' : 'Allmän feedback'}
                </ThemedText>
              </ThemedPressable>
            )}
          />

          <ThemedPressable
            onPress={sendFeedback}
            disabled={flagCount === 0}
            bg={flagCount > 0 ? 'brass' : undefined}
            borderTone={flagCount > 0 ? undefined : 'fog'}
            borderOpacity={flagCount > 0 ? undefined : 15}
            className={`rounded-lg px-4 py-3 items-center ${flagCount > 0 ? 'active:opacity-90' : 'border'}`}
          >
            <ThemedText
              tone={flagCount > 0 ? 'bg' : 'fog'}
              className="text-body font-sans-semibold"
            >
              Skicka feedback ({flagCount})
            </ThemedText>
          </ThemedPressable>

          {flagCount > 0 ? (
            <ThemedPressable onPress={clearFeedback} hitSlop={8} className="items-center pt-3">
              <ThemedText tone="fog" className="text-caption font-mono">
                Rensa sparad feedback
              </ThemedText>
            </ThemedPressable>
          ) : null}
        </ThemedView>

        <View className="flex-1" />
        <Disclaimer />
      </ScrollView>
    </SafeAreaView>
  );
}
