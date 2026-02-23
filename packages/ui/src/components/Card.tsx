import { styled, Stack, type GetProps } from '@tamagui/core';
import { forwardRef } from 'react';
import type { TamaguiElement } from '@tamagui/core';

// ---------------------------------------------------------------------------
// Card frame
// ---------------------------------------------------------------------------

const CardFrame = styled(Stack, {
  name: 'Card',

  // Layout
  flexDirection: 'column',
  overflow: 'hidden',

  // Appearance
  backgroundColor: '$surface1',
  borderRadius: '$6',
  borderWidth: 1,
  borderStyle: 'solid',
  borderColor: '$borderColor',

  variants: {
    variant: {
      /**
       * Elevated card — uses a drop shadow to lift it off the surface.
       * The shadow values are intentionally kept subtle to work across
       * both light and dark themes.
       */
      elevated: {
        backgroundColor: '$surface1',
        borderColor: '$borderColor',
        shadowColor: '$shadowColor',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 4, // Android

        hoverStyle: {
          shadowOpacity: 0.14,
          shadowRadius: 16,
          elevation: 8,
          borderColor: '$borderColorHover',
        },
      },

      /**
       * Flat card — sits flush with the surface, distinguished only by its
       * background colour and border.
       */
      flat: {
        backgroundColor: '$surface2',
        borderColor: '$borderColor',
        shadowOpacity: 0,
        elevation: 0,

        hoverStyle: {
          backgroundColor: '$surface3',
          borderColor: '$borderColorHover',
        },
      },
    },

    /**
     * Padding preset applied to the card body.
     */
    padding: {
      none: { padding: 0 },
      sm: { padding: '$3' },
      md: { padding: '$4' },
      lg: { padding: '$6' },
      xl: { padding: '$8' },
    },

    /**
     * Whether the card is interactive (pressable).
     */
    pressable: {
      true: {
        cursor: 'pointer',
        pressStyle: {
          opacity: 0.92,
          scale: 0.99,
        },
      },
      false: {
        cursor: 'default',
      },
    },
  } as const,

  defaultVariants: {
    variant: 'elevated',
    padding: 'md',
    pressable: false,
  },
});

// ---------------------------------------------------------------------------
// Public Card component – automatically sets accessibilityRole="button" when
// the pressable variant is true, so consumers don't need to remember.
// ---------------------------------------------------------------------------

type CardFrameProps = GetProps<typeof CardFrame>;

export const Card = forwardRef<TamaguiElement, CardFrameProps>(
  function Card({ pressable, ...rest }, ref) {
    return (
      <CardFrame
        ref={ref}
        pressable={pressable}
        {...(pressable ? { accessibilityRole: 'button' } : {})}
        {...rest}
      />
    );
  },
);

// ---------------------------------------------------------------------------
// Card sub-components for structured layouts
// ---------------------------------------------------------------------------

export const CardHeader = styled(Stack, {
  name: 'CardHeader',

  paddingHorizontal: '$4',
  paddingTop: '$4',
  paddingBottom: '$3',
  borderBottomWidth: 1,
  borderBottomColor: '$borderColor',
  borderStyle: 'solid',
});

export const CardBody = styled(Stack, {
  name: 'CardBody',

  flex: 1,
  padding: '$4',
});

export const CardFooter = styled(Stack, {
  name: 'CardFooter',

  paddingHorizontal: '$4',
  paddingBottom: '$4',
  paddingTop: '$3',
  borderTopWidth: 1,
  borderTopColor: '$borderColor',
  borderStyle: 'solid',
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'flex-end',
  gap: '$3',
});

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export type CardProps = GetProps<typeof CardFrame>;
export type CardHeaderProps = GetProps<typeof CardHeader>;
export type CardBodyProps = GetProps<typeof CardBody>;
export type CardFooterProps = GetProps<typeof CardFooter>;
