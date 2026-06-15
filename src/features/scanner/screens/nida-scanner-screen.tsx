import { useEffect, useMemo } from "react";
import {
  ActivityIndicator,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";

import { useAppTheme } from "@/core/theme/theme-provider";
import { ScannerAutoCaptureIndicator } from "@/features/scanner/components/scanner-auto-capture-indicator";
import { NidaScannerOverlay } from "@/features/scanner/components/nida-scanner-overlay";
import { ScannerTopStatus } from "@/features/scanner/components/scanner-top-status";
import { useScannerConnectivity } from "@/features/scanner/hooks/use-scanner-connectivity";
import { useScannerQueueCount } from "@/features/scanner/hooks/use-scanner-queue-count";
import { Button } from "@/shared/components/ui";

export function NidaScannerScreen() {
  const { colors, spacing, typography, radius } = useAppTheme();
  const connectivity = useScannerConnectivity();
  const queueCount = useScannerQueueCount((state) => state.queueCount);
  const [permission, requestPermission] = useCameraPermissions();

  useEffect(() => {
    if (!permission?.granted && permission?.status !== "denied") {
      void requestPermission();
    }
  }, [permission, requestPermission]);

  const permissionContent = useMemo(() => {
    if (!permission) {
      return (
        <View style={styles.permissionBox}>
          <ActivityIndicator color={colors.primary} />
          <Text
            style={[
              styles.permissionText,
              {
                color: colors.textSecondary,
                fontFamily: typography.fontFamily.medium,
              },
            ]}
          >
            Requesting camera permission
          </Text>
        </View>
      );
    }

    if (!permission.granted) {
      return (
        <View style={styles.permissionBox}>
          <Text
            style={[
              styles.permissionTitle,
              {
                color: colors.textPrimary,
                fontFamily: typography.fontFamily.semibold,
              },
            ]}
          >
            Camera access required
          </Text>
          <Text
            style={[
              styles.permissionText,
              {
                color: colors.textSecondary,
                fontFamily: typography.fontFamily.regular,
              },
            ]}
          >
            NIDA card scanning needs camera permission. No images are stored on
            the device.
          </Text>
          <Button
            fullWidth
            label="Grant Camera Access"
            onPress={() => void requestPermission()}
            variant="primary"
          />
        </View>
      );
    }

    return null;
  }, [colors, permission, requestPermission, typography]);

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        {
          backgroundColor: colors.background,
        },
      ]}
    >
      <ScannerTopStatus
        isAutoCaptureActive
        label={connectivity.label}
        queueCount={queueCount}
      />

      <View style={styles.screen}>
        <View style={styles.previewShell}>
          {permission?.granted ? (
            <CameraView
              facing="back"
              style={styles.preview}
              enableTorch={false}
            />
          ) : (
            <View
              style={[
                styles.previewFallback,
                {
                  backgroundColor: colors.surfaceMuted,
                  borderColor: colors.border,
                  borderRadius: radius.md,
                },
              ]}
            />
          )}

          <View style={styles.overlayContainer}>
            <NidaScannerOverlay />
          </View>
        </View>

        <View
          style={[
            styles.footer,
            {
              backgroundColor: colors.background,
              borderTopColor: colors.border,
              paddingHorizontal: spacing[4],
              paddingVertical: spacing[4],
            },
          ]}
        >
          <ScannerAutoCaptureIndicator />
          <Text
            style={[
              styles.footerText,
              {
                color: colors.textSecondary,
                fontFamily: typography.fontFamily.regular,
              },
            ]}
          >
            Images are not stored. Capture output is processed in memory only and
            handed off to the validation flow.
          </Text>
        </View>
      </View>

      {permissionContent}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  screen: {
    flex: 1,
  },
  previewShell: {
    flex: 1,
    overflow: "hidden",
  },
  preview: {
    flex: 1,
  },
  previewFallback: {
    borderWidth: 1,
    flex: 1,
  },
  overlayContainer: {
    alignItems: "center",
    bottom: 0,
    justifyContent: "center",
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
  },
  footer: {
    borderTopWidth: 1,
    gap: 12,
  },
  footerText: {
    fontSize: 13,
    lineHeight: 18,
  },
  permissionBox: {
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    gap: 12,
    padding: 24,
  },
  permissionTitle: {
    fontSize: 18,
    marginBottom: 4,
  },
  permissionText: {
    fontSize: 14,
    lineHeight: 20,
  },
});
