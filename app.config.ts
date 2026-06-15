import type { ConfigContext, ExpoConfig } from "expo/config";

const APP_ENV = process.env.EXPO_PUBLIC_APP_ENV ?? "development";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "KYC Optimizer",
  slug: "kyc-optimizer",
  scheme: "kyc-optimizer",
  version: "0.1.0",
  orientation: "portrait",
  userInterfaceStyle: "automatic",
  ios: {
    supportsTablet: false,
    bundleIdentifier: "com.stanbic.kycoptimizer",
    infoPlist: {
      NSCameraUsageDescription:
        "Allow camera access to scan NIDA cards for KYC verification.",
    },
  },
  android: {
    package: "com.stanbic.kycoptimizer",
  },
  plugins: [
    "expo-router",
    "expo-font",
    "expo-secure-store",
    "expo-sqlite",
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    appEnv: APP_ENV,
  },
});
