import { Link, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Disclaimer } from '@/components/disclaimer';
import { bumpLaunchCount } from '@/db';
import { dashboardStats, type DashboardStats } from '@/srs/stats';
import { getStreak } from '@/state/activity';
import { TRACK_NAMES, useTrack } from '@/state/track-context';

export default function DashboardScreen() {
  const { track } = useTrack();
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

  if (!stats) return <SafeAreaView className="flex-1 bg-bg" />;

  const maxCount = Math.max(...stats.coverage.map((c) => c.itemCount), 1);

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={['top']}>
      <ScrollView contentContainerClassName="flex-grow px-6 pt-10 pb-6">
        <Text className="text-caption font-mono text-fog uppercase tracking-widest">
          {TRACK_NAMES[track]}
        </Text>
        <Text className="text-display-xl font-display text-ink mt-1">
          Plugga Sjöexamen
        </Text>

        {/* Today */}
        <View className="mt-8 rounded-xl bg-surface border border-fog/15 px-5 py-6">
          <View className="flex-row items-baseline justify-between">
            <Text className="text-caption font-mono text-fog uppercase tracking-widest">
              Idag
            </Text>
            {streak > 1 ? (
              <Text className="text-caption font-mono text-brass">
                {streak} dagar i rad
              </Text>
            ) : null}
          </View>
          <View className="flex-row items-baseline mt-2">
            <Text className="text-data-lg font-mono-medium text-brass">{stats.dueTotal}</Text>
            <Text className="text-small font-sans text-fog ml-2">
              {stats.dueTotal === 1 ? 'fråga att repetera' : 'frågor att repetera'}
            </Text>
          </View>
          {stats.nextModule ? (
            <Link
              href={{ pathname: '/drill/[slug]', params: { slug: stats.nextModule.slug } }}
              asChild
            >
              <Pressable className="bg-brass rounded-xl py-3.5 items-center mt-4 active:opacity-90">
                <Text className="text-body font-sans-semibold text-bg">
                  Repetera: {stats.nextModule.titleSv} ({stats.nextModule.due})
                </Text>
              </Pressable>
            </Link>
          ) : (
            <Text className="text-small font-sans text-fog mt-3">
              {stats.reviewedTotal === 0
                ? 'Inget schemalagt ännu — börja med en modul under Moduler.'
                : 'Allt repeterat för i dag. Nästa repetition förfaller enligt schemat.'}
            </Text>
          )}
        </View>

        {/* Weak areas */}
        {stats.weakModules.length > 0 ? (
          <View className="mt-5 rounded-xl bg-surface border border-fog/15 px-5 py-5">
            <Text className="text-caption font-mono text-fog uppercase tracking-widest mb-3">
              Svaga områden
            </Text>
            {stats.weakModules.map((w) => (
              <Link
                key={w.moduleId}
                href={{ pathname: '/module/[slug]', params: { slug: w.slug } }}
                asChild
              >
                <Pressable className="flex-row items-center py-2 active:opacity-80">
                  <Text className="text-body font-sans text-ink flex-1">{w.titleSv}</Text>
                  <Text className="text-small font-mono text-port">
                    {w.wrong} av {w.reviewed} fel
                  </Text>
                </Pressable>
              </Link>
            ))}
          </View>
        ) : null}

        {/* Content coverage */}
        <View className="mt-5 rounded-xl bg-surface border border-fog/15 px-5 py-5">
          <Text className="text-caption font-mono text-fog uppercase tracking-widest mb-3">
            Frågebank
          </Text>
          {stats.coverage.map((c) => (
            <View key={c.moduleId} className="flex-row items-center py-1.5">
              <Text className="text-small font-sans text-ink flex-1" numberOfLines={1}>
                {c.titleSv}
              </Text>
              <View className="w-16 h-1 rounded-full bg-fog/15 overflow-hidden mr-3">
                <View
                  className="h-1 bg-brass/70"
                  style={{ width: `${(c.itemCount / maxCount) * 100}%` }}
                />
              </View>
              <Text className="text-caption font-mono text-fog w-16 text-right" numberOfLines={1}>
                {c.itemCount}
                {c.thin ? ' · tunt' : ''}
              </Text>
            </View>
          ))}
          <Text className="text-caption font-sans text-fog mt-3">
            ”Tunt” markerar moduler där frågebanken behöver växa.
          </Text>
        </View>

        <View className="flex-1" />
        <Disclaimer />
      </ScrollView>
    </SafeAreaView>
  );
}
