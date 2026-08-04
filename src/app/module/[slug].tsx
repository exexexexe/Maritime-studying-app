import { Link, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { moduleBySlug, topicsForModule } from '@/content';
import { moduleProgress, topicProgress } from '@/srs/session';
import { useTrack } from '@/state/track-context';

export default function ModuleScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { track } = useTrack();
  const module = moduleBySlug(slug);
  const [progress] = useState(() =>
    module ? moduleProgress(module.id, track, Date.now()) : null,
  );
  const [topics] = useState(() => {
    if (!module) return [];
    const now = Date.now();
    return topicsForModule(module.id).map((t) => ({
      topic: t,
      progress: topicProgress(t.id, track, now),
    }));
  });

  if (!module || !progress) {
    return (
      <SafeAreaView className="flex-1 bg-bg items-center justify-center">
        <Text className="text-body font-sans text-fog">Modulen hittades inte.</Text>
      </SafeAreaView>
    );
  }

  const drillable = progress.due + progress.unseen > 0;

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView contentContainerClassName="flex-grow px-6 pt-6 pb-10">
        <Link href="/modules" asChild>
          <Pressable hitSlop={8}>
            <Text className="text-small font-sans text-fog">‹ Moduler</Text>
          </Pressable>
        </Link>

        <Text className="text-display font-display text-ink mt-6">{module.titleSv}</Text>

        <View className="flex-row mt-8 rounded-xl bg-surface border border-fog/15">
          {(
            [
              ['Att repetera', progress.due],
              ['Nya', progress.unseen],
              ['Totalt', progress.total],
            ] as const
          ).map(([label, value], i) => (
            <View
              key={label}
              className={`flex-1 items-center py-5 ${i > 0 ? 'border-l border-fog/10' : ''}`}
            >
              <Text className="text-data-lg font-mono-medium text-ink">{value}</Text>
              <Text className="text-caption font-mono text-fog uppercase tracking-widest mt-1">
                {label}
              </Text>
            </View>
          ))}
        </View>

        <View className="mt-6">
          <Text className="text-caption font-mono text-fog uppercase tracking-widest mb-3">
            Ämnen
          </Text>
          {topics.map(({ topic: t, progress: tp }) => {
            const tDrillable = tp.due + tp.unseen > 0;
            return (
              <Link
                key={t.id}
                href={{ pathname: '/drill/[slug]', params: { slug: module.slug, topic: t.id } }}
                asChild
              >
                <Pressable
                  disabled={!tDrillable}
                  className={`flex-row items-center justify-between rounded-xl border border-fog/15 px-4 py-3.5 mb-2 ${
                    tDrillable ? 'bg-surface active:opacity-80' : 'opacity-50'
                  }`}
                >
                  <Text className="text-body font-sans text-ink flex-1 pr-3">{t.titleSv}</Text>
                  <Text className="text-caption font-mono text-fog">
                    {tDrillable ? (tp.due > 0 ? `${tp.due} att repetera` : `${tp.unseen} nya`) : 'Klart'}
                  </Text>
                </Pressable>
              </Link>
            );
          })}
        </View>

        <View className="flex-1" />

        {drillable ? (
          <Link href={{ pathname: '/drill/[slug]', params: { slug: module.slug } }} asChild>
            <Pressable className="bg-brass rounded-xl py-4 items-center active:opacity-90">
              <Text className="text-body font-sans-semibold text-bg">
                Starta drillpass (hela modulen)
              </Text>
            </Pressable>
          </Link>
        ) : (
          <View className="rounded-xl border border-fog/15 py-4 items-center">
            <Text className="text-body font-sans text-fog">
              Allt repeterat — kom tillbaka när nästa repetition förfaller.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
