import { StyleSheet, Text, View } from "react-native";

import { useAppTheme } from "@/core/theme/theme-provider";
import { StatusBadge } from "@/shared/components/ui";

type ResultFieldRowProps = {
  label: string;
  value: string | null;
  confidence: number | null | undefined;
  warningThreshold?: number;
};

export function ResultFieldRow({
  label,
  value,
  confidence,
  warningThreshold = 0.7,
}: ResultFieldRowProps) {
  const { colors, radius, spacing, typography } = useAppTheme();
  const hasWarning =
    typeof confidence === "number" && confidence < warningThreshold;
  const displayValue = value?.trim() ? value : "Not available";
  const percentage =
    typeof confidence === "number" ? `${Math.round(confidence * 100)}%` : "N/A";

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderRadius: radius.md,
          padding: spacing[4],
        },
      ]}
    >
      <View style={styles.header}>
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
        {typeof confidence === "number" ? (
          <StatusBadge
            label={hasWarning ? `Low ${percentage}` : percentage}
            tone={hasWarning ? "warning" : "success"}
          />
        ) : null}
      </View>
      <Text
        style={[
          styles.value,
          {
            color: hasWarning ? colors.warning : colors.textPrimary,
            fontFamily: typography.fontFamily.semibold,
          },
        ]}
      >
        {displayValue}
      </Text>
      {hasWarning ? (
        <Text
          style={[
            styles.warning,
            {
              color: colors.warningText,
              fontFamily: typography.fontFamily.regular,
            },
          ]}
        >
          Confidence below 70 percent. Review before confirming.
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    gap: 10,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  label: {
    fontSize: 13,
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  value: {
    fontSize: 17,
    includeFontPadding: false,
    letterSpacing: 0.2,
  },
  warning: {
    fontSize: 12,
    lineHeight: 18,
  },
});
