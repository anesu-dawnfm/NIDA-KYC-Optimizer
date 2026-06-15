import { StyleSheet, View, type ViewProps } from "react-native";

import { useAppTheme } from "@/core/theme/theme-provider";

type CardProps = ViewProps & {
  padded?: boolean;
};

export function Card({ style, children, padded = true, ...props }: CardProps) {
  const { colors, radius, shadow, spacing } = useAppTheme();

  return (
    <View
      {...props}
      style={[
        styles.base,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderRadius: radius.md,
          padding: padded ? spacing[4] : 0,
        },
        shadow.sm,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderWidth: 1,
  },
});
