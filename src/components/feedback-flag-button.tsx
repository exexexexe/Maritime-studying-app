import { useState } from 'react';
import { Modal, TextInput, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { ThemedPressable, ThemedText, ThemedView, withAlpha } from '@/components/themed';
import { addFeedbackFlag, type FeedbackCategory } from '@/db/feedback';
import { useAppColorScheme } from '@/state/theme-context';
import { palette } from '@/theme/tokens';

/**
 * Tester-only feedback flagging — see src/db/feedback.ts and
 * content/AUTHORING.md's "testing, not shipping" note. Deliberately plain:
 * this is a testing tool, not a polished student-facing screen, so it
 * skips the app's usual motion/elevation treatment and just uses a plain
 * RN Modal. Small and dim by default (tone="fog") so it stays out of the
 * way during normal use.
 *
 * Pass `item` from any drill-screen item type or the orbit trainer's
 * currently selected vessel to flag a specific piece of content; omit it
 * (Settings' general-feedback entry) for feedback not tied to one item.
 */

interface FeedbackFlagButtonProps {
  item?: { id: string; topicId: string; type: string };
  /** Custom trigger — defaults to the small flag icon used on drill
   * screens. Settings' general-feedback entry supplies a full row
   * instead; the trigger owns its own pressable. */
  trigger?: (props: { onPress: () => void; confirmed: boolean }) => React.ReactNode;
  /** Called after a flag is successfully saved — lets a parent (e.g.
   * Settings' flag count) refresh without polling. */
  onSaved?: () => void;
}

const CATEGORIES: { key: FeedbackCategory; label: string }[] = [
  { key: 'wrong_answer', label: 'Fel svar' },
  { key: 'confusing', label: 'Otydligt' },
  { key: 'typo_translation', label: 'Stavfel/översättning' },
  { key: 'other', label: 'Övrigt' },
];

const CONFIRM_MS = 1200;

function FlagGlyph({ color, size = 18 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 3v18" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
      <Path d="M6 4 H17 L14.5 7.5 L17 11 H6 Z" fill={color} fillOpacity={0.85} />
    </Svg>
  );
}

function CheckGlyph({ color, size = 18 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4.5 12.5 L9.5 17.5 L19.5 6.5"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function FeedbackFlagButton({ item, trigger, onSaved }: FeedbackFlagButtonProps) {
  const p = palette(useAppColorScheme().scheme);
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState('');
  const [confirmed, setConfirmed] = useState(false);

  function submit(category: FeedbackCategory) {
    addFeedbackFlag({
      category,
      note,
      itemId: item?.id ?? null,
      topicId: item?.topicId ?? null,
      itemType: item?.type ?? null,
    });
    setOpen(false);
    setNote('');
    setConfirmed(true);
    onSaved?.();
    setTimeout(() => setConfirmed(false), CONFIRM_MS);
  }

  return (
    <>
      {trigger ? (
        trigger({ onPress: () => setOpen(true), confirmed })
      ) : (
        <ThemedPressable hitSlop={10} onPress={() => setOpen(true)} disabled={confirmed}>
          {confirmed ? <CheckGlyph color={p.starboard} /> : <FlagGlyph color={p.fog} />}
        </ThemedPressable>
      )}

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        {/* Raw black scrim, not a theme token — same reasoning as
            lantern-diagram.tsx's NIGHT constant: a modal dimming overlay
            isn't a themed UI surface, it's a fixed effect. */}
        <View
          className="flex-1 items-center justify-center px-6"
          style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
        >
          <ThemedView
            bg="surface"
            borderTone="fog"
            borderOpacity={20}
            className="w-full rounded-2xl border p-5"
          >
            <ThemedText className="text-title font-sans-medium">
              {item ? 'Flagga den här frågan' : 'Allmän feedback'}
            </ThemedText>
            {item ? (
              <ThemedText tone="fog" className="text-caption font-mono mt-1">
                {item.id}
              </ThemedText>
            ) : null}

            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="Kort anteckning (valfritt)"
              placeholderTextColor={p.fog}
              multiline
              style={{
                marginTop: 16,
                minHeight: 60,
                borderWidth: 1,
                borderColor: withAlpha(p.fog, 20),
                borderRadius: 10,
                padding: 10,
                color: p.ink,
                textAlignVertical: 'top',
              }}
            />

            <View className="flex-row flex-wrap gap-2 mt-4">
              {CATEGORIES.map((c) => (
                <ThemedPressable
                  key={c.key}
                  onPress={() => submit(c.key)}
                  borderTone="fog"
                  borderOpacity={25}
                  className="rounded-lg border px-3 py-2.5 active:opacity-80"
                >
                  <ThemedText className="text-small font-sans">{c.label}</ThemedText>
                </ThemedPressable>
              ))}
            </View>

            <ThemedPressable
              hitSlop={8}
              onPress={() => {
                setOpen(false);
                setNote('');
              }}
              className="mt-4 items-center"
            >
              <ThemedText tone="fog" className="text-small font-sans">
                Avbryt
              </ThemedText>
            </ThemedPressable>
          </ThemedView>
        </View>
      </Modal>
    </>
  );
}
