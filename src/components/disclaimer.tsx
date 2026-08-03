import { Text, View } from 'react-native';

/**
 * Product-wide legal framing. Shown on the dashboard and in settings.
 * Wording is deliberate: "helps you prepare for", never "certified for".
 */
export function Disclaimer() {
  return (
    <View className="px-6 py-4">
      <Text className="text-caption font-sans text-fog/80 text-center">
        Fristående studiehjälpmedel som hjälper dig att förbereda dig inför prov.{'\n'}
        Inte anslutet till eller godkänt av Transportstyrelsen, NFB eller något annat
        certifierande organ.
      </Text>
    </View>
  );
}
