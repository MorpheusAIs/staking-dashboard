import {
  createContext,
  memo,
  PropsWithChildren,
  useContext,
  useState,
} from "react";
import { useCapitalStaking } from "staking-dashboard/hooks/useCapitalStaking";
import { AssetSymbol } from "staking-dashboard/lib/configs/asset";
import { SelectedAssetProps } from "./type";

export type SelectedAssetProviderProps = PropsWithChildren;

const SelectedAssetContext = createContext<SelectedAssetProps | null>(null);

// This is for context splitting, this provider is separated to manage the selected asset due to
// rerendering issues when combined with CapitalStakingProvider.
/**
 * ===========================
 * MAIN
 * ===========================
 */
export const SelectedAssetProvider: React.FC<SelectedAssetProviderProps> = memo(
  (props) => {
    const { children } = props;
    const { assets } = useCapitalStaking();
    // =============== HOOKS
    const [selectedAsset, setSelectedAsset] = useState<AssetSymbol>("stETH");

    // =============== EVENT HANDLERS
    const onHandleSetSelectedAsset = (asset: AssetSymbol) => {
      setSelectedAsset(asset);
    };

    // =============== VARIABLES
    const currentAssetData = assets[selectedAsset];
    const hasDeposited = currentAssetData.userDeposited > BigInt(0);
    const selectedAssetCanClaim = currentAssetData?.canClaim ?? false;

    // =============== VIEWS
    return (
      <SelectedAssetContext.Provider
        value={{
          onHandleSetSelectedAsset,
          selectedAsset,
          canWithdraw: hasDeposited,
          selectedAssetCanClaim,
        }}
      >
        {children}
      </SelectedAssetContext.Provider>
    );
  }
);

export function useSelectedAsset() {
  const ctx = useContext(SelectedAssetContext);
  if (!ctx)
    throw new Error(
      "useSelectedAsset must be used inside SelectedAssetProvider"
    );
  return ctx;
}

/**
 * ===========================
 * EXPORTS
 * ===========================
 */
export default SelectedAssetProvider;
