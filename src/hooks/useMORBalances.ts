import { useCallback, useEffect, useRef } from "react";
import { morTokenContracts } from "staking-dashboard/lib/contracts";
import { CHAIN_ID, MOR_ABI } from "staking-dashboard/lib/utils/constants";
import { useReadContract } from "wagmi";

declare global {
  interface Window {
    refreshMORBalances?: () => Promise<void>;
  }
}

export const useMORBalances = (address: `0x${string}` | undefined) => {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const { data: arbitrumBalance, refetch: refetchArbitrum } = useReadContract({
    address: morTokenContracts[CHAIN_ID.ARBITRUM] as `0x${string}`,
    abi: MOR_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    chainId: CHAIN_ID.ARBITRUM,
    account: address,
  });

  const { data: baseBalance, refetch: refetchBase } = useReadContract({
    address: morTokenContracts[CHAIN_ID.BASE] as `0x${string}`,
    abi: MOR_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    chainId: CHAIN_ID.BASE,
    account: address,
  });

  console.log("address useMORBalances", address);
  console.log("mortoken", morTokenContracts[CHAIN_ID.ARBITRUM_SEPOLIA]);
  const { data: arbitrumSepoliaBalance, refetch: refetchSepolia } =
    useReadContract({
      address: morTokenContracts[CHAIN_ID.ARBITRUM_SEPOLIA] as `0x${string}`,
      abi: MOR_ABI,
      functionName: "balanceOf",
      args: address ? [address] : undefined,
      chainId: CHAIN_ID.ARBITRUM_SEPOLIA,
      account: address,
      query: {
        enabled: !!address && !!morTokenContracts[CHAIN_ID.ARBITRUM_SEPOLIA],
      },
    });

  console.log("arbitrumSepoliaBalance useMORBalances", arbitrumSepoliaBalance);

  // Function to refresh all balances
  const refreshBalances = useCallback(async () => {
    await Promise.all([refetchArbitrum(), refetchBase(), refetchSepolia()]);
  }, [refetchArbitrum, refetchBase, refetchSepolia]);

  // Set up polling for balance updates instead of watching events
  useEffect(() => {
    if (!address) {
      // Clear interval if no address
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Poll for balance updates every 30 seconds
    // This is more reliable than event watching with RPC providers that don't support filters
    intervalRef.current = setInterval(() => {
      refreshBalances();
    }, 30000); // 30 seconds

    // Cleanup interval on unmount or address change
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [address, refreshBalances]);

  return {
    arbitrumBalance,
    baseBalance,
    arbitrumSepoliaBalance,
    refreshBalances,
  };
};
