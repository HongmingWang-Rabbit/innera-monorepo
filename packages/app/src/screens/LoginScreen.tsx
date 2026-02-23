import React from 'react';
import { Button, Card, Separator, Text, XStack, YStack } from '@innera/ui';

export function LoginScreen() {
  return (
    <YStack
      flex={1}
      backgroundColor="$background"
      padding="$6"
      justifyContent="center"
      gap="$6"
    >
      <YStack alignItems="center" gap="$3">
        <Card
          width={80}
          height={80}
          borderRadius="$6"
          backgroundColor="$blue10"
          alignItems="center"
          justifyContent="center"
        >
          <Text fontSize="$8" fontWeight="800" color="white">
            I
          </Text>
        </Card>
        <YStack alignItems="center" gap="$1">
          <Text fontSize="$8" fontWeight="800" color="$color" letterSpacing={-1}>
            innera
          </Text>
          <Text fontSize="$3" color="$colorSubtle" textAlign="center">
            Your private space for growth and connection
          </Text>
        </YStack>
      </YStack>

      <YStack gap="$3">
        <Button
          size="lg"
          variant="secondary"
          accessibilityLabel="Sign in with Google"
        >
          Sign in with Google
        </Button>

        <Button
          size="lg"
          accessibilityLabel="Sign in with Apple"
        >
          Sign in with Apple
        </Button>

        <XStack alignItems="center" gap="$3" marginVertical="$2">
          <Separator flex={1} />
          <Text fontSize="$2" color="$colorSubtle">
            or
          </Text>
          <Separator flex={1} />
        </XStack>

        <Button
          size="lg"
          variant="secondary"
          accessibilityLabel="Continue as guest"
        >
          Continue as Guest
        </Button>
      </YStack>

      <YStack alignItems="center" gap="$2">
        <Text fontSize="$2" color="$colorSubtle" textAlign="center">
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </Text>
        <Text fontSize="$2" color="$colorSubtle" textAlign="center">
          Your data is end-to-end encrypted.
        </Text>
      </YStack>
    </YStack>
  );
}
