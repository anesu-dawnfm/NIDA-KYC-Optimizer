import { Component, type ErrorInfo, type PropsWithChildren } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import {
  borderTokens,
  colorTokens,
  radiusTokens,
  spacingTokens,
  typographyTokens,
} from "@/core/theme/tokens";
import { reportError } from "@/core/utils/report-error";
import { LoadingState } from "@/shared/components/ui";

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
        <LoadingState compact label="Recovering" />
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
    backgroundColor: colorTokens.dark.background,
    flex: 1,
    justifyContent: "center",
    padding: spacingTokens[6],
  },
  title: {
    color: colorTokens.dark.textPrimary,
    fontSize: typographyTokens.size["2xl"],
    fontFamily: typographyTokens.fontFamily.bold,
  },
  message: {
    color: colorTokens.dark.textSecondary,
    fontSize: typographyTokens.size.md,
    marginVertical: spacingTokens[4],
    textAlign: "center",
  },
  button: {
    backgroundColor: colorTokens.dark.primary,
    borderRadius: radiusTokens.md,
    borderWidth: borderTokens.hairlineWidth,
    paddingHorizontal: spacingTokens[6],
    paddingVertical: spacingTokens[3],
  },
  buttonText: {
    color: colorTokens.dark.primaryText,
    fontFamily: typographyTokens.fontFamily.bold,
  },
});
