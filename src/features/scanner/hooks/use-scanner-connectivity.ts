import { useNetInfo, type NetInfoState } from "@react-native-community/netinfo";

import { classifyNetworkType, formatNetworkLabel } from "@/features/sync";

type ConnectivityState = {
  isOnline: boolean;
  label: string;
  networkType: "offline" | "wifi" | "mobile";
};

export function useScannerConnectivity(): ConnectivityState {
  const netInfo = useNetInfo();
  const networkType = classifyNetworkType(netInfo as NetInfoState);
  const isOnline = networkType !== "offline";

  return {
    isOnline,
    label: formatNetworkLabel(networkType),
    networkType,
  };
}
