import { Link } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { itemsForModule, modules } from '@/content';
import { getActiveTrack } from '@/state/track';

export default function ModulesScreen() {
  const track = getActiveTrack();

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={['top']}>
      <ScrollView contentContainerClassName="px-6 pt-10 pb-8">
        <Text className="text-display font-display text-ink">Moduler</Text>
        <Text className="text-small font-sans text-fog mt-1">
          Nio moduler för Fartygsbefäl klass 8.
        </Text>

        <View className="mt-8 rounded-xl bg-surface border border-fog/15 overflow-hidden">
          {modules.map((m, i) => {
            const itemCount = itemsForModule(m.id, track).length;
            const row = (
              <View
                className={`flex-row items-center px-5 py-4 ${
                  i > 0 ? 'border-t border-fog/10' : ''
                }`}
              >
                <Text className="text-caption font-mono text-fog w-8">
                  {String(m.order).padStart(2, '0')}
                </Text>
                <Text
                  className={`text-body flex-1 ${
                    itemCount > 0 ? 'font-sans-medium text-ink' : 'font-sans text-fog'
                  }`}
                >
                  {m.titleSv}
                </Text>
                {itemCount > 0 ? (
                  <Text className="text-caption font-mono text-brass">{itemCount} frågor ›</Text>
                ) : (
                  <Text className="text-caption font-sans text-fog">kommer</Text>
                )}
              </View>
            );
            return itemCount > 0 ? (
              <Link
                key={m.id}
                href={{ pathname: '/module/[slug]', params: { slug: m.slug } }}
                asChild
              >
                <Pressable className="active:opacity-80">{row}</Pressable>
              </Link>
            ) : (
              <View key={m.id}>{row}</View>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
