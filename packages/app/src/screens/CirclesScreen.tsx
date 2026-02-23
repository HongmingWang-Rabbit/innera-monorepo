import React from 'react';
import { Button, Card, Text, XStack, YStack } from '@innera/ui';

type CirclePlaceholder = {
  id: string;
  name: string;
  memberCount: number;
  color: string;
};

const PLACEHOLDER_CIRCLES: CirclePlaceholder[] = [
  { id: '1', name: 'Close Friends', memberCount: 4, color: '$blue3' },
  { id: '2', name: 'Family', memberCount: 6, color: '$green3' },
  { id: '3', name: 'Mindfulness Group', memberCount: 8, color: '$purple3' },
];

export function CirclesScreen() {
  return (
    <YStack flex={1} backgroundColor="$background" padding="$4" gap="$4">
      <XStack justifyContent="space-between" alignItems="center">
        <Text fontSize="$6" fontWeight="700" color="$color">
          Circles
        </Text>
        <Button size="sm" accessibilityLabel="Create new circle">
          + New Circle
        </Button>
      </XStack>

      <YStack gap="$3">
        {PLACEHOLDER_CIRCLES.map((circle) => (
          <Card
            key={circle.id}
            padding="md"
            pressStyle={{ scale: 0.98 }}
            accessibilityRole="button"
            accessibilityLabel={`View ${circle.name} circle`}
          >
            <XStack alignItems="center" gap="$3">
              <Card
                width={48}
                height={48}
                borderRadius="$8"
                backgroundColor={circle.color}
                alignItems="center"
                justifyContent="center"
              >
                <Text fontSize="$5">
                </Text>
              </Card>
              <YStack flex={1} gap="$1">
                <Text fontSize="$4" fontWeight="600" color="$color">
                  {circle.name}
                </Text>
                <Text fontSize="$2" color="$colorSubtle">
                  {circle.memberCount} members
                </Text>
              </YStack>
              <Text fontSize="$4" color="$colorSubtle">
                {'>'}
              </Text>
            </XStack>
          </Card>
        ))}
      </YStack>

      <Card padding="lg" alignItems="center" gap="$3" marginTop="$2">
        <Text fontSize="$4" fontWeight="600" color="$color">
          Create a Circle
        </Text>
        <Text fontSize="$3" color="$colorSubtle" textAlign="center">
          Circles let you share journal entries with trusted groups of people
        </Text>
        <Button size="md" variant="secondary" accessibilityLabel="Get started creating a circle">
          Get Started
        </Button>
      </Card>
    </YStack>
  );
}
