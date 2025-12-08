"use client";
import {
  useEffect,
  useMemo,
  useState,
  createContext,
  PropsWithChildren,
} from "react";
import { ContractAddresses } from "staking-dashboard/@types/common";
import { AssetData } from "staking-dashboard/@types/useCapitalStaking";
import {
  AssetSymbol,
  getAssetConfig,
  getAssetsForNetwork,
} from "staking-dashboard/lib/configs/asset";
import {
  getChainById,
  getContractAddress,
} from "staking-dashboard/lib/networks";
import { isAddress, maxInt256, parseUnits, zeroAddress } from "viem";
import { arbitrum, base, mainnet, sepolia } from "viem/chains";
import {
  useAccount,
  useChainId,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { useAssetContractData } from "staking-dashboard/hooks/useAssetContractData";
import { formatBigInt } from "staking-dashboard/lib/helpers";
import { getSafeWalletUrlIfApplicable } from "staking-dashboard/lib/configs/safe-wallet-detection";
import DepositPoolAbi from "staking-dashboard/lib/abi/DepositPool.json";
import ERC20Abi from "staking-dashboard/lib/abi/ERC20.json";
import { toaster } from "staking-dashboard/components/ui/toaster";
import { showToast } from "staking-dashboard/lib/showToast";
import { CapitalStakingProps } from "./type";
import { constructTransactionUrl } from "./helper";

export const CapitalStakingContext = createContext<CapitalStakingProps>(
  null as unknown as CapitalStakingProps
);

// V2 Confirmed Pool Index (from discovery script)
const V2_REWARD_POOL_INDEX = BigInt(0);

export type CapitalStakingProviderProps = PropsWithChildren;

/**
 * ===========================
 * MAIN
 * ===========================
 */
export const CapitalStakingProvider: React.FC<CapitalStakingProviderProps> = (
  props
) => {
  const { children } = props;
  // =============== STATE
  const [selectedAsset, setSelectedAsset] = useState<AssetSymbol>("stETH");
  const [lastHandledApprovalHash, setLastHandledApprovalHash] = useState<
    `0x${string}` | null
  >(null);
  const [lastHandledStakeHash, setLastHandledStakeHash] = useState<
    `0x${string}` | null
  >(null);

  // ============== WRITE CONTRACT
  const {
    data: stakeHash,
    writeContractAsync: stakeAsync,
    isPending: isSendingStake,
  } = useWriteContract();
  const {
    data: approveHash,
    writeContractAsync: approveAsync,
    isPending: isSendingApproval,
  } = useWriteContract();

  // =============== HOOKS
  const chainId = useChainId();
  const { address: userAddress } = useAccount();

  // =============== VARIABLES
  // Use the dynamic hook for each potential asset - only enabled when contracts exist
  const assetContractData = {
    stETH: useAssetContractData("stETH"),
    LINK: useAssetContractData("LINK"),
    USDC: useAssetContractData("USDC"),
    USDT: useAssetContractData("USDT"),
    wBTC: useAssetContractData("wBTC"),
    wETH: useAssetContractData("wETH"),
  };

  const networkEnv = ([mainnet.id, arbitrum.id, base.id] as number[]).includes(
    chainId
  )
    ? "mainnet"
    : "testnet";

  // either mainnet id or sepolia id
  const l1ChainId = networkEnv === "mainnet" ? mainnet.id : sepolia.id;
  const chain = getChainById(l1ChainId, "mainnet");

  const distributorV2Address = getContractAddress(
    l1ChainId,
    "distributorV2",
    networkEnv
  ) as `0x${string}` | undefined;

  // --- Build Assets Structure Dynamically (Network + Config Cross-Reference) ---
  const assets = useMemo((): Record<AssetSymbol, AssetData> => {
    // Helper to get available assets that have both metadata AND deployed contracts
    const getAvailableAssetsWithContracts = () => {
      const assetsFromConfig = getAssetsForNetwork(networkEnv);
      const availableAssets: typeof assetsFromConfig = [];

      assetsFromConfig.forEach((assetInfo) => {
        const symbol = assetInfo.metadata.symbol;
        const depositPoolContractName = getDepositPoolContractName(symbol);

        if (depositPoolContractName && l1ChainId) {
          const depositPoolAddress = getContractAddress(
            l1ChainId,
            depositPoolContractName,
            networkEnv
          );

          // Only include assets that have:
          // 1. Metadata in asset-config.ts
          // 2. Deposit pool contract defined in networks.ts
          // 3. Non-empty deposit pool address (contract is deployed)
          if (
            depositPoolAddress &&
            depositPoolAddress !== "" &&
            depositPoolAddress !== zeroAddress
          ) {
            availableAssets.push(assetInfo);

            if (process.env.NODE_ENV !== "production") {
              console.log(`✅ [Dynamic Assets] ${symbol} available:`, {
                symbol,
                tokenAddress: assetInfo.address,
                depositPoolAddress,
                networkEnv,
                chainId: l1ChainId,
              });
            }
          } else {
            if (process.env.NODE_ENV !== "production") {
              console.log(
                `❌ [Dynamic Assets] ${symbol} not available - no deposit pool deployed:`,
                {
                  symbol,
                  depositPoolContractName,
                  depositPoolAddress,
                  networkEnv,
                  chainId: l1ChainId,
                }
              );
            }
          }
        } else {
          if (process.env.NODE_ENV !== "production") {
            console.log(
              `❌ [Dynamic Assets] ${symbol} not available - no deposit pool contract mapping:`,
              {
                symbol,
                depositPoolContractName,
                networkEnv,
                chainId: l1ChainId,
              }
            );
          }
        }
      });

      return availableAssets;
    };

    // Maps asset symbols to their corresponding deposit pool contract names in networks.ts
    const getDepositPoolContractName = (
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

    const availableAssets = getAvailableAssetsWithContracts();
    const assetsRecord: Record<string, AssetData> = {};

    // Build assets structure from dynamic contract data - truly configuration-driven!
    availableAssets.forEach((assetInfo) => {
      const symbol = assetInfo.metadata.symbol;
      const contractData = assetContractData[symbol as AssetSymbol];

      // Only include assets that have deployed contracts (non-zero addresses)
      if (contractData.depositPoolAddress !== zeroAddress) {
        assetsRecord[symbol] = {
          symbol,
          config: {
            symbol,
            depositPoolAddress: contractData.depositPoolAddress,
            tokenAddress: contractData.tokenAddress,
            decimals: assetInfo.metadata.decimals,
            icon: assetInfo.metadata.icon,
          },
          // All data comes from the dynamic hook - no more hardcoded variables!
          userBalance: contractData.userBalance,
          userDeposited: contractData.userDeposited,
          userAllowance: contractData.userAllowance,
          claimableAmount: contractData.claimableAmount,
          userMultiplier: contractData.userMultiplier,
          totalDeposited: contractData.totalDeposited,
          protocolDetails: null, // TODO: Add to dynamic hook
          poolData: null,
          claimUnlockTimestamp: contractData.claimUnlockTimestamp,
          withdrawUnlockTimestamp: contractData.withdrawUnlockTimestamp,
          // Formatted data from hook
          userBalanceFormatted: contractData.userBalanceFormatted,
          userDepositedFormatted: contractData.userDepositedFormatted,
          claimableAmountFormatted: contractData.claimableAmountFormatted,
          userMultiplierFormatted: contractData.userMultiplierFormatted,
          totalDepositedFormatted: contractData.totalDepositedFormatted,
          minimalStakeFormatted: "100", // TODO: Get from protocol details
          claimUnlockTimestampFormatted:
            contractData.claimUnlockTimestampFormatted,
          withdrawUnlockTimestampFormatted:
            contractData.withdrawUnlockTimestampFormatted,
          // Eligibility flags from hook
          canClaim: contractData.canClaim,
          canWithdraw: contractData.canWithdraw,
        };
      }
    });

    return assetsRecord as Record<AssetSymbol, AssetData>;
  }, [networkEnv, l1ChainId, assetContractData]);

  // =============== EVENT HANDLERS
  const checkAndUpdateApprovalNeeded = async (
    asset: AssetSymbol,
    amountString: string
  ): Promise<boolean> => {
    try {
      // Get asset configuration for correct decimals
      const assetInfo = getAssetConfig(asset, networkEnv);
      if (!assetInfo) return false;

      const amountBigInt = amountString
        ? parseUnits(amountString, assetInfo.metadata.decimals)
        : BigInt(0);
      if (amountBigInt <= BigInt(0)) return false;

      // Use dynamic refetch from assetContractData - works for ALL assets
      const assetData = assetContractData[asset];
      if (!assetData) {
        console.error(`Asset data not found for ${asset}`);
        return false;
      }

      // Refetch allowance dynamically for any asset
      await assetData.refetch.allowance();

      // Use the current allowance value from the hook state (will be updated after refetch)
      const currentAllowanceValue = assetData.userAllowance;

      const needsApproval = currentAllowanceValue < amountBigInt;

      return needsApproval;
    } catch (error) {
      console.error(`Error checking approval status for ${asset}:`, error);
      return false;
    }
  };

  const onHandleSetSelectedAsset = (asset: AssetSymbol) => {
    setSelectedAsset(asset);
  };

  const onHandleTransaction = async (
    txFunction: () => Promise<`0x${string}`>,
    options: {
      loading: string;
      success: string;
      error: string;
    }
  ) => {
    const toastId = options.loading;

    // Check if user is using a Safe wallet and generate the appropriate URL
    let safeWalletUrl: string | null = null;
    if (userAddress && l1ChainId) {
      try {
        safeWalletUrl = await getSafeWalletUrlIfApplicable(
          userAddress,
          l1ChainId
        );
      } catch (error) {
        console.warn("Failed to check if wallet is Safe:", error);
      }
    }

    // Show loading toast with Safe wallet link if applicable
    if (safeWalletUrl) {
      showToast({
        title: options.loading,
        method: "create",
        type: "loading",
        id: toastId,
        description:
          "If the transaction doesn't appear, check your Safe wallet.",
        action: {
          label: "Open Safe Wallet",
          onClick: () => window.open(safeWalletUrl, "_blank"),
        },
      });
    } else {
      showToast({
        title: options.loading,
        method: "create",
        type: "loading",
        id: toastId,
      });
    }

    try {
      const hash = await txFunction();

      toaster.dismiss(toastId);
      return hash;
    } catch (error) {
      const detailedError = error as {
        cause?: { reason?: string; data?: unknown };
        message?: string;
        shortMessage?: string;
        details?: string;
        metaMessages?: string[];
      };

      toaster.dismiss(toastId);
      const errorMessage =
        detailedError?.shortMessage ||
        detailedError?.message ||
        "Unknown error";
      showToast({
        title: options.error,
        description: errorMessage,
        type: "error",
      });
      throw error;
    }
  };

  const onHandleApproveToken = async (asset: AssetSymbol) => {
    if (!distributorV2Address || !l1ChainId) {
      throw new Error("Distributor address or chain ID not available");
    }

    // Get asset configuration for current network environment
    const assetInfo = getAssetConfig(asset, networkEnv);
    if (!assetInfo) {
      throw new Error(`Asset ${asset} not supported on ${networkEnv}`);
    }

    await onHandleTransaction(
      () =>
        approveAsync({
          address: assetInfo.address,
          abi: ERC20Abi,
          functionName: "approve",
          args: [distributorV2Address, maxInt256], // Use distributor address as spender to allow to move user's token
          chainId: l1ChainId,
        }),
      {
        loading: `Requesting ${asset} approval...`,
        success: `${asset} approval successful!`,
        error: `${asset} approval failed`,
      }
    );
  };

  const onHandleDeposit = async (
    asset: AssetSymbol,
    amountString: string,
    lockDurationSeconds?: bigint,
    referrerAddress?: string
  ) => {
    // this returns asset's address and asset's metada
    const assetInfo = getAssetConfig(asset, networkEnv);
    if (!assetInfo) {
      throw new Error(`Asset ${asset} not supported on ${networkEnv}`);
    }

    const assetData = assets[asset];
    if (!assetData) {
      throw new Error(`Asset ${asset} data not available`);
    }

    // parse the amount accordingly to the asset decimals
    const amountBigInt = parseUnits(amountString, assetInfo.metadata.decimals);

    // Validation valid amount
    if (amountBigInt <= BigInt(0)) throw new Error("Invalid deposit amount");
    // Validation deposit pool address
    if (assetData.config.depositPoolAddress === zeroAddress)
      throw new Error(`${asset} deposits not yet supported.`);
    // Validation balance and allowance
    if (assetData.userBalance < amountBigInt)
      throw new Error("Insufficient balance");
    // Validation allowance
    if (assetData.userAllowance < amountBigInt)
      throw new Error("Insufficient allowance. Please approve first.");
    // Validation chain ID
    if (!l1ChainId) throw new Error("Chain ID not available");

    // Restore safety net - use contract minimum lock period
    const MINIMUM_CLAIM_LOCK_PERIOD = BigInt(90 * 24 * 60 * 60); // 90 days in seconds
    const lockDuration = lockDurationSeconds || MINIMUM_CLAIM_LOCK_PERIOD;

    // Process referrer address - use provided address or zero address as fallback
    const finalReferrerAddress =
      referrerAddress && isAddress(referrerAddress)
        ? (referrerAddress as `0x${string}`)
        : zeroAddress;

    console.log(`🏦 ${asset} Deposit Details:`, {
      asset,
      depositPoolAddress: assetData.config.depositPoolAddress,
      tokenAddress: assetData.config.tokenAddress,
      amount: amountString,
      amountBigInt: amountBigInt.toString(),
      lockDuration: lockDuration.toString(),
      poolIndex: V2_REWARD_POOL_INDEX.toString(),
      chainId: l1ChainId,
      userBalance: assetData.userBalanceFormatted,
      userAllowance: formatBigInt(
        assetData.userAllowance,
        assetInfo.metadata.decimals,
        4
      ),
      decimals: assetInfo.metadata.decimals,
      referrerAddress: referrerAddress || "none",
      finalReferrerAddress,
    });

    // Execute the stake transaction with toast handling
    await onHandleTransaction(
      () => {
        // Calculate unlock date timestamp right before transaction for maximum safety
        const claimLockEnd =
          BigInt(Math.floor(Date.now() / 1000)) + lockDuration;

        console.log("🕒 Final timestamp calculated right before transaction:", {
          currentTimestamp: Math.floor(Date.now() / 1000),
          lockDuration: lockDuration.toString(),
          claimLockEnd: claimLockEnd.toString(),
          claimLockEndDate: new Date(Number(claimLockEnd) * 1000).toISOString(),
          asset,
        });

        // Log transaction arguments for debugging
        console.log(`🔍 [${asset}] Final Transaction:`, {
          asset,
          contractAddress: assetData.config.depositPoolAddress,
          functionName: "stake",
          rewardPoolIndex: V2_REWARD_POOL_INDEX.toString(),
          amount: amountBigInt.toString(),
          amountHex: "0x" + amountBigInt.toString(16),
          claimLockEnd: claimLockEnd.toString(),
          originalAmountString: amountString,
          assetDecimals: assetInfo.metadata.decimals,
          expectedGasFee: "NORMAL ($2-5)",
          contractAddress_full: assetData.config.depositPoolAddress,
        });
        // @TODO test thoroughly first
        // return stakeAsync({
        //   address: assetData.config.depositPoolAddress,
        //   abi: DepositPoolAbi,
        //   functionName: "stake",
        //   args: [
        //     // first pool
        //     V2_REWARD_POOL_INDEX, // pool index
        //     amountBigInt, // deposit amount
        //     claimLockEnd, // unlock timestamp
        //     finalReferrerAddress, // referrer address
        //   ],
        //   chainId: l1ChainId, // mainnet chain id
        // });
      },
      {
        loading: `Requesting ${asset} deposit...`,
        success: `Successfully deposited ${amountString} ${asset}!`,
        error: `${asset} deposit failed`,
      }
    );
  };

  // =============== WAIT FOR TX RECEIPTS
  const {
    isLoading: isConfirmingApproval,
    isSuccess: isApprovalSuccess,
    isError: isApprovalError,
    error: approvalError,
  } = useWaitForTransactionReceipt({ hash: approveHash, chainId: l1ChainId });

  const {
    isLoading: isConfirmingStake,
    isSuccess: isStakeSuccess,
    isError: isStakeError,
    error: stakeError,
  } = useWaitForTransactionReceipt({ hash: stakeHash, chainId: l1ChainId });

  // =============== EFFECTS
  useEffect(() => {
    if (isApprovalError) {
      showToast({
        title: "Approval failed",
        description: approvalError?.message || "Approval transaction failed",
        type: "error",
      });
    }
    if (
      isApprovalSuccess &&
      approveHash &&
      approveHash !== lastHandledApprovalHash
    ) {
      showToast({
        title: "Approval successful!",
        description: "Your approval transaction has been confirmed",
        type: "success",
        action: {
          label: "View on Explorer",
          onClick: () => {
            const explorerUrl = chain?.blockExplorers?.default.url;
            if (explorerUrl && approveHash) {
              const url = constructTransactionUrl(explorerUrl, approveHash);
              window.open(url, "_blank");
            }
          },
        },
      });

      // Refetch allowances for all assets dynamically
      Object.values(assetContractData).forEach((asset) =>
        asset.refetch.allowance()
      );
      setLastHandledApprovalHash(approveHash);
    }
  }, [
    l1ChainId,
    approveHash,
    isApprovalError,
    assetContractData,
    isApprovalSuccess,
    lastHandledApprovalHash,
  ]);

  useEffect(() => {
    if (isStakeError) {
      showToast({
        title: "Deposit failed",
        description: stakeError?.message || "Deposit transaction failed",
        type: "error",
      });
    }

    if (isStakeSuccess && stakeHash && stakeHash !== lastHandledStakeHash) {
      showToast({
        title: "Stake successful!",
        description: "Your stake transaction has been confirmed",
        type: "success",
        action: {
          label: "View on Explorer",
          onClick: () => {
            const explorerUrl = chain?.blockExplorers?.default.url;
            if (explorerUrl && stakeHash) {
              const url = constructTransactionUrl(explorerUrl, stakeHash);
              window.open(url, "_blank");
            }
          },
        },
      });
      setLastHandledStakeHash(stakeHash);
    }
  }, [
    l1ChainId,
    stakeHash,
    networkEnv,
    isStakeError,
    isStakeSuccess,
    assetContractData,
    lastHandledStakeHash,
  ]);

  // =============== VARIABLES
  const isProcessingDeposit =
    isSendingApproval ||
    isConfirmingApproval ||
    isSendingStake ||
    isConfirmingStake;

  return (
    <CapitalStakingContext.Provider
      value={{
        userAddress,
        onHandleSetSelectedAsset,
        assets,
        l1ChainId,
        networkEnv,
        selectedAsset,
        onHandleApproveToken,
        checkAndUpdateApprovalNeeded,
        onHandleDeposit,
        isProcessingDeposit,
      }}
    >
      {children}
    </CapitalStakingContext.Provider>
  );
};

/**
 * ===========================
 * EXPORTS
 * ===========================
 */
export default CapitalStakingProvider;
