import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Disclaimer } from '@/components/disclaimer';
import { bumpLaunchCount } from '@/db';

export default function DashboardScreen() {
  // Phase 1 persistence proof: increments once per app launch, survives restart.
  const [launchCount] = useState(() => bumpLaunchCount());

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={['top']}>
      <ScrollView contentContainerClassName="flex-grow px-6 pt-10">
        <Text className="text-caption font-mono text-fog uppercase tracking-widest">
          Fartygsbefäl klass 8
        </Text>
        <Text className="text-display-xl font-display text-ink mt-1">
          Plugga Sjöexamen
        </Text>

        <View className="mt-10 rounded-xl bg-surface border border-fog/15 px-5 py-6">
          <Text className="text-caption font-mono text-fog uppercase tracking-widest">
            Loggbok
          </Text>
          <View className="flex-row items-baseline mt-2">
            <Text className="text-data-lg font-mono-medium text-brass">
              {launchCount}
            </Text>
            <Text className="text-small font-sans text-fog ml-2">
              {launchCount === 1 ? 'loggförd start' : 'loggförda starter'}
            </Text>
          </View>
          <Text className="text-small font-sans text-fog mt-3">
            Räknaren sparas lokalt och överlever omstart — beviset på att appen
            fungerar helt utan nätverk.
          </Text>
        </View>

        <View className="mt-6 rounded-xl bg-surface border border-fog/15 px-5 py-6">
          <Text className="text-caption font-mono text-fog uppercase tracking-widest">
            Nästa steg
          </Text>
          <Text className="text-body font-sans text-ink mt-2">
            Drillpass, repetitionsschema och provläge byggs modul för modul.
            Först ut: Lanternor.
          </Text>
        </View>

        <View className="flex-1" />
        <Disclaimer />
      </ScrollView>
    </SafeAreaView>
  );
}
