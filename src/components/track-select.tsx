import { useState } from 'react';
import { ScrollView, useColorScheme, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Disclaimer } from '@/components/disclaimer';
import { ThemedPressable, ThemedText } from '@/components/themed';
import type { Track } from '@/content/types';
import { TRACK_NAMES, TRACK_ORDER } from '@/state/track-context';
import { palette } from '@/theme/tokens';

const TRACK_DESCRIPTIONS: Record<Track, string> = {
  klass8: 'Yrkesbevis för mindre fartyg i inre fart — appens huvudspår',
  forarintyg: 'Grunderna i navigation och sjömanskap för fritidsbåt',
  kustskeppare: 'Fortsättningen efter Förarintyg, för större fritidsbåtar',
  vhf: 'Radiocertifikat för marin VHF med DSC',
};

/**
 * First-run screen: choose the active certification track. Rendered by the
 * root layout until a track is stored; can be changed later in settings.
 */
export function TrackSelect({ onSelect }: { onSelect: (track: Track) => void }) {
  const [chosen, setChosen] = useState<Track>('klass8');
  const p = palette(useColorScheme());

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: p.bg }} edges={['top', 'bottom']}>
      <ScrollView contentContainerClassName="flex-grow px-6 pt-14">
        <ThemedText tone="fog" className="text-caption font-mono uppercase tracking-widest">
          Välkommen
        </ThemedText>
        <ThemedText className="text-display-xl font-display mt-1">Plugga Sjöexamen</ThemedText>
        <ThemedText tone="fog" className="text-body font-sans mt-3">
          Vilken examen pluggar du mot? Du kan byta spår när som helst i
          inställningarna — varje spår har sitt eget repetitionsschema.
        </ThemedText>

        <View className="mt-8">
          {TRACK_ORDER.map((t) => {
            const active = chosen === t;
            return (
              <ThemedPressable
                key={t}
                onPress={() => setChosen(t)}
                bg="surface"
                bgOpacity={active ? undefined : 60}
                borderTone={active ? 'brass' : 'fog'}
                borderOpacity={active ? undefined : 15}
                className="rounded-xl border px-5 py-4 mb-3 active:opacity-80"
              >
                <ThemedText
                  toneOpacity={active ? undefined : 80}
                  className={`text-body ${active ? 'font-sans-semibold' : 'font-sans-medium'}`}
                >
                  {TRACK_NAMES[t]}
                </ThemedText>
                <ThemedText tone="fog" className="text-small font-sans mt-1">
                  {TRACK_DESCRIPTIONS[t]}
                </ThemedText>
              </ThemedPressable>
            );
          })}
        </View>

        <View className="flex-1" />

        <ThemedPressable
          bg="brass"
          className="rounded-xl py-4 items-center active:opacity-90"
          onPress={() => onSelect(chosen)}
        >
          <ThemedText tone="bg" className="text-body font-sans-semibold">
            Börja plugga {TRACK_NAMES[chosen]}
          </ThemedText>
        </ThemedPressable>
        <Disclaimer />
      </ScrollView>
    </SafeAreaView>
  );
}
