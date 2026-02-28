import { styled, View, type GetProps } from '@tamagui/core';
import React, { forwardRef, useCallback } from 'react';
import type { TamaguiElement } from '@tamagui/core';

// ---------------------------------------------------------------------------
// Card frame
// ---------------------------------------------------------------------------

const CardFrame = styled(View, {
  name: 'Card',

  // Layout — no overflow:'hidden' so text selection, focus rings, and shadows
  // aren't clipped. Edge children must set their own borderRadius to stay
  // within the card's rounded corners.
  flexDirection: 'column',

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
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 3,
        elevation: 2, // Android

        hoverStyle: {
          shadowOpacity: 0.12,
          shadowOffset: { width: 0, height: 4 },
          shadowRadius: 12,
          elevation: 6,
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
          opacity: 0.95,
          scale: 0.985,
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
// Public Card component – automatically sets role="button" when the pressable
// variant is true, so consumers don't need to remember.
// ---------------------------------------------------------------------------

type CardFrameProps = GetProps<typeof CardFrame> & {
  /** RN accessibility prop — mapped to aria-label on web. */
  accessibilityLabel?: string;
  /** RN accessibility prop — mapped to aria-roledescription on web. */
  accessibilityHint?: string;
  /** RN accessibility prop — ignored (role is set via pressable). */
  accessibilityRole?: string;
};

export const Card = forwardRef<TamaguiElement, CardFrameProps>(
  function Card(
    {
      pressable,
      accessibilityLabel,
      accessibilityHint,
      accessibilityRole: _accessibilityRole,
      onPress,
      ...rest
    },
    ref,
  ) {
    const handleKeyDown = useCallback(
      (e: { key: string; preventDefault: () => void }) => {
        if (pressable && onPress && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          (onPress as () => void)();
        }
      },
      [pressable, onPress],
    );

    return (
      <CardFrame
        ref={ref}
        pressable={pressable}
        {...(pressable ? { role: 'button', tabIndex: 0 } : {})}
        aria-label={accessibilityLabel}
        aria-roledescription={accessibilityHint}
        onPress={pressable ? onPress : undefined}
        onKeyDown={pressable ? handleKeyDown : undefined}
        {...rest}
      />
    );
  },
);

// ---------------------------------------------------------------------------
// Card sub-components for structured layouts
// ---------------------------------------------------------------------------

export const CardHeader = styled(View, {
  name: 'CardHeader',

  paddingHorizontal: '$4',
  paddingTop: '$4',
  paddingBottom: '$3',
  borderBottomWidth: 1,
  borderBottomColor: '$borderColor',
  borderStyle: 'solid',
});

export const CardBody = styled(View, {
  name: 'CardBody',

  flex: 1,
  padding: '$4',
});

export const CardFooter = styled(View, {
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

export type CardProps = React.ComponentProps<typeof Card>;
export type CardHeaderProps = GetProps<typeof CardHeader>;
export type CardBodyProps = GetProps<typeof CardBody>;
export type CardFooterProps = GetProps<typeof CardFooter>;
