import { styled, Stack, Text, type GetProps } from '@tamagui/core';
import { forwardRef, type ReactNode } from 'react';
import type { TamaguiElement } from '@tamagui/core';

// ---------------------------------------------------------------------------
// Base button frame
// ---------------------------------------------------------------------------

const ButtonFrame = styled(Stack, {
  name: 'Button',
  tag: 'button',

  // Layout
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  alignSelf: 'flex-start',
  gap: '$2',

  // Appearance
  borderRadius: '$4',
  borderWidth: 1,
  borderStyle: 'solid',
  cursor: 'pointer',
  userSelect: 'none',

  // Default (primary) appearance
  backgroundColor: '$primary',
  borderColor: '$primary',
  pressStyle: {
    opacity: 0.85,
    scale: 0.98,
  },
  hoverStyle: {
    backgroundColor: '$primaryHover',
    borderColor: '$primaryHover',
  },
  focusStyle: {
    outlineColor: '$borderColorFocus',
    outlineStyle: 'solid',
    outlineWidth: 2,
    outlineOffset: 2,
  },

  variants: {
    variant: {
      primary: {
        backgroundColor: '$primary',
        borderColor: '$primary',
        hoverStyle: {
          backgroundColor: '$primaryHover',
          borderColor: '$primaryHover',
        },
        pressStyle: {
          backgroundColor: '$primaryPress',
          borderColor: '$primaryPress',
          opacity: 0.9,
          scale: 0.98,
        },
      },

      secondary: {
        backgroundColor: '$secondary',
        borderColor: '$borderColor',
        hoverStyle: {
          backgroundColor: '$secondaryHover',
          borderColor: '$borderColorHover',
        },
        pressStyle: {
          backgroundColor: '$secondaryPress',
          borderColor: '$borderColorPress',
          opacity: 0.9,
          scale: 0.98,
        },
      },

      ghost: {
        backgroundColor: 'transparent',
        borderColor: 'transparent',
        hoverStyle: {
          backgroundColor: '$backgroundHover',
          borderColor: 'transparent',
        },
        pressStyle: {
          backgroundColor: '$backgroundPress',
          opacity: 0.9,
          scale: 0.98,
        },
      },

      danger: {
        backgroundColor: '$danger',
        borderColor: '$danger',
        hoverStyle: {
          backgroundColor: '$dangerHover',
          borderColor: '$dangerHover',
        },
        pressStyle: {
          backgroundColor: '$dangerPress',
          borderColor: '$dangerPress',
          opacity: 0.9,
          scale: 0.98,
        },
      },
    },

    size: {
      sm: {
        paddingVertical: '$2',
        paddingHorizontal: '$3',
        borderRadius: '$3',
        height: '$8',
      },
      md: {
        paddingVertical: '$3',
        paddingHorizontal: '$4',
        borderRadius: '$4',
        height: '$10',
      },
      lg: {
        paddingVertical: '$4',
        paddingHorizontal: '$6',
        borderRadius: '$5',
        height: '$12',
      },
    },

    disabled: {
      true: {
        opacity: 0.5,
        pointerEvents: 'none',
        cursor: 'not-allowed',
      },
    },

    fullWidth: {
      true: {
        alignSelf: 'stretch',
        width: '100%',
      },
    },
  } as const,

  defaultVariants: {
    variant: 'primary',
    size: 'md',
    disabled: false,
    fullWidth: false,
  },
});

// ---------------------------------------------------------------------------
// Button label (text inside the button)
// ---------------------------------------------------------------------------

const ButtonText = styled(Text, {
  name: 'ButtonText',

  fontFamily: '$body',
  fontWeight: '600',
  textAlign: 'center',
  userSelect: 'none',

  variants: {
    variant: {
      primary: {
        color: '$primaryColor',
      },
      secondary: {
        color: '$secondaryColor',
      },
      ghost: {
        color: '$color',
      },
      danger: {
        color: '$dangerColor',
      },
    },

    size: {
      sm: {
        fontSize: '$3',
        lineHeight: '$3',
      },
      md: {
        fontSize: '$4',
        lineHeight: '$4',
      },
      lg: {
        fontSize: '$5',
        lineHeight: '$5',
      },
    },
  } as const,

  defaultVariants: {
    variant: 'primary',
    size: 'md',
  },
});

// ---------------------------------------------------------------------------
// Public Button component
// ---------------------------------------------------------------------------

type ButtonFrameProps = GetProps<typeof ButtonFrame>;

export type ButtonProps = ButtonFrameProps & {
  children?: ReactNode;
};

export const Button = forwardRef<TamaguiElement, ButtonProps>(function Button(
  {
    children,
    variant = 'primary',
    size = 'md',
    disabled = false,
    fullWidth = false,
    ...rest
  },
  ref,
) {
  return (
    <ButtonFrame
      ref={ref}
      variant={variant}
      size={size}
      disabled={disabled}
      fullWidth={fullWidth}
      aria-disabled={disabled}
      accessibilityRole="button"
      opacity={disabled ? 0.5 : 1}
      pointerEvents={disabled ? 'none' : 'auto'}
      {...rest}
    >
      {typeof children === 'string' ? (
        <ButtonText variant={variant} size={size}>
          {children}
        </ButtonText>
      ) : (
        children
      )}
    </ButtonFrame>
  );
});
