import Constants from 'expo-constants';
import { ScrollView, useColorScheme, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Disclaimer } from '@/components/disclaimer';
import { ThemedPressable, ThemedText, ThemedView } from '@/components/themed';
import { itemsForTrack } from '@/content';
import { TRACK_NAMES, TRACK_ORDER, useTrack } from '@/state/track-context';
import { palette } from '@/theme/tokens';

export default function SettingsScreen() {
  const { track, setTrack } = useTrack();
  const p = palette(useColorScheme());

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: p.bg }} edges={['top']}>
      <ScrollView contentContainerClassName="flex-grow px-6 pt-10">
        <ThemedText className="text-display font-display">Inställningar</ThemedText>

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

        <ThemedView
          bg="surface"
          borderTone="fog"
          borderOpacity={15}
          className="mt-4 rounded-xl border px-5 py-5"
        >
          <ThemedText tone="fog" className="text-caption font-mono uppercase tracking-widest">
            Utseende
          </ThemedText>
          <ThemedText tone="fog" className="text-small font-sans mt-2">
            Följer systemets mörka/ljusa läge. Mörkt läge är appens standard.
          </ThemedText>
        </ThemedView>

        <ThemedView
          bg="surface"
          borderTone="fog"
          borderOpacity={15}
          className="mt-4 rounded-xl border px-5 py-5"
        >
          <ThemedText tone="fog" className="text-caption font-mono uppercase tracking-widest">
            Om appen
          </ThemedText>
          <ThemedText tone="fog" className="text-small font-sans mt-2">
            Version {Constants.expoConfig?.version ?? '—'} · All data sparas
            lokalt på enheten. Appen kräver ingen nätverksanslutning.
          </ThemedText>
        </ThemedView>

        <View className="flex-1" />
        <Disclaimer />
      </ScrollView>
    </SafeAreaView>
  );
}
