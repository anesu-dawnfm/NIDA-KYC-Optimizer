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

const appEnv = readAppEnvironment(process.env.EXPO_PUBLIC_APP_ENV);
const apiBaseUrl = readApiBaseUrl(process.env.EXPO_PUBLIC_API_BASE_URL, appEnv);

export const env = Object.freeze({
  appEnv,
  apiBaseUrl: apiBaseUrl.toString().replace(/\/$/, ""),
  isDevelopment: appEnv === "development",
  isProduction: appEnv === "production",
});
