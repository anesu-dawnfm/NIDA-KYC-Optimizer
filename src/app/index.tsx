import { StyleSheet, Text, View } from "react-native";

import { useAppTheme } from "@/core/theme/theme-provider";

export default function HomeScreen() {
  const { colors, spacing, typography } = useAppTheme();

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.background, padding: spacing.lg },
      ]}
    >
      <Text
        style={[
          styles.title,
          { color: colors.textPrimary, fontSize: typography.title },
        ]}
      >
        KYC Optimizer
      </Text>
      <Text style={{ color: colors.textSecondary, fontSize: typography.body }}>
        Mobile application foundation is ready.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
  },
  title: {
    fontWeight: "700",
    marginBottom: 8,
  },
});
