'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { RefreshControl } from 'react-native';
import { Button, Card, EmptyState, IconBadge, Input, Spinner, Text, XStack, YStack } from '@innera/ui';
import { Users, ChevronRight, PlusCircle, X } from '@tamagui/lucide-icons';
import { ScreenContainer } from '../components';
import { palette } from '../constants';
import { useRouter } from '../navigation';
import { useCircles, useCreateCircle } from '../hooks/use-circles';

const CIRCLE_COLORS = [
  { bg: '$blue3', icon: palette.blue500 },
  { bg: '$green3', icon: palette.green500 },
  { bg: '$purple3', icon: palette.purple500 },
  { bg: '$pink3', icon: palette.pink500 },
];

export function CirclesScreen() {
  const { data: circles, isLoading, isError, isRefetching, refetch } = useCircles();
  const createCircle = useCreateCircle();
  const router = useRouter();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Stable refs for mutation and state values to avoid re-creating callbacks on every render
  const createCircleRef = useRef(createCircle.mutateAsync);
  const newNameRef = useRef(newName);
  const newDescriptionRef = useRef(newDescription);
  useEffect(() => {
    createCircleRef.current = createCircle.mutateAsync;
    newNameRef.current = newName;
    newDescriptionRef.current = newDescription;
  });

  const handleCreate = useCallback(async () => {
    if (!newNameRef.current.trim()) return;
    setError(null);
    try {
      await createCircleRef.current({ name: newNameRef.current.trim(), description: newDescriptionRef.current.trim() || undefined });
      setShowCreateForm(false);
      setNewName('');
      setNewDescription('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create circle');
    }
  }, []);

  return (
    <ScreenContainer
      edges={['top']}
      scrollable
      refreshControl={
        <RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} />
      }
    >
      <XStack justifyContent="space-between" alignItems="center">
        <Text fontSize="$6" fontWeight="700" color="$color">
          Circles
        </Text>
        <Button
          size="sm"
          accessibilityLabel={showCreateForm ? 'Cancel creating circle' : 'Create new circle'}
          onPress={() => {
            setShowCreateForm((v) => {
              if (v) {
                // Clearing form state when closing the create form
                setNewName('');
                setNewDescription('');
                setError(null);
              }
              return !v;
            });
          }}
        >
          <XStack alignItems="center" gap="$1">
            {showCreateForm ? (
              <X size={14} color="$primaryColor" />
            ) : (
              <PlusCircle size={14} color="$primaryColor" />
            )}
            <Text fontSize="$3" fontWeight="600" color="$primaryColor">
              {showCreateForm ? 'Cancel' : 'New'}
            </Text>
          </XStack>
        </Button>
      </XStack>

      {showCreateForm && (
        <Card padding="md">
          <YStack gap="$3">
            <Text fontSize="$4" fontWeight="600" color="$color">Create Circle</Text>
            <Input
              placeholder="Circle name"
              value={newName}
              onChangeText={setNewName}
              aria-label="Circle name"
              maxLength={100}
            />
            <Input
              placeholder="Description (optional)"
              value={newDescription}
              onChangeText={setNewDescription}
              aria-label="Circle description"
              maxLength={500}
            />
            {error && <Text fontSize="$2" color="$danger">{error}</Text>}
            <Button
              size="md"
              fullWidth
              disabled={!newName.trim() || createCircle.isPending}
              loading={createCircle.isPending}
              onPress={handleCreate}
            >
              Create Circle
            </Button>
          </YStack>
        </Card>
      )}

      {isLoading && (
        <YStack alignItems="center" padding="$6">
          <Spinner size="large" />
        </YStack>
      )}

      {isError && (
        <Card padding="md">
          <YStack gap="$2" alignItems="center">
            <Text fontSize="$3" color="$danger">Failed to load circles</Text>
            <Button size="sm" variant="secondary" onPress={() => void refetch()}>Retry</Button>
          </YStack>
        </Card>
      )}

      {!isLoading && !isError && circles && circles.length > 0 && (
        <YStack gap="$3">
          {circles.map((circle) => {
            const colorIndex = circle.id.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
            const colors = CIRCLE_COLORS[colorIndex % CIRCLE_COLORS.length]!;
            return (
              <Card
                key={circle.id}
                padding="md"
                pressable
                accessibilityRole="button"
                accessibilityLabel={`View ${circle.name} circle`}
                onPress={() => router.push(`/circles/${circle.id}`)}
              >
                <XStack alignItems="center" gap="$3">
                  <IconBadge
                    icon={<Users size={20} color={colors.icon} />}
                    size={48}
                    backgroundColor={colors.bg}
                  />
                  <YStack flex={1} gap="$1">
                    <Text fontSize="$4" fontWeight="600" color="$color">
                      {circle.name}
                    </Text>
                    <Text fontSize="$2" color="$colorSubtle">
                      {circle.memberCount} member{circle.memberCount !== 1 ? 's' : ''}
                    </Text>
                  </YStack>
                  <ChevronRight size={20} color="$colorSubtle" />
                </XStack>
              </Card>
            );
          })}
        </YStack>
      )}

      {!isLoading && !isError && (!circles || circles.length === 0) && !showCreateForm && (
        <EmptyState
          icon={<Users size={36} color="$colorSubtle" />}
          title="Create a Circle"
          description="Circles let you share journal entries with trusted groups of people"
          action={
            <Button
              size="md"
              variant="secondary"
              accessibilityLabel="Get started creating a circle"
              onPress={() => setShowCreateForm(true)}
            >
              Get Started
            </Button>
          }
        />
      )}
    </ScreenContainer>
  );
}
