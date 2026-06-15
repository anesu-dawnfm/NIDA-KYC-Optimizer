import { forwardRef } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  type TextInputProps,
  View,
} from "react-native";

import { useAppTheme } from "@/core/theme/theme-provider";

type InputProps = TextInputProps & {
  label: string;
  error?: string;
  helperText?: string;
};

export const Input = forwardRef<TextInput, InputProps>(function Input(
  { label, error, helperText, style, ...props },
  ref,
) {
  const { colors, radius, spacing, typography } = useAppTheme();

  return (
    <View style={{ gap: spacing[2] }}>
      <Text
        style={[
          styles.label,
          {
            color: colors.textPrimary,
            fontFamily: typography.fontFamily.medium,
          },
        ]}
      >
        {label}
      </Text>
      <TextInput
        ref={ref}
        placeholderTextColor={colors.textMuted}
        style={[
          styles.input,
          {
            backgroundColor: colors.surface,
            borderColor: error ? colors.danger : colors.border,
            borderRadius: radius.md,
            color: colors.textPrimary,
            paddingHorizontal: spacing[4],
            paddingVertical: spacing[3],
            fontFamily: typography.fontFamily.regular,
          },
          style,
        ]}
        {...props}
      />
      {helperText ? (
        <Text style={[styles.helper, { color: colors.textMuted }]}>
          {helperText}
        </Text>
      ) : null}
      {error ? (
        <Text style={[styles.error, { color: colors.danger }]}>{error}</Text>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  label: {
    fontSize: 14,
    includeFontPadding: false,
  },
  input: {
    borderWidth: 1,
    fontSize: 16,
    minHeight: 48,
  },
  helper: {
    fontSize: 12,
  },
  error: {
    fontSize: 12,
  },
});
