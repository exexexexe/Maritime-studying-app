import { Tabs } from 'expo-router';
import { useColorScheme } from 'react-native';

import { ChartsIcon, ChronometerIcon, CompassIcon, HelmIcon } from '@/components/icons';
import { fonts, palette } from '@/theme/tokens';

export default function TabLayout() {
  const p = palette(useColorScheme());

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: p.brass,
        tabBarInactiveTintColor: p.fog,
        tabBarStyle: {
          backgroundColor: p.surface,
          borderTopColor: `${p.fog}26`,
        },
        tabBarLabelStyle: {
          fontFamily: fonts.sansMedium,
          fontSize: 11,
          letterSpacing: 0.3,
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
