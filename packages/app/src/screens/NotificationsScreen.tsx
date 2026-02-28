'use client';

import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { RefreshControl } from 'react-native';
import { Button, Card, EmptyState, IconBadge, Spinner, Text, View, XStack, YStack } from '@innera/ui';
import { Heart, MessageCircle, Bell, Inbox } from '@tamagui/lucide-icons';
import { ScreenContainer } from '../components';
import { palette } from '../constants';
import { useRouter, Routes } from '../navigation';
import { useNotifications, useMarkRead, useMarkAllRead } from '../hooks/use-notifications';
import { formatRelativeTime, isToday } from '../utils/format';
import type { NotificationType } from '@innera/shared';

const TYPE_CONFIG: Partial<Record<NotificationType, { color: string; bg: string }>> = {
  PARTNER_REQUEST: { color: palette.pink500, bg: '$pink3' },
  PARTNER_ACCEPTED: { color: palette.pink500, bg: '$pink3' },
  PARTNER_REVOKED: { color: palette.pink500, bg: '$pink3' },
  CIRCLE_INVITED: { color: palette.blue500, bg: '$blue3' },
  CIRCLE_JOIN_REQUEST: { color: palette.blue500, bg: '$blue3' },
  CIRCLE_APPROVED: { color: palette.blue500, bg: '$blue3' },
  CIRCLE_REJECTED: { color: palette.blue500, bg: '$blue3' },
  CIRCLE_REMOVED: { color: palette.blue500, bg: '$blue3' },
  COMMENT_ADDED: { color: palette.blue500, bg: '$blue3' },
  REACTION_ADDED: { color: palette.amber500, bg: '$yellow3' },
  ACCOUNT_DELETE_SCHEDULED: { color: palette.amber500, bg: '$yellow3' },
  ACCOUNT_DELETE_CANCELLED: { color: palette.amber500, bg: '$yellow3' },
};

function getTypeIcon(type: string): React.ReactElement {
  const cfg = TYPE_CONFIG[type as NotificationType] ?? { color: palette.amber500 };
  if (type.startsWith('PARTNER_')) return <Heart size={18} color={cfg.color} />;
  if (type.startsWith('CIRCLE_') || type === 'COMMENT_ADDED') return <MessageCircle size={18} color={cfg.color} />;
  return <Bell size={18} color={cfg.color} />;
}

interface NotificationItem {
  id: string;
  type: string;
  title: string | null;
  body: string | null;
  read: boolean;
  createdAt: string;
  data?: Record<string, unknown> | null;
}

