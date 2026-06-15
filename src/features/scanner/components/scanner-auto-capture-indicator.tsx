import { useEffect, useState } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";

import { useAppTheme } from "@/core/theme/theme-provider";

export function ScannerAutoCaptureIndicator() {
  const { colors, radius, spacing, typography } = useAppTheme();
  const [pulse] = useState(() => new Animated.Value(0));

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 900,
          useNativeDriver: true,
        }),
      ]),
    );

    animation.start();

    return () => animation.stop();
  }, [pulse]);

  const opacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.35, 1],
  });

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderRadius: radius.md,
          paddingHorizontal: spacing[4],
          paddingVertical: spacing[3],
        },
      ]}
    >
      <Animated.View
        style={[
          styles.dot,
          {
            backgroundColor: colors.primary,
            opacity,
          },
        ]}
      />
      <Text
        style={[
          styles.label,
          {
            color: colors.textPrimary,
            fontFamily: typography.fontFamily.medium,
          },
        ]}
      >
        Auto-capture armed
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    alignSelf: "flex-start",
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
  },
  dot: {
    borderRadius: 9999,
    height: 10,
    width: 10,
  },
  label: {
    fontSize: 14,
    includeFontPadding: false,
  },
});
