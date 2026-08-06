import { TextInput, View } from 'react-native';

import { ThemedText, ThemedView } from '@/components/themed';
import type { MapAnswer } from '@/content/types';
import type { MapAnswerValue } from '@/lib/map-answer';
import { useAppColorScheme } from '@/state/theme-context';
import { palette } from '@/theme/tokens';

interface Props {
  answer: MapAnswer;
  value: MapAnswerValue;
  onChange: (value: MapAnswerValue) => void;
  disabled?: boolean;
}

const UNIT_LABEL: Record<Exclude<MapAnswer['kind'], 'position'>, string> = {
  bearing: '°',
  distance: 'M',
  depth: 'm',
};

/** Free numeric entry for map_question's numeric_tolerance mode — the input
 * shape (single field vs lat/long pair) and unit label follow answer.kind. */
export function MapAnswerInput({ answer, value, onChange, disabled }: Props) {
  const p = palette(useAppColorScheme().scheme);

  if (answer.kind === 'position' && value.kind === 'position') {
    return (
      <View>
        <View className="flex-row gap-3">
          <View className="flex-1">
            <ThemedText tone="fog" className="text-caption font-mono uppercase tracking-widest mb-1.5">
              Latitud (°N)
            </ThemedText>
            <ThemedView
              bg="surface"
              borderTone="fog"
              borderOpacity={25}
              className="rounded-xl border"
            >
              <TextInput
                editable={!disabled}
                value={value.latText}
                onChangeText={(text) => onChange({ ...value, latText: text })}
                keyboardType="numbers-and-punctuation"
                placeholder="59,1234"
                placeholderTextColor={p.fog}
                style={{ color: p.ink }}
                className="px-4 py-3.5 text-body font-mono"
              />
            </ThemedView>
          </View>
          <View className="flex-1">
            <ThemedText tone="fog" className="text-caption font-mono uppercase tracking-widest mb-1.5">
              Longitud (°E)
            </ThemedText>
            <ThemedView
              bg="surface"
              borderTone="fog"
              borderOpacity={25}
              className="rounded-xl border"
            >
              <TextInput
                editable={!disabled}
                value={value.lonText}
                onChangeText={(text) => onChange({ ...value, lonText: text })}
                keyboardType="numbers-and-punctuation"
                placeholder="18,1234"
                placeholderTextColor={p.fog}
                style={{ color: p.ink }}
                className="px-4 py-3.5 text-body font-mono"
              />
            </ThemedView>
          </View>
        </View>
        <ThemedText tone="fog" className="text-caption font-sans mt-2">
          Decimalgrader, t.ex. 59,1234 — komma eller punkt fungerar.
        </ThemedText>
      </View>
    );
  }

  if (answer.kind !== 'position' && value.kind !== 'position') {
    return (
      <ThemedView
        bg="surface"
        borderTone="fog"
        borderOpacity={25}
        className="flex-row items-center rounded-xl border px-4"
      >
        <TextInput
          editable={!disabled}
          value={value.text}
          onChangeText={(text) => onChange({ ...value, text })}
          keyboardType="numbers-and-punctuation"
          placeholder="0"
          placeholderTextColor={p.fog}
          style={{ color: p.ink }}
          className="flex-1 py-3.5 text-body font-mono"
        />
        <ThemedText tone="fog" className="text-body font-mono ml-2">
          {UNIT_LABEL[answer.kind]}
        </ThemedText>
      </ThemedView>
    );
  }

  return null;
}
