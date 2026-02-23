import React from 'react';
import { Button, Card, Text, XStack, YStack } from '@innera/ui';

export function PartnerScreen() {
  return (
    <YStack flex={1} backgroundColor="$background" padding="$4" gap="$4">
      <Text fontSize="$6" fontWeight="700" color="$color">
        Partner
      </Text>

      <Card padding="lg" alignItems="center" gap="$4">
        <Card
          width={64}
          height={64}
          borderRadius="$12"
          backgroundColor="$pink3"
          alignItems="center"
          justifyContent="center"
        >
          <Text fontSize="$7">
          </Text>
        </Card>
        <YStack alignItems="center" gap="$1">
          <Text fontSize="$4" fontWeight="600" color="$color">
            No partner connected
          </Text>
          <Text fontSize="$3" color="$colorSubtle" textAlign="center">
            Connect with your partner to share journal entries and grow together
          </Text>
        </YStack>
        <Button size="md" accessibilityLabel="Invite partner">
          Invite Partner
        </Button>
      </Card>

      <YStack gap="$2">
        <Text fontSize="$4" fontWeight="600" color="$color">
          Shared Entries
        </Text>
        <Card padding="md">
          <Text fontSize="$3" color="$colorSubtle" textAlign="center">
            Shared entries will appear here once you connect with a partner
          </Text>
        </Card>
      </YStack>

      <YStack gap="$2">
        <Text fontSize="$4" fontWeight="600" color="$color">
          Partner Activity
        </Text>
        <Card padding="md">
          <XStack gap="$3" alignItems="center">
            <Card
              width={40}
              height={40}
              borderRadius="$8"
              backgroundColor="$purple3"
              alignItems="center"
              justifyContent="center"
            >
              <Text fontSize="$5">
              </Text>
            </Card>
            <YStack flex={1} gap="$1">
              <Text fontSize="$3" color="$colorSubtle">
                No recent activity
              </Text>
              <Text fontSize="$2" color="$colorSubtle">
                Partner activity will show up here
              </Text>
            </YStack>
          </XStack>
        </Card>
      </YStack>
    </YStack>
  );
}
