import { StyleSheet, Text, View } from "react-native";

import { useAppTheme } from "@/core/theme/theme-provider";

export function NidaScannerOverlay() {
  const { colors, radius, spacing, typography } = useAppTheme();

  return (
    <View pointerEvents="none" style={styles.container}>
      <View
        style={[
          styles.frameShell,
          {
            width: "82%",
          },
        ]}
      >
        <View style={[styles.frame, { borderRadius: radius.md }]} />
        <View
          style={[
            styles.corner,
            styles.topLeft,
            {
              borderTopColor: colors.primary,
              borderLeftColor: colors.primary,
            },
          ]}
        />
        <View
          style={[
            styles.corner,
            styles.topRight,
            {
              borderTopColor: colors.primary,
              borderRightColor: colors.primary,
            },
          ]}
        />
        <View
          style={[
            styles.corner,
            styles.bottomLeft,
            {
              borderBottomColor: colors.primary,
              borderLeftColor: colors.primary,
            },
          ]}
        />
        <View
          style={[
            styles.corner,
            styles.bottomRight,
            {
              borderBottomColor: colors.primary,
              borderRightColor: colors.primary,
            },
          ]}
        />
      </View>
      <View style={[styles.caption, { marginTop: spacing[6] }]}>
        <Text
          style={[
            styles.captionText,
            {
              color: colors.textPrimary,
              fontFamily: typography.fontFamily.semibold,
            },
          ]}
        >
          Align NIDA Card within frame
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  frameShell: {
    aspectRatio: 0.74,
    position: "relative",
  },
  frame: {
    borderColor: "#FFFFFF",
    borderWidth: 1,
    flex: 1,
    opacity: 0.92,
  },
  corner: {
    height: 42,
    position: "absolute",
    width: 42,
  },
  topLeft: {
    borderLeftWidth: 3,
    borderTopWidth: 3,
    left: 0,
    top: 0,
  },
  topRight: {
    borderRightWidth: 3,
    borderTopWidth: 3,
    right: 0,
    top: 0,
  },
  bottomLeft: {
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    bottom: 0,
    left: 0,
  },
  bottomRight: {
    borderBottomWidth: 3,
    borderRightWidth: 3,
    bottom: 0,
    right: 0,
  },
  caption: {
    alignItems: "center",
  },
  captionText: {
    fontSize: 16,
    includeFontPadding: false,
    textAlign: "center",
  },
});
