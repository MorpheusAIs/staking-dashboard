import RewardPoolV2Abi from "staking-dashboard/lib/abi/RewardPoolV2.json";
import DepositPoolAbi from "staking-dashboard/lib/abi/DepositPool.json";
import DistributorV2Abi from "staking-dashboard/lib/abi/DistributorV2.json";
import {
  AssetSymbol,
  getAssetConfig,
} from "staking-dashboard/lib/configs/asset";
import { useReadContract } from "wagmi";
import { useMemo } from "react";
import {
  getContractAddress,
  mainnetChains,
} from "staking-dashboard/lib/networks";
import { ContractAddresses } from "staking-dashboard/@types/common";
import { formatUnits, zeroAddress } from "viem";

type UseDailyEmissionsParams = {
  userDeposited: bigint | undefined;
  assetSymbol: AssetSymbol;
  poolIndex?: number; // Optional pool index override
  totalUSDValueAllPools?: number; // Total USD value across all pools
  assetPrice?: number; // Price of this specific asset
};

type DailyEmissionsResult = {
  emissions: number;
  isLoading: boolean;
};

/**
 * Hook for calculating daily emissions based on V7 protocol reward distribution
 */
export function useDailyEmissions(
  args: UseDailyEmissionsParams
): DailyEmissionsResult {
  const {
    userDeposited,
    assetSymbol,
    poolIndex = 0,
    totalUSDValueAllPools,
    assetPrice,
  } = args;

  // =============== HELPER
  // Get DepositPool contract address for total stake calculation
  const getDepositPoolContractKey = (
    symbol: AssetSymbol
  ): keyof ContractAddresses | null => {
    const mapping: Record<AssetSymbol, keyof ContractAddresses> = {
      stETH: "stETHDepositPool",
      LINK: "linkDepositPool",
      USDC: "usdcDepositPool",
      USDT: "usdtDepositPool",
      wBTC: "wbtcDepositPool",
      wETH: "wethDepositPool",
    };
    return mapping[symbol] || null;
  };

  // =============== VARIABLES

  // Get asset configuration for correct decimal handling
  const assetConfig = getAssetConfig(assetSymbol, "mainnet");
  const assetDecimals = assetConfig?.metadata.decimals || 18;
  const l1ChainId = mainnetChains.mainnet.id;
  // Use provided pool index or default to 0 for Capital pool
  const rewardPoolIndex = BigInt(poolIndex ?? 0);
  const now = Math.floor(Date.now() / 1000);
  const twentyFourHoursAgo = now - 24 * 60 * 60;
  const startTime = BigInt(twentyFourHoursAgo);
  const endTime = BigInt(now);

  // Get RewardPoolV2 contract address (the main emission contract)
  const rewardPoolAddress = getContractAddress(
    l1ChainId,
    "rewardPoolV2",
    "mainnet"
  ) as `0x${string}` | undefined;

  // Get DistributorV2 contract address (for yield-based reward allocation)
  const distributorV2Address = getContractAddress(
    l1ChainId,
    "distributorV2",
    "mainnet"
  ) as `0x${string}` | undefined;

  // =============== MEMO
  const depositPoolAddress = useMemo(() => {
    const contractKey = getDepositPoolContractKey(assetSymbol);
    if (!contractKey) return undefined;
    return getContractAddress(l1ChainId, contractKey, "mainnet") as
      | `0x${string}`
      | undefined;
  }, [l1ChainId, assetSymbol]);

  // =============== CONTRACT READS
  // Check if the reward pool exists before querying rewards
  const { data: poolExists, isLoading: isLoadingPoolExists } = useReadContract({
    address: rewardPoolAddress,
    abi: RewardPoolV2Abi,
    functionName: "isRewardPoolExist",
    args: [rewardPoolIndex],
    chainId: l1ChainId,
    query: {
      enabled: !!rewardPoolAddress,
    },
  });

  // Get total daily rewards for the entire capital pool (pool index 0)
  const { data: dailyPoolRewards, isLoading: isLoadingPoolRewards } =
    useReadContract({
      address: rewardPoolAddress,
      abi: [
        {
          inputs: [
            { name: "index_", type: "uint256" },
            { name: "startTime_", type: "uint128" },
            { name: "endTime_", type: "uint128" },
          ],
          name: "getPeriodRewards",
          outputs: [{ name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function",
        },
      ],
      functionName: "getPeriodRewards",
      args: [BigInt(0), startTime, endTime], // Always use pool index 0 for total capital pool rewards
      chainId: l1ChainId,
      query: {
        enabled: !!rewardPoolAddress,
        refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
      },
    });

  // Get total staked amount in this specific deposit pool
  const { data: totalStaked, isLoading: isLoadingTotalStaked } =
    useReadContract({
      address: depositPoolAddress,
      abi: DepositPoolAbi,
      functionName: "totalDepositedInPublicPools",
      chainId: l1ChainId,
      query: {
        enabled: !!depositPoolAddress,
        refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
      },
    });

  // Get MOR rewards allocated to this deposit pool from DistributorV2
  // This gives us the yield-based allocation from the last distributeRewards() call
  const { data: allocatedRewards, isLoading: isLoadingAllocatedRewards } =
    useReadContract({
      address: distributorV2Address,
      abi: DistributorV2Abi,
      functionName: "distributedRewards",
      args: [rewardPoolIndex, depositPoolAddress || zeroAddress],
      chainId: l1ChainId,
      query: {
        enabled: !!distributorV2Address && !!depositPoolAddress,
        refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
      },
    });

  // =============== VARIABLES
  // Early return if contract data not available
  const isLoading =
    isLoadingPoolRewards ||
    isLoadingTotalStaked ||
    isLoadingPoolExists ||
    isLoadingAllocatedRewards;

  // =============== LOGIC
  const computeDailyEmissions = () => {
    // Early return if user has no stake
    if (!userDeposited || userDeposited === BigInt(0)) {
      return 0;
    }

    // Early return if essential data missing
    if (!dailyPoolRewards || !totalStaked || isLoading) return 0;

    // Early return if data types incorrect
    if (typeof dailyPoolRewards !== "bigint" || typeof totalStaked !== "bigint")
      return 0;

    // Total MOR rewards for 24h period (MOR always 18 decimals)
    const totalDailyRewards = Number(formatUnits(dailyPoolRewards, 18));
    // Total staked in this pool
    const totalStake = Number(formatUnits(totalStaked, assetDecimals));
    // User's stake
    const userStake = Number(formatUnits(userDeposited, assetDecimals));
    // Historical MOR allocation to this pool
    const poolAllocatedRewards =
      allocatedRewards && typeof allocatedRewards === "bigint"
        ? Number(formatUnits(allocatedRewards, 18))
        : 0;

    if (totalStake <= 0 || totalDailyRewards <= 0) {
      return 0;
    }

    // CORRECT USD-BASED FORMULA (per MOR Distribution v7 documentation):
    // 1. Total MOR rewards are allocated proportionally to USD VALUE of pools
    // 2. Within each pool, users get rewards proportional to their stake
    // Formula: rewardShare = (poolUSDValue * totalRewards) / totalUSDValue

    let poolUSDShare = 0;

    if (
      totalUSDValueAllPools &&
      totalUSDValueAllPools > 0 &&
      assetPrice &&
      assetPrice > 0
    ) {
      // Calculate this pool's USD value
      const poolUSDValue = totalStake * assetPrice;

      // Calculate pool's proportional share based on USD value
      poolUSDShare = poolUSDValue / totalUSDValueAllPools;

      console.log(`💰 [${assetSymbol}] USD-based pool calculation:`, {
        totalStakeInPool: totalStake,
        assetPrice: assetPrice,
        poolUSDValue: poolUSDValue.toFixed(2),
        totalUSDValueAllPools: totalUSDValueAllPools.toFixed(2),
        poolUSDShare: (poolUSDShare * 100).toFixed(4) + "%",
      });
    } else {
      // Fallback: Use historical allocation data if USD values not available
      const estimatedTotalHistoricalRewards = Math.max(
        totalDailyRewards * 30,
        1000
      );

      if (poolAllocatedRewards > 0) {
        poolUSDShare = Math.min(
          poolAllocatedRewards / estimatedTotalHistoricalRewards,
          1.0
        );
        poolUSDShare = Math.max(poolUSDShare, 0.000001); // Minimum 0.0001% share
      } else {
        poolUSDShare = 0.000001; // Minimal fallback share
      }

      console.log(`📊 [${assetSymbol}] Fallback to historical allocation:`, {
        reason: !totalUSDValueAllPools
          ? "No total USD value"
          : !assetPrice
          ? "No asset price"
          : "Unknown",
        poolAllocatedRewards: poolAllocatedRewards.toFixed(2),
        estimatedTotal: estimatedTotalHistoricalRewards.toFixed(2),
        fallbackShare: (poolUSDShare * 100).toFixed(6) + "%",
      });
    }

    // User's share within the pool (stake-based)
    const userShareOfPool = userStake / totalStake;

    // Final calculation: total rewards × pool's USD share × user's share within pool
    const userDailyEmissions =
      totalDailyRewards * poolUSDShare * userShareOfPool;

    console.log(`📊 [${assetSymbol}] USD-BASED Daily emissions:`, {
      userStake,
      totalStakeInPool: totalStake,
      userShareOfPool: (userShareOfPool * 100).toFixed(6) + "%",
      poolUSDShare: (poolUSDShare * 100).toFixed(6) + "%",
      totalDailyRewards: totalDailyRewards.toFixed(2),
      userDailyEmissions: userDailyEmissions.toFixed(6),
      period: "24 hours",
      rewardPoolIndex: rewardPoolIndex.toString(),
      calculation: "USD-based: totalRewards × poolUSDShare × userShareOfPool",
      method:
        totalUSDValueAllPools && assetPrice
          ? "USD Value Proportional"
          : "Historical Allocation Fallback",
    });

    return Math.max(0, userDailyEmissions);
  };

  return {
    emissions: computeDailyEmissions(),
    isLoading:
      isLoadingPoolRewards ||
      isLoadingTotalStaked ||
      isLoadingPoolExists ||
      isLoadingAllocatedRewards,
  };
}
