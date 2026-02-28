import { YStack } from '@innera/ui';
import type { ScreenContainerProps } from './ScreenContainer.types';
import { SCROLL_BOTTOM_PADDING } from './ScreenContainer.types';

export type { ScreenContainerProps } from './ScreenContainer.types';

export function ScreenContainer({
  children,
  // `edges` is accepted for API parity with native but has no effect on web
  // where the browser viewport handles safe areas.
  edges: _edges,
  scrollable = true,
  padded = true,
  // No-op on web — browsers dismiss the keyboard natively on outside click.
  dismissKeyboard: _dismissKeyboard,
  // No-op on web — pull-to-refresh is a mobile-only interaction.
  refreshControl: _refreshControl,
}: ScreenContainerProps) {
  if (scrollable) {
    return (
      <YStack
        minHeight="100dvh"
        backgroundColor="$background"
        paddingHorizontal={padded ? '$5' : 0}
        paddingTop={padded ? '$5' : 0}
        paddingBottom={SCROLL_BOTTOM_PADDING}
        gap="$4"
      >
        {children}
      </YStack>
    );
  }

  return (
    <YStack
      height="100dvh"
      overflow="hidden"
      backgroundColor="$background"
      padding={padded ? '$5' : 0}
      gap="$4"
    >
      {children}
    </YStack>
  );
}
