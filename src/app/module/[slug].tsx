import { Link, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, useColorScheme, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedPressable, ThemedText, ThemedView } from '@/components/themed';
import { itemsForTrack, moduleBySlug, topicsForModule } from '@/content';
import { lanternSprintItems } from '@/lib/sprint';
import { moduleProgress, topicProgress } from '@/srs/session';
import { useTrack } from '@/state/track-context';
import { palette } from '@/theme/tokens';

export default function ModuleScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { track } = useTrack();
  const p = palette(useColorScheme());
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
  // Sprint mode currently only has eligible content for lanterns — see
  // src/lib/sprint.ts. Hides itself on tracks with no eligible items
  // (buoy-fyr items are klass8/kustskeppare only) rather than linking to
  // an empty drill.
  const sprintAvailable =
    module?.id === 'mod-lanterns' && lanternSprintItems(itemsForTrack(track)).length > 0;

  if (!module || !progress) {
    return (
      <SafeAreaView
        className="flex-1 items-center justify-center"
        style={{ backgroundColor: p.bg }}
      >
        <ThemedText tone="fog" className="text-body font-sans">
          Modulen hittades inte.
        </ThemedText>
      </SafeAreaView>
    );
  }

  const drillable = progress.due + progress.unseen > 0;

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: p.bg }} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView contentContainerClassName="flex-grow px-6 pt-6 pb-10">
        <Link href="/modules" asChild>
          <ThemedPressable hitSlop={8}>
            <ThemedText tone="fog" className="text-small font-sans">
              ‹ Moduler
            </ThemedText>
          </ThemedPressable>
        </Link>

        <ThemedText className="text-display font-display mt-6">{module.titleSv}</ThemedText>

        <ThemedView
          bg="surface"
          borderTone="fog"
          borderOpacity={15}
          className="flex-row mt-8 rounded-xl border"
        >
          {(
            [
              ['Att repetera', progress.due],
              ['Nya', progress.unseen],
              ['Totalt', progress.total],
            ] as const
          ).map(([label, value], i) => (
            <ThemedView
              key={label}
              borderTone="fog"
              borderOpacity={10}
              style={{ borderLeftWidth: i > 0 ? 1 : 0 }}
              className="flex-1 items-center py-5"
            >
              <ThemedText className="text-data-lg font-mono-medium">{value}</ThemedText>
              <ThemedText
                tone="fog"
                className="text-caption font-mono uppercase tracking-widest mt-1"
              >
                {label}
              </ThemedText>
            </ThemedView>
          ))}
        </ThemedView>

        <View className="mt-6">
          <ThemedText tone="fog" className="text-caption font-mono uppercase tracking-widest mb-3">
            Ämnen
          </ThemedText>
          {topics.map(({ topic: t, progress: tp }) => {
            const tDrillable = tp.due + tp.unseen > 0;
            return (
              <Link
                key={t.id}
                href={{ pathname: '/drill/[slug]', params: { slug: module.slug, topic: t.id } }}
                asChild
              >
                <ThemedPressable
                  disabled={!tDrillable}
                  bg={tDrillable ? 'surface' : undefined}
                  borderTone="fog"
                  borderOpacity={15}
                  className={`flex-row items-center justify-between rounded-xl border px-4 py-3.5 mb-2 ${
                    tDrillable ? 'active:opacity-80' : 'opacity-50'
                  }`}
                >
                  <ThemedText className="text-body font-sans flex-1 pr-3">{t.titleSv}</ThemedText>
                  <ThemedText tone="fog" className="text-caption font-mono">
                    {tDrillable ? (tp.due > 0 ? `${tp.due} att repetera` : `${tp.unseen} nya`) : 'Klart'}
                  </ThemedText>
                </ThemedPressable>
              </Link>
            );
          })}
        </View>

        {sprintAvailable ? (
          <Link href="/sprint/lantern" asChild>
            <ThemedPressable
              borderTone="tide"
              className="rounded-xl border px-4 py-3.5 items-center active:opacity-80"
            >
              <ThemedText tone="tide" className="text-body font-sans-medium">
                Snabbtest: ljuskaraktärer
              </ThemedText>
            </ThemedPressable>
          </Link>
        ) : null}

        <View className="flex-1" />

        {drillable ? (
          <Link href={{ pathname: '/drill/[slug]', params: { slug: module.slug } }} asChild>
            <ThemedPressable bg="brass" className="rounded-xl py-4 items-center active:opacity-90">
              <ThemedText tone="bg" className="text-body font-sans-semibold">
                Starta drillpass (hela modulen)
              </ThemedText>
            </ThemedPressable>
          </Link>
        ) : (
          <ThemedView
            borderTone="fog"
            borderOpacity={15}
            className="rounded-xl border py-4 items-center"
          >
            <ThemedText tone="fog" className="text-body font-sans">
              Allt repeterat — kom tillbaka när nästa repetition förfaller.
            </ThemedText>
          </ThemedView>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
