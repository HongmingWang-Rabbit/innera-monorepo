import type { Visibility } from '@innera/shared';
import { palette } from '../constants';

export type VisibilityConfig = {
  label: string;
  color: string;
  icon: string;
};

/**
 * Shared visibility configuration used across HomeScreen, NewEntryScreen,
 * and EntryDetailScreen to avoid duplicating label/color/icon mappings.
 *
 * `color` values reference the raw palette (for Lucide icon color props).
 * `icon` is the Lucide icon name as a string identifier.
 */
export const VISIBILITY_CONFIG: Record<Visibility, VisibilityConfig> = {
  PRIVATE: { label: 'Private', color: palette.indigo500, icon: 'Lock' },
  PARTNER: { label: 'Partner', color: palette.pink500, icon: 'Heart' },
  CIRCLE: { label: 'Circle', color: palette.purple500, icon: 'Users' },
  FUTURE_CIRCLE_ONLY: { label: 'Circle', color: palette.purple500, icon: 'Users' },
};
