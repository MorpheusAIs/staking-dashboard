"use client";
import { memo, useEffect, useMemo, useState } from "react";
import { useCapitalStaking } from "staking-dashboard/hooks/useCapitalStaking";
import {
  AssetSymbol,
  getAssetConfig,
} from "staking-dashboard/lib/configs/asset";
import { fetchWithCache } from "staking-dashboard/lib/graphql/fetchQuery";
import { AssetPriceMap, Metrics, UserAsset } from "../../type";
import {
  buildUserAsset,
  checkHasStakedAssets,
  formatDailyEmissions,
  formatNumber,
} from "../../helper";
import { VStack } from "@chakra-ui/react";
import { useTotalMorEarned } from "staking-dashboard/hooks/useTotalMorEarned";
import MetricsData from "./MetricsData";
import StakingTable from "../tables/StakingTable";
import { useAllDailyEmissions } from "staking-dashboard/hooks/useAllDailyEmissions";

// DefiLlama token addresses for direct API calls (Ethereum mainnet + LINK)
const DEFILLAMA_TOKEN_ADDRESSES = {
  stETH: "ethereum:0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84",
  wBTC: "ethereum:0x2260fac5e5542a773aa44fbcfedf7c193bc2c599",
  wETH: "ethereum:0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
  LINK: "ethereum:0x514910771AF9Ca656af840dff83E8264EcF986CA",
} as const;

/**
 * ===========================
 * MAIN
 * ===========================
 */
