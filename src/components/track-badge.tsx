import { useState } from 'react';
import { View } from 'react-native';

import { ThemedPressable, ThemedText } from '@/components/themed';
import { UnfurlMenu } from '@/components/unfurl-menu';
import type { Track } from '@/content/types';
import { TRACK_NAMES, TRACK_ORDER, useTrack } from '@/state/track-context';

/**
 * Structural-rework Phase 2: track switching was previously reachable only
 * from deep inside Settings, with no visibility elsewhere — a real gap for
 * anyone studying more than one certificate. This badge sits in the header
 * of Dashboard/Moduler/Prov and opens an inline switcher via the existing
 * UnfurlMenu (unfurl, not snap — matching the app's motion language).
 * Settings keeps its own full track section too; this is additive.
 */
export function TrackBadge() {
  const { track, setTrack } = useTrack();
  const [open, setOpen] = useState(false);

  function choose(t: Track) {
    setTrack(t);
    setOpen(false);
  }

  return (
    <View>
      <ThemedPressable
        onPress={() => setOpen((o) => !o)}
        borderTone="fog"
        borderOpacity={25}
        className="flex-row items-center self-start rounded-full border px-3 py-1.5 active:opacity-80"
      >
        <ThemedText tone="fog" className="text-caption font-mono uppercase tracking-widest">
          {TRACK_NAMES[track]}
        </ThemedText>
        <ThemedText tone="fog" className="text-caption font-mono ml-1.5">
          {open ? '︿' : '⌄'}
        </ThemedText>
      </ThemedPressable>

      <UnfurlMenu open={open}>
        <View className="mt-2 mb-1">
          {TRACK_ORDER.map((t) => {
            const active = t === track;
            return (
              <ThemedPressable
                key={t}
                onPress={() => choose(t)}
                bg={active ? 'brass' : undefined}
                bgOpacity={active ? 12 : undefined}
                borderTone={active ? 'brass' : 'fog'}
                borderOpacity={active ? undefined : 15}
                className="rounded-lg border px-4 py-2.5 mb-2 active:opacity-80"
              >
                <ThemedText
                  tone={active ? 'brass' : 'ink'}
                  className={`text-small ${active ? 'font-sans-semibold' : 'font-sans'}`}
                >
                  {TRACK_NAMES[t]}
                </ThemedText>
              </ThemedPressable>
            );
          })}
        </View>
      </UnfurlMenu>
    </View>
  );
}
