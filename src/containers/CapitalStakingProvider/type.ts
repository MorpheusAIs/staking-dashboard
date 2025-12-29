import { AssetData } from "staking-dashboard/@types/useCapitalStaking";
import {
  AssetContractInfo,
  AssetSymbol,
} from "staking-dashboard/lib/configs/asset";

export type CapitalStakingProps = {
  assets: Record<AssetSymbol, AssetData>;
  l1ChainId: number;
  networkEnv: "mainnet" | "testnet";
  onHandleDeposit: (
    asset: AssetSymbol,
    amountString: string,
    lockDurationSeconds?: bigint,
    referrerAddress?: string
  ) => Promise<void>;
  onHandleApproveToken: (asset: AssetSymbol) => Promise<void>;
  checkAndUpdateApprovalNeeded: (
    asset: AssetSymbol,
    amountString: string
  ) => Promise<boolean>;
  isProcessingDeposit: boolean;
  userAddress: `0x${string}` | undefined;
  isProcessingWithdraw: boolean;
  onHandleWithdraw: (asset: AssetSymbol, amountString: string) => Promise<void>;
  onHandleClaimMorRewards: (asset: AssetSymbol) => Promise<void>;
  onHandleLockMorRewards: (
    asset: AssetSymbol,
    lockDurationSeconds: bigint
  ) => Promise<void>;
  isProcessingClaim: boolean;
  isProcessingChangeLock: boolean;
  totalClaimableAmountFormatted: string;
};

export type ValidateWithdrawArgs = {
  asset: AssetSymbol;
  amountBigInt: bigint;
  assetInfo: AssetContractInfo | undefined;
  assetData: AssetData;
  networkEnv: string;
  l1ChainId: number;
  userDeposited: bigint;
  userAddress?: `0x${string}` | undefined;
};
