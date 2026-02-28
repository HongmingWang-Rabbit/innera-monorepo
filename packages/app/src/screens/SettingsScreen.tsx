'use client';

import React, { useCallback, useEffect, useRef } from 'react';
import {
  Button,
  Card,
  Separator,
  Spinner,
  Switch,
  Text,
  View,
  XStack,
  YStack,
} from '@innera/ui';
import {
  Palette,
  BellRing,
  UserCircle,
  Database,
  Link,
  KeyRound,
  Trash2,
  Download,
  Upload,
  LogOut,
} from '@tamagui/lucide-icons';
import { APP_VERSION, ThemePreference } from '@innera/shared';
import { ScreenContainer } from '../components';
import { useAuth } from '../auth/use-auth';
import { useRouter, Routes } from '../navigation';
import { useSettings, useUpdateSettings } from '../hooks/use-settings';

const themeValues: ThemePreference[] = ['light', 'dark', 'system'];

const THEME_OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
];

function SectionHeader({
  title,
  icon,
}: {
  title: string;
  icon: React.ReactElement;
}) {
  return (
    <XStack alignItems="center" gap="$2" paddingTop="$2">
      {icon}
      <Text
        fontSize="$3"
        fontWeight="600"
        color="$colorSubtle"
        textTransform="uppercase"
        letterSpacing={0.5}
      >
        {title}
      </Text>
    </XStack>
  );
}

const SettingsRow = React.memo(function SettingsRow({
  label,
  description,
  icon,
  action,
}: {
  label: string;
  description?: string;
  icon?: React.ReactElement;
  action?: React.ReactNode;
}) {
  return (
    <XStack
      justifyContent="space-between"
      alignItems="center"
      paddingVertical="$3"
    >
      <XStack flex={1} gap="$3" alignItems="center" marginRight="$3">
        {icon}
        <YStack flex={1} gap="$1">
          <Text fontSize="$3" color="$color">
            {label}
          </Text>
          {description && (
            <Text fontSize="$2" color="$colorSubtle">
              {description}
            </Text>
          )}
        </YStack>
      </XStack>
      {action}
    </XStack>
  );
});

