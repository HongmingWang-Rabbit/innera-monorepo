import React, { forwardRef } from 'react';
import type { TamaguiElement } from '@tamagui/core';
import { YStack, type YStackProps } from 'tamagui';
import { Text } from './Text';

export type EmptyStateProps = YStackProps & {
  icon?: React.ReactElement;
  title: string;
  description?: string;
  action?: React.ReactNode;
  headingLevel?: 1 | 2 | 3 | 4 | 5 | 6;
};

export const EmptyState = forwardRef<TamaguiElement, EmptyStateProps>(
  function EmptyState(
    {
      icon,
      title,
      description,
      action,
      headingLevel,
      ...rest
    },
    ref,
  ) {
    return (
      <YStack
        ref={ref}
        alignItems="center"
        justifyContent="center"
        padding="$6"
        gap="$3"
        {...rest}
      >
        {icon}
        <YStack alignItems="center" gap="$1">
          <Text fontSize="$5" fontWeight="600" color="$color" textAlign="center" role="heading" aria-level={headingLevel ?? 2}>
            {title}
          </Text>
          {description && (
            <Text
              fontSize="$3"
              color="$colorSubtle"
              textAlign="center"
              maxWidth="80%"
            >
              {description}
            </Text>
          )}
        </YStack>
        {action}
      </YStack>
    );
  },
);
