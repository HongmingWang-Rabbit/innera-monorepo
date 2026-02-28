import type React from 'react';

export type Edge = 'top' | 'bottom' | 'left' | 'right';

export type ScreenContainerProps = {
  children: React.ReactNode;
  edges?: Edge[];
  scrollable?: boolean;
  padded?: boolean;
  /** Dismiss keyboard when tapping outside an input (native only, no-op on web). */
  dismissKeyboard?: boolean;
  /** Optional RefreshControl element for pull-to-refresh (only used when scrollable is true). */
  refreshControl?: React.ReactElement<any>;
};

/** Default bottom padding added below scroll content (px). */
export const SCROLL_BOTTOM_PADDING = 16;
