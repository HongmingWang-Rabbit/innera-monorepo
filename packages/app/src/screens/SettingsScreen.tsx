import React, { useState } from 'react';
import { Button, Card, Separator, Text, XStack, YStack } from '@innera/ui';

type Theme = 'light' | 'dark' | 'system';

const THEME_OPTIONS: { value: Theme; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
];

function SectionHeader({ title }: { title: string }) {
  return (
    <Text fontSize="$3" fontWeight="600" color="$colorSubtle" paddingTop="$2">
      {title.toUpperCase()}
    </Text>
  );
}

function SettingsRow({
  label,
  description,
  action,
}: {
  label: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <XStack
      justifyContent="space-between"
      alignItems="center"
      paddingVertical="$3"
    >
      <YStack flex={1} gap="$1" marginRight="$3">
        <Text fontSize="$3" color="$color">
          {label}
        </Text>
        {description && (
          <Text fontSize="$2" color="$colorSubtle">
            {description}
          </Text>
        )}
      </YStack>
      {action}
    </XStack>
  );
}

export function SettingsScreen() {
  const [theme, setTheme] = useState<Theme>('system');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [partnerNotifications, setPartnerNotifications] = useState(true);

  return (
    <YStack flex={1} backgroundColor="$background" padding="$4" gap="$4">
      <Text fontSize="$6" fontWeight="700" color="$color">
        Settings
      </Text>

      <YStack gap="$2">
        <SectionHeader title="Appearance" />
        <Card padding="sm">
          <YStack gap="$1">
            <Text fontSize="$3" color="$color" marginBottom="$2">
              Theme
            </Text>
            <XStack gap="$2">
              {THEME_OPTIONS.map((option) => (
                <Button
                  key={option.value}
                  flex={1}
                  size="sm"
                  onPress={() => setTheme(option.value)}
                  backgroundColor={
                    theme === option.value ? '$blue10' : '$background'
                  }
                  borderWidth={1}
                  borderColor={
                    theme === option.value ? '$blue10' : '$borderColor'
                  }
                  accessibilityLabel={`Set theme to ${option.label}`}
                >
                  {option.label}
                </Button>
              ))}
            </XStack>
          </YStack>
        </Card>
      </YStack>

      <YStack gap="$2">
        <SectionHeader title="Notifications" />
        <Card padding="sm">
          <YStack>
            <SettingsRow
              label="Push Notifications"
              description="Receive notifications on this device"
              action={
                <Button
                  size="sm"
                  onPress={() => setNotificationsEnabled((v) => !v)}
                  backgroundColor={
                    notificationsEnabled ? '$green10' : '$colorSubtle'
                  }
                  accessibilityLabel={`Push notifications ${notificationsEnabled ? 'enabled' : 'disabled'}`}
                >
                  {notificationsEnabled ? 'On' : 'Off'}
                </Button>
              }
            />
            <Separator />
            <SettingsRow
              label="Partner Activity"
              description="Notify when partner shares an entry"
              action={
                <Button
                  size="sm"
                  onPress={() => setPartnerNotifications((v) => !v)}
                  backgroundColor={
                    partnerNotifications ? '$green10' : '$colorSubtle'
                  }
                  accessibilityLabel={`Partner notifications ${partnerNotifications ? 'enabled' : 'disabled'}`}
                >
                  {partnerNotifications ? 'On' : 'Off'}
                </Button>
              }
            />
          </YStack>
        </Card>
      </YStack>

      <YStack gap="$2">
        <SectionHeader title="Account" />
        <Card padding="sm">
          <YStack>
            <SettingsRow
              label="Linked Accounts"
              description="Google, Apple"
              action={
                <Button size="sm" variant="secondary" accessibilityLabel="Manage linked accounts">
                  Manage
                </Button>
              }
            />
            <Separator />
            <SettingsRow
              label="Change Password"
              action={
                <Button size="sm" variant="secondary" accessibilityLabel="Update password">
                  Update
                </Button>
              }
            />
            <Separator />
            <SettingsRow
              label="Delete Account"
              description="Permanently delete your account and data"
              action={
                <Button
                  size="sm"
                  variant="danger"
                  accessibilityLabel="Delete account"
                >
                  Delete
                </Button>
              }
            />
          </YStack>
        </Card>
      </YStack>

      <YStack gap="$2">
        <SectionHeader title="Data" />
        <Card padding="sm">
          <YStack>
            <SettingsRow
              label="Export Entries"
              description="Download your entries as a JSON file"
              action={
                <Button size="sm" variant="secondary" accessibilityLabel="Export entries">
                  Export
                </Button>
              }
            />
            <Separator />
            <SettingsRow
              label="Import Entries"
              description="Import entries from a JSON file"
              action={
                <Button size="sm" variant="secondary" accessibilityLabel="Import entries">
                  Import
                </Button>
              }
            />
          </YStack>
        </Card>
      </YStack>

      <YStack alignItems="center" paddingVertical="$2">
        <Text fontSize="$2" color="$colorSubtle">
          innera v0.0.1
        </Text>
      </YStack>
    </YStack>
  );
}
