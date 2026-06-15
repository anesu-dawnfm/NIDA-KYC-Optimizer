import { Link, Stack } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { useAppTheme } from "@/core/theme/theme-provider";

export default function NotFoundScreen() {
  const { colors, spacing, typography } = useAppTheme();

  return (
    <>
      <Stack.Screen options={{ title: "Not Found", headerShown: true }} />
      <View
        style={[
          styles.container,
          { backgroundColor: colors.background, padding: spacing.lg },
        ]}
      >
        <Text style={{ color: colors.textPrimary, fontSize: typography.title }}>
          This screen does not exist.
        </Text>
        <Link href="/" style={[styles.link, { color: colors.primary }]}>
          Return home
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
  },
  link: {
    marginTop: 16,
  },
});
