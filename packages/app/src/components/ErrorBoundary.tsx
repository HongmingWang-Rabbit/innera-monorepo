import React from 'react';
import { Button, EmptyState, Text, YStack } from '@innera/ui';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  /** Optional callback to navigate away when the error persists. */
  onNavigateAway?: () => void;
}

interface State {
  hasError: boolean;
  errorCount: number;
}

const MAX_RETRIES = 3;

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false, errorCount: 0 };

  static getDerivedStateFromError(_error: Error): Partial<State> {
    // Only set hasError here; errorCount is incremented in componentDidCatch
    // which fires after getDerivedStateFromError in the same error cycle.
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // componentDidCatch is guaranteed to fire after getDerivedStateFromError,
    // so hasError is already true at this point.
    console.error('ErrorBoundary caught:', error, errorInfo);
    this.setState((prev) => ({ errorCount: prev.errorCount + 1 }));
  }

  render() {
    if (this.state.hasError) {
      if (this.state.errorCount >= MAX_RETRIES) {
        return this.props.fallback ?? (
          <YStack flex={1} justifyContent="center" alignItems="center" padding="$6">
            <EmptyState
              title="Something keeps going wrong"
              description="This error has occurred multiple times. Please navigate away or restart the app."
              action={
                this.props.onNavigateAway ? (
                  <Button size="md" variant="secondary" onPress={this.props.onNavigateAway}>
                    Go Back
                  </Button>
                ) : (
                  <Text fontSize="$2" color="$colorSubtle">Please restart the app</Text>
                )
              }
            />
          </YStack>
        );
      }

      return this.props.fallback ?? (
        <YStack flex={1} justifyContent="center" alignItems="center" padding="$6">
          <EmptyState
            title="Something went wrong"
            description="An unexpected error occurred. Please try again."
            action={
              <Button size="md" variant="secondary" onPress={() => this.setState({ hasError: false })}>
                Try Again
              </Button>
            }
          />
        </YStack>
      );
    }
    return this.props.children;
  }
}
