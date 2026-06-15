import type { SyncNetworkType } from "@/features/sync/types/sync";

type NetworkStateInput = {
  isConnected: boolean | null;
  isInternetReachable: boolean | null;
  type: string;
};

export function classifyNetworkType(
  netInfo: NetworkStateInput,
): SyncNetworkType {
  if (!netInfo.isConnected || netInfo.isInternetReachable === false) {
    return "offline";
  }

  if (netInfo.type === "cellular") {
    return "mobile";
  }

  return "wifi";
}

export function formatNetworkLabel(networkType: SyncNetworkType): string {
  switch (networkType) {
    case "wifi":
      return "Wi-Fi";
    case "mobile":
      return "Mobile network";
    case "offline":
    default:
      return "Offline";
  }
}
