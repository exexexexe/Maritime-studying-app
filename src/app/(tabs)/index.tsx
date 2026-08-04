import { Link, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, useColorScheme, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Disclaimer } from '@/components/disclaimer';
import { ThemedPressable, ThemedText, ThemedView } from '@/components/themed';
import { bumpLaunchCount } from '@/db';
import { coverageLabel, dashboardStats, type DashboardStats } from '@/srs/stats';
import { getStreak } from '@/state/activity';
import { TRACK_NAMES, useTrack } from '@/state/track-context';
import { palette } from '@/theme/tokens';

export default function DashboardScreen() {
  const { track } = useTrack();
  const p = palette(useColorScheme());
  // Offline-persistence check from Phase 1 — still bumped, no longer displayed.
  useState(() => bumpLaunchCount());

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [streak, setStreak] = useState(0);

  useFocusEffect(
    useCallback(() => {
      const now = Date.now();
      setStats(dashboardStats(track, now));
      setStreak(getStreak(now));
    }, [track]),
  );

  if (!stats) return <SafeAreaView className="flex-1" style={{ backgroundColor: p.bg }} />;

  const maxCount = Math.max(...stats.coverage.map((c) => c.itemCount), 1);

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: p.bg }} edges={['top']}>
      <ScrollView contentContainerClassName="flex-grow px-6 pt-10 pb-6">
        <ThemedText tone="fog" className="text-caption font-mono uppercase tracking-widest">
          {TRACK_NAMES[track]}
        </ThemedText>
        <ThemedText className="text-display-xl font-display mt-1">Plugga Sjöexamen</ThemedText>

        {/* Today */}
        <ThemedView
          bg="surface"
          borderTone="fog"
          borderOpacity={15}
          className="mt-8 rounded-xl border px-5 py-6"
        >
          <View className="flex-row items-baseline justify-between">
            <ThemedText tone="fog" className="text-caption font-mono uppercase tracking-widest">
              Idag
            </ThemedText>
            {streak > 1 ? (
              <ThemedText tone="brass" className="text-caption font-mono">
                {streak} dagar i rad
              </ThemedText>
            ) : null}
          </View>
          <View className="flex-row items-baseline mt-2">
            <ThemedText tone="brass" className="text-data-lg font-mono-medium">
              {stats.dueTotal}
            </ThemedText>
            <ThemedText tone="fog" className="text-small font-sans ml-2">
              {stats.dueTotal === 1 ? 'fråga att repetera' : 'frågor att repetera'}
            </ThemedText>
          </View>
          {stats.nextModule ? (
            <Link
              href={{ pathname: '/drill/[slug]', params: { slug: stats.nextModule.slug } }}
              asChild
            >
              <ThemedPressable
                bg="brass"
                className="rounded-xl py-3.5 items-center mt-4 active:opacity-90"
              >
                <ThemedText tone="bg" className="text-body font-sans-semibold">
                  Repetera: {stats.nextModule.titleSv} ({stats.nextModule.due})
                </ThemedText>
              </ThemedPressable>
            </Link>
          ) : (
            <ThemedText tone="fog" className="text-small font-sans mt-3">
              {stats.reviewedTotal === 0
                ? 'Inget schemalagt ännu — börja med en modul under Moduler.'
                : 'Allt repeterat för i dag. Nästa repetition förfaller enligt schemat.'}
            </ThemedText>
          )}
        </ThemedView>

        {/* Weak areas */}
        {stats.weakModules.length > 0 ? (
          <ThemedView
            bg="surface"
            borderTone="fog"
            borderOpacity={15}
            className="mt-5 rounded-xl border px-5 py-5"
          >
            <ThemedText
              tone="fog"
              className="text-caption font-mono uppercase tracking-widest mb-3"
            >
              Svaga områden
            </ThemedText>
            {stats.weakModules.map((w) => (
              <Link
                key={w.moduleId}
                href={{ pathname: '/module/[slug]', params: { slug: w.slug } }}
                asChild
              >
                <ThemedPressable className="flex-row items-center py-2 active:opacity-80">
                  <ThemedText className="text-body font-sans flex-1">{w.titleSv}</ThemedText>
                  <ThemedText tone="port" className="text-small font-mono">
                    {w.wrong} av {w.reviewed} fel
                  </ThemedText>
                </ThemedPressable>
              </Link>
            ))}
          </ThemedView>
        ) : null}

        {/* Content coverage — a relative bar plus a qualitative tier, never
            a raw item count (reads as marketing/padding, not something a
            student needs to plan a study session around). */}
        <ThemedView
          bg="surface"
          borderTone="fog"
          borderOpacity={15}
          className="mt-5 rounded-xl border px-5 py-5"
        >
          <ThemedText tone="fog" className="text-caption font-mono uppercase tracking-widest mb-3">
            Täckning
          </ThemedText>
          {stats.coverage.map((c) => (
            <View key={c.moduleId} className="flex-row items-center py-1.5">
              <ThemedText className="text-small font-sans flex-1" numberOfLines={1}>
                {c.titleSv}
              </ThemedText>
              <ThemedView
                bg="fog"
                bgOpacity={15}
                className="w-16 h-1 rounded-full overflow-hidden mr-3"
              >
                <ThemedView
                  bg="brass"
                  bgOpacity={70}
                  className="h-1"
                  style={{ width: `${(c.itemCount / maxCount) * 100}%` }}
                />
              </ThemedView>
              <ThemedText
                tone={c.thin ? 'fog' : 'brass'}
                className="text-caption font-mono w-28 text-right"
                numberOfLines={1}
              >
                {coverageLabel(c.itemCount)}
              </ThemedText>
            </View>
          ))}
        </ThemedView>

        <View className="flex-1" />
        <Disclaimer />
      </ScrollView>
    </SafeAreaView>
  );
}
