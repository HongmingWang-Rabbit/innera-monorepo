import { styled, View, Text, type GetProps } from '@tamagui/core';
import { Spinner } from 'tamagui';
import { forwardRef, useCallback, type KeyboardEvent, type ReactNode } from 'react';
import type { TamaguiElement } from '@tamagui/core';

// ---------------------------------------------------------------------------
// Base button frame
// ---------------------------------------------------------------------------

const ButtonFrame = styled(View, {
  name: 'Button',

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
        minHeight: '$8',
      },
      md: {
        paddingVertical: '$3',
        paddingHorizontal: '$4',
        borderRadius: '$4',
        minHeight: '$10',
      },
      lg: {
        paddingVertical: '$4',
        paddingHorizontal: '$6',
        borderRadius: '$5',
        minHeight: '$12',
      },
    },

    disabled: {
      true: {
        opacity: 0.5,
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
      },
      md: {
        fontSize: '$4',
      },
      lg: {
        fontSize: '$5',
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

type ButtonVariant = NonNullable<ButtonFrameProps['variant']>;

const SPINNER_COLOR: Record<ButtonVariant, string> = {
  primary: '$primaryColor',
  secondary: '$secondaryColor',
  ghost: '$color',
  danger: '$dangerColor',
};

type ButtonFrameProps = GetProps<typeof ButtonFrame>;

export type ButtonProps = ButtonFrameProps & {
  children?: ReactNode;
  loading?: boolean;
  /** RN accessibility prop — mapped to aria-label on web. */
  accessibilityLabel?: string;
  /** RN accessibility prop — mapped to aria-roledescription on web. */
  accessibilityHint?: string;
  /** RN accessibility prop — mapped to aria-* attributes on web. */
  accessibilityState?: Record<string, unknown>;
  /** RN accessibility prop — ignored (role="button" already set). */
  accessibilityRole?: string;
};

export const Button = forwardRef<TamaguiElement, ButtonProps>(function Button(
  {
    children,
    variant = 'primary',
    size = 'md',
    disabled = false,
    fullWidth = false,
    loading = false,
    onPress,
    // Intercept RN accessibility props so they don't leak to the DOM.
    accessibilityLabel,
    accessibilityHint,
    accessibilityState,
    accessibilityRole: _accessibilityRole,
    ...rest
  },
  ref,
) {
  const isDisabled = disabled || loading;

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLElement>) => {
      if (isDisabled) return;
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        // Keyboard-triggered press: onPress is called without the
        // GestureResponderEvent argument. Consumers that depend on the event
        // object should handle `undefined` gracefully.
        (onPress as (() => void) | undefined)?.();
      }
    },
    [isDisabled, onPress],
  );

  return (
    <ButtonFrame
      ref={ref}
      role="button"
      tabIndex={isDisabled ? -1 : 0}
      variant={variant}
      size={size}
      disabled={isDisabled}
      fullWidth={fullWidth}
      aria-disabled={isDisabled}
      aria-busy={loading || undefined}
      aria-label={accessibilityLabel}
      aria-roledescription={accessibilityHint}
      aria-selected={
        accessibilityState?.selected != null
          ? Boolean(accessibilityState.selected)
          : undefined
      }
      onPress={isDisabled ? undefined : onPress}
      // Spread as object to bypass Tamagui View's prop types which don't include onKeyDown.
      // The handler still works via DOM passthrough on web; on native it's a no-op.
      {...{ onKeyDown: handleKeyDown }}
      {...rest}
    >
      {loading ? (
        <Spinner size="small" color={SPINNER_COLOR[variant]} />
      ) : typeof children === 'string' ? (
        <ButtonText variant={variant} size={size}>
          {children}
        </ButtonText>
      ) : (
        children
      )}
    </ButtonFrame>
  );
});
