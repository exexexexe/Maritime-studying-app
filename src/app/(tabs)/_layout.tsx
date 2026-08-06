import { Tabs } from 'expo-router';

import { ChartsIcon, ChronometerIcon, CompassIcon, HelmIcon } from '@/components/icons';
import { useAppColorScheme } from '@/state/theme-context';
import { fonts, palette } from '@/theme/tokens';

export default function TabLayout() {
  const p = palette(useAppColorScheme().scheme);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        // Cross-fade + slight shift instead of an instant swap — restrained
        // on purpose (no slide/bounce), matching the instrument-panel bar.
        animation: 'shift',
        tabBarActiveTintColor: p.brass,
        tabBarInactiveTintColor: p.fog,
        tabBarStyle: {
          backgroundColor: p.surface,
          borderTopColor: `${p.fog}26`,
        },
        tabBarLabelStyle: {
          fontFamily: fonts.sansMedium,
          // React Navigation's tabBarLabelStyle can't take a className, so
          // this matches text-caption in tailwind.config.js by hand.
          fontSize: 12,
          letterSpacing: 0.4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Översikt',
          tabBarIcon: ({ color }) => <CompassIcon color={color} />,
        }}
      />
      <Tabs.Screen
        name="modules"
        options={{
          title: 'Moduler',
          tabBarIcon: ({ color }) => <ChartsIcon color={color} />,
        }}
      />
      <Tabs.Screen
        name="exam"
        options={{
          title: 'Prov',
          tabBarIcon: ({ color }) => <ChronometerIcon color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Inställningar',
          tabBarIcon: ({ color }) => <HelmIcon color={color} />,
        }}
      />
    </Tabs>
  );
}
