import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  CameraView,
  type CameraCapturedPicture,
  useCameraPermissions,
} from "expo-camera";

import { useAppTheme } from "@/core/theme/theme-provider";
import { ScannerAutoCaptureIndicator } from "@/features/scanner/components/scanner-auto-capture-indicator";
import { NidaScannerOverlay } from "@/features/scanner/components/nida-scanner-overlay";
import { ScannerTopStatus } from "@/features/scanner/components/scanner-top-status";
import { useScannerConnectivity } from "@/features/scanner/hooks/use-scanner-connectivity";
import { useScannerQueueCount } from "@/features/scanner/hooks/use-scanner-queue-count";
import { useOcrProcessor } from "@/features/ocr/hooks/use-ocr-processor";
import { Button } from "@/shared/components/ui";

export function NidaScannerScreen() {
  const { colors, spacing, typography, radius } = useAppTheme();
  const connectivity = useScannerConnectivity();
  const queueCount = useScannerQueueCount((state) => state.queueCount);
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<InstanceType<typeof CameraView> | null>(null);
  const { status, result, error, processOcr, reset } = useOcrProcessor();
  const [captureError, setCaptureError] = useState<string | null>(null);

  useEffect(() => {
    if (!permission?.granted && permission?.status !== "denied") {
      void requestPermission();
    }
  }, [permission, requestPermission]);

  const isProcessing = status === "processing";

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

  const handleScan = async () => {
    const camera = cameraRef.current;

    if (!camera) {
      setCaptureError("Camera is not ready yet.");
      return;
    }

    setCaptureError(null);
    reset();

    try {
      const photo: CameraCapturedPicture = await camera.takePictureAsync({
        quality: 0.9,
        exif: false,
        base64: false,
        shutterSound: false,
      });

      await processOcr({ imageUri: photo.uri });
    } catch (cause) {
      const message =
        cause instanceof Error ? cause.message : "Unable to process scan.";
      setCaptureError(message);
    }
  };

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
              ref={cameraRef}
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
            Images are processed on-device and deleted immediately after OCR.
          </Text>
          <Button
            fullWidth
            label={isProcessing ? "Scanning..." : "Scan NIDA Card"}
            loading={isProcessing}
            onPress={() => void handleScan()}
            variant="primary"
          />
          {captureError ? (
            <Text style={[styles.errorText, { color: colors.danger }]}>
              {captureError}
            </Text>
          ) : null}
          {error ? (
            <Text style={[styles.errorText, { color: colors.danger }]}>
              {error.message}
            </Text>
          ) : null}
          {result ? (
            <View
              style={[
                styles.resultBox,
                {
                  backgroundColor: colors.surfaceMuted,
                  borderColor: colors.border,
                  borderRadius: radius.md,
                  padding: spacing[3],
                },
              ]}
            >
              <Text
                style={[
                  styles.resultTitle,
                  {
                    color: colors.textPrimary,
                    fontFamily: typography.fontFamily.semibold,
                  },
                ]}
              >
                OCR Ready
              </Text>
              <Text
                style={[
                  styles.resultText,
                  {
                    color: colors.textSecondary,
                    fontFamily: typography.fontFamily.regular,
                  },
                ]}
              >
                {result.blocks.length} blocks recognized. {result.text.length}{" "}
                characters extracted.
              </Text>
            </View>
          ) : null}
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
  errorText: {
    fontSize: 13,
    lineHeight: 18,
  },
  resultBox: {
    borderWidth: 1,
    gap: 6,
  },
  resultTitle: {
    fontSize: 14,
  },
  resultText: {
    fontSize: 13,
    lineHeight: 18,
  },
});
