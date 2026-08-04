import { useState } from 'react';
import { Pressable, Text, useColorScheme, View } from 'react-native';

import { getMeta, setMeta } from '@/db';
import { palette } from '@/theme/tokens';
import type { MapChartRef } from '@/content/types';

import { PaperChartIcon } from './icons';

const ONBOARDING_SEEN_KEY = 'seen_chart_question_onboarding';

/**
 * Shown before question content on every map_question item — the app never
 * renders SE61/SE93 imagery (copyright), so this is the actual fix for the
 * "why is there no picture" confusion: tell the student which physical
 * chart to go get. Same component everywhere a map_question can appear.
 */
export function ChartRequiredBanner({ chartRef }: { chartRef: MapChartRef }) {
  const p = palette(useColorScheme());
  const [onboardingSeen, setOnboardingSeen] = useState(() => getMeta(ONBOARDING_SEEN_KEY) === '1');

  function dismissOnboarding() {
    setMeta(ONBOARDING_SEEN_KEY, '1');
    setOnboardingSeen(true);
  }

  return (
    <View className="rounded-xl bg-surface border border-brass/40 px-4 py-3.5 mb-5">
      <View className="flex-row items-center">
        <PaperChartIcon color={p.brass} size={22} />
        <Text className="text-small font-sans-medium text-ink ml-3 flex-1">
          Den här frågan kräver sjökort{' '}
          <Text className="font-sans-semibold">{chartRef.chart}</Text>
        </Text>
      </View>
      {!onboardingSeen ? (
        <View className="mt-3 pt-3 border-t border-fog/15">
          <Text className="text-caption font-sans text-fog">
            En del frågor löser du bäst genom att mäta eller plotta direkt på ett
            fysiskt sjökort (SE61 eller SE93) med passare och linjal — precis
            som på det riktiga provet. Appen visar inte själva sjökortet;
            plocka fram ditt eget och kontrollera svaret här när du är klar.
          </Text>
          <Pressable onPress={dismissOnboarding} hitSlop={8} className="mt-2 self-start">
            <Text className="text-caption font-mono text-brass uppercase tracking-widest">
              Jag förstår
            </Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}
