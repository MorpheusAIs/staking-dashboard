import { useCallback, useEffect, useState } from "react";
import { CHAIN_ID } from "staking-dashboard/lib/configs/constants";
import { useConfig } from "wagmi";
import { readContracts } from "wagmi/actions";
import type { Abi } from "viem";
import ERC20Abi from "staking-dashboard/lib/abi/ERC20.json";
import { getTokenBySymbol, getDistributorV2Address } from "staking-dashboard/lib/configs/capital.config";

/**
 * Hook to fetch capital staking token balance and allowance
 * @param address - User's wallet address
 * @param selectedToken - Selected token symbol (e.g., "USDC", "stETH")
 * @returns Token balance, allowance, loading state, and refresh function
 */
export const useCapitalStakingBalance = (
  address: `0x${string}` | undefined,
  selectedToken: string
) => {
  const config = useConfig();
  const [data, setData] = useState({
    balance: undefined as bigint | undefined,
    allowance: undefined as bigint | undefined,
    decimals: undefined as number | undefined,
  });
  const [isLoading, setIsLoading] = useState(false);

  // Function to refresh balance and allowance
  const refreshBalance = useCallback(async () => {
    if (!address) return;

    const token = getTokenBySymbol(selectedToken, CHAIN_ID.MAINNET);
    const distributorAddress = getDistributorV2Address(CHAIN_ID.MAINNET);
    
    if (!token || !distributorAddress) {
      console.error("Token or distributor address not found");
      return;
    }

    setIsLoading(true);
    try {
      // Batch balance and allowance reads into ONE multicall
      const contracts = [
        // 0: Token Balance
        {
          address: token.address,
          abi: ERC20Abi as Abi,
          functionName: "balanceOf",
          args: [address],
          chainId: CHAIN_ID.MAINNET,
        },
        // 1: Token Allowance
        {
          address: token.address,
          abi: ERC20Abi as Abi,
          functionName: "allowance",
          args: [address, distributorAddress],
          chainId: CHAIN_ID.MAINNET,
        },
      ];

      const results = await readContracts(config, { contracts });

      setData({
        balance: results[0].status === "success" ? (results[0].result as bigint) : undefined,
        allowance: results[1].status === "success" ? (results[1].result as bigint) : undefined,
        decimals: token.decimals,
      });
    } catch (error) {
      console.error("Error fetching capital staking balance:", error);
    } finally {
      setIsLoading(false);
    }
  }, [address, selectedToken, config]);

  // Fetch balance on mount and when address or token changes
  useEffect(() => {
    if (address && selectedToken) {
      refreshBalance();
    } else {
      // Reset data when no address
      setData({
        balance: undefined,
        allowance: undefined,
        decimals: undefined,
      });
    }
  }, [address, selectedToken, refreshBalance]);

  return {
    balance: data.balance,
    allowance: data.allowance,
    decimals: data.decimals,
    refreshBalance,
    isLoading,
  };
};

