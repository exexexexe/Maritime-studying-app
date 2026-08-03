import Constants from 'expo-constants';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Disclaimer } from '@/components/disclaimer';
import { itemsForTrack } from '@/content';
import { TRACK_NAMES, TRACK_ORDER, useTrack } from '@/state/track-context';

export default function SettingsScreen() {
  const { track, setTrack } = useTrack();

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={['top']}>
      <ScrollView contentContainerClassName="flex-grow px-6 pt-10">
        <Text className="text-display font-display text-ink">Inställningar</Text>

        <View className="mt-8 rounded-xl bg-surface border border-fog/15 px-5 py-5">
          <Text className="text-caption font-mono text-fog uppercase tracking-widest">
            Aktivt spår
          </Text>
          <Text className="text-small font-sans text-fog mt-2 mb-3">
            Varje spår har sitt eget innehåll och sitt eget repetitionsschema —
            framsteg i ett spår påverkar inte de andra.
          </Text>
          {TRACK_ORDER.map((t) => {
            const active = t === track;
            return (
              <Pressable
                key={t}
                onPress={() => setTrack(t)}
                className={`flex-row items-center justify-between rounded-lg border px-4 py-3 mb-2 active:opacity-80 ${
                  active ? 'border-brass' : 'border-fog/15'
                }`}
              >
                <Text
                  className={`text-body ${
                    active ? 'font-sans-semibold text-brass' : 'font-sans text-ink'
                  }`}
                >
                  {TRACK_NAMES[t]}
                </Text>
                <Text className="text-caption font-mono text-fog">
                  {itemsForTrack(t).length} frågor
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View className="mt-4 rounded-xl bg-surface border border-fog/15 px-5 py-5">
          <Text className="text-caption font-mono text-fog uppercase tracking-widest">
            Utseende
          </Text>
          <Text className="text-small font-sans text-fog mt-2">
            Följer systemets mörka/ljusa läge. Mörkt läge är appens standard.
          </Text>
        </View>

        <View className="mt-4 rounded-xl bg-surface border border-fog/15 px-5 py-5">
          <Text className="text-caption font-mono text-fog uppercase tracking-widest">
            Om appen
          </Text>
          <Text className="text-small font-sans text-fog mt-2">
            Version {Constants.expoConfig?.version ?? '—'} · All data sparas
            lokalt på enheten. Appen kräver ingen nätverksanslutning.
          </Text>
        </View>

        <View className="flex-1" />
        <Disclaimer />
      </ScrollView>
    </SafeAreaView>
  );
}
