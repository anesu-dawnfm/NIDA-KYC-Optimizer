import { StyleSheet, Text, View } from "react-native";

import type { ThemeTokens } from "@/core/theme/theme-provider";
import { useAppTheme } from "@/core/theme/theme-provider";

export type StatusTone = "neutral" | "success" | "warning" | "danger" | "info";

type StatusBadgeProps = {
  label: string;
  tone?: StatusTone;
};

export function StatusBadge({ label, tone = "neutral" }: StatusBadgeProps) {
  const { colors, radius, spacing, typography } = useAppTheme();

  const toneStyles = getToneStyles(tone, colors);

  return (
    <View
      style={[
        styles.base,
        {
          backgroundColor: toneStyles.backgroundColor,
          borderColor: toneStyles.borderColor,
          borderRadius: radius.pill,
          paddingHorizontal: spacing[3],
          paddingVertical: spacing[1],
        },
      ]}
    >
      <Text
        style={[
          styles.label,
          {
            color: toneStyles.textColor,
            fontFamily: typography.fontFamily.medium,
          },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

function getToneStyles(
  tone: StatusTone,
  colors: ThemeTokens["colors"],
) {
  switch (tone) {
    case "success":
      return {
        backgroundColor: colors.successSurface,
        borderColor: colors.success,
        textColor: colors.successText,
      };
    case "warning":
      return {
        backgroundColor: colors.warningSurface,
        borderColor: colors.warning,
        textColor: colors.warningText,
      };
    case "danger":
      return {
        backgroundColor: colors.dangerSurface,
        borderColor: colors.danger,
        textColor: colors.dangerText,
      };
    case "info":
      return {
        backgroundColor: colors.infoSurface,
        borderColor: colors.info,
        textColor: colors.infoText,
      };
    case "neutral":
    default:
      return {
        backgroundColor: colors.surfaceMuted,
        borderColor: colors.border,
        textColor: colors.textPrimary,
      };
  }
}

const styles = StyleSheet.create({
  base: {
    alignSelf: "flex-start",
    borderWidth: 1,
  },
  label: {
    fontSize: 12,
    includeFontPadding: false,
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
});
