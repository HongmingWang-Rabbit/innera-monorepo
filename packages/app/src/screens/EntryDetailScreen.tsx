import React from 'react';
import { Button, Card, Text, XStack, YStack } from '@innera/ui';
import { useParams } from '../navigation';

export function EntryDetailScreen() {
  const params = useParams<{ id: string }>();
  const id = params?.id;

  return (
    <YStack flex={1} backgroundColor="$background" padding="$4" gap="$4">
      <XStack justifyContent="space-between" alignItems="center">
        <YStack>
          <Text fontSize="$5" fontWeight="700" color="$color">
            Entry
          </Text>
          <Text fontSize="$2" color="$colorSubtle">
            ID: {id ?? 'unknown'}
          </Text>
        </YStack>
        <Button size="sm" variant="secondary" accessibilityLabel="Edit entry">
          Edit
        </Button>
      </XStack>

      <Card padding="md">
        <YStack gap="$3">
          <XStack justifyContent="space-between" alignItems="center">
            <Text fontSize="$3" fontWeight="600" color="$color">
              Visibility
            </Text>
            <Card
              padding="none"
              paddingVertical="$2"
              paddingHorizontal="$3"
              backgroundColor="$blue3"
              borderRadius="$4"
            >
              <Text fontSize="$2" color="$blue10">
                Private
              </Text>
            </Card>
          </XStack>

          <YStack gap="$1">
            <Text fontSize="$2" color="$colorSubtle">
              Created
            </Text>
            <Text fontSize="$3" color="$color">
              Placeholder date
            </Text>
          </YStack>
        </YStack>
      </Card>

      <Card flex={1} padding="md">
        <YStack gap="$3" flex={1}>
          <XStack alignItems="center" gap="$2">
            <Text fontSize="$3" fontWeight="600" color="$color">
              Content
            </Text>
            <Card
              padding="none"
              paddingVertical="$1"
              paddingHorizontal="$2"
              backgroundColor="$yellow3"
              borderRadius="$3"
            >
              <Text fontSize="$1" color="$yellow10">
                Encrypted
              </Text>
            </Card>
          </XStack>
          <Text fontSize="$3" color="$colorSubtle" lineHeight="$5">
            Entry content will be displayed here after decryption. This is a
            placeholder for the encrypted journal entry content that supports
            full Markdown rendering.
          </Text>
        </YStack>
      </Card>

      <XStack gap="$3">
        <Button flex={1} variant="danger" accessibilityLabel="Delete entry">
          Delete
        </Button>
        <Button flex={1} accessibilityLabel="Share entry">
          Share
        </Button>
      </XStack>
    </YStack>
  );
}