export function SettingsScreen() {
  const { logout, isGuest } = useAuth();
  const router = useRouter();
  const { data: settings, isLoading } = useSettings();
  const updateSettings = useUpdateSettings();

  // Stable ref for mutation function to avoid re-creating callbacks on every render
  const updateSettingsRef = useRef(updateSettings.mutate);
  useEffect(() => { updateSettingsRef.current = updateSettings.mutate; });

  const rawTheme = settings?.theme;
  const theme: ThemePreference = typeof rawTheme === 'string' && (themeValues as string[]).includes(rawTheme) ? rawTheme as ThemePreference : 'system';

  const handleThemeChange = useCallback((value: ThemePreference) => {
    updateSettingsRef.current({ theme: value });
  }, []);

  const handleToggle = useCallback((key: 'notifyPartner' | 'notifyCircle' | 'notifyComments' | 'notifyReactions', value: boolean) => {
    updateSettingsRef.current({ [key]: value });
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      await logout();
      router.replace(Routes.Login);
    } catch {
      // Logout failed, but still navigate to login for UX
      router.replace(Routes.Login);
    }
  }, [logout, router]);

  if (isLoading && !settings) {
    return (
      <ScreenContainer edges={['top']} scrollable>
        <Text fontSize="$6" fontWeight="700" color="$color">Settings</Text>
        <YStack alignItems="center" padding="$6">
          <Spinner size="large" />
        </YStack>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer edges={['top']} scrollable>
      <Text fontSize="$6" fontWeight="700" color="$color">
        Settings
      </Text>

      {isGuest && (
        <Card padding="md" backgroundColor="$yellow3">
          <YStack gap="$2" alignItems="center">
            <Text fontSize="$3" fontWeight="600" color="$color">
              You're in guest mode
            </Text>
            <Text fontSize="$2" color="$colorSubtle" textAlign="center">
              Sign in to save your data and access all features.
            </Text>
            <Button size="sm" onPress={() => router.replace(Routes.Login)}>
              Sign In
            </Button>
          </YStack>
        </Card>
      )}

      {updateSettings.isError && (
        <Card padding="md" backgroundColor="$red3">
          <YStack gap="$2" alignItems="center">
            <Text fontSize="$3" fontWeight="600" color="$danger">
              Failed to save settings
            </Text>
            <Text fontSize="$2" color="$colorSubtle" textAlign="center">
              {updateSettings.error instanceof Error
                ? updateSettings.error.message
                : 'Your changes could not be saved. Please try again.'}
            </Text>
            <Button
              size="sm"
              variant="secondary"
              onPress={() => updateSettings.reset()}
            >
              Dismiss
            </Button>
          </YStack>
        </Card>
      )}

      <YStack gap="$2">
        <SectionHeader
          title="Appearance"
          icon={<Palette size={16} color="$colorSubtle" />}
        />
        <Card padding="sm">
          <YStack gap="$1">
            <Text fontSize="$3" color="$color" marginBottom="$2">
              Theme
            </Text>
            <View accessibilityRole="radiogroup">
              <XStack gap="$2">
                {THEME_OPTIONS.map((option) => (
                  <Button
                    key={option.value}
                    flex={1}
                    size="sm"
                    variant={theme === option.value ? 'primary' : 'secondary'}
                    onPress={() => handleThemeChange(option.value)}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: theme === option.value }}
                    accessibilityLabel={`Set theme to ${option.label}`}
                  >
                    {option.label}
                  </Button>
                ))}
              </XStack>
            </View>
          </YStack>
        </Card>
      </YStack>

      <YStack gap="$2">
        <SectionHeader
          title="Notifications"
          icon={<BellRing size={16} color="$colorSubtle" />}
        />
        <Card padding="sm">
          <YStack>
            <SettingsRow
              label="Partner Activity"
              description="Notify when partner shares an entry"
              action={
                <Switch
                  size="$3"
                  checked={settings?.notifyPartner ?? true}
                  onCheckedChange={(v) => handleToggle('notifyPartner', v)}
                  aria-label="Partner notifications toggle"
                >
                  <Switch.Thumb />
                </Switch>
              }
            />
            <Separator />
            <SettingsRow
              label="Circle Activity"
              description="Notify on circle entry activity"
              action={
                <Switch
                  size="$3"
                  checked={settings?.notifyCircle ?? true}
                  onCheckedChange={(v) => handleToggle('notifyCircle', v)}
                  aria-label="Circle notifications toggle"
                >
                  <Switch.Thumb />
                </Switch>
              }
            />
            <Separator />
            <SettingsRow
              label="Comments"
              description="Notify on new comments"
              action={
                <Switch
                  size="$3"
                  checked={settings?.notifyComments ?? true}
                  onCheckedChange={(v) => handleToggle('notifyComments', v)}
                  aria-label="Comments notifications toggle"
                >
                  <Switch.Thumb />
                </Switch>
              }
            />
            <Separator />
            <SettingsRow
              label="Reactions"
              description="When someone reacts to your entry"
              action={
                <Switch
                  size="$3"
                  checked={settings?.notifyReactions ?? false}
                  onCheckedChange={(v) => handleToggle('notifyReactions', v)}
                  aria-label="Reactions notifications toggle"
                >
                  <Switch.Thumb />
                </Switch>
              }
            />
          </YStack>
        </Card>
      </YStack>

      <YStack gap="$2">
        <SectionHeader
          title="Account"
          icon={<UserCircle size={16} color="$colorSubtle" />}
        />
        <Card padding="sm">
          <YStack>
            <SettingsRow
              label="Linked Accounts"
              description="Google, Apple"
              icon={<Link size={16} color="$colorSubtle" />}
              action={
                <Button size="sm" variant="secondary" accessibilityLabel="Manage linked accounts" disabled>
                  Manage
                </Button>
              }
            />
            <Separator />
            <SettingsRow
              label="Change Password"
              icon={<KeyRound size={16} color="$colorSubtle" />}
              action={
                <Button size="sm" variant="secondary" accessibilityLabel="Update password" disabled>
                  Update
                </Button>
              }
            />
            <Separator />
            <SettingsRow
              label="Delete Account"
              description="Account deletion coming soon"
              icon={<Trash2 size={16} color="$colorSubtle" />}
              action={
                <Button size="sm" variant="secondary" accessibilityLabel="Delete account" disabled>
                  Delete
                </Button>
              }
            />
          </YStack>
        </Card>
      </YStack>

      <YStack gap="$2">
        <SectionHeader
          title="Data"
          icon={<Database size={16} color="$colorSubtle" />}
        />
        <Card padding="sm">
          <YStack>
            <SettingsRow
              label="Export Entries"
              description="Download your entries as a JSON file"
              icon={<Download size={16} color="$colorSubtle" />}
              action={
                <Button size="sm" variant="secondary" accessibilityLabel="Export entries" disabled>
                  Export
                </Button>
              }
            />
            <Separator />
            <SettingsRow
              label="Import Entries"
              description="Import entries from a JSON file"
              icon={<Upload size={16} color="$colorSubtle" />}
              action={
                <Button size="sm" variant="secondary" accessibilityLabel="Import entries" disabled>
                  Import
                </Button>
              }
            />
          </YStack>
        </Card>
      </YStack>

      <Button
        size="lg"
        fullWidth
        variant="secondary"
        onPress={handleLogout}
        accessibilityLabel="Sign out"
      >
        <XStack alignItems="center" gap="$2">
          <LogOut size={18} color="$color" />
          <Text fontSize="$3" fontWeight="600" color="$color">
            Sign Out
          </Text>
        </XStack>
      </Button>

      <YStack alignItems="center" paddingVertical="$2">
        <Text fontSize="$2" color="$colorSubtle">
          innera v{APP_VERSION}
        </Text>
      </YStack>
    </ScreenContainer>
  );
}
