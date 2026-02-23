import { styled, Text as TamaguiText, type GetProps } from '@tamagui/core';

// ---------------------------------------------------------------------------
// Base Text
// ---------------------------------------------------------------------------

/**
 * The base `Text` component. All other text variants are built on top of this.
 *
 * It exposes a `variant` prop for quick semantic selection and is otherwise
 * fully customisable via Tamagui style props.
 */
export const Text = styled(TamaguiText, {
  name: 'Text',

  fontFamily: '$body',
  fontSize: '$4',
  lineHeight: '$4',
  color: '$color',

  variants: {
    variant: {
      /** Large display / page-level heading. */
      heading: {
        fontFamily: '$heading',
        fontSize: '$9',
        lineHeight: '$9',
        fontWeight: '700',
        letterSpacing: -0.5,
        color: '$color',
      },

      /** Section-level heading. */
      subheading: {
        fontFamily: '$heading',
        fontSize: '$6',
        lineHeight: '$6',
        fontWeight: '600',
        letterSpacing: -0.25,
        color: '$color',
      },

      /** Default paragraph / body copy. */
      body: {
        fontFamily: '$body',
        fontSize: '$4',
        lineHeight: '$6',
        fontWeight: '400',
        color: '$color',
      },

      /** Supporting or helper text placed beneath labels/fields. */
      caption: {
        fontFamily: '$body',
        fontSize: '$2',
        lineHeight: '$4',
        fontWeight: '400',
        color: '$colorHover',
      },

      /** Short form labels for inputs, badges, etc. */
      label: {
        fontFamily: '$body',
        fontSize: '$3',
        lineHeight: '$3',
        fontWeight: '500',
        color: '$color',
      },
    },

    /**
     * Truncate to a single line with an ellipsis.
     */
    truncate: {
      true: {
        numberOfLines: 1,
        overflow: 'hidden',
      },
    },

    /**
     * Align the text within its container.
     */
    align: {
      left: { textAlign: 'left' },
      center: { textAlign: 'center' },
      right: { textAlign: 'right' },
    },

    /**
     * Colour shortcuts for common semantic meanings.
     */
    tone: {
      muted: { color: '$colorHover' },
      danger: { color: '$error' },
      success: { color: '$success' },
      warning: { color: '$warning' },
      primary: { color: '$primary' },
    },
  } as const,

  defaultVariants: {
    variant: 'body',
    truncate: false,
    align: 'left',
  },
});

export type TextProps = GetProps<typeof Text>;

// ---------------------------------------------------------------------------
// Semantic convenience exports
// ---------------------------------------------------------------------------

/**
 * Large display heading — equivalent to `<Text variant="heading" />`.
 */
export const Heading = styled(Text, {
  name: 'Heading',
  variant: 'heading',
});

export type HeadingProps = GetProps<typeof Heading>;

/**
 * Small supporting text — equivalent to `<Text variant="caption" />`.
 */
export const Caption = styled(Text, {
  name: 'Caption',
  variant: 'caption',
});

export type CaptionProps = GetProps<typeof Caption>;

/**
 * Short form label — equivalent to `<Text variant="label" />`.
 */
export const Label = styled(Text, {
  name: 'Label',
  variant: 'label',
});

export type LabelProps = GetProps<typeof Label>;
