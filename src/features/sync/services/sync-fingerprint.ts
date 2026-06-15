import { StorageError } from "@/features/storage/errors/storage-error";

function getCrypto(): Crypto {
  const crypto = globalThis.crypto;

  if (!crypto?.subtle) {
    throw new StorageError(
      "encryption_failed",
      "Secure Web Crypto is not available in this runtime.",
    );
  }

  return crypto;
}

export async function createPayloadFingerprint(payload: unknown): Promise<string> {
  const encoded = new TextEncoder().encode(stableStringify(payload));
  const digest = await getCrypto().subtle.digest("SHA-256", encoded);

  return bytesToHex(new Uint8Array(digest));
}

function stableStringify(value: unknown): string {
  if (
    value === null ||
    (Object.prototype.toString.call(value) !== "[object Object]" &&
      !Array.isArray(value))
  ) {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  }

  const entries = Object.entries(value as Record<string, unknown>)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, item]) => `${JSON.stringify(key)}:${stableStringify(item)}`);

  return `{${entries.join(",")}}`;
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}
