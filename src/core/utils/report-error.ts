type ErrorContext = Readonly<Record<string, string | number | boolean>>;

export function reportError(error: unknown, context: ErrorContext = {}): void {
  const normalizedError =
    error instanceof Error ? error : new Error("Unknown application error");

  // Replace this console sink with the bank-approved, PII-redacting telemetry
  // adapter when observability infrastructure is selected.
  console.error(normalizedError.name, normalizedError.message, context);
}
