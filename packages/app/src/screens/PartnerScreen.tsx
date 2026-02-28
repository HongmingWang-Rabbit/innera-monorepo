'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Platform } from 'react-native';
import { Button, Card, EmptyState, IconBadge, Input, Spinner, Text, View, XStack, YStack } from '@innera/ui';
import { Heart, UserPlus } from '@tamagui/lucide-icons';
import { ScreenContainer } from '../components';
import { palette } from '../constants';
import {
  usePartner,
  useCreateInvite,
  useAcceptInvite,
  useRespondToPartner,
  useDisconnectPartner,
  type PartnerLinkWithPartner,
} from '../hooks/use-partner';

export function PartnerScreen() {
  const { data: partnerLink, isLoading, isError, refetch } = usePartner();

  if (isLoading) {
    return (
      <ScreenContainer edges={['top']} scrollable>
        <Text fontSize="$6" fontWeight="700" color="$color">Partner</Text>
        <YStack alignItems="center" padding="$6">
          <Spinner size="large" />
        </YStack>
      </ScreenContainer>
    );
  }

  if (isError) {
    return (
      <ScreenContainer edges={['bottom']} scrollable>
        <EmptyState
          title="Something went wrong"
          description="Could not load partner information. Please try again."
          action={<Button size="md" variant="secondary" onPress={() => refetch()}>Retry</Button>}
        />
      </ScreenContainer>
    );
  }

  if (!partnerLink) return <NoPartnerState />;
  if (partnerLink.status === 'PENDING') return <PendingState partnerLink={partnerLink} />;
  return <ActivePartnerState partnerLink={partnerLink} />;
}

