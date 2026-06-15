import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { useAppTheme } from "@/core/theme/theme-provider";

type LoadingStateProps = {
  label?: string;
  compact?: boolean;
};

export function LoadingState({
  label = "Loading",
  compact = false,
}: LoadingStateProps) {
  const { colors, spacing, typography } = useAppTheme();

  return (
    <View
      accessibilityRole="progressbar"
      style={[
        styles.base,
        compact ? styles.compact : styles.full,
        { gap: spacing[3] },
      ]}
    >
      <ActivityIndicator color={colors.primary} size="small" />
      <Text
        style={[
          styles.label,
          {
            color: colors.textSecondary,
            fontFamily: typography.fontFamily.medium,
          },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    justifyContent: "center",
  },
  full: {
    flex: 1,
  },
  compact: {
    minHeight: 96,
  },
  label: {
    fontSize: 14,
    includeFontPadding: false,
  },
});
