// Tamagui config and themes
export { config } from './tamagui.config';
export type { AppConfig } from './tamagui.config';

// Custom components
export * from './components/Button';
export * from './components/Input';
export * from './components/Card';
export * from './components/Text';
export * from './components/Badge';
export * from './components/IconBadge';
export * from './components/StatCard';
export * from './components/EmptyState';

// Re-export commonly used Tamagui primitives so consumers can import from
// '@innera/ui' instead of 'tamagui' directly.
export {
  YStack,
  XStack,
  ZStack,
  View,
  Separator,
  TextArea,
  ScrollView,
  Image,
  Spinner,
  Switch,
  Theme,
  TamaguiProvider,
} from 'tamagui';
