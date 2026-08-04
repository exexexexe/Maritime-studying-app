import { View } from 'react-native';

import { ThemedText } from '@/components/themed';

/**
 * Product-wide legal framing. Shown on the dashboard and in settings.
 * Wording is deliberate: "helps you prepare for", never "certified for".
 */
export function Disclaimer() {
  return (
    <View className="px-6 py-4">
      <ThemedText tone="fog" toneOpacity={80} className="text-caption font-sans text-center">
        Fristående studiehjälpmedel som hjälper dig att förbereda dig inför prov.{'\n'}
        Inte anslutet till eller godkänt av Transportstyrelsen, NFB eller något annat
        certifierande organ.
      </ThemedText>
    </View>
  );
}
