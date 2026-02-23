import React from 'react';
import { Button, Card, Text, XStack, YStack } from '@innera/ui';
import { useLink } from '../navigation';
import { Routes } from '../navigation';

export function HomeScreen() {
  const newEntryLink = useLink({ href: Routes.NewEntry });

  return (
    <YStack flex={1} backgroundColor="$background" padding="$4" gap="$4">
      <XStack justifyContent="space-between" alignItems="center">
        <YStack>
          <Text fontSize="$6" fontWeight="700" color="$color">
            Good morning
          </Text>
          <Text fontSize="$3" color="$colorSubtle">
            How are you feeling today?
          </Text>
        </YStack>
        <Button size="sm" accessibilityLabel="Create new entry" {...newEntryLink}>
          + New Entry
        </Button>
      </XStack>

      <YStack gap="$3">
        <Text fontSize="$4" fontWeight="600" color="$color">
          Recent Entries
        </Text>

        <Card padding="md">
          <YStack gap="$2">
            <XStack justifyContent="space-between" alignItems="center">
              <Text fontSize="$3" fontWeight="600" color="$color">
                Today
              </Text>
              <Text fontSize="$2" color="$colorSubtle">
                Private
              </Text>
            </XStack>
            <Text fontSize="$3" color="$colorSubtle">
              No entries yet. Tap &quot;New Entry&quot; to get started.
            </Text>
          </YStack>
        </Card>

        <Card padding="md">
          <YStack gap="$2">
            <XStack justifyContent="space-between" alignItems="center">
              <Text fontSize="$3" fontWeight="600" color="$color">
                Yesterday
              </Text>
              <Text fontSize="$2" color="$colorSubtle">
                Partner
              </Text>
            </XStack>
            <Text fontSize="$3" color="$colorSubtle">
              Entry content placeholder...
            </Text>
          </YStack>
        </Card>
      </YStack>

      <YStack gap="$3">
        <Text fontSize="$4" fontWeight="600" color="$color">
          Quick Stats
        </Text>
        <XStack gap="$3">
          <Card flex={1} padding="sm" alignItems="center">
            <Text fontSize="$6" fontWeight="700" color="$blue10">
              7
            </Text>
            <Text fontSize="$2" color="$colorSubtle">
              Day streak
            </Text>
          </Card>
          <Card flex={1} padding="sm" alignItems="center">
            <Text fontSize="$6" fontWeight="700" color="$green10">
              24
            </Text>
            <Text fontSize="$2" color="$colorSubtle">
              Total entries
            </Text>
          </Card>
          <Card flex={1} padding="sm" alignItems="center">
            <Text fontSize="$6" fontWeight="700" color="$purple10">
              3
            </Text>
            <Text fontSize="$2" color="$colorSubtle">
              Circles
            </Text>
          </Card>
        </XStack>
      </YStack>
    </YStack>
  );
}
