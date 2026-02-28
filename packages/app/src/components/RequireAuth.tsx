'use client';

import React from 'react';
import { Button, Card, EmptyState, IconBadge, Spinner, YStack } from '@innera/ui';
import { Lock } from '@tamagui/lucide-icons';
import { useAuth } from '../auth/use-auth';
import { useRouter, Routes } from '../navigation';
import { palette } from '../constants';

/**
 * Wraps screens that require authentication (circles, partners, notifications).
 * Shows a sign-in prompt for unauthenticated and guest users.
 * Shows a loading spinner while auth status is being determined.
 */
export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { status, isGuest } = useAuth();
  const router = useRouter();

  if (status === 'loading') {
    return (
      <YStack flex={1} alignItems="center" justifyContent="center" padding="$6">
        <Spinner size="large" />
      </YStack>
    );
  }

  if (status === 'unauthenticated' || isGuest) {
    return (
      <YStack flex={1} alignItems="center" justifyContent="center" padding="$6">
        <Card padding="lg" maxWidth={400} width="100%">
          <EmptyState
            icon={
              <IconBadge
                icon={<Lock size={28} color={palette.indigo500} />}
                size={64}
                backgroundColor="$blue3"
              />
            }
            title={isGuest ? 'Sign in to unlock' : 'Welcome to Innera'}
            description={
              isGuest
                ? 'This feature requires an account. Sign in to access Circles, Partners, and more.'
                : 'Sign in to access all features including Circles, Partners, and Notifications.'
            }
            action={
              <Button
                size="lg"
                fullWidth
                onPress={() => router.replace(Routes.Login)}
                accessibilityLabel="Go to sign in"
              >
                Sign In
              </Button>
            }
          />
        </Card>
      </YStack>
    );
  }

  return <>{children}</>;
}
