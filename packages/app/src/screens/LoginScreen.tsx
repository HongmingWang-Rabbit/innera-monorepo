'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Linking } from 'react-native';
import { Button, Separator, Text, XStack, YStack, View } from '@innera/ui';
import { ScreenContainer } from '../components';
import { useAuth } from '../auth/use-auth';
import { useRouter, Routes } from '../navigation';

export function LoginScreen() {
  const { status, continueAsGuest } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  // If already authenticated, redirect to Home
  useEffect(() => {
    if (status === 'authenticated') {
      router.replace(Routes.Home);
    }
  }, [status, router]);

  const handleGoogleLogin = useCallback(() => {
    setError('Google Sign-In is not yet configured. Please use Guest mode for now.');
  }, []);

  const handleAppleLogin = useCallback(() => {
    setError('Apple Sign-In is not yet configured. Please use Guest mode for now.');
  }, []);

  const handleGuestMode = useCallback(() => {
    continueAsGuest();
    router.replace(Routes.Home);
  }, [continueAsGuest, router]);

  return (
    <ScreenContainer edges={['top', 'bottom']} scrollable={false}>
      <YStack flex={1} justifyContent="center" gap="$6">
        <YStack alignItems="center" gap="$3">
          <View
            width={80}
            height={80}
            borderRadius="$6"
            backgroundColor="$primary"
            alignItems="center"
            justifyContent="center"
            accessibilityRole="image"
            accessibilityLabel="Innera logo"
          >
            <Text variant="heading" color="$background">
              I
            </Text>
          </View>
          <YStack alignItems="center" gap="$1">
            <Text variant="heading">innera</Text>
            <Text variant="caption" textAlign="center">
              Your private space for growth and connection
            </Text>
          </YStack>
        </YStack>

        <YStack gap="$3">
          <Button
            size="lg"
            fullWidth
            variant="secondary"
            accessibilityLabel="Sign in with Google"
            onPress={handleGoogleLogin}
          >
            Sign in with Google
          </Button>

          <Button
            size="lg"
            fullWidth
            accessibilityLabel="Sign in with Apple"
            onPress={handleAppleLogin}
          >
            Sign in with Apple
          </Button>

          {error && (
            <Text fontSize="$2" color="$danger" textAlign="center">
              {error}
            </Text>
          )}

          <XStack alignItems="center" gap="$3" marginVertical="$2">
            <Separator flex={1} />
            <Text variant="caption">or</Text>
            <Separator flex={1} />
          </XStack>

          <Button
            size="lg"
            fullWidth
            variant="secondary"
            accessibilityLabel="Continue as guest"
            onPress={handleGuestMode}
          >
            Continue as Guest
          </Button>
        </YStack>

        <YStack alignItems="center" gap="$2">
          <XStack flexWrap="wrap" justifyContent="center" gap="$1">
            <Text variant="caption">By continuing, you agree to our</Text>
            <Text
              fontSize="$2"
              color="$primary"
              textDecorationLine="underline"
              role="link"
              onPress={() => void Linking.openURL('https://innera.app/terms')}
              accessibilityLabel="Terms of Service"
            >
              Terms of Service
            </Text>
            <Text variant="caption">and</Text>
            <Text
              fontSize="$2"
              color="$primary"
              textDecorationLine="underline"
              role="link"
              onPress={() => void Linking.openURL('https://innera.app/privacy')}
              accessibilityLabel="Privacy Policy"
            >
              Privacy Policy
            </Text>
          </XStack>
          <Text variant="caption" textAlign="center">
            Your data is end-to-end encrypted.
          </Text>
        </YStack>
      </YStack>
    </ScreenContainer>
  );
}
