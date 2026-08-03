import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Disclaimer } from '@/components/disclaimer';
import { itemsForTrack } from '@/content';
import type { Track } from '@/content/types';
import { TRACK_NAMES, TRACK_ORDER } from '@/state/track-context';

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

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={['top', 'bottom']}>
      <ScrollView contentContainerClassName="flex-grow px-6 pt-14">
        <Text className="text-caption font-mono text-fog uppercase tracking-widest">
          Välkommen
        </Text>
        <Text className="text-display-xl font-display text-ink mt-1">Plugga Sjöexamen</Text>
        <Text className="text-body font-sans text-fog mt-3">
          Vilken examen pluggar du mot? Du kan byta spår när som helst i
          inställningarna — varje spår har sitt eget repetitionsschema.
        </Text>

        <View className="mt-8">
          {TRACK_ORDER.map((t) => {
            const active = chosen === t;
            const count = itemsForTrack(t).length;
            return (
              <Pressable
                key={t}
                onPress={() => setChosen(t)}
                className={`rounded-xl border px-5 py-4 mb-3 active:opacity-80 ${
                  active ? 'border-brass bg-surface' : 'border-fog/15 bg-surface/60'
                }`}
              >
                <View className="flex-row items-center justify-between">
                  <Text
                    className={`text-body ${
                      active ? 'font-sans-semibold text-ink' : 'font-sans-medium text-ink/80'
                    }`}
                  >
                    {TRACK_NAMES[t]}
                  </Text>
                  <Text className="text-caption font-mono text-fog">{count} frågor</Text>
                </View>
                <Text className="text-small font-sans text-fog mt-1">
                  {TRACK_DESCRIPTIONS[t]}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View className="flex-1" />

        <Pressable
          className="bg-brass rounded-xl py-4 items-center active:opacity-90"
          onPress={() => onSelect(chosen)}
        >
          <Text className="text-body font-sans-semibold text-bg">
            Börja plugga {TRACK_NAMES[chosen]}
          </Text>
        </Pressable>
        <Disclaimer />
      </ScrollView>
    </SafeAreaView>
  );
}
