'use client';

import React, { useMemo } from 'react';
import { RefreshControl } from 'react-native';
import {
  Button,
  Card,
  EmptyState,
  StatCard,
  Text,
  XStack,
  YStack,
  View,
  Spinner,
} from '@innera/ui';
import { Flame, BookOpen, Users, ChevronRight, PenLine } from '@tamagui/lucide-icons';
import { ScreenContainer } from '../components';
import { useLink, Routes } from '../navigation';
import { palette } from '../constants';
import { useAuth } from '../auth/use-auth';
import { useInfiniteEntries } from '../hooks/use-entries';
import type { EntryResponse } from '@innera/shared';
import { safeDecodeBase64 } from '../utils/crypto';
import { formatRelativeTime, getGreeting } from '../utils/format';
import { VISIBILITY_CONFIG } from '../utils/visibility';

export function HomeScreen() {
  const newEntryLink = useLink({ href: Routes.NewEntry });
  const greeting = getGreeting();
  const { user, isGuest } = useAuth();
  // Fetch a larger initial page so the client-side streak calculation has enough
  // history to be reasonably accurate. See TODO(streak-accuracy) below.
  const { data, isLoading, isError, isRefetching, refetch, hasNextPage, fetchNextPage } = useInfiniteEntries(30);

  const allEntries = useMemo(() => {
    if (!data?.pages) return [];
    return data.pages.flatMap((page) => page.data);
  }, [data]);

  // NOTE: totalEntries only counts entries fetched so far (current page).
  // This is an approximation until a server-side stats API is added.
  const totalEntries = allEntries.length;

  // TODO(streak-accuracy): The streak is computed from only the entries fetched
  // on the first page (currently `limit` items). For users with long streaks this
  // will under-count. Preferred fix: add a GET /api/v1/entries/stats endpoint that
  // returns { currentStreak, longestStreak, totalEntries } computed server-side
  // across the full dataset and use that here instead.
  const streak = useMemo(() => {
    if (allEntries.length === 0) return 0;
    /** Return YYYY-MM-DD in the user's local timezone for consistent comparison. */
    const toLocalDateStr = (d: string | Date) =>
      new Date(d).toLocaleDateString('en-CA');
    const dates = new Set(allEntries.map((e) => toLocalDateStr(e.createdAt)));
    let count = 0;
    const d = new Date();
    while (dates.has(toLocalDateStr(d))) {
      count++;
      d.setDate(d.getDate() - 1);
    }
    return count;
  }, [allEntries]);

  const displayName = user?.displayName ?? 'there';

  return (
    <ScreenContainer
      edges={['top']}
      scrollable
      padded={false}
      refreshControl={
        <RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} />
      }
    >
      <YStack
        backgroundColor="$headerWarm"
        paddingHorizontal="$5"
        paddingTop="$6"
        paddingBottom="$5"
        gap="$2"
      >
        <Text variant="subheading">
          {greeting}, {displayName}
        </Text>
        <Text variant="caption">
          How are you feeling today?
        </Text>
      </YStack>

      <YStack paddingHorizontal="$5" gap="$4">
        <Button
          size="lg"
          fullWidth
          accessibilityLabel="Create new entry"
          {...newEntryLink}
        >
          + Write a new entry
        </Button>

        <XStack gap="$3">
          <StatCard
            value={isLoading ? '--' : streak}
            label="Day streak"
            icon={<Flame size={18} color={palette.amber500} />}
            accentColor="$yellow10"
          />
          <StatCard
            value={isLoading ? '--' : totalEntries}
            label="Entries"
            icon={<BookOpen size={18} color={palette.indigo500} />}
            accentColor="$blue10"
          />
          <StatCard
            value="--"
            label="Circles"
            icon={<Users size={18} color={palette.purple500} />}
            accentColor="$purple10"
          />
        </XStack>

        <YStack gap="$3">
          <Text variant="label">
            Recent Entries
          </Text>

          {isLoading && (
            <YStack alignItems="center" padding="$4">
              <Spinner size="large" />
            </YStack>
          )}

          {isError && (
            <Card padding="md">
              <YStack gap="$2" alignItems="center">
                <Text fontSize="$3" color="$danger">
                  Failed to load entries
                </Text>
                <Button size="sm" variant="secondary" onPress={() => void refetch()}>
                  Retry
                </Button>
              </YStack>
            </Card>
          )}

          {!isLoading && !isError && allEntries.length === 0 && (
            <EmptyState
              icon={<PenLine size={36} color="$colorSubtle" />}
              title="Start journaling"
              description="Your entries will appear here. Tap the button above to write your first entry."
            />
          )}

          {allEntries.map((entry: EntryResponse) => (
            <MemoizedEntryCard key={entry.id} entry={entry} />
          ))}

          {hasNextPage && (
            <Button size="sm" variant="ghost" onPress={() => void fetchNextPage()} accessibilityLabel="Load more entries">
              View more
            </Button>
          )}
        </YStack>
      </YStack>
    </ScreenContainer>
  );
}

function EntryCard({ entry }: { entry: EntryResponse }) {
  const entryLink = useLink({ href: `/entry/${entry.id}` });
  const title = entry.titleEncrypted ? safeDecodeBase64(entry.titleEncrypted, 'Untitled') : 'Untitled';
  const preview = safeDecodeBase64(entry.contentEncrypted).slice(0, 120);

  return (
    <Card
      padding="none"
      pressable
      {...entryLink}
      accessibilityRole="button"
      accessibilityLabel={`View ${title} entry`}
    >
      <XStack>
        <View
          width="$1"
          backgroundColor={VISIBILITY_CONFIG[entry.visibility]?.color ?? palette.indigo500}
          borderTopLeftRadius="$6"
          borderBottomLeftRadius="$6"
        />
        <YStack flex={1} padding="$3" gap="$2">
          <XStack justifyContent="space-between" alignItems="center">
            <Text variant="label">
              {title}
            </Text>
            <XStack alignItems="center" gap="$1">
              <Text variant="caption">
                {VISIBILITY_CONFIG[entry.visibility]?.label ?? entry.visibility}
              </Text>
              <ChevronRight size={14} color="$colorSubtle" />
            </XStack>
          </XStack>
          <Text
            variant="caption"
            numberOfLines={2}
          >
            {preview}
          </Text>
          <Text fontSize="$1" color="$colorSubtle">
            {formatRelativeTime(entry.createdAt)}
          </Text>
        </YStack>
      </XStack>
    </Card>
  );
}

const MemoizedEntryCard = React.memo(EntryCard);
