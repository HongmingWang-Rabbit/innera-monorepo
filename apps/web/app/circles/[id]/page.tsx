'use client';
import { RequireAuth } from '@innera/app';
import { Text, YStack } from '@innera/ui';

// TODO: CircleDetailScreen will be added to @innera/app when implemented.
export default function CircleDetailPage() {
  return (
    <RequireAuth>
      <YStack flex={1} backgroundColor="$background" padding="$4" alignItems="center" justifyContent="center">
        <Text variant="subheading">Circle Detail</Text>
        <Text variant="caption">Coming soon</Text>
      </YStack>
    </RequireAuth>
  );
}
