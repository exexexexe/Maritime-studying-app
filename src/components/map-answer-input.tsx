import { Text, TextInput, useColorScheme, View } from 'react-native';

import type { MapAnswer } from '@/content/types';
import type { MapAnswerValue } from '@/lib/map-answer';
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
  const p = palette(useColorScheme());

  if (answer.kind === 'position' && value.kind === 'position') {
    return (
      <View>
        <View className="flex-row gap-3">
          <View className="flex-1">
            <Text className="text-caption font-mono text-fog uppercase tracking-widest mb-1.5">
              Latitud (°N)
            </Text>
            <TextInput
              editable={!disabled}
              value={value.latText}
              onChangeText={(text) => onChange({ ...value, latText: text })}
              keyboardType="numbers-and-punctuation"
              placeholder="59,1234"
              placeholderTextColor={p.fog}
              className="rounded-xl border border-fog/25 bg-surface px-4 py-3.5 text-body font-mono text-ink"
            />
          </View>
          <View className="flex-1">
            <Text className="text-caption font-mono text-fog uppercase tracking-widest mb-1.5">
              Longitud (°E)
            </Text>
            <TextInput
              editable={!disabled}
              value={value.lonText}
              onChangeText={(text) => onChange({ ...value, lonText: text })}
              keyboardType="numbers-and-punctuation"
              placeholder="18,1234"
              placeholderTextColor={p.fog}
              className="rounded-xl border border-fog/25 bg-surface px-4 py-3.5 text-body font-mono text-ink"
            />
          </View>
        </View>
        <Text className="text-caption font-sans text-fog mt-2">
          Decimalgrader, t.ex. 59,1234 — komma eller punkt fungerar.
        </Text>
      </View>
    );
  }

  if (answer.kind !== 'position' && value.kind !== 'position') {
    return (
      <View className="flex-row items-center rounded-xl border border-fog/25 bg-surface px-4">
        <TextInput
          editable={!disabled}
          value={value.text}
          onChangeText={(text) => onChange({ ...value, text })}
          keyboardType="numbers-and-punctuation"
          placeholder="0"
          placeholderTextColor={p.fog}
          className="flex-1 py-3.5 text-body font-mono text-ink"
        />
        <Text className="text-body font-mono text-fog ml-2">{UNIT_LABEL[answer.kind]}</Text>
      </View>
    );
  }

  return null;
}
