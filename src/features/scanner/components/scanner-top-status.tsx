import { StyleSheet, Text, View } from "react-native";

import { useAppTheme } from "@/core/theme/theme-provider";

type ScannerTopStatusProps = {
  label: string;
  queueCount: number;
  isAutoCaptureActive: boolean;
};

export function ScannerTopStatus({
  label,
  queueCount,
  isAutoCaptureActive,
}: ScannerTopStatusProps) {
  const { colors, radius, spacing, typography } = useAppTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.backgroundMuted,
          borderBottomColor: colors.border,
          paddingHorizontal: spacing[4],
          paddingVertical: spacing[3],
        },
      ]}
    >
      <View style={styles.row}>
        <View
          style={[
            styles.pill,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderRadius: radius.pill,
            },
          ]}
        >
          <View
            style={[
              styles.dot,
              { backgroundColor: isAutoCaptureActive ? colors.primary : colors.borderStrong },
            ]}
          />
          <Text
            style={[
              styles.text,
              {
                color: colors.textPrimary,
                fontFamily: typography.fontFamily.medium,
              },
            ]}
          >
            Auto capture
          </Text>
        </View>
        <View
          style={[
            styles.pill,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderRadius: radius.pill,
            },
          ]}
        >
          <Text
            style={[
              styles.text,
              {
                color: colors.textPrimary,
                fontFamily: typography.fontFamily.medium,
              },
            ]}
          >
            Queue {queueCount}
          </Text>
        </View>
      </View>
      <Text
        style={[
          styles.status,
          {
            color: colors.textSecondary,
            fontFamily: typography.fontFamily.regular,
          },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  pill: {
    alignItems: "center",
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  text: {
    fontSize: 13,
    includeFontPadding: false,
  },
  dot: {
    borderRadius: 9999,
    height: 8,
    width: 8,
  },
  status: {
    fontSize: 12,
    marginTop: 10,
  },
});
