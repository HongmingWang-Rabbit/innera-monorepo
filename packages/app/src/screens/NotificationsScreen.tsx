import React from 'react';
import { Card, Text, XStack, YStack } from '@innera/ui';

type NotificationType = 'partner' | 'circle' | 'system';

type NotificationPlaceholder = {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  time: string;
  read: boolean;
};

const PLACEHOLDER_NOTIFICATIONS: NotificationPlaceholder[] = [
  {
    id: '1',
    type: 'partner',
    title: 'Partner shared an entry',
    body: 'Your partner shared a new journal entry with you',
    time: '2m ago',
    read: false,
  },
  {
    id: '2',
    type: 'circle',
    title: 'New entry in Close Friends',
    body: 'Alex posted a new entry in your circle',
    time: '1h ago',
    read: false,
  },
  {
    id: '3',
    type: 'system',
    title: 'Weekly reflection reminder',
    body: "It's Sunday - a great time for a weekly reflection",
    time: '3h ago',
    read: true,
  },
];

const TYPE_ICON: Record<NotificationType, string> = {
  partner: '',
  circle: '',
  system: '',
};

const TYPE_COLOR: Record<NotificationType, string> = {
  partner: '$pink3',
  circle: '$blue3',
  system: '$yellow3',
};

export function NotificationsScreen() {
  return (
    <YStack flex={1} backgroundColor="$background" padding="$4" gap="$4">
      <XStack justifyContent="space-between" alignItems="center">
        <Text fontSize="$6" fontWeight="700" color="$color">
          Notifications
        </Text>
        <Text
          fontSize="$3"
          color="$blue10"
          pressStyle={{ opacity: 0.7 }}
          accessibilityRole="button"
          accessibilityLabel="Mark all notifications as read"
        >
          Mark all read
        </Text>
      </XStack>

      <YStack gap="$2">
        {PLACEHOLDER_NOTIFICATIONS.map((notification) => (
          <Card
            key={notification.id}
            padding="md"
            pressStyle={{ scale: 0.98 }}
            backgroundColor={
              notification.read ? '$background' : '$blue1'
            }
            borderColor={
              notification.read ? '$borderColor' : '$blue6'
            }
            accessibilityRole="button"
            accessibilityLabel={`${notification.read ? 'Read' : 'Unread'} notification: ${notification.title}`}
          >
            <XStack gap="$3" alignItems="flex-start">
              <Card
                width={40}
                height={40}
                borderRadius="$8"
                backgroundColor={TYPE_COLOR[notification.type]}
                alignItems="center"
                justifyContent="center"
                flexShrink={0}
              >
                <Text fontSize="$4">
                  {TYPE_ICON[notification.type]}
                </Text>
              </Card>
              <YStack flex={1} gap="$1">
                <XStack justifyContent="space-between" alignItems="center">
                  <Text
                    fontSize="$3"
                    fontWeight={notification.read ? '400' : '600'}
                    color="$color"
                    flex={1}
                    marginRight="$2"
                  >
                    {notification.title}
                  </Text>
                  <Text fontSize="$2" color="$colorSubtle" flexShrink={0}>
                    {notification.time}
                  </Text>
                </XStack>
                <Text fontSize="$2" color="$colorSubtle">
                  {notification.body}
                </Text>
              </YStack>
              {!notification.read && (
                <Card
                  width={8}
                  height={8}
                  borderRadius="$12"
                  backgroundColor="$blue10"
                  flexShrink={0}
                  marginTop="$1"
                />
              )}
            </XStack>
          </Card>
        ))}
      </YStack>

      <Card padding="md" alignItems="center">
        <Text fontSize="$3" color="$colorSubtle">
          You&apos;re all caught up
        </Text>
      </Card>
    </YStack>
  );
}
