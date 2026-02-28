'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Keyboard, Platform } from 'react-native';
import { Button, Card, Text, TextArea, XStack, YStack } from '@innera/ui';
import { ChevronDown, Lock, Heart, Users } from '@tamagui/lucide-icons';
import { ScreenContainer } from '../components';
import { useRouter, useParams } from '../navigation';
import { useCreateEntry, useUpdateEntry, useEntry } from '../hooks/use-entries';
import { safeDecodeBase64, encodeBase64 } from '../utils/crypto';
import { VISIBILITY_CONFIG } from '../utils/visibility';
import type { Visibility } from '@innera/shared';

function useKeyboardVisible(): boolean {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'web') return;

    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, () => setVisible(true));
    const hideSub = Keyboard.addListener(hideEvent, () => setVisible(false));

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  return visible;
}

type EntryVisibility = Exclude<Visibility, 'FUTURE_CIRCLE_ONLY'>;

type VisibilityOption = {
  value: EntryVisibility;
  label: string;
  description: string;
};

const VISIBILITY_OPTIONS: VisibilityOption[] = [
  { value: 'PRIVATE', label: 'Private', description: 'Only you can see this' },
  { value: 'PARTNER', label: 'Partner', description: 'Shared with your partner' },
  { value: 'CIRCLE', label: 'Circle', description: 'Shared with your circle' },
];

function getVisibilityIcon(value: EntryVisibility): React.ReactElement {
  const color = VISIBILITY_CONFIG[value].color;
  switch (value) {
    case 'PRIVATE':
      return <Lock size={16} color={color} />;
    case 'PARTNER':
      return <Heart size={16} color={color} />;
    case 'CIRCLE':
      return <Users size={16} color={color} />;
  }
}

export function NewEntryScreen() {
  const params = useParams<{ id?: string }>();
  // Edge case: an entry with literal ID "new" would not be editable here.
  // This is safe because entry IDs are UUIDs, which cannot equal "new".
  const editId = params?.id && params.id !== 'new' ? params.id : undefined;
  const isEdit = !!editId;

  const { data: existingEntry } = useEntry(editId);
  const createEntry = useCreateEntry();
  const updateEntry = useUpdateEntry();
  const router = useRouter();

  const [content, setContent] = useState('');
  const [visibility, setVisibility] = useState<EntryVisibility>('PRIVATE');
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);
  const keyboardVisible = useKeyboardVisible();

  // Stable refs for mutation functions to avoid re-creating callbacks on every render
  const createEntryRef = useRef(createEntry.mutateAsync);
  const updateEntryRef = useRef(updateEntry.mutateAsync);
  useEffect(() => {
    createEntryRef.current = createEntry.mutateAsync;
    updateEntryRef.current = updateEntry.mutateAsync;
  });

  // Pre-fill form in edit mode
  useEffect(() => {
    if (isEdit && existingEntry && !initialized) {
      setContent(safeDecodeBase64(existingEntry.contentEncrypted));
      const vis = existingEntry.visibility;
      if (vis === 'PRIVATE' || vis === 'PARTNER' || vis === 'CIRCLE') {
        setVisibility(vis);
      } else {
        setVisibility('PRIVATE'); // Fallback for unsupported visibility types
      }
      setInitialized(true);
    }
  }, [isEdit, existingEntry, initialized]);

  const handleDismissKeyboard = useCallback(() => Keyboard.dismiss(), []);

  const isPending = createEntry.isPending || updateEntry.isPending;

  const handleSave = useCallback(async () => {
    setError(null);
    const encoded = encodeBase64(content);
    try {
      if (isEdit && existingEntry) {
        await updateEntryRef.current({
          id: editId!,
          contentEncrypted: encoded,
          visibility,
          version: existingEntry.version,
        });
      } else {
        await createEntryRef.current({
          contentEncrypted: encoded,
          visibility,
        });
      }
      router.back();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save entry');
    }
  }, [content, visibility, isEdit, existingEntry, editId, router]);

  const todayLabel = editId && existingEntry
    ? new Date(existingEntry.createdAt).toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      })
    : new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      });

  return (
    <ScreenContainer edges={['bottom']} scrollable={false} dismissKeyboard>
      <XStack justifyContent="space-between" alignItems="center">
        <Text fontSize="$5" fontWeight="700" color="$color">
          {isEdit ? 'Edit Entry' : 'New Entry'}
        </Text>
        <Text fontSize="$2" color="$colorSubtle">
          {todayLabel}
        </Text>
      </XStack>

      <Card flex={1} padding="sm">
        <YStack flex={1} gap="$2">
          <XStack justifyContent="space-between" alignItems="center">
            <Text fontSize="$2" color="$colorSubtle">
              Markdown supported
            </Text>
            {keyboardVisible && (
              <Button
                size="sm"
                variant="ghost"
                onPress={handleDismissKeyboard}
                accessibilityLabel="Close keyboard"
              >
                <XStack alignItems="center" gap="$1">
                  <ChevronDown size={14} color="$primary" />
                  <Text fontSize="$2" fontWeight="600" color="$primary">
                    Done
                  </Text>
                </XStack>
              </Button>
            )}
          </XStack>
          <TextArea
            flex={1}
            placeholder="What's on your mind? Start writing..."
            value={content}
            onChangeText={setContent}
            fontSize="$4"
            borderWidth={0}
            backgroundColor="transparent"
            padding={0}
            multiline
            disabled={isPending}
            aria-label="Journal entry content"
          />
        </YStack>
      </Card>

      <YStack gap="$2">
        <Text fontSize="$3" fontWeight="600" color="$color">
          Visibility
        </Text>
        <XStack gap="$2" flexWrap="wrap">
          {VISIBILITY_OPTIONS.map((option) => {
            const selected = visibility === option.value;
            return (
              <Card
                key={option.value}
                flex={1}
                padding="sm"
                pressStyle={{ scale: 0.97 }}
                onPress={() => setVisibility(option.value)}
                backgroundColor={selected ? '$blue3' : '$background'}
                borderColor={selected ? '$blue8' : '$borderColor'}
                pressable
                accessibilityLabel={`Set visibility to ${option.label}`}
              >
                <YStack gap="$1" alignItems="center">
                  {getVisibilityIcon(option.value)}
                  <Text
                    fontSize="$2"
                    fontWeight="600"
                    color={selected ? '$blue10' : '$color'}
                  >
                    {option.label}
                  </Text>
                  <Text
                    fontSize="$1"
                    color={selected ? '$blue8' : '$colorSubtle'}
                    textAlign="center"
                  >
                    {option.description}
                  </Text>
                </YStack>
              </Card>
            );
          })}
        </XStack>
      </YStack>

      {error && (
        <Text fontSize="$2" color="$danger" textAlign="center">
          {error}
        </Text>
      )}

      <Button
        size="lg"
        fullWidth
        disabled={content.trim().length === 0 || isPending}
        loading={isPending}
        onPress={handleSave}
        accessibilityLabel="Save journal entry"
      >
        {isEdit ? 'Update Entry' : 'Save Entry'}
      </Button>

      {content.trim().length === 0 && (
        <Text fontSize="$1" color="$colorSubtle" textAlign="center">Write something to save your entry</Text>
      )}
    </ScreenContainer>
  );
}
