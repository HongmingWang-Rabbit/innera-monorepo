'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { YStack, XStack, Text, View } from '@innera/ui';
import { Home, Users, Heart, Bell, Settings, BookOpen } from '@tamagui/lucide-icons';

const SIDEBAR_WIDTH = 220;

const NAV_ITEMS = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/circles', label: 'Circles', icon: Users },
  { href: '/partner', label: 'Partner', icon: Heart },
  { href: '/notifications', label: 'Notifications', icon: Bell },
  { href: '/settings', label: 'Settings', icon: Settings },
] as const;

function isActive(pathname: string, href: string): boolean {
  if (href === '/') return pathname === '/';
  return pathname.startsWith(href);
}

export function Sidebar() {
  const pathname = usePathname();

  // Hide sidebar on login page
  if (pathname === '/login') return null;

  return (
    <YStack
      role="navigation"
      width={SIDEBAR_WIDTH}
      minHeight="100dvh"
      backgroundColor="$surface2"
      borderRightWidth={1}
      borderRightColor="$borderColor"
      paddingVertical="$4"
      paddingHorizontal="$3"
      gap="$1"
      flexShrink={0}
    >
      {/* App branding */}
      <XStack alignItems="center" gap="$2" paddingHorizontal="$3" paddingBottom="$4">
        <View
          width={32}
          height={32}
          borderRadius="$4"
          backgroundColor="$primary"
          alignItems="center"
          justifyContent="center"
        >
          <BookOpen size={18} color="$primaryColor" />
        </View>
        <Text fontSize="$5" fontWeight="700" color="$color">
          Innera
        </Text>
      </XStack>

      {/* Nav links */}
      <YStack role="navigation" aria-label="Main navigation" gap="$1">
        {NAV_ITEMS.map((item) => {
          const active = isActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              style={{ textDecoration: 'none' }}
            >
              <XStack
                paddingVertical="$2"
                paddingHorizontal="$3"
                borderRadius="$4"
                gap="$3"
                alignItems="center"
                backgroundColor={active ? '$blue3' : 'transparent'}
                hoverStyle={{ backgroundColor: active ? '$blue3' : '$backgroundHover' }}
                cursor="pointer"
              >
                <Icon
                  size={20}
                  color={active ? '$primary' : '$colorSubtle'}
                />
                <Text
                  fontSize="$3"
                  fontWeight={active ? '600' : '400'}
                  color={active ? '$primary' : '$color'}
                >
                  {item.label}
                </Text>
              </XStack>
            </Link>
          );
        })}
      </YStack>
    </YStack>
  );
}
