import { Component, type ErrorInfo, type PropsWithChildren } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { darkColors, spacing, typography } from "@/core/theme/tokens";
import { reportError } from "@/core/utils/report-error";

type State = {
  hasError: boolean;
};

export class GlobalErrorBoundary extends Component<PropsWithChildren, State> {
  override state: State = {
    hasError: false,
  };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    reportError(error, {
      boundary: "global",
      componentStackPresent: Boolean(errorInfo.componentStack),
    });
  }

  private readonly reset = (): void => {
    this.setState({ hasError: false });
  };

  override render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <View style={styles.container}>
        <Text style={styles.title}>Something went wrong</Text>
        <Text style={styles.message}>
          The application could not complete the operation. No sensitive details
          have been displayed.
        </Text>
        <Pressable
          accessibilityRole="button"
          onPress={this.reset}
          style={styles.button}
        >
          <Text style={styles.buttonText}>Try again</Text>
        </Pressable>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    backgroundColor: darkColors.background,
    flex: 1,
    justifyContent: "center",
    padding: spacing.lg,
  },
  title: {
    color: darkColors.textPrimary,
    fontSize: typography.title,
    fontWeight: "700",
  },
  message: {
    color: darkColors.textSecondary,
    fontSize: typography.body,
    marginVertical: spacing.md,
    textAlign: "center",
  },
  button: {
    backgroundColor: darkColors.primary,
    borderRadius: 8,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  buttonText: {
    color: darkColors.background,
    fontWeight: "700",
  },
});
