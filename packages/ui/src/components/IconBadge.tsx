import React, { forwardRef } from 'react';
import { View, type GetProps, type TamaguiElement } from '@tamagui/core';

export type IconBadgeProps = GetProps<typeof View> & {
  icon: React.ReactElement;
  size?: number;
};

export const IconBadge = forwardRef<TamaguiElement, IconBadgeProps>(
  function IconBadge(
    {
      icon,
      size = 40,
      backgroundColor = '$blue3',
      ...rest
    },
    ref,
  ) {
    return (
      <View
        ref={ref}
        width={size}
        height={size}
        borderRadius={size / 2}
        backgroundColor={backgroundColor}
        alignItems="center"
        justifyContent="center"
        flexShrink={0}
        {...rest}
      >
        {icon}
      </View>
    );
  },
);
IconBadge.displayName = 'IconBadge';
