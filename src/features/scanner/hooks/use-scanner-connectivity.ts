import { useNetInfo } from "@react-native-community/netinfo";

type ConnectivityState = {
  isOnline: boolean;
  label: string;
};

export function useScannerConnectivity(): ConnectivityState {
  const netInfo = useNetInfo();
  const isOnline = Boolean(
    netInfo.isConnected && netInfo.isInternetReachable !== false,
  );

  return {
    isOnline,
    label: isOnline ? "Online" : "Offline",
  };
}
