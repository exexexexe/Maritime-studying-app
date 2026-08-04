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

import { TrackSelect } from '@/components/track-select';
import { TrackProvider, useTrackOrNull } from '@/state/track-context';
import { fonts, palette } from '@/theme/tokens';

SplashScreen.preventAutoHideAsync();

/** Gate: first run shows the track selector instead of the app. */
function TrackGate() {
  const { track, setTrack } = useTrackOrNull();
  if (!track) return <TrackSelect onSelect={setTrack} />;
  // One consistent push/pop direction for every screen in the app (module
  // → topic → drill, dashboard → settings, etc.) — the platform default on
  // Android is otherwise an abrupt cut, exactly the "instant-and-silent"
  // feel the rework is meant to fix.
  return <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }} />;
}

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
      <TrackProvider>
        <StatusBar style="auto" />
        <TrackGate />
      </TrackProvider>
    </ThemeProvider>
  );
}
