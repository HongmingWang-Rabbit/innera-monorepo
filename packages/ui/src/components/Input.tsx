import { styled, Input as TamaguiInput, type GetProps } from 'tamagui';

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
  lineHeight: '$4',
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
        lineHeight: '$3',
        borderRadius: '$3',
      },
      md: {
        height: '$10',
        paddingVertical: '$3',
        paddingHorizontal: '$4',
        fontSize: '$4',
        lineHeight: '$4',
        borderRadius: '$4',
      },
      lg: {
        height: '$12',
        paddingVertical: '$4',
        paddingHorizontal: '$5',
        fontSize: '$5',
        lineHeight: '$5',
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
        pointerEvents: 'none',
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
};

export function Input({ accessibilityLabel, ...props }: InputProps) {
  return (
    <StyledInput
      accessibilityLabel={accessibilityLabel}
      aria-label={accessibilityLabel}
      {...props}
    />
  );
}
