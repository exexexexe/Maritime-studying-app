import '../global.css';

import {
  IBMPlexMono_400Regular,
  IBMPlexMono_500Medium,
} from '@expo-google-fonts/ibm-plex-mono';
import {
  IBMPlexSans_400Regular,
  IBMPlexSans_500Medium,
  IBMPlexSans_600SemiBold,
} from '@expo-google-fonts/ibm-plex-sans';
import { InstrumentSerif_400Regular } from '@expo-google-fonts/instrument-serif';
import { useFonts } from 'expo-font';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';

import { fonts, palette } from '@/theme/tokens';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const scheme = useColorScheme();
  const p = palette(scheme);

  const [fontsLoaded] = useFonts({
    InstrumentSerif_400Regular,
    IBMPlexSans_400Regular,
    IBMPlexSans_500Medium,
    IBMPlexSans_600SemiBold,
    IBMPlexMono_400Regular,
    IBMPlexMono_500Medium,
  });

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  const base = scheme === 'light' ? DefaultTheme : DarkTheme;
  const navTheme = {
    ...base,
    colors: {
      ...base.colors,
      background: p.bg,
      card: p.surface,
      text: p.ink,
      primary: p.brass,
      border: `${p.fog}33`,
    },
    fonts: {
      ...base.fonts,
      regular: { fontFamily: fonts.sans, fontWeight: '400' as const },
      medium: { fontFamily: fonts.sansMedium, fontWeight: '500' as const },
      bold: { fontFamily: fonts.sansSemiBold, fontWeight: '600' as const },
      heavy: { fontFamily: fonts.sansSemiBold, fontWeight: '600' as const },
    },
  };

  return (
    <ThemeProvider value={navTheme}>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }} />
    </ThemeProvider>
  );
}
