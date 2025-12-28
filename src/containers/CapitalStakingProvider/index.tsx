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
import {
  BaseError,
  formatUnits,
  isAddress,
  maxInt256,
  parseEther,
  parseUnits,
  zeroAddress,
} from "viem";
import { arbitrum, base, mainnet, sepolia } from "viem/chains";
import {
  useAccount,
  useChainId,
  usePublicClient,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { useAssetContractData } from "staking-dashboard/hooks/useAssetContractData";
import { formatBigInt } from "staking-dashboard/lib/helpers";
import { getSafeWalletUrlIfApplicable } from "staking-dashboard/lib/configs/SafeWalletDetection";
import DepositPoolAbi from "staking-dashboard/lib/abi/DepositPool.json";
import ERC20Abi from "staking-dashboard/lib/abi/ERC20.json";
import { toaster } from "staking-dashboard/components/ui/toaster";
import { showToast } from "staking-dashboard/lib/showToast";
import { CapitalStakingProps } from "./type";
import {
  constructTransactionUrl,
  getTransactionUrl,
  validateWithdraw,
} from "./helper";
import SelectedAssetProvider from "../SelectedAssetProvider";
import { useModalActions } from "../ModalProvider";
import { set } from "lodash";

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
  const [lastHandledApprovalHash, setLastHandledApprovalHash] = useState<
    `0x${string}` | null
  >(null);
  const [lastHandledStakeHash, setLastHandledStakeHash] = useState<
    `0x${string}` | null
  >(null);
  const [lastHandledWithdrawHash, setLastHandledWithdrawHash] = useState<
    `0x${string}` | null
  >(null);
  const [lastHandledClaimHash, setLastHandledClaimHash] = useState<
    `0x${string}` | null
  >(null);
  const [lastHandledLockClaimHash, setLastHandledLockClaimHash] = useState<
    `0x${string}` | null
  >(null);
  const [isWithdrawFetching, setIsWithdrawFetching] = useState(false);

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
  const {
    data: withdrawHash,
    writeContractAsync: withdrawAsync,
    isPending: isSendingWithdraw,
  } = useWriteContract({});
  const {
    data: claimHash,
    writeContractAsync: claimAsync,
    isPending: isSendingClaim,
  } = useWriteContract();

  const {
    data: lockClaimHash,
    writeContractAsync: lockClaimAsync,
    isPending: isSendingLockClaim,
  } = useWriteContract();

  // =============== HOOKS
  const chainId = useChainId();
  const { address: userAddress } = useAccount();
  const publicClient = usePublicClient();
  const { onHandleSetModal } = useModalActions();

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

  // Build Assets Structure Dynamically (Network + Config Cross-Reference)
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
          userBalance: contractData.userBalance,
          userDeposited: contractData.userDeposited,
          userAllowance: contractData.userAllowance,
          claimableAmount: contractData.claimableAmount,
          userMultiplier: contractData.userMultiplier,
          totalDeposited: contractData.totalDeposited,
          // @TODO: add to dynamic hooks
          protocolDetails: null,
          poolData: null,
          claimUnlockTimestamp: contractData.claimUnlockTimestamp,
          withdrawUnlockTimestamp: contractData.withdrawUnlockTimestamp,

          // Formatted data from hook
          userBalanceFormatted: contractData.userBalanceFormatted,
          userDepositedFormatted: contractData.userDepositedFormatted,
          claimableAmountFormatted: contractData.claimableAmountFormatted,
          userMultiplierFormatted: contractData.userMultiplierFormatted,
          totalDepositedFormatted: contractData.totalDepositedFormatted,
          // @TODO Get from protocol details
          minimalStakeFormatted: "100",
          claimUnlockTimestampFormatted:
            contractData.claimUnlockTimestampFormatted,
          withdrawUnlockTimestampFormatted:
            contractData.withdrawUnlockTimestampFormatted,
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

  const onHandleTransaction = async (
    txFunction: () => Promise<`0x${string}`>,
    options: {
      loading: string;
      success: string;
      error: string;
    },
    onErrorCallback?: (error: BaseError) => void
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
        id: toastId,
        type: "error",
      });
      onErrorCallback?.(error as BaseError);
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
    // Validate user balance
    if (assetData.userBalance <= BigInt(0)) {
      throw new Error(`No ${asset} balance available`);
    }
    // Validation balance and allowance
    if (assetData.userBalance < amountBigInt)
      throw new Error("Insufficient balance");
    // Validation allowance
    if (assetData.userAllowance < amountBigInt)
      throw new Error("Insufficient allowance. Please approve first.");
    // Validation chain ID
    if (!l1ChainId) throw new Error("Chain ID not available");
    // validate lock duration
    if (!lockDurationSeconds || lockDurationSeconds <= BigInt(0)) {
      throw new Error("Invalid lock duration");
    }

    // Restore safety net - use contract minimum lock period
    const MINIMUM_CLAIM_LOCK_PERIOD = BigInt(90 * 24 * 60 * 60); // 90 days in seconds
    const lockDuration = lockDurationSeconds || MINIMUM_CLAIM_LOCK_PERIOD;

    // Process referrer address - use provided address or zero address as fallback
    const finalReferrerAddress =
      referrerAddress && isAddress(referrerAddress)
        ? (referrerAddress as `0x${string}`)
        : zeroAddress;

    // Execute the stake transaction with toast handling
    await onHandleTransaction(
      () => {
        // Calculate unlock date timestamp right before transaction for maximum safety
        const claimLockEnd =
          BigInt(Math.floor(Date.now() / 1000)) + lockDuration;

        return stakeAsync({
          address: assetData.config.depositPoolAddress,
          abi: DepositPoolAbi,
          functionName: "stake",
          args: [
            // first pool
            V2_REWARD_POOL_INDEX, // pool index
            amountBigInt, // deposit amount
            claimLockEnd, // unlock timestamp
            finalReferrerAddress, // referrer address
          ],
          chainId: l1ChainId, // mainnet chain id
        });
      },
      {
        loading: `Requesting ${asset} deposit...`,
        success: `Successfully deposited ${amountString} ${asset}!`,
        error: `${asset} deposit failed`,
      }
    );
  };

  const onHandleClaimMorRewards = async (asset: AssetSymbol) => {
    if (!userAddress || !l1ChainId)
      throw new Error("Claim prerequisites not met");

    // Get asset data dynamically
    const assetData = assets[asset];
    if (!assetData) {
      throw new Error(`${asset} data not available`);
    }

    if (!assetData.canClaim || assetData.claimableAmount <= BigInt(0)) {
      throw new Error(
        `${asset} claim prerequisites not met or no rewards available`
      );
    }

    const targetAddress = assetData.config.depositPoolAddress;

    // For V2 claims, we need ETH for cross-chain gas fees to L2 (Arbitrum Sepolia)
    // The claim will trigger cross-chain communication via LayerZero
    const ETH_FOR_CROSS_CHAIN_GAS = parseEther("0.01"); // 0.01 ETH for L2 gas

    await onHandleTransaction(
      () =>
        claimAsync({
          address: targetAddress,
          abi: DepositPoolAbi,
          functionName: "claim",
          args: [V2_REWARD_POOL_INDEX, userAddress],
          chainId: l1ChainId,
          value: ETH_FOR_CROSS_CHAIN_GAS, // Send ETH for cross-chain gas
          gas: BigInt(800000), // Higher gas limit for cross-chain operations
        }),
      {
        loading: `Claiming ${asset} rewards...`,
        success: `Successfully claimed ${asset} rewards! MOR tokens will be minted on Arbitrum Sepolia.`,
        error: `${asset} claim failed`,
      }
    );
  };

  const onHandleLockMorRewards = async (
    asset: AssetSymbol,
    lockDurationSeconds: bigint
  ) => {
    if (!userAddress || !l1ChainId)
      throw new Error("Lock claim prerequisites not met");

    // Get asset data dynamically
    const assetData = assets[asset];
    if (!assetData) {
      throw new Error(`${asset} data not available`);
    }

    const targetAddress = assetData.config.depositPoolAddress;

    const lockEndTimestamp =
      BigInt(Math.floor(Date.now() / 1000)) + lockDurationSeconds;

    await onHandleTransaction(
      () =>
        lockClaimAsync({
          address: targetAddress,
          abi: DepositPoolAbi,
          functionName: "lockClaim",
          args: [V2_REWARD_POOL_INDEX, lockEndTimestamp],
          chainId: l1ChainId,
          gas: BigInt(500000),
        }),
      {
        loading: `Locking ${asset} rewards...`,
        success: `Successfully locked ${asset} rewards for increased multiplier!`,
        error: `${asset} lock failed`,
      }
    );
  };

  const onHandleWithdraw = async (asset: AssetSymbol, amountString: string) => {
    setIsWithdrawFetching(true);
    // Get asset configuration and data
    const assetInfo = getAssetConfig(asset, networkEnv);

    const assetData = assets[asset];

    const decimals = assetInfo?.metadata.decimals || 18;

    // Refetch data before withdrawal validation
    const { data: userPoolData } = await assetContractData[
      asset
    ]?.refetch.userData();

    const amountBigInt = parseUnits(amountString, decimals);

    // Parse user pool data
    let userDeposited = assetData.userDeposited;

    if (userPoolData && Array.isArray(userPoolData)) {
      try {
        userDeposited = BigInt(userPoolData[1] || 0);
      } catch (e) {
        console.error(
          `Error parsing user pool data for ${assetData.config.symbol}:`,
          e
        );
      }
    }

    // Perform withdrawal validations before proceeding
    validateWithdraw({
      asset,
      amountBigInt,
      assetInfo,
      assetData,
      networkEnv,
      l1ChainId,
      userDeposited,
      userAddress,
    });

    const commonTxParams = {
      address: assetData.config.depositPoolAddress,
      abi: DepositPoolAbi,
      functionName: "withdraw",
      args: [V2_REWARD_POOL_INDEX, amountBigInt],
    };
    // 🔍 SIMULATION: Get exact contract error before execution - Trigged deployment
    try {
      await publicClient?.simulateContract({
        ...commonTxParams,
        account: userAddress,
      });
    } catch (error) {
      // If simulation fails, throw the actual contract error
      const contractError = (error as Error).message || "";
      throw new Error(`Contract simulation failed: ${contractError}`);
    }

    await onHandleTransaction(
      async () => {
        const txParams = {
          ...commonTxParams,
          chainId: l1ChainId,
          gas: BigInt(1200000),
        };

        return await withdrawAsync(txParams);
      },
      {
        loading: `Requesting ${asset} withdrawal...`,
        success: `Successfully withdrew ${amountString} ${asset}!`,
        error: `${asset} withdrawal failed`,
      },
      () => {
        setIsWithdrawFetching(false);
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

  const {
    isLoading: isConfirmingWithdraw,
    isSuccess: isWithdrawSuccess,
    isError: isWithdrawError,
    error: withdrawError,
  } = useWaitForTransactionReceipt({ hash: withdrawHash, chainId: l1ChainId });

  const {
    isLoading: isConfirmingClaim,
    isSuccess: isClaimSuccess,
    isError: isClaimError,
    error: claimError,
  } = useWaitForTransactionReceipt({ hash: claimHash, chainId: l1ChainId });

  const {
    isLoading: isConfirmingLockClaim,
    isSuccess: isLockClaimSuccess,
    isError: isLockClaimError,
    error: lockClaimError,
  } = useWaitForTransactionReceipt({ hash: lockClaimHash, chainId: l1ChainId });

  // =============== EFFECTS
  // -------------- STAKE HANDLERS ----------------
  useEffect(() => {
    if (isStakeError && stakeError && stakeHash) {
      const errorMessage =
        (stakeError as BaseError)?.shortMessage || stakeError.message;
      const txUrl = getTransactionUrl(l1ChainId, stakeHash);

      showToast({
        title: "Staking Failed",
        description: errorMessage || "Staking transaction failed",
        id: "stake-error",
        type: "error",
        action: txUrl
          ? {
              label: "View Transaction",
              onClick: () => window.open(txUrl, "_blank"),
            }
          : undefined,
      });
    }
  }, [isStakeError, stakeError, stakeHash, l1ChainId]);

  useEffect(() => {
    if (isStakeSuccess && stakeHash && stakeHash !== lastHandledStakeHash) {
      const txUrl = getTransactionUrl(l1ChainId, stakeHash);
      showToast({
        title: "Stake confimed!",
        description: "Your stake transaction has been confirmed",
        id: "stake-success",
        type: "success",
        action: txUrl
          ? {
              label: "View Transaction",
              onClick: () => window.open(txUrl, "_blank"),
            }
          : undefined,
      });
      Object.values(assetContractData).forEach((asset) => asset.refetch.all());
      onHandleSetModal(null);
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

  // -------------- WITHDRAW HANDLERS ----------------
  useEffect(() => {
    if (
      isWithdrawSuccess &&
      withdrawHash &&
      withdrawHash !== lastHandledWithdrawHash
    ) {
      const txUrl = getTransactionUrl(l1ChainId || 1, withdrawHash);

      showToast({
        title: "Withdrawal confirmed!",
        id: "withdraw-success",
        description: "Your withdrawal transaction has been confirmed",
        type: "success",
        action: txUrl
          ? {
              label: "View Transaction",
              onClick: () => window.open(txUrl, "_blank"),
            }
          : undefined,
      });

      // Refetch all asset contract data dynamically (balances, deposits, etc.)
      Object.values(assetContractData).forEach((asset) => asset.refetch.all());

      setLastHandledWithdrawHash(withdrawHash);
      onHandleSetModal(null);
    }
  }, [isWithdrawSuccess, withdrawHash, assetContractData, l1ChainId]);

  useEffect(() => {
    if (isWithdrawError && withdrawError && withdrawHash) {
      const errorMessage =
        (withdrawError as BaseError)?.shortMessage || withdrawError.message;

      const txUrl = getTransactionUrl(l1ChainId || 1, withdrawHash);

      showToast({
        title: "Withdrawal Failed",
        description: errorMessage,
        id: "withdraw-error",
        type: "error",
        action: txUrl
          ? {
              label: "View Transaction",
              onClick: () => window.open(txUrl, "_blank"),
            }
          : undefined,
      });
    }
  }, [isWithdrawError, withdrawError, withdrawHash, l1ChainId]);

  // -------------- CLAIM HANDLERS ----------------
  useEffect(() => {
    if (isClaimSuccess && claimHash && claimHash !== lastHandledClaimHash) {
      const txUrl = getTransactionUrl(l1ChainId || 1, claimHash);

      showToast({
        title: "Claim confirmed!",
        description: "Your claim transaction has been confirmed",
        type: "success",
        id: "claim-success",
        action: txUrl
          ? {
              label: "View Transaction",
              onClick: () => window.open(txUrl, "_blank"),
            }
          : undefined,
      });
      onHandleSetModal(null);

      // Refetch all asset reward data dynamically
      Object.values(assetContractData).forEach((asset) =>
        asset.refetch.rewards()
      );

      setLastHandledClaimHash(claimHash);
    }
  }, [isClaimSuccess, claimHash, assetContractData, l1ChainId]);

  useEffect(() => {
    if (isClaimError && claimError && claimHash) {
      const errorMessage =
        (withdrawError as BaseError)?.shortMessage || claimError.message;

      const txUrl = getTransactionUrl(l1ChainId || 1, claimHash);

      showToast({
        title: "Claim Failed",
        description: errorMessage,
        id: "claim-error",
        type: "error",
        action: txUrl
          ? {
              label: "View Transaction",
              onClick: () => window.open(txUrl, "_blank"),
            }
          : undefined,
      });
    }
  }, [isWithdrawError, withdrawError, withdrawHash, l1ChainId]);

  // -------------- LOCK CLAIM HANDLERS ----------------
  useEffect(() => {
    if (
      isLockClaimSuccess &&
      lockClaimHash &&
      lockClaimHash !== lastHandledLockClaimHash
    ) {
      const txUrl = l1ChainId
        ? getTransactionUrl(l1ChainId || 1, lockClaimHash)
        : null;

      showToast({
        title: "Lock period update confirmed!",
        description: "Your lock period update transaction has been confirmed",
        type: "success",
        id: "lock-claim-success",
        action: txUrl
          ? {
              label: "View Transaction",
              onClick: () => window.open(txUrl, "_blank"),
            }
          : undefined,
      });

      // Refetch all asset multiplier data dynamically
      Object.values(assetContractData).forEach((asset) =>
        asset.refetch.multiplier()
      );

      setLastHandledLockClaimHash(lockClaimHash);
      onHandleSetModal(null);
    }
  }, [isLockClaimSuccess, lockClaimHash, assetContractData, l1ChainId]);

  useEffect(() => {
    if (isLockClaimError && lockClaimError && lockClaimHash) {
      const errorMessage =
        (lockClaimError as BaseError)?.shortMessage || lockClaimError.message;
      const txUrl = getTransactionUrl(l1ChainId || 1, lockClaimHash);

      showToast({
        title: "Claim Failed",
        description: errorMessage,
        id: "lock-claim-error",
        type: "error",
        action: txUrl
          ? {
              label: "View Transaction",
              onClick: () => window.open(txUrl, "_blank"),
            }
          : undefined,
      });
    }
  }, [isLockClaimError, lockClaimError, lockClaimHash, l1ChainId]);

  // -------------- APPROVAL HANDLERS ----------------
  useEffect(() => {
    if (
      isApprovalSuccess &&
      approveHash &&
      approveHash !== lastHandledApprovalHash
    ) {
      showToast({
        title: "Approval successful!",
        id: "approval-success",
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
    isApprovalSuccess,
    approveHash,
    lastHandledApprovalHash,
    l1ChainId,
    assetContractData,
  ]);

  useEffect(() => {
    if (isApprovalError) {
      const errorMessage =
        (approvalError as BaseError)?.shortMessage || approvalError.message;
      const txUrl = getTransactionUrl(l1ChainId || 1, approveHash!);

      showToast({
        title: "Approval failed",
        description: errorMessage || "Approval transaction failed",
        type: "error",
        id: "approval-error",
        action: txUrl
          ? {
              label: "View Transaction",
              onClick: () => window.open(txUrl, "_blank"),
            }
          : undefined,
      });
    }
  }, [l1ChainId, approveHash, isApprovalError]);

  // =============== VARIABLES
  const isProcessingDeposit =
    isSendingApproval ||
    isConfirmingApproval ||
    isSendingStake ||
    isConfirmingStake;

  const isProcessingWithdraw =
    isSendingWithdraw || isConfirmingWithdraw || isWithdrawFetching;
  const isProcessingClaim = isSendingClaim || isConfirmingClaim;
  const isProcessingChangeLock = isSendingLockClaim || isConfirmingLockClaim;
  const totalClaimableAmountFormatted = formatBigInt(
    Object.values(assets).reduce(
      (total, asset) => total + asset.claimableAmount,
      BigInt(0)
    ),
    18,
    2
  );

  return (
    <CapitalStakingContext.Provider
      value={{
        assets,
        userAddress,
        l1ChainId,
        networkEnv,
        onHandleDeposit,
        onHandleWithdraw,
        isProcessingClaim,
        isProcessingDeposit,
        isProcessingWithdraw,
        onHandleApproveToken,
        onHandleLockMorRewards,
        isProcessingChangeLock,
        onHandleClaimMorRewards,
        checkAndUpdateApprovalNeeded,
        totalClaimableAmountFormatted,
      }}
    >
      <SelectedAssetProvider>{children}</SelectedAssetProvider>
    </CapitalStakingContext.Provider>
  );
};

/**
 * ===========================
 * EXPORTS
 * ===========================
 */
export default CapitalStakingProvider;
