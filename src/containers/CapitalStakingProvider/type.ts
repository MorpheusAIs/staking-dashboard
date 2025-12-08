import { AssetData } from "staking-dashboard/@types/useCapitalStaking";
import { AssetSymbol } from "staking-dashboard/lib/configs/asset";

export type CapitalStakingProps = {
  assets: Record<AssetSymbol, AssetData>;
  l1ChainId: number;
  networkEnv: "mainnet" | "testnet";
  selectedAsset: AssetSymbol;
  onHandleDeposit: (
    asset: AssetSymbol,
    amountString: string,
    lockDurationSeconds?: bigint,
    referrerAddress?: string
  ) => Promise<void>;
  onHandleSetSelectedAsset: (asset: AssetSymbol) => void;
  onHandleApproveToken: (asset: AssetSymbol) => Promise<void>;
  checkAndUpdateApprovalNeeded: (
    asset: AssetSymbol,
    amountString: string
  ) => Promise<boolean>;
  isProcessingDeposit: boolean;
  userAddress: `0x${string}` | undefined;
};
