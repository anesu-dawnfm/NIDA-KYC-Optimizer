import { describe, expect, it, vi, beforeEach } from "vitest";

import { SQLiteSessionStorageRepository, decryptPayload, encryptPayload } from "../src/features/storage";

const secureStoreMemory = new Map<string, string>();

vi.mock("expo-secure-store", () => ({
  getItemAsync: vi.fn(async (key: string) => secureStoreMemory.get(key) ?? null),
  setItemAsync: vi.fn(async (key: string, value: string) => {
    secureStoreMemory.set(key, value);
  }),
  AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY: "AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY",
}));

vi.mock("expo-sqlite", () => ({
  openDatabaseAsync: vi.fn(async () => ({
    execAsync: vi.fn(async () => undefined),
    runAsync: vi.fn(async () => ({ lastInsertRowId: 1 })),
    getFirstAsync: vi.fn(async () => null),
    getAllAsync: vi.fn(async () => []),
  })),
}));

beforeEach(() => {
  vi.restoreAllMocks();
  secureStoreMemory.clear();
});

describe("storage crypto", () => {
  it("encrypts and decrypts payloads", async () => {
    const payload = {
      sessionId: "session-1",
      timestamp: "2026-06-15T00:00:00.000Z",
    };

    const encrypted = await encryptPayload(payload);
    const decrypted = await decryptPayload<typeof payload>(encrypted);

    expect(decrypted).toEqual(payload);
  });
});

describe("SQLiteSessionStorageRepository", () => {
  it("creates a persisted encrypted session record", async () => {
    const repository = new SQLiteSessionStorageRepository();

    const record = await repository.create({
      payload: { foo: "bar" },
      sessionId: "session-1",
      timestamp: "2026-06-15T10:00:00.000Z",
    });

    expect(record.sessionId).toBe("session-1");
    expect(record.syncStatus).toBe("pending");
    expect(record.encryptedPayload).toContain(":");
  });
});
