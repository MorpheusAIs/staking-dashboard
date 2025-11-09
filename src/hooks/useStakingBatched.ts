"use client";

import { useEffect, useState, useCallback } from "react";
import { useAccount, useChainId, useConfig } from "wagmi";
import { Address, type Abi } from "viem";
import { readContracts } from "wagmi/actions";
import ERC20Abi from "staking-dashboard/lib/abi/ERC20.json";
import BuilderSubnetsV2Abi from "staking-dashboard/lib/abi/BuilderSubnetsV2.json";
import BuildersAbi from "staking-dashboard/lib/abi/Builders.json";
import { arbitrumSepolia } from "viem/chains";

type BatchedStakingData = {
  tokenSymbol: string | null;
  tokenBalance: bigint | null;
  allowance: bigint | null;
  stakerData: unknown | null;
  claimableAmount: bigint | null;
};

export const useStakingDataBatched = (
  tokenAddress: Address | undefined,
  contractAddress: Address | undefined,
  subnetId: string | undefined,
  enabled: boolean = true
) => {
  const config = useConfig();
  const { address: connectedAddress } = useAccount();
  const chainId = useChainId();
  const isTestnet = chainId === arbitrumSepolia.id;

  const [data, setData] = useState<BatchedStakingData>({
    tokenSymbol: null,
    tokenBalance: null,
    allowance: null,
    stakerData: null,
    claimableAmount: null,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchBatchedData = useCallback(async () => {
    if (
      !enabled ||
      !tokenAddress ||
      !contractAddress ||
      !connectedAddress ||
      !subnetId
    ) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Batch all contract reads into a single multicall
      const contracts = [
        // 0: Token Symbol
        {
          address: tokenAddress,
          abi: ERC20Abi as Abi,
          functionName: "symbol",
          chainId,
        },
        // 1: Token Balance
        {
          address: tokenAddress,
          abi: ERC20Abi as Abi,
          functionName: "balanceOf",
          args: [connectedAddress],
          chainId,
        },
        // 2: Allowance
        {
          address: tokenAddress,
          abi: ERC20Abi as Abi,
          functionName: "allowance",
          args: [connectedAddress, contractAddress],
          chainId,
        },
        // 3: Staker Data
        {
          address: contractAddress,
          abi: (isTestnet ? BuilderSubnetsV2Abi : BuildersAbi) as Abi,
          functionName: isTestnet ? "stakers" : "usersData",
          args: isTestnet
            ? [subnetId, connectedAddress]
            : [connectedAddress, subnetId],
          chainId,
        },
        // 4: Claimable Amount
        {
          address: contractAddress,
          abi: (isTestnet ? BuilderSubnetsV2Abi : BuildersAbi) as Abi,
          functionName: isTestnet
            ? "getStakerRewards"
            : "getCurrentBuilderReward",
          args: isTestnet ? [subnetId, connectedAddress] : [subnetId],
          chainId,
        },
      ];

      const results = await readContracts(config, {
        contracts,
      });

      setData({
        tokenSymbol: results[0].status === "success" ? (results[0].result as string) : null,
        tokenBalance: results[1].status === "success" ? (results[1].result as bigint) : null,
        allowance: results[2].status === "success" ? (results[2].result as bigint) : null,
        stakerData: results[3].status === "success" ? results[3].result : null,
        claimableAmount: results[4].status === "success" ? (results[4].result as bigint) : null,
      });
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch batched data"));
      console.error("Error fetching batched staking data:", err);
    } finally {
      setIsLoading(false);
    }
  }, [
    config,
    tokenAddress,
    contractAddress,
    connectedAddress,
    subnetId,
    chainId,
    isTestnet,
    enabled,
  ]);

  // Fetch on mount and when dependencies change
  useEffect(() => {
    fetchBatchedData();
  }, [fetchBatchedData]);

  return {
    ...data,
    isLoading,
    error,
    refetch: fetchBatchedData,
  };
};
