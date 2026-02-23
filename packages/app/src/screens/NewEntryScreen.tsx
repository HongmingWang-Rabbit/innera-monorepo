import React, { useState } from 'react';
import { Button, Card, Text, TextArea, XStack, YStack } from '@innera/ui';

type Visibility = 'PRIVATE' | 'PARTNER' | 'CIRCLE';

const VISIBILITY_OPTIONS: { value: Visibility; label: string; description: string }[] = [
  { value: 'PRIVATE', label: 'Private', description: 'Only you can see this' },
  { value: 'PARTNER', label: 'Partner', description: 'Shared with your partner' },
  { value: 'CIRCLE', label: 'Circle', description: 'Shared with your circle' },
];

export function NewEntryScreen() {
  const [content, setContent] = useState('');
  const [visibility, setVisibility] = useState<Visibility>('PRIVATE');

  return (
    <YStack flex={1} backgroundColor="$background" padding="$4" gap="$4">
      <XStack justifyContent="space-between" alignItems="center">
        <Text fontSize="$5" fontWeight="700" color="$color">
          New Entry
        </Text>
        <Text fontSize="$2" color="$colorSubtle">
          {new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
          })}
        </Text>
      </XStack>

      <Card flex={1} padding="sm">
        <YStack flex={1} gap="$2">
          <Text fontSize="$2" color="$colorSubtle">
            Markdown supported
          </Text>
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
            accessibilityLabel="Journal entry content"
          />
        </YStack>
      </Card>

      <YStack gap="$2">
        <Text fontSize="$3" fontWeight="600" color="$color">
          Visibility
        </Text>
        <XStack gap="$2">
          {VISIBILITY_OPTIONS.map((option) => (
            <Card
              key={option.value}
              flex={1}
              padding="sm"
              pressStyle={{ scale: 0.97 }}
              onPress={() => setVisibility(option.value)}
              backgroundColor={
                visibility === option.value ? '$blue3' : '$background'
              }
              borderColor={
                visibility === option.value ? '$blue8' : '$borderColor'
              }
              accessibilityRole="button"
              accessibilityLabel={`Set visibility to ${option.label}`}
            >
              <YStack gap="$1" alignItems="center">
                <Text
                  fontSize="$2"
                  fontWeight="600"
                  color={visibility === option.value ? '$blue10' : '$color'}
                >
                  {option.label}
                </Text>
                <Text
                  fontSize="$1"
                  color={
                    visibility === option.value ? '$blue8' : '$colorSubtle'
                  }
                  textAlign="center"
                >
                  {option.description}
                </Text>
              </YStack>
            </Card>
          ))}
        </XStack>
      </YStack>

      <Button
        size="lg"
        disabled={content.trim().length === 0}
        accessibilityLabel="Save journal entry"
      >
        Save Entry
      </Button>
    </YStack>
  );
}
