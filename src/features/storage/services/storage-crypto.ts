import * as SecureStore from "expo-secure-store";

import { StorageError } from "@/features/storage/errors/storage-error";

const KEY_ALIAS = "kyc_optimizer_local_storage_key";
const IV_LENGTH_BYTES = 12;
const KEY_LENGTH_BYTES = 32;

type CryptoLike = Crypto & {
  randomUUID?: () => string;
};

function getCrypto(): CryptoLike {
  const crypto = globalThis.crypto as CryptoLike | undefined;

  if (!crypto?.subtle || !crypto.getRandomValues) {
    throw new StorageError(
      "encryption_failed",
      "Secure Web Crypto is not available in this runtime.",
    );
  }

  return crypto;
}

export async function getOrCreateEncryptionKey(): Promise<string> {
  const storedKey = await SecureStore.getItemAsync(KEY_ALIAS);
  if (storedKey) {
    return storedKey;
  }

  const keyBytes = randomBytes(KEY_LENGTH_BYTES);
  const normalizedKey = bytesToHex(keyBytes);

  await SecureStore.setItemAsync(KEY_ALIAS, normalizedKey, {
    keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
  });

  return normalizedKey;
}

export async function encryptPayload(payload: unknown): Promise<string> {
  try {
    const crypto = getCrypto();
    const keyBytes = hexToBytes(await getOrCreateEncryptionKey());
    const iv = randomBytes(IV_LENGTH_BYTES);
    const secretKey = await crypto.subtle.importKey(
      "raw",
      toArrayBuffer(keyBytes),
      "AES-GCM",
      false,
      ["encrypt"],
    );
    const plaintext = new TextEncoder().encode(JSON.stringify(payload));
    const encryptedBuffer = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv: toArrayBuffer(iv) },
      secretKey,
      toArrayBuffer(plaintext),
    );

    return [bytesToHex(iv), bytesToHex(new Uint8Array(encryptedBuffer))].join(
      ":",
    );
  } catch (cause) {
    throw new StorageError("encryption_failed", "Failed to encrypt payload.", cause);
  }
}

export async function decryptPayload<T>(encryptedPayload: string): Promise<T> {
  try {
    const crypto = getCrypto();
    const [ivHex, payloadHex] = encryptedPayload.split(":");

    if (!ivHex || !payloadHex) {
      throw new StorageError("decryption_failed", "Encrypted payload is malformed.");
    }

    const keyBytes = hexToBytes(await getOrCreateEncryptionKey());
    const iv = hexToBytes(ivHex);
    const payloadBytes = hexToBytes(payloadHex);
    const secretKey = await crypto.subtle.importKey(
      "raw",
      toArrayBuffer(keyBytes),
      "AES-GCM",
      false,
      ["decrypt"],
    );
    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: toArrayBuffer(iv) },
      secretKey,
      toArrayBuffer(payloadBytes),
    );

    return JSON.parse(new TextDecoder().decode(decryptedBuffer)) as T;
  } catch (cause) {
    if (cause instanceof StorageError) {
      throw cause;
    }

    throw new StorageError("decryption_failed", "Failed to decrypt payload.", cause);
  }
}

export function createSessionId(): string {
  const crypto = globalThis.crypto as CryptoLike | undefined;
  if (crypto?.randomUUID) {
    return crypto.randomUUID();
  }

  return bytesToHex(randomBytes(16));
}

function randomBytes(length: number): Uint8Array<ArrayBuffer> {
  const bytes = new Uint8Array(length);
  getCrypto().getRandomValues(bytes);
  return bytes as Uint8Array<ArrayBuffer>;
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function hexToBytes(hex: string): Uint8Array {
  if (hex.length % 2 !== 0) {
    throw new StorageError("decryption_failed", "Invalid hex payload.");
  }

  const bytes = new Uint8Array(hex.length / 2);
  for (let index = 0; index < hex.length; index += 2) {
    bytes[index / 2] = Number.parseInt(hex.slice(index, index + 2), 16);
  }

  return bytes;
}

function toArrayBuffer(bytes: Uint8Array<ArrayBufferLike>): ArrayBuffer {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(new Uint8Array(bytes.buffer, bytes.byteOffset, bytes.byteLength));
  return copy.buffer as ArrayBuffer;
}
