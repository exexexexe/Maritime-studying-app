import { Link } from 'expo-router';
import { ScrollView, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedPressable, ThemedText, ThemedView } from '@/components/themed';
import { itemsForModule, modules } from '@/content';
import { TRACK_NAMES, useTrack } from '@/state/track-context';
import { palette } from '@/theme/tokens';

export default function ModulesScreen() {
  const { track } = useTrack();
  const p = palette(useColorScheme());

  // Only modules with content for the active track — a VHF student never
  // sees stability, a Förarintyg student never sees radar.
  const visible = modules
    .map((m) => ({ module: m, itemCount: itemsForModule(m.id, track).length }))
    .filter((e) => e.itemCount > 0);

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: p.bg }} edges={['top']}>
      <ScrollView contentContainerClassName="px-6 pt-10 pb-8">
        <ThemedText className="text-display font-display">Moduler</ThemedText>
        <ThemedText tone="fog" className="text-small font-sans mt-1">
          {visible.length} moduler för {TRACK_NAMES[track]}.
        </ThemedText>

        <ThemedView
          bg="surface"
          borderTone="fog"
          borderOpacity={15}
          className="mt-8 rounded-xl border overflow-hidden"
        >
          {visible.map(({ module: m, itemCount }, i) => (
            <Link
              key={m.id}
              href={{ pathname: '/module/[slug]', params: { slug: m.slug } }}
              asChild
            >
              <ThemedPressable className="active:opacity-80">
                <ThemedView
                  borderTone="fog"
                  borderOpacity={10}
                  style={{ borderTopWidth: i > 0 ? 1 : 0 }}
                  className="flex-row items-center px-5 py-4"
                >
                  <ThemedText tone="fog" className="text-caption font-mono w-8">
                    {String(i + 1).padStart(2, '0')}
                  </ThemedText>
                  <ThemedText className="text-body font-sans-medium flex-1">
                    {m.titleSv}
                  </ThemedText>
                  <ThemedText tone="brass" className="text-caption font-mono">
                    {itemCount} frågor ›
                  </ThemedText>
                </ThemedView>
              </ThemedPressable>
            </Link>
          ))}
        </ThemedView>
      </ScrollView>
    </SafeAreaView>
  );
}
