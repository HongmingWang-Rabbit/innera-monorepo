import { styled, View, Text, type GetProps } from '@tamagui/core';
import { forwardRef } from 'react';
import type { TamaguiElement } from '@tamagui/core';

const BadgeFrame = styled(View, {
  name: 'Badge',

  flexDirection: 'row',
  alignItems: 'center',
  gap: '$1',
  paddingVertical: '$1',
  paddingHorizontal: '$3',
  borderRadius: '$8',

  variants: {
    variant: {
      default: {
        backgroundColor: '$surface3',
      },
      success: {
        backgroundColor: '$green3',
      },
      warning: {
        backgroundColor: '$yellow3',
      },
      danger: {
        backgroundColor: '$pink3',
      },
      brand: {
        backgroundColor: '$blue3',
      },
    },
  } as const,

  defaultVariants: {
    variant: 'default',
  },
});

const BadgeText = styled(Text, {
  name: 'BadgeText',

  fontFamily: '$body',
  fontSize: '$2',
  fontWeight: '600',

  variants: {
    variant: {
      default: {
        color: '$color',
      },
      success: {
        color: '$green10',
      },
      warning: {
        color: '$yellow10',
      },
      danger: {
        color: '$pink10',
      },
      brand: {
        color: '$blue10',
      },
    },
  } as const,

  defaultVariants: {
    variant: 'default',
  },
});

export type BadgeProps = GetProps<typeof BadgeFrame> & {
  children: string;
};

export const Badge = forwardRef<TamaguiElement, BadgeProps>(function Badge({ children, variant = 'default', ...rest }, ref) {
  return (
    <BadgeFrame variant={variant} ref={ref} {...rest}>
      <BadgeText variant={variant}>{children}</BadgeText>
    </BadgeFrame>
  );
});
