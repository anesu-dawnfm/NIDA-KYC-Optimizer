import {
  AxiosError,
  AxiosHeaders,
  create,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from "axios";

import { env } from "@/core/config/env";
import { createCorrelationId } from "@/core/utils/create-correlation-id";
import { normalizeApiError } from "@/core/api/api-error";

type AccessTokenProvider = () => Promise<string | null>;

let accessTokenProvider: AccessTokenProvider = async () => null;

export function registerAccessTokenProvider(provider: AccessTokenProvider): void {
  accessTokenProvider = provider;
}

function attachRequestContext(
  config: InternalAxiosRequestConfig,
): InternalAxiosRequestConfig {
  const headers = AxiosHeaders.from(config.headers);
  headers.set("Accept", "application/json");
  headers.set("X-Correlation-ID", createCorrelationId());
  config.headers = headers;

  return config;
}

async function attachAuthorization(
  config: InternalAxiosRequestConfig,
): Promise<InternalAxiosRequestConfig> {
  const token = await accessTokenProvider();

  if (token) {
    config.headers.set("Authorization", `Bearer ${token}`);
  }

  return config;
}

function createApiClient(): AxiosInstance {
  const client = create({
    baseURL: env.apiBaseUrl,
    timeout: 30_000,
    headers: {
      "Content-Type": "application/json",
    },
  });

  client.interceptors.request.use(attachRequestContext);
  client.interceptors.request.use(attachAuthorization);
  client.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => Promise.reject(normalizeApiError(error)),
  );

  return client;
}

export const apiClient = createApiClient();
