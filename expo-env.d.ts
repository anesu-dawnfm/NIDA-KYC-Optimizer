/// <reference types="expo/types" />

declare namespace NodeJS {
  interface ProcessEnv {
    readonly EXPO_PUBLIC_APP_ENV?:
      | "development"
      | "test"
      | "staging"
      | "production";
    readonly EXPO_PUBLIC_API_BASE_URL?: string;
  }
}
