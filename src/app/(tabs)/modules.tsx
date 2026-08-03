import { Link } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { itemsForModule, modules } from '@/content';
import { TRACK_NAMES, useTrack } from '@/state/track-context';

export default function ModulesScreen() {
  const { track } = useTrack();

  // Only modules with content for the active track — a VHF student never
  // sees stability, a Förarintyg student never sees radar.
  const visible = modules
    .map((m) => ({ module: m, itemCount: itemsForModule(m.id, track).length }))
    .filter((e) => e.itemCount > 0);

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={['top']}>
      <ScrollView contentContainerClassName="px-6 pt-10 pb-8">
        <Text className="text-display font-display text-ink">Moduler</Text>
        <Text className="text-small font-sans text-fog mt-1">
          {visible.length} moduler för {TRACK_NAMES[track]}.
        </Text>

        <View className="mt-8 rounded-xl bg-surface border border-fog/15 overflow-hidden">
          {visible.map(({ module: m, itemCount }, i) => (
            <Link
              key={m.id}
              href={{ pathname: '/module/[slug]', params: { slug: m.slug } }}
              asChild
            >
              <Pressable className="active:opacity-80">
                <View
                  className={`flex-row items-center px-5 py-4 ${
                    i > 0 ? 'border-t border-fog/10' : ''
                  }`}
                >
                  <Text className="text-caption font-mono text-fog w-8">
                    {String(i + 1).padStart(2, '0')}
                  </Text>
                  <Text className="text-body font-sans-medium text-ink flex-1">
                    {m.titleSv}
                  </Text>
                  <Text className="text-caption font-mono text-brass">
                    {itemCount} frågor ›
                  </Text>
                </View>
              </Pressable>
            </Link>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
