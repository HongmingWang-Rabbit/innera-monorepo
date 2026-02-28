import { Keyboard, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScrollView, YStack } from '@innera/ui';
import type { ScreenContainerProps } from './ScreenContainer.types';
import { SCROLL_BOTTOM_PADDING } from './ScreenContainer.types';

export type { ScreenContainerProps } from './ScreenContainer.types';

export function ScreenContainer({
  children,
  edges = ['top'],
  scrollable = true,
  padded = true,
  dismissKeyboard = false,
  refreshControl,
}: ScreenContainerProps) {
  const insets = useSafeAreaInsets();

  const paddingTop = edges.includes('top') ? insets.top : 0;
  const paddingBottom = edges.includes('bottom') ? insets.bottom : 0;
  const paddingLeft = edges.includes('left') ? insets.left : 0;
  const paddingRight = edges.includes('right') ? insets.right : 0;

  if (scrollable) {
    return (
      <ScrollView
        flex={1}
        backgroundColor="$background"
        keyboardDismissMode={dismissKeyboard ? 'on-drag' : 'none'}
        keyboardShouldPersistTaps={dismissKeyboard ? 'handled' : 'always'}
        refreshControl={refreshControl}
        contentContainerStyle={{
          paddingTop,
          paddingBottom: paddingBottom + SCROLL_BOTTOM_PADDING,
          paddingLeft,
          paddingRight,
        }}
      >
        <YStack
          flex={1}
          paddingHorizontal={padded ? '$5' : 0}
          paddingTop={padded ? '$5' : 0}
          gap="$4"
        >
          {children}
        </YStack>
      </ScrollView>
    );
  }

  const content = (
    <YStack
      flex={1}
      backgroundColor="$background"
      paddingHorizontal={padded ? '$5' : 0}
      gap="$4"
      style={{
        paddingTop,
        paddingBottom,
        paddingLeft,
        paddingRight,
      }}
    >
      {children}
    </YStack>
  );

  if (dismissKeyboard) {
    return (
      <Pressable onPress={Keyboard.dismiss} accessible={false} style={{ flex: 1 }}>
        {content}
      </Pressable>
    );
  }

  return content;
}
