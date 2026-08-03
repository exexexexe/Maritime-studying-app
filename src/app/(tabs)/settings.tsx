import Constants from 'expo-constants';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Disclaimer } from '@/components/disclaimer';

export default function SettingsScreen() {
  return (
    <SafeAreaView className="flex-1 bg-bg" edges={['top']}>
      <ScrollView contentContainerClassName="flex-grow px-6 pt-10">
        <Text className="text-display font-display text-ink">Inställningar</Text>

        <View className="mt-8 rounded-xl bg-surface border border-fog/15 px-5 py-5">
          <Text className="text-caption font-mono text-fog uppercase tracking-widest">
            Aktiv examen
          </Text>
          <Text className="text-body font-sans-medium text-ink mt-2">
            Fartygsbefäl klass 8
          </Text>
          <Text className="text-small font-sans text-fog mt-1">
            Fler spår (Förarintyg, Kustskepparintyg, VHF/SRC) kan väljas när
            spårfiltreringen är på plats.
          </Text>
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
