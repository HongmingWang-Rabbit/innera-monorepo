import React, { forwardRef } from 'react';
import type { TamaguiElement } from '@tamagui/core';
import { XStack } from 'tamagui';
import { Text } from './Text';
import { Card } from './Card';

type BaseCardProps = React.ComponentProps<typeof Card>;
export type StatCardProps = Omit<BaseCardProps, 'children'> & {
  value: string | number;
  label: string;
  icon?: React.ReactElement;
  accentColor?: string;
};

export const StatCard = forwardRef<TamaguiElement, StatCardProps>(
  function StatCard(
    {
      value,
      label,
      icon,
      accentColor = '$blue10',
      ...rest
    },
    ref,
  ) {
    return (
      <Card ref={ref} flex={1} padding="lg" gap="$2" accessibilityLabel={`${label}: ${value}`} {...rest}>
        <XStack justifyContent="space-between" alignItems="center">
          <Text fontSize="$6" fontWeight="700" color={accentColor}>
            {value}
          </Text>
          {icon}
        </XStack>
        <Text fontSize="$2" color="$colorSubtle" fontWeight="500">
          {label}
        </Text>
      </Card>
    );
  },
);
