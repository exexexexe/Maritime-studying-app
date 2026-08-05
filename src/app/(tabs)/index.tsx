import { Link, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, useColorScheme, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Disclaimer } from '@/components/disclaimer';
import { NumericReadout } from '@/components/numeric-readout';
import { ThemedPressable, ThemedText, ThemedView } from '@/components/themed';
import { TrackBadge } from '@/components/track-badge';
import { UnfurlMenu } from '@/components/unfurl-menu';
import { bumpLaunchCount } from '@/db';
import { coverageLabel, dashboardStats, type DashboardStats } from '@/srs/stats';
import { getStreak } from '@/state/activity';
import { useTrack } from '@/state/track-context';
import { palette } from '@/theme/tokens';

export default function DashboardScreen() {
  const { track } = useTrack();
  const p = palette(useColorScheme());
  // Offline-persistence check from Phase 1 — still bumped, no longer displayed.
  useState(() => bumpLaunchCount());

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [streak, setStreak] = useState(0);
  const [coverageOpen, setCoverageOpen] = useState(false);

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
        <TrackBadge />
        <ThemedText className="text-display-xl font-display mt-2">Plugga Sjöexamen</ThemedText>

        {/* Today — the screen's one dominant element. Due-reviews count is
            the single number that answers the student's actual daily
            question ("what do I need to do today"), and it's already the
            anchor for the CTA below it — no new derived stat, just this
            existing one given the visual weight it earns. Elevated +
            larger radius/padding than every card below it, so the
            hierarchy reads as a physical stack, not a list of equals. */}
        <ThemedView
          bg="surface"
          borderTone="fog"
          borderOpacity={15}
          elevated
          className="mt-8 rounded-2xl border px-6 py-8"
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
          <NumericReadout value={stats.dueTotal} tone="brass" className="mt-3" />
          <ThemedText tone="fog" className="text-small font-sans mt-1">
            {stats.dueTotal === 1 ? 'fråga att repetera' : 'frågor att repetera'}
          </ThemedText>
          {stats.nextModule ? (
            <Link
              href={{ pathname: '/drill/[slug]', params: { slug: stats.nextModule.slug } }}
              asChild
            >
              <ThemedPressable
                bg="brass"
                className="rounded-xl py-3.5 items-center mt-6 active:opacity-90"
              >
                <ThemedText tone="bg" className="text-body font-sans-semibold">
                  Repetera: {stats.nextModule.titleSv} ({stats.nextModule.due})
                </ThemedText>
              </ThemedPressable>
            </Link>
          ) : (
            <ThemedText tone="fog" className="text-small font-sans mt-5">
              {stats.reviewedTotal === 0
                ? 'Inget schemalagt ännu — börja med en modul under Moduler.'
                : 'Allt repeterat för i dag. Nästa repetition förfaller enligt schemat.'}
            </ThemedText>
          )}
        </ThemedView>

        {/* Weak areas — deliberately quieter than Idag: no border, no
            shadow, tighter padding. Secondary information, not a second
            focal point. */}
        {stats.weakModules.length > 0 ? (
          <ThemedView bg="surface" bgOpacity={45} className="mt-4 rounded-xl px-5 py-4">
            <ThemedText
              tone="fog"
              className="text-caption font-mono uppercase tracking-widest mb-2"
            >
              Svaga områden
            </ThemedText>
            {stats.weakModules.map((w) => (
              <Link
                key={w.moduleId}
                href={{ pathname: '/module/[slug]', params: { slug: w.slug } }}
                asChild
              >
                <ThemedPressable className="flex-row items-center py-1.5 active:opacity-80">
                  <ThemedText className="text-small font-sans flex-1">{w.titleSv}</ThemedText>
                  <ThemedText tone="port" className="text-caption font-mono">
                    {w.wrong} av {w.reviewed} fel
                  </ThemedText>
                </ThemedPressable>
              </Link>
            ))}
          </ThemedView>
        ) : null}

        {/* Content coverage — collapsed by default (structural rework): it's
            the same 11 modules Moduler already lists, so showing it
            uncollapsed here too doubled up with that screen and competed
            with Idag for attention. Still one tap away, not removed. */}
        <ThemedPressable
          onPress={() => setCoverageOpen((o) => !o)}
          bg="surface"
          bgOpacity={45}
          className="mt-3 rounded-xl px-5 py-4 flex-row items-center justify-between active:opacity-80"
        >
          <ThemedText tone="fog" className="text-caption font-mono uppercase tracking-widest">
            Täckning
          </ThemedText>
          <ThemedText tone="fog" className="text-caption font-mono">
            {coverageOpen ? '︿' : '⌄'}
          </ThemedText>
        </ThemedPressable>
        <UnfurlMenu open={coverageOpen}>
          <ThemedView bg="surface" bgOpacity={45} className="rounded-xl px-5 py-4 mt-1">
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
        </UnfurlMenu>

        <View className="flex-1" />
        <Disclaimer />
      </ScrollView>
    </SafeAreaView>
  );
}
