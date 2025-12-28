"use client";
import { AssetSymbol } from "staking-dashboard/lib/configs/asset";

type PoolLimitsData = {
  claimLockPeriodAfterStake: bigint;
  claimLockPeriodAfterClaim: bigint;
};

type PoolInfoData = {
  payoutStart: bigint;
  decreaseInterval: bigint;
  withdrawLockPeriod: bigint;
  claimLockPeriod: bigint;
  withdrawLockPeriodAfterStake: bigint;
  initialReward: bigint;
  rewardDecrease: bigint;
  minimalStake: bigint;
  isPublic: boolean;
};

type AssetConfig = {
  symbol: AssetSymbol;
  depositPoolAddress: `0x${string}`;
  tokenAddress: `0x${string}`;
  decimals: number;
  icon: string;
};

export type AssetData = {
  symbol: AssetSymbol;
  config: AssetConfig;
  // User-specific data
  userBalance: bigint;
  userDeposited: bigint;
  userAllowance: bigint;
  claimableAmount: bigint;
  userMultiplier: bigint;
  // Pool-specific data
  totalDeposited: bigint;
  protocolDetails: PoolLimitsData | null;
  poolData: PoolInfoData | null;
  // Unlock timestamps for dynamic validation
  claimUnlockTimestamp?: bigint;
  withdrawUnlockTimestamp?: bigint;
  // Formatted for display
  userBalanceFormatted: string;
  userDepositedFormatted: string;
  claimableAmountFormatted: string;
  userMultiplierFormatted: string;
  totalDepositedFormatted: string;
  minimalStakeFormatted: string;
  claimUnlockTimestampFormatted: string;
  withdrawUnlockTimestampFormatted: string;
  // Dynamic eligibility flags per asset
  canClaim: boolean;
  canWithdraw: boolean;
};
