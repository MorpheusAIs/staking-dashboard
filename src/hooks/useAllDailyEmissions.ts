import { AssetSymbol } from "staking-dashboard/lib/configs/asset";
import { useDailyEmissions } from "./useDailyEmissions";
import { AssetData } from "staking-dashboard/@types/useCapitalStaking";

type UseAllDailyEmissionsArgs = {
  assets: Record<AssetSymbol, AssetData>;
  totalUSDValueAllPools: number;
  assetPrice: {
    [assetSymbol: string]: number;
  };
};

export const useAllDailyEmissions = (args: UseAllDailyEmissionsArgs) => {
  const { assets, totalUSDValueAllPools, assetPrice } = args;

  return {
    stETHEmissions: useDailyEmissions({
      userDeposited: assets.stETH?.userDeposited,
      assetSymbol: "stETH",
      totalUSDValueAllPools,
      assetPrice: assetPrice["stETH"] || undefined,
    }),
    usdcEmissions: useDailyEmissions({
      userDeposited: assets.USDC?.userDeposited,
      assetSymbol: "USDC",
      totalUSDValueAllPools,
      assetPrice: assetPrice["USDC"] || undefined,
    }),
    usdtEmissions: useDailyEmissions({
      userDeposited: assets.USDT?.userDeposited,
      assetSymbol: "USDT",
      totalUSDValueAllPools,
      assetPrice: assetPrice["USDT"] || undefined,
    }),
    wbtcEmissions: useDailyEmissions({
      userDeposited: assets.wBTC?.userDeposited,
      assetSymbol: "wBTC",
      totalUSDValueAllPools,
      assetPrice: assetPrice["wBTC"] || undefined,
    }),
    wethEmissions: useDailyEmissions({
      userDeposited: assets.wETH?.userDeposited,
      assetSymbol: "wETH",
      totalUSDValueAllPools,
      assetPrice: assetPrice["wETH"] || undefined,
    }),
  };
};
