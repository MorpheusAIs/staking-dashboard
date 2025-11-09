import { useCallback, useEffect, useState } from "react";
import { morTokenContracts } from "staking-dashboard/lib/contracts";
import { CHAIN_ID, MOR_ABI } from "staking-dashboard/lib/configs/constants";
import { useConfig } from "wagmi";
import { readContracts } from "wagmi/actions";
import type { Abi } from "viem";

declare global {
  interface Window {
    refreshMORBalances?: () => Promise<void>;
  }
}

export const useMORBalances = (address: `0x${string}` | undefined) => {
  const config = useConfig();
  const [balances, setBalances] = useState({
    mainnetBalance: undefined as bigint | undefined,
    arbitrumBalance: undefined as bigint | undefined,
    baseBalance: undefined as bigint | undefined,
    arbitrumSepoliaBalance: undefined as bigint | undefined,
  });
  const [isLoading, setIsLoading] = useState(false);

  // Function to refresh all balances using a single batched multicall
  const refreshBalances = useCallback(async () => {
    if (!address) return;

    setIsLoading(true);
    try {
      // Batch all 4 balance reads into ONE multicall
      const contracts = [
        {
          address: morTokenContracts[CHAIN_ID.MAINNET] as `0x${string}`,
          abi: MOR_ABI as Abi,
          functionName: "balanceOf",
          args: [address],
          chainId: CHAIN_ID.MAINNET,
        },
        {
          address: morTokenContracts[CHAIN_ID.ARBITRUM] as `0x${string}`,
          abi: MOR_ABI as Abi,
          functionName: "balanceOf",
          args: [address],
          chainId: CHAIN_ID.ARBITRUM,
        },
        {
          address: morTokenContracts[CHAIN_ID.BASE] as `0x${string}`,
          abi: MOR_ABI as Abi,
          functionName: "balanceOf",
          args: [address],
          chainId: CHAIN_ID.BASE,
        },
        {
          address: morTokenContracts[CHAIN_ID.ARBITRUM_SEPOLIA] as `0x${string}`,
          abi: MOR_ABI as Abi,
          functionName: "balanceOf",
          args: [address],
          chainId: CHAIN_ID.ARBITRUM_SEPOLIA,
        },
      ];

      const results = await readContracts(config, { contracts });

      setBalances({
        mainnetBalance: results[0].status === "success" ? (results[0].result as bigint) : undefined,
        arbitrumBalance: results[1].status === "success" ? (results[1].result as bigint) : undefined,
        baseBalance: results[2].status === "success" ? (results[2].result as bigint) : undefined,
        arbitrumSepoliaBalance: results[3].status === "success" ? (results[3].result as bigint) : undefined,
      });
    } catch (error) {
      console.error("Error fetching MOR balances:", error);
    } finally {
      setIsLoading(false);
    }
  }, [address, config]);

  // Fetch balances on mount
  useEffect(() => {
    if (address) {
      refreshBalances();
    }
  }, [address, refreshBalances]);

  // Expose refresh function globally for manual refresh
  useEffect(() => {
    if (address) {
      window.refreshMORBalances = refreshBalances;
    }
    return () => {
      delete window.refreshMORBalances;
    };
  }, [address, refreshBalances]);

  return {
    ...balances,
    refreshBalances,
    isLoading,
  };
};
