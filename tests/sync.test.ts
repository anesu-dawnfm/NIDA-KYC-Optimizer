import { beforeEach, describe, expect, it, vi } from "vitest";

import { calculateRetryDelayMs } from "@/features/sync/services/sync-backoff";
import {
  classifyNetworkType,
  formatNetworkLabel,
} from "@/features/sync/services/sync-network";
import { createPayloadFingerprint } from "@/features/sync/services/sync-fingerprint";

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("offline-first sync helpers", () => {
  it("classifies connectivity state", () => {
    expect(
      classifyNetworkType({
        isConnected: false,
        isInternetReachable: null,
        type: "wifi",
      }),
    ).toBe("offline");
    expect(
      classifyNetworkType({
        isConnected: true,
        isInternetReachable: true,
        type: "wifi",
      }),
    ).toBe("wifi");
    expect(
      classifyNetworkType({
        isConnected: true,
        isInternetReachable: true,
        type: "cellular",
      }),
    ).toBe("mobile");
    expect(formatNetworkLabel("mobile")).toBe("Mobile network");
  });

  it("calculates bounded exponential retry delays", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);

    expect(calculateRetryDelayMs(1)).toBe(1_000);
    expect(calculateRetryDelayMs(2)).toBe(2_000);
    expect(calculateRetryDelayMs(10)).toBeLessThanOrEqual(30_000);
  });

  it("generates stable fingerprints for equivalent payloads", async () => {
    const left = await createPayloadFingerprint({ a: 1, b: 2 });
    const right = await createPayloadFingerprint({ b: 2, a: 1 });

    expect(left).toBe(right);
    expect(left).toHaveLength(64);
  });
});