export function NotificationsScreen() {
  const { data, isLoading, isError, isRefetching, refetch } = useNotifications();
  const markRead = useMarkRead();
  const markAllRead = useMarkAllRead();
  const router = useRouter();

  // Stable refs for mutation functions to avoid re-creating callbacks on every render
  const markReadRef = useRef(markRead.mutate);
  const markAllReadRef = useRef(markAllRead.mutate);
  useEffect(() => { markReadRef.current = markRead.mutate; });
  useEffect(() => { markAllReadRef.current = markAllRead.mutate; });

  const allNotifications = useMemo(() => {
    if (!data?.pages) return [];
    return data.pages.flatMap((page) => page.data);
  }, [data]);

  const { todayItems, earlierItems, hasUnread } = useMemo(() => {
    const today: NotificationItem[] = [];
    const earlier: NotificationItem[] = [];
    let unread = false;
    for (const n of allNotifications) {
      if (isToday(n.createdAt)) today.push(n);
      else earlier.push(n);
      if (!n.read) unread = true;
    }
    return { todayItems: today, earlierItems: earlier, hasUnread: unread };
  }, [allNotifications]);

  const handleMarkAllRead = useCallback(() => {
    markAllReadRef.current();
  }, []);

  const handleTapNotification = useCallback((notification: NotificationItem) => {
    if (!notification.read) {
      markReadRef.current(notification.id);
    }
    // Navigate based on notification type
    const type = notification.type as NotificationType;
    if (type === 'PARTNER_REQUEST' || type === 'PARTNER_ACCEPTED' || type === 'PARTNER_REVOKED') {
      router.push(Routes.Partner);
    } else if (type === 'COMMENT_ADDED' || type === 'REACTION_ADDED') {
      const entryId = notification.data?.entryId;
      if (typeof entryId === 'string') {
        router.push(`/entry/${entryId}`);
      }
    } else if (type === 'CIRCLE_INVITED' || type === 'CIRCLE_APPROVED' || type === 'CIRCLE_JOIN_REQUEST' || type === 'CIRCLE_REJECTED' || type === 'CIRCLE_REMOVED') {
      router.push(Routes.Circles);
    } else if (type === 'ACCOUNT_DELETE_SCHEDULED' || type === 'ACCOUNT_DELETE_CANCELLED') {
      router.push(Routes.Settings);
    }
  }, [router]);

  if (isLoading) {
    return (
      <ScreenContainer edges={['top']} scrollable>
        <Text fontSize="$6" fontWeight="700" color="$color">Notifications</Text>
        <YStack alignItems="center" padding="$6">
          <Spinner size="large" />
        </YStack>
      </ScreenContainer>
    );
  }

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
          Notifications
        </Text>
        {hasUnread && (
          <Button
            variant="ghost"
            size="sm"
            accessibilityLabel="Mark all notifications as read"
            onPress={handleMarkAllRead}
            loading={markAllRead.isPending}
          >
            Mark all read
          </Button>
        )}
      </XStack>

      {isError && (
        <Card padding="md">
          <YStack gap="$2" alignItems="center">
            <Text fontSize="$3" color="$danger">Failed to load notifications</Text>
            <Button size="sm" variant="secondary" onPress={() => void refetch()}>Retry</Button>
          </YStack>
        </Card>
      )}

      {todayItems.length > 0 && (
        <YStack gap="$2">
          <Text
            fontSize="$2" fontWeight="600" color="$colorSubtle"
            textTransform="uppercase" letterSpacing={0.5}
          >
            Today
          </Text>
          {todayItems.map((n) => (
            <MemoizedNotificationCard
              key={n.id}
              notification={n}
              onTap={handleTapNotification}
            />
          ))}
        </YStack>
      )}

      {earlierItems.length > 0 && (
        <YStack gap="$2">
          <Text
            fontSize="$2" fontWeight="600" color="$colorSubtle"
            textTransform="uppercase" letterSpacing={0.5}
          >
            Earlier
          </Text>
          {earlierItems.map((n) => (
            <MemoizedNotificationCard
              key={n.id}
              notification={n}
              onTap={handleTapNotification}
            />
          ))}
        </YStack>
      )}

      {allNotifications.length === 0 && !isError && (
        <EmptyState
          icon={<Inbox size={40} color="$colorSubtle" />}
          title="No notifications yet"
          description="You'll see updates from your partner and circles here"
        />
      )}
    </ScreenContainer>
  );
}

function NotificationCard({
  notification,
  onTap,
}: {
  notification: NotificationItem;
  onTap: (notification: NotificationItem) => void;
}) {
  const cfg = TYPE_CONFIG[notification.type as NotificationType] ?? { bg: '$yellow3' };

  const handlePress = useCallback(() => {
    onTap(notification);
  }, [onTap, notification]);

  return (
    <Card
      padding="md"
      backgroundColor={notification.read ? '$surface1' : '$blue1'}
      borderColor={notification.read ? '$borderColor' : '$blue6'}
      accessibilityLabel={`${notification.read ? 'Read' : 'Unread'} notification: ${notification.title}`}
      pressable
      onPress={handlePress}
    >
      <XStack gap="$3" alignItems="flex-start">
        <IconBadge
          icon={getTypeIcon(notification.type)}
          backgroundColor={cfg.bg}
        />
        <YStack flex={1} gap="$1">
          <XStack justifyContent="space-between" alignItems="center">
            <Text
              fontSize="$3"
              fontWeight={notification.read ? '400' : '600'}
              color="$color"
              flex={1}
              marginRight="$2"
            >
              {notification.title ?? 'Notification'}
            </Text>
            <Text fontSize="$2" color="$colorSubtle" flexShrink={0}>
              {formatRelativeTime(notification.createdAt)}
            </Text>
          </XStack>
          {notification.body && (
            <Text fontSize="$2" color="$colorSubtle">
              {notification.body}
            </Text>
          )}
        </YStack>
        {!notification.read && (
          <View
            width="$2"
            height="$2"
            borderRadius="$2"
            backgroundColor="$primary"
            flexShrink={0}
            marginTop="$1"
          />
        )}
      </XStack>
    </Card>
  );
}

const MemoizedNotificationCard = React.memo(NotificationCard);
