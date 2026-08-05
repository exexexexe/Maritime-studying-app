import { Link, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, useColorScheme } from 'react-native';
import Animated, { FadeInDown, useReducedMotion } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { StaggerIn } from '@/components/stagger-in';
import { ThemedPressable, ThemedText, ThemedView } from '@/components/themed';
import { TrackBadge } from '@/components/track-badge';
import { coverageLabel, dashboardStats, isThinCoverage, type ModuleCoverage } from '@/srs/stats';
import { TRACK_NAMES, useTrack } from '@/state/track-context';
import { palette } from '@/theme/tokens';

function ModuleRow({ m, i, dominant }: { m: ModuleCoverage; i: number; dominant: boolean }) {
  return (
    <Link href={{ pathname: '/module/[slug]', params: { slug: m.slug } }} asChild>
      <ThemedPressable className="active:opacity-80">
        <ThemedView
          borderTone="fog"
          borderOpacity={10}
          style={{ borderTopWidth: i > 0 ? 1 : 0 }}
          className="flex-row items-center px-5 py-4"
        >
          <ThemedText
            tone={dominant ? 'brass' : 'ink'}
            className={`text-body flex-1 ${dominant ? 'font-sans-semibold' : 'font-sans'}`}
          >
            {m.titleSv}
          </ThemedText>
          {dominant ? (
            <ThemedText tone="brass" className="text-body font-mono-medium">
              {m.due} ›
            </ThemedText>
          ) : (
            <ThemedText
              tone={isThinCoverage(m.itemCount) ? 'fog' : 'brass'}
              className="text-caption font-mono"
            >
              {coverageLabel(m.itemCount)} ›
            </ThemedText>
          )}
        </ThemedView>
      </ThemedPressable>
    </Link>
  );
}

export default function ModulesScreen() {
  const { track } = useTrack();
  const p = palette(useColorScheme());
  const reducedMotion = useReducedMotion();
  const [coverage, setCoverage] = useState<ModuleCoverage[]>([]);

  useFocusEffect(
    useCallback(() => {
      setCoverage(dashboardStats(track, Date.now()).coverage);
    }, [track]),
  );

  // Structural rework: a flat numbered 01–11 list gave every module the
  // same visual weight regardless of whether it's what a student actually
  // needs today. Grouping by due>0 answers "which of these matters" on
  // the screen itself instead of leaving it to the dashboard alone.
  const due = coverage.filter((c) => c.due > 0).sort((a, b) => b.due - a.due);
  const rest = coverage.filter((c) => c.due === 0);

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: p.bg }} edges={['top']}>
      <ScrollView contentContainerClassName="px-6 pt-10 pb-8">
        <TrackBadge />
        <Animated.View entering={reducedMotion ? undefined : FadeInDown.duration(280).delay(60)}>
          <ThemedText className="text-display font-display mt-2">Moduler</ThemedText>
          <ThemedText tone="fog" className="text-small font-sans mt-1">
            {coverage.length} moduler för {TRACK_NAMES[track]}.
          </ThemedText>
        </Animated.View>

        {due.length > 0 ? (
          <>
            <ThemedText
              tone="fog"
              className="text-caption font-mono uppercase tracking-widest mt-8 mb-3"
            >
              Att repetera idag
            </ThemedText>
            <ThemedView
              bg="surface"
              borderTone="brass"
              borderOpacity={25}
              className="rounded-xl border overflow-hidden"
            >
              {due.map((m, i) => (
                <StaggerIn key={m.moduleId} index={i}>
                  <ModuleRow m={m} i={i} dominant />
                </StaggerIn>
              ))}
            </ThemedView>
          </>
        ) : null}

        {rest.length > 0 ? (
          <>
            <ThemedText
              tone="fog"
              className="text-caption font-mono uppercase tracking-widest mt-6 mb-3"
            >
              Övriga moduler
            </ThemedText>
            <ThemedView bg="surface" bgOpacity={45} className="rounded-xl overflow-hidden">
              {rest.map((m, i) => (
                <StaggerIn key={m.moduleId} index={i}>
                  <ModuleRow m={m} i={i} dominant={false} />
                </StaggerIn>
              ))}
            </ThemedView>
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
