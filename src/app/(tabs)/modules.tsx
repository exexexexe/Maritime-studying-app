import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

/**
 * Static preview of the module map. Rows become tappable as each module
 * ships (Lanternor first, in Phase 2).
 */
const MODULES: { titleSv: string; note?: string }[] = [
  { titleSv: 'Lanternor', note: 'byggs härnäst' },
  { titleSv: 'Sjövägsregler (COLREG)' },
  { titleSv: 'Utmärkning & bojar' },
  { titleSv: 'Navigationsberäkningar' },
  { titleSv: 'Väder' },
  { titleSv: 'Säkerhet' },
  { titleSv: 'Stabilitet & balans' },
  { titleSv: 'VHF / SRC' },
  { titleSv: 'Radar' },
];

export default function ModulesScreen() {
  return (
    <SafeAreaView className="flex-1 bg-bg" edges={['top']}>
      <ScrollView contentContainerClassName="px-6 pt-10 pb-8">
        <Text className="text-display font-display text-ink">Moduler</Text>
        <Text className="text-small font-sans text-fog mt-1">
          Nio moduler för Fartygsbefäl klass 8.
        </Text>

        <View className="mt-8 rounded-xl bg-surface border border-fog/15 overflow-hidden">
          {MODULES.map((m, i) => (
            <View
              key={m.titleSv}
              className={`flex-row items-center px-5 py-4 ${
                i > 0 ? 'border-t border-fog/10' : ''
              }`}
            >
              <Text className="text-caption font-mono text-fog w-8">
                {String(i + 1).padStart(2, '0')}
              </Text>
              <Text className="text-body font-sans text-ink flex-1">{m.titleSv}</Text>
              <Text className="text-caption font-sans text-fog">
                {m.note ?? 'kommer'}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