function NoPartnerState() {
  const createInvite = useCreateInvite();
  const acceptInvite = useAcceptInvite();
  const [inviteCode, setInviteCode] = useState('');
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Stable refs for mutation functions and state to avoid re-creating callbacks on every render
  const createInviteRef = useRef(createInvite.mutateAsync);
  const acceptInviteRef = useRef(acceptInvite.mutateAsync);
  const inviteCodeRef = useRef(inviteCode);
  useEffect(() => {
    createInviteRef.current = createInvite.mutateAsync;
    acceptInviteRef.current = acceptInvite.mutateAsync;
    inviteCodeRef.current = inviteCode;
  });

  const handleGenerateInvite = useCallback(async () => {
    setError(null);
    try {
      const result = await createInviteRef.current();
      setGeneratedCode(result.inviteCode);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate invite');
    }
  }, []);

  const handleAcceptInvite = useCallback(async () => {
    if (!inviteCodeRef.current.trim()) return;
    setError(null);
    try {
      await acceptInviteRef.current(inviteCodeRef.current.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to accept invite');
    }
  }, []);

  return (
    <ScreenContainer edges={['top']} scrollable>
      <Text fontSize="$6" fontWeight="700" color="$color">Partner</Text>

      <EmptyState
        icon={<Heart size={40} color={palette.pink500} />}
        title="Connect with your partner"
        description="Share journal entries with someone special. Send an invite or enter a code to connect."
      />

      <YStack gap="$3">
        <Card padding="md">
          <YStack gap="$3">
            <Text fontSize="$4" fontWeight="600" color="$color">
              Send an Invite
            </Text>
            {generatedCode ? (
              <YStack gap="$2">
                <Text fontSize="$2" color="$colorSubtle">
                  Share this code with your partner:
                </Text>
                <Card padding="sm" backgroundColor="$surface2">
                  <XStack alignItems="center" justifyContent="center" gap="$2">
                    <Text fontSize="$4" fontWeight="700" color="$primary" fontFamily="$mono">
                      {generatedCode}
                    </Text>
                  </XStack>
                </Card>
                <Text fontSize="$1" color="$colorSubtle" textAlign="center">
                  This code expires in 24 hours
                </Text>
              </YStack>
            ) : (
              <Button
                size="md"
                fullWidth
                onPress={handleGenerateInvite}
                loading={createInvite.isPending}
              >
                <XStack alignItems="center" gap="$2">
                  <UserPlus size={16} color="$primaryColor" />
                  <Text fontSize="$3" fontWeight="600" color="$primaryColor">
                    Generate Invite Code
                  </Text>
                </XStack>
              </Button>
            )}
          </YStack>
        </Card>

        <Card padding="md">
          <YStack gap="$3">
            <Text fontSize="$4" fontWeight="600" color="$color">
              Enter a Code
            </Text>
            <Input
              placeholder="Paste invite code here"
              value={inviteCode}
              onChangeText={setInviteCode}
              aria-label="Partner invite code"
            />
            <Button
              size="md"
              fullWidth
              variant="secondary"
              disabled={!inviteCode.trim() || acceptInvite.isPending}
              loading={acceptInvite.isPending}
              onPress={handleAcceptInvite}
            >
              Accept Invite
            </Button>
          </YStack>
        </Card>

        {error && (
          <Text fontSize="$2" color="$danger" textAlign="center">
            {error}
          </Text>
        )}
      </YStack>
    </ScreenContainer>
  );
}

function PendingState({ partnerLink }: { partnerLink: Pick<PartnerLinkWithPartner, 'role' | 'partner'> }) {
  const respond = useRespondToPartner();
  const [error, setError] = useState<string | null>(null);
  const [respondAction, setRespondAction] = useState<'accept' | 'decline' | null>(null);

  // Stable ref for mutation function to avoid re-creating callback on every render
  const respondRef = useRef(respond.mutateAsync);
  useEffect(() => { respondRef.current = respond.mutateAsync; });

  const handleRespond = useCallback(async (accept: boolean) => {
    setError(null);
    setRespondAction(accept ? 'accept' : 'decline');
    try {
      await respondRef.current(accept);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to respond');
    }
  }, []);

  const isReceiver = partnerLink.role === 'partner';

  return (
    <ScreenContainer edges={['top']} scrollable>
      <Text fontSize="$6" fontWeight="700" color="$color">Partner</Text>

      <Card padding="md">
        <YStack gap="$3" alignItems="center">
          <IconBadge
            icon={<Heart size={28} color={palette.pink500} />}
            size={64}
            backgroundColor="$pink3"
          />
          {isReceiver ? (
            <>
              <Text fontSize="$4" fontWeight="600" color="$color">
                Partner Request
              </Text>
              <Text fontSize="$3" color="$colorSubtle" textAlign="center">
                {partnerLink.partner?.displayName ?? 'Someone'} wants to connect with you as a partner
              </Text>
              <XStack gap="$3" width="100%">
                <Button
                  flex={1}
                  variant="secondary"
                  onPress={() => handleRespond(false)}
                  loading={respond.isPending && respondAction === 'decline'}
                  disabled={respond.isPending}
                >
                  Decline
                </Button>
                <Button
                  flex={1}
                  onPress={() => handleRespond(true)}
                  loading={respond.isPending && respondAction === 'accept'}
                  disabled={respond.isPending}
                >
                  Accept
                </Button>
              </XStack>
            </>
          ) : (
            <>
              <Text fontSize="$4" fontWeight="600" color="$color">
                Waiting for response
              </Text>
              <Text fontSize="$3" color="$colorSubtle" textAlign="center">
                Your partner invite is pending. They'll need to accept your code to connect.
              </Text>
            </>
          )}
          {error && <Text fontSize="$2" color="$danger">{error}</Text>}
        </YStack>
      </Card>
    </ScreenContainer>
  );
}

function ActivePartnerState({ partnerLink }: { partnerLink: Pick<PartnerLinkWithPartner, 'partner' | 'initiatedAt'> }) {
  const disconnect = useDisconnectPartner();
  const [error, setError] = useState<string | null>(null);

  // Stable ref for mutation function to avoid re-creating callback on every render
  const disconnectRef = useRef(disconnect.mutateAsync);
  useEffect(() => { disconnectRef.current = disconnect.mutateAsync; });

  const handleDisconnect = useCallback(() => {
    const doDisconnect = async () => {
      setError(null);
      try {
        await disconnectRef.current();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to disconnect');
      }
    };

    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm('Are you sure you want to disconnect from your partner?')) {
        void doDisconnect();
      }
    } else {
      Alert.alert(
        'Disconnect Partner',
        'Are you sure? This will end your partner connection.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Disconnect', style: 'destructive', onPress: () => void doDisconnect() },
        ],
      );
    }
  }, []);

  const connectedDate = new Date(partnerLink.initiatedAt).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <ScreenContainer edges={['top']} scrollable>
      <Text fontSize="$6" fontWeight="700" color="$color">Partner</Text>

      <Card padding="none">
        <YStack
          backgroundColor="$pink3"
          borderTopLeftRadius="$6"
          borderTopRightRadius="$6"
          height="$1"
        />
        <YStack padding="$4" gap="$3" alignItems="center">
          <IconBadge
            icon={<Heart size={28} color={palette.pink500} />}
            size={64}
            backgroundColor="$pink3"
          />
          <YStack alignItems="center" gap="$1">
            <Text fontSize="$5" fontWeight="700" color="$color">
              {partnerLink.partner?.displayName ?? 'Your Partner'}
            </Text>
            <Text fontSize="$2" color="$colorSubtle">
              Connected since {connectedDate}
            </Text>
          </YStack>
        </YStack>
      </Card>

      <YStack gap="$2">
        <Text fontSize="$4" fontWeight="600" color="$color">
          Shared Entries
        </Text>
        <Text fontSize="$3" color="$colorSubtle">
          Entries shared between you and your partner will appear here.
        </Text>
      </YStack>

      {error && (
        <Text fontSize="$2" color="$danger" textAlign="center">
          {error}
        </Text>
      )}

      <Button
        size="md"
        variant="danger"
        fullWidth
        accessibilityLabel="Disconnect partner"
        onPress={handleDisconnect}
        loading={disconnect.isPending}
      >
        Disconnect
      </Button>
    </ScreenContainer>
  );
}
