import React, { useId } from 'react';
import { styled, type GetProps, type TamaguiElement } from '@tamagui/core';
import { Input as TamaguiInput, Text, YStack } from 'tamagui';

// ---------------------------------------------------------------------------
// Styled Input
// ---------------------------------------------------------------------------

const StyledInput = styled(TamaguiInput, {
  name: 'Input',

  // Layout
  width: '100%',

  // Typography
  fontFamily: '$body',
  fontSize: '$4',
  color: '$color',

  // Appearance
  backgroundColor: '$background',
  borderWidth: 1,
  borderStyle: 'solid',
  borderColor: '$borderColor',
  borderRadius: '$4',

  // Spacing
  paddingVertical: '$3',
  paddingHorizontal: '$4',
  height: '$10',

  // Placeholder
  placeholderTextColor: '$placeholderColor',

  // States
  hoverStyle: {
    borderColor: '$borderColorHover',
  },

  focusStyle: {
    borderColor: '$borderColorFocus',
    outlineWidth: 2,
    outlineStyle: 'solid',
    outlineColor: '$borderColorFocus',
    outlineOffset: 0,
  },

  variants: {
    size: {
      sm: {
        height: '$8',
        paddingVertical: '$2',
        paddingHorizontal: '$3',
        fontSize: '$3',
        borderRadius: '$3',
      },
      md: {
        height: '$10',
        paddingVertical: '$3',
        paddingHorizontal: '$4',
        fontSize: '$4',
        borderRadius: '$4',
      },
      lg: {
        height: '$12',
        paddingVertical: '$4',
        paddingHorizontal: '$5',
        fontSize: '$5',
        borderRadius: '$5',
      },
    },

    error: {
      true: {
        borderColor: '$error',
        hoverStyle: {
          borderColor: '$error',
        },
        focusStyle: {
          borderColor: '$error',
          outlineWidth: 2,
          outlineStyle: 'solid',
          outlineColor: '$error',
          outlineOffset: 0,
        },
      },
      false: {},
    },

    disabled: {
      true: {
        opacity: 0.5,
        cursor: 'not-allowed',
        backgroundColor: '$backgroundStrong',
      },
    },
  } as const,

  defaultVariants: {
    size: 'md',
    error: false,
    disabled: false,
  },
});

// ---------------------------------------------------------------------------
// Public type + re-export
// ---------------------------------------------------------------------------

export type InputProps = GetProps<typeof StyledInput> & {
  accessibilityLabel?: string;
  errorText?: string;
};

export const Input = React.forwardRef<TamaguiElement, InputProps>(function Input(
  { accessibilityLabel, errorText, error, ...props },
  ref,
) {
  const errorId = useId();
  const effectiveError = error || !!errorText;

  const input = (
    <StyledInput
      ref={ref}
      aria-label={accessibilityLabel}
      aria-invalid={effectiveError ? true : undefined}
      aria-describedby={errorText ? errorId : undefined}
      error={effectiveError}
      {...props}
    />
  );

  if (!errorText) return input;

  return (
    <YStack>
      {input}
      <Text id={errorId} fontSize="$2" color="$error" marginTop="$1" role="alert">
        {errorText}
      </Text>
    </YStack>
  );
});
