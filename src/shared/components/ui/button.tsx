import { Pressable, StyleSheet, Text, ViewStyle } from "react-native";

import type { ThemeTokens } from "@/core/theme/theme-provider";
import { useAppTheme } from "@/core/theme/theme-provider";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

type ButtonProps = {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
};

const sizeMap: Record<
  ButtonSize,
  { minHeight: number; paddingHorizontal: number; fontSize: number }
> = {
  sm: { minHeight: 36, paddingHorizontal: 12, fontSize: 14 },
  md: { minHeight: 44, paddingHorizontal: 16, fontSize: 16 },
  lg: { minHeight: 52, paddingHorizontal: 20, fontSize: 16 },
};

export function Button({
  label,
  onPress,
  variant = "primary",
  size = "md",
  disabled = false,
  loading = false,
  fullWidth = false,
}: ButtonProps) {
  const { colors, radius, typography } = useAppTheme();
  const token = sizeMap[size];
  const isDisabled = disabled || loading;

  const containerStyle: ViewStyle = {
    minHeight: token.minHeight,
    paddingHorizontal: token.paddingHorizontal,
    borderRadius: radius.md,
    width: fullWidth ? "100%" : "auto",
    opacity: isDisabled ? 0.6 : 1,
  };

  const variantStyles = getVariantStyles(variant, colors);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        containerStyle,
        variantStyles.container,
        pressed && !isDisabled && styles.pressed,
      ]}
    >
      <Text
        style={[
          styles.label,
          {
            color: variantStyles.labelColor,
            fontFamily: typography.fontFamily.semibold,
            fontSize: token.fontSize,
          },
        ]}
      >
        {loading ? "Loading..." : label}
      </Text>
    </Pressable>
  );
}

function getVariantStyles(
  variant: ButtonVariant,
  colors: ThemeTokens["colors"],
) {
  switch (variant) {
    case "secondary":
      return {
        container: {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderWidth: 1,
        },
        labelColor: colors.textPrimary,
      };
    case "ghost":
      return {
        container: {
          backgroundColor: "transparent",
        },
        labelColor: colors.textPrimary,
      };
    case "danger":
      return {
        container: {
          backgroundColor: colors.danger,
        },
        labelColor: "#FFFFFF",
      };
    case "primary":
    default:
      return {
        container: {
          backgroundColor: colors.primary,
        },
        labelColor: colors.primaryText,
      };
  }
}

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    alignSelf: "flex-start",
    justifyContent: "center",
  },
  label: {
    includeFontPadding: false,
  },
  pressed: {
    opacity: 0.86,
  },
});