export const StakingPosition = memo(() => {
  // =============== HOOKS
  const {
    assets,
    networkEnv,
    userAddress,
    isProcessingClaim,
    isProcessingDeposit,
    isProcessingWithdraw,
    isProcessingChangeLock,
  } = useCapitalStaking();
  const { totalEarnedMOR, isLoading } = useTotalMorEarned({ userAddress });

  // =============== STATE
  const [depositValue, setDepositValue] = useState(0);
  const [assetPrice, setAssetPrice] = useState<AssetPriceMap>({});
  const [isLoadingPrices, setIsLoadingPrices] = useState(true);

  // ============== MEMO
  // Calculate total USD value across all pools for proportional distribution
  const totalUSDValueAllPools = useMemo(() => {
    return Object.values(assets).reduce((total, asset) => {
      const assetConfigData = getAssetConfig(asset.symbol, networkEnv);
      const decimals = assetConfigData?.metadata?.decimals || 18;
      const totalStaked = Number(asset.totalDeposited) / Math.pow(10, decimals);
      const assetPriceValue = assetPrice[asset.symbol];

      if (assetPriceValue && assetPriceValue > 0 && totalStaked > 0) {
        const value = totalStaked * assetPriceValue;

        return total + value;
      }
      return total;
    }, 0);
  }, [assets, assetPrice, networkEnv]);

  // =============== DAILY EMISSIONS
  // Calculate daily emissions for each asset dynamically using real contract data
  const {
    stETHEmissions,
    usdcEmissions,
    usdtEmissions,
    wbtcEmissions,
    wethEmissions,
  } = useAllDailyEmissions({
    assets,
    totalUSDValueAllPools,
    assetPrice,
  });

  // =============== VARIABLES
  const hasStakedAssets = checkHasStakedAssets(assets);
  const supportedAssets = Object.keys(assets) as AssetSymbol[];
  const isAnyActionProcessing =
    isProcessingDeposit ||
    isProcessingClaim ||
    isProcessingWithdraw ||
    isProcessingChangeLock;

  // =============== EFFECTS
  useEffect(() => {
    setIsLoadingPrices(true);
    // Fetch token prices from DefiLlama and calculate total deposit value by the connected user
    const fetchTokenPrices = async () => {
      try {
        const tokenAddresses = Object.values(DEFILLAMA_TOKEN_ADDRESSES).join(
          ","
        );

        // fetch the price data with cache
        const data = await fetchWithCache(
          "defiLlamaPrices",
          `https://coins.llama.fi/prices/current/${tokenAddresses}`,
          60000
        );

        let totalValue = 0;
        // Build asset price map first
        const prices: Record<string, number> = {
          USDT: 1,
          USDC: 1,
          ...Object.fromEntries(
            Object.entries(DEFILLAMA_TOKEN_ADDRESSES).map(
              ([symbol, address]) => {
                const priceData = data.coins[address];
                return [symbol, priceData?.price || 0];
              }
            )
          ),
        };

        for (const asset of Object.values(assets)) {
          const config = getAssetConfig(asset.config.symbol, networkEnv);
          if (!config) continue;

          const decimals = config?.metadata?.decimals || 18;
          const symbol = asset.config.symbol;

          const defillamaAddress =
            DEFILLAMA_TOKEN_ADDRESSES[
              asset.config.symbol as keyof typeof DEFILLAMA_TOKEN_ADDRESSES
            ];

          if (!defillamaAddress && symbol !== "USDT" && symbol !== "USDC")
            continue;

          let price: number | null = null;

          if (symbol === "USDT" || symbol === "USDC") {
            price = 1;
          } else {
            const priceData = data.coins[defillamaAddress];
            if (!priceData || !priceData.price) continue;
            price = priceData.price;
          }

          if (!price) continue;

          const stakedAmount =
            Number(asset.userDeposited) / Math.pow(10, decimals);
          const assetValue = stakedAmount * price;

          totalValue += assetValue;
        }

        setDepositValue(totalValue);
        setAssetPrice(prices);
      } catch (error) {
        console.error("Error fetching token prices:", error);
      } finally {
        setIsLoadingPrices(false);
      }
    };
    fetchTokenPrices();
  }, [assets]);

  // =============== MEMO
  // Create a mapping of asset symbols to their emission data for easy lookup
  const assetEmissions = useMemo(
    () => ({
      stETH: stETHEmissions,
      USDC: usdcEmissions,
      USDT: usdtEmissions,
      wBTC: wbtcEmissions,
      wETH: wethEmissions,
    }),
    [stETHEmissions, usdcEmissions, usdtEmissions, wbtcEmissions, wethEmissions]
  );

  // User assets data with real staking amounts
  const unsortedUserAssets: UserAsset[] = useMemo(() => {
    if (!hasStakedAssets) {
      return [];
    }

    const assetsList = supportedAssets.map((symbol) => {
      const assetData = assets[symbol];

      if (!assetData) return null;
      const assetConfigData = getAssetConfig(symbol, networkEnv);
      if (!assetConfigData) return null;
      const emissions =
        assetEmissions[symbol as keyof typeof assetEmissions]?.emissions || 0;
      return buildUserAsset({
        assetSymbol: symbol,
        assetData,
        assetConfigData,
        emission: emissions,
      });
    });

    return (
      assetsList
        .filter((asset) => {
          if (!asset) return false;

          // Check if user has any stake (even very small amounts) or claimable rewards
          // Use raw bigint values from assets data instead of formatted values to avoid precision loss
          const assetData = assets[asset.assetSymbol];
          const hasStake = assetData && assetData.userDeposited > BigInt(0);
          const hasClaimable = asset.availableToClaim > 0;

          return hasStake || hasClaimable;
        })
        // Sort so assets with exactly 0 amount deposited appear at the end
        .sort((a, b) => {
          if (!a || !b) return 0; // Should not happen due to filter, but safety check

          const aIsZeroStaked = a.amountStaked === 0;
          const bIsZeroStaked = b.amountStaked === 0;

          // If both are zero or both are non-zero, maintain current order
          if (aIsZeroStaked === bIsZeroStaked) return 0;

          // Assets with zero staked go to the end
          return aIsZeroStaked ? 1 : -1;
        }) as UserAsset[]
    );
  }, [hasStakedAssets, assets, supportedAssets, assetEmissions, networkEnv]);

  // =============== VARIABLES
  // Calculate total daily emissions as the sum of values shown in the table
  const totalDailyEmissions = unsortedUserAssets.reduce((total, asset) => {
    return total + asset.dailyEmissions;
  }, 0);

  const assetAvailableToClaim = unsortedUserAssets.reduce(
    (sum, asset) => sum + asset.availableToClaim,
    0
  );

  const assetAvailableToClaimButNotStaked = Object.values(assets).reduce(
    (sum, asset) => {
      if (asset && asset.claimableAmountFormatted) {
        const claimable =
          parseFloat(asset.claimableAmountFormatted.replace(/,/g, "")) || 0;
        return sum + claimable;
      }
      return sum;
    },
    0
  );

  // Calculate total available to claim from table rows, or directly from assets if no staked assets
  const totalTableAvailableToClaim = hasStakedAssets
    ? assetAvailableToClaim
    : assetAvailableToClaimButNotStaked;

  const lifetimeEarnings = formatDailyEmissions(totalEarnedMOR);

  const freshMetrics: Metrics = {
    stakedValue: Math.floor(depositValue).toLocaleString("en-US"),
    dailyEmissionsEarned: formatDailyEmissions(totalDailyEmissions),
    lifetimeEmissionsEarned: lifetimeEarnings,
    totalAvailableToClaim: formatNumber(totalTableAvailableToClaim),
  };

  const loading = isLoading || isLoadingPrices;

  // =============== VIEWS
  return (
    <VStack pt={4} width="full" gap={3}>
      <MetricsData metrics={freshMetrics} isLoading={loading} />
      <StakingTable
        userAsset={unsortedUserAssets}
        isLoading={loading}
        isAnyActionProcessing={isAnyActionProcessing}
      />
    </VStack>
  );
});

/**
 * ===========================
 * EXPORTS
 * ===========================
 */
export default StakingPosition;
