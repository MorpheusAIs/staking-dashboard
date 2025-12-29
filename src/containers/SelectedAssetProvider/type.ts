import { AssetSymbol } from "staking-dashboard/lib/configs/asset";

export type SelectedAssetProps = {
  selectedAsset: AssetSymbol;
  onHandleSetSelectedAsset: (asset: AssetSymbol) => void;
  canWithdraw: boolean;
  selectedAssetCanClaim: boolean;
};
