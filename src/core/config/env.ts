import "react-native-url-polyfill/auto";

type AppEnvironment = "development" | "test" | "staging" | "production";

function readAppEnvironment(value: string | undefined): AppEnvironment {
  switch (value) {
    case "test":
    case "staging":
    case "production":
      return value;
    default:
      return "development";
  }
}

function readApiBaseUrl(value: string | undefined, appEnv: AppEnvironment): URL {
  if (!value) {
    if (appEnv !== "production") {
      return new URL("http://localhost:3000");
    }

    throw new Error("EXPO_PUBLIC_API_BASE_URL is required in production.");
  }

  const url = new URL(value);

  if (appEnv === "production" && url.protocol !== "https:") {
    throw new Error("The production API base URL must use HTTPS.");
  }

  return url;
}

function readSupabaseConfig(appEnv: AppEnvironment): {
  supabaseAnonKey: string | null;
  supabaseUrl: string | null;
  hasSupabaseConfig: boolean;
} {
  const supabaseUrlValue = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const supabaseAnonKeyValue = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrlValue && !supabaseAnonKeyValue) {
    return {
      hasSupabaseConfig: false,
      supabaseAnonKey: null,
      supabaseUrl: null,
    };
  }

  if (!supabaseUrlValue || !supabaseAnonKeyValue) {
    throw new Error(
      "EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY must be configured together.",
    );
  }

  const supabaseUrl = new URL(supabaseUrlValue);

  if (appEnv === "production" && supabaseUrl.protocol !== "https:") {
    throw new Error("The Supabase URL must use HTTPS in production.");
  }

  return {
    hasSupabaseConfig: true,
    supabaseAnonKey: supabaseAnonKeyValue,
    supabaseUrl: supabaseUrl.toString().replace(/\/$/, ""),
  };
}

const appEnv = readAppEnvironment(process.env.EXPO_PUBLIC_APP_ENV);
const apiBaseUrl = readApiBaseUrl(process.env.EXPO_PUBLIC_API_BASE_URL, appEnv);
const supabaseConfig = readSupabaseConfig(appEnv);

export const env = Object.freeze({
  appEnv,
  apiBaseUrl: apiBaseUrl.toString().replace(/\/$/, ""),
  hasSupabaseConfig: supabaseConfig.hasSupabaseConfig,
  isDevelopment: appEnv === "development",
  isProduction: appEnv === "production",
  supabaseAnonKey: supabaseConfig.supabaseAnonKey,
  supabaseUrl: supabaseConfig.supabaseUrl,
});
