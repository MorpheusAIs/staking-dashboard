import { AssetData } from "staking-dashboard/@types/useCapitalStaking";
import {
  AssetContractInfo,
  AssetSymbol,
} from "staking-dashboard/lib/configs/asset";

export type UserAsset = {
  id: string;
  symbol: string;
  assetSymbol: AssetSymbol; // Add the actual asset symbol for context
  icon: string;
  amountStaked: number;
  available: number;
  dailyEmissions: number;
  powerFactor: string;
  unlockDate: string | null; // For "Claim Unlock Date" column
  withdrawUnlockDate: string | null; // For "Amount Staked" badge/tooltip
  availableToClaim: number;
  canClaim: boolean;
  canWithdraw: boolean;
};

export type MinimalAssetData = {
  userDepositedFormatted: string;
};

export type BuildUserAssetArgs = {
  assetData: AssetData;
  assetConfigData: AssetContractInfo | null;
  assetSymbol: AssetSymbol;
  emission?: number;
};

export type BuildUserAssetReturn = {
  id: string;
  symbol: string;
  assetSymbol: AssetSymbol;
  icon: string;
  amountStaked: number;
  available: number;
  dailyEmissions: number | undefined;
  powerFactor: string;
  unlockDate: string | null;
  withdrawUnlockDate: string | null;
  availableToClaim: number;
  canClaim: boolean;
  canWithdraw: boolean;
};

export type Metrics = {
  stakedValue: string;
  dailyEmissionsEarned: string;
  lifetimeEmissionsEarned: string;
  totalAvailableToClaim: string;
};

export type AssetPriceMap = Partial<Record<AssetSymbol, number>>;

export type EnsValidationResult = {
  isValid: boolean;
  error: string | null;
};

export type SchemaValidation = {
  canWithdraw?: boolean;
  currentAsset: AssetData;
  selectedAsset?: string;
};
