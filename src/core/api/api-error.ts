import { isAxiosError, type AxiosError } from "axios";

export type ApiErrorCode =
  | "network_error"
  | "request_timeout"
  | "unauthorized"
  | "forbidden"
  | "not_found"
  | "conflict"
  | "validation_error"
  | "server_error"
  | "unknown_error";

export class ApiError extends Error {
  readonly code: ApiErrorCode;
  readonly status: number | undefined;
  readonly correlationId: string | undefined;

  constructor(options: {
    code: ApiErrorCode;
    message: string;
    status?: number;
    correlationId?: string;
  }) {
    super(options.message);
    this.name = "ApiError";
    this.code = options.code;
    this.status = options.status;
    this.correlationId = options.correlationId;
  }
}

function codeFromStatus(status: number | undefined): ApiErrorCode {
  switch (status) {
    case 400:
    case 422:
      return "validation_error";
    case 401:
      return "unauthorized";
    case 403:
      return "forbidden";
    case 404:
      return "not_found";
    case 409:
      return "conflict";
    default:
      return status !== undefined && status >= 500
        ? "server_error"
        : "unknown_error";
  }
}

export function normalizeApiError(error: AxiosError): ApiError {
  const status = error.response?.status;
  const correlationHeader = error.response?.headers["x-correlation-id"];
  const correlationId =
    typeof correlationHeader === "string" ? correlationHeader : undefined;

  if (error.code === "ECONNABORTED") {
    return new ApiError({
      code: "request_timeout",
      message: "The request timed out.",
      ...(correlationId === undefined ? {} : { correlationId }),
      ...(status === undefined ? {} : { status }),
    });
  }

  if (!error.response && isAxiosError(error)) {
    return new ApiError({
      code: "network_error",
      message: "The service could not be reached.",
      ...(correlationId === undefined ? {} : { correlationId }),
    });
  }

  return new ApiError({
    code: codeFromStatus(status),
    message: "The request could not be completed.",
    ...(correlationId === undefined ? {} : { correlationId }),
    ...(status === undefined ? {} : { status }),
  });
}
