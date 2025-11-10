"use client";

import { useCallback, useEffect, useState } from "react";
import { toaster } from "staking-dashboard/components/ui/toaster";
import {
  getMissingApprovalData,
  isStakeAmountInvalid,
  validateAndExtractChainConfig,
} from "staking-dashboard/lib/helpers";
import {
  useAccount,
  useChainId,
  useConfig,
  useReadContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { readContracts } from "wagmi/actions";
import ERC20Abi from "staking-dashboard/lib/abi/ERC20.json";
import BuilderSubnetsAbi from "staking-dashboard/lib/abi/BuilderSubnets.json";
import BuilderSubnetsV2Abi from "staking-dashboard/lib/abi/BuilderSubnetsV2.json";
import BuildersAbi from "staking-dashboard/lib/abi/Builders.json";
import { Address, formatEther, isAddress, parseEther, type Abi } from "viem";
import { getChainById } from "staking-dashboard/lib/networks";
import { arbitrumSepolia } from "viem/chains";
import { CHAIN_ID } from "staking-dashboard/lib/configs/constants";
import { UseStakingProps } from "staking-dashboard/@types/useStaking";
import { validatePreApproval, validatePreStake } from "./helpers";
import { useNetwork } from "staking-dashboard/containers/NetworkProvider";
import { getSafeWalletUrlIfApplicable } from "staking-dashboard/lib/configs/safe-wallet-detection";
import { showToast } from "staking-dashboard/lib/showToast";
import { waitForTransactionReceipt } from "wagmi/actions";

export const useStaking = (args: UseStakingProps) => {
  const { subnetId, networkChainId, onTxSuccess, lockPeriodInSeconds } = args;

  // =============== STATE
  // Symbol of the token (default "MOR"); will update dynamically after reading from the token contract
  const [tokenSymbol, setTokenSymbol] = useState<string>("MOR");

  // Address of the MOR (or equivalent) ERC20 token;
  // usually fetched from the staking contract via its `token()` function, unless predefined (e.g. on Base network)
  const [tokenAddress, setTokenAddress] = useState<Address | undefined>(
    undefined
  );

  // Address of the staking contract (BuilderSubnets / BuilderSubnetsV2),
  // determined from the network configuration using `validateAndExtractChainConfig`
  const [contractAddress, setContractAddress] = useState<Address | undefined>(
    undefined
  );

  // The connected user's token balance (from the token contract's `balanceOf(address)` call)
  const [tokenBalance, setTokenBalance] = useState<bigint | undefined>(
    undefined
  );

  // The connected user's allowance (how much the staking contract is allowed to spend, from `allowance(owner, spender)`)
  const [allowance, setAllowance] = useState<bigint | undefined>(undefined);

  // Whether the user needs to approve tokens before staking
  const [needsApproval, setNeedsApproval] = useState<boolean>(false);

  const [isNetworkSwitching, setIsNetworkSwitching] = useState(false);

  // Batched data loading state
  const [isBatchedLoading, setIsBatchedLoading] = useState(false);
  const [stakerData, setStakerData] = useState<unknown | undefined>(undefined);

  // =============== HOOKS
  const walletChainId = useChainId();
  const config = useConfig();
  const { address: connectedAddress } = useAccount();
  const { switchToChain } = useNetwork();

  // =============== VARIABLES
  const isTestnet = networkChainId === arbitrumSepolia.id;

  // Helper function to show enhanced toast with Safe wallet link if applicable
  const showEnhancedLoadingToast = useCallback(async (message: string, id: string) => {
    if (connectedAddress && networkChainId) {
      showToast({
        description: message,
        type: "loading",
        id,
      });
      try {
        const safeWalletUrl = await getSafeWalletUrlIfApplicable(
          connectedAddress,
          networkChainId
        );
        if (safeWalletUrl) {
          toaster.update(id, {
            description: message,
            type: "loading",
            action: {
              label: "Open Safe Wallet",
              onClick: () => window.open(safeWalletUrl, "_blank"),
            },
          });
        }
      } catch {
        toaster.dismiss(id);
      }
    } else {
      toaster.dismiss(id);
    }
  }, [connectedAddress, networkChainId]);
  
  // =============== HELPERS
  // Check if approval is needed and update state
  const checkAndUpdateApprovalNeeded = useCallback(
    (stakeAmount: string) => {
      try {
        // If no amount or zero amount, no approval needed
        if (isStakeAmountInvalid(stakeAmount)) {
          setNeedsApproval(false);
          return false;
        }

        const missingData = getMissingApprovalData({
          allowance,
          tokenAddress,
          contractAddress,
        });

        if (missingData.length > 0) {
          setNeedsApproval(true);
          return true;
        }

        const parsedAmount = parseEther(stakeAmount);
        const currentAllowance = allowance || BigInt(0);

        // Standard approval check for all networks (including Base)
        // Fixed: Use the same logic for all networks to avoid Base network issues
        const approvalNeeded = currentAllowance < parsedAmount;

        setNeedsApproval(approvalNeeded);
        return approvalNeeded;
      } catch {
        setNeedsApproval(true);
        return true; // Assume approval needed on error
      }
    },
    [allowance, tokenAddress, contractAddress]
  );

  // Helper to check if user is on correct network
  const isCorrectNetwork = useCallback(() => {
    return (
      typeof walletChainId === "number" && walletChainId === networkChainId
    );
  }, [walletChainId, networkChainId]);

  const getNetworkName = useCallback(
    (chainId: number): string => {
      const chain = getChainById(chainId, isTestnet ? "testnet" : "mainnet");
      return chain?.name ?? `Network ID ${chainId}`;
    },
    [isTestnet]
  );

  // Helper to get the correct ABI based on network (V1 vs V2)
  const getAbi = useCallback(() => {
    return isTestnet ? BuilderSubnetsV2Abi : BuilderSubnetsAbi;
  }, [isTestnet]);

  // =============== EVENT HANDLERS
  // Handle token approval before staking
  const onHandleApprove = async (amount: string) => {
    if (!validatePreApproval(tokenAddress, contractAddress)) {
      return;
    }

    try {
      // Parse the amount to approve
      const approvalAmount = parseEther(amount);
      await writeApprove({
        address: tokenAddress,
        abi: ERC20Abi,
        functionName: "approve",
        args: [contractAddress, approvalAmount],
        chainId: networkChainId,
      });
    } catch (error) {
      console.error("Error in approval call:", error);
      toaster.create({
        description: `Approval request failed. ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        type: "error",
      });
    }
  };

  // Handle withdraw MOR
  const onHandleWithdraw = async (
    amount: string,
    onWithDrawSuccess: () => void
  ) => {
    if (!connectedAddress || !isCorrectNetwork()) {
      toaster.create({
        title: "Cannot withdraw: Wallet or network issue.",
        type: "error",
      });
      return;
    }

    if (!contractAddress) {
      toaster.create({
        title: "Builder contract address not found.",
        type: "error",
      });
      return;
    }

    if (!subnetId) {
      toaster.create({
        title: "Subnet ID is required for withdrawing.",
        type: "error",
      });
      return;
    }

    try {
      const parsedAmount = parseEther(amount);

      // Both testnet (V2) and mainnet contracts use the same withdraw interface
      // withdraw(bytes32 subnetId_, uint256 amount_)
      await writeWithdraw(
        {
          address: contractAddress,
          abi: isTestnet ? BuilderSubnetsV2Abi : BuildersAbi, // Use BuildersAbi for mainnet
          functionName: "withdraw",
          args: [subnetId, parsedAmount],
          chainId: networkChainId,
        },
        {
          onSuccess: async (result) => {
            const receipt = await waitForTransactionReceipt(config, {
              hash: result,
            });

            if (receipt.status === "success") {
              onWithDrawSuccess?.();
            }
          },
        }
      );
    } catch (error) {
      console.error("Error in handleWithdraw:", error);
      toaster.create({
        title: "Failed to withdraw",
        description: `${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        type: "error",
      });
    }
  };

  // Handle staking
  const onHandleStaking = async (
    amount: string,
    onStakingSuccess: () => void
  ) => {
    if (
      !validatePreStake({
        connectedAddress,
        contractAddress,
        isCorrectNetwork,
        subnetId,
      })
    ) {
      return;
    }

    try {
      const parsedAmount = parseEther(amount);

      // Check if user has enough balance
      const userBalance = tokenBalance || BigInt(0);
      if (userBalance < parsedAmount) {
        toaster.create({
          description: `Insufficient balance. You have ${formatEther(
            userBalance
          )} ${tokenSymbol}.`,
          type: "error",
        });
        return;
      }

      // Mainnet staking flow
      if (!isTestnet) {
        // For mainnet, we need to use deposit(bytes32,uint256) from BuildersAbi
        // Mainnet uses a different contract interface: Builders.json
        return await writeStake(
          {
            // We are sure that contractAddress is defined due to validatePreStake check
            address: contractAddress!,
            abi: BuildersAbi, // Changed from BuilderSubnetsAbi to BuildersAbi
            functionName: "deposit", // Changed from 'stake' to 'deposit'
            args: [subnetId, parsedAmount], // Changed to include subnetId
            chainId: networkChainId,
          },
          {
            onSuccess: async (result) => {
              const receipt = await waitForTransactionReceipt(config, {
                hash: result,
              });

              if (receipt.status === "success") {
                onStakingSuccess();
              }
            },
          }
        );
      }

      // Different staking function for testnet
      // For testnet using BuilderSubnetsV2
      const now = Math.floor(Date.now() / 1000);

      // Use the subnet-specific lock period if provided, otherwise default to 30 days
      const lockPeriod = lockPeriodInSeconds || 30 * 24 * 60 * 60; // Default to 30 days in seconds

      const lockEndTimestamp = BigInt(now + lockPeriod);

      // Explicitly convert to uint128 by ensuring it's within range
      const claimLockEndUint128 =
        lockEndTimestamp & BigInt("0xFFFFFFFFFFFFFFFF"); // Mask to uint128 range

      // Verify the contract address is the one from the networks.ts config
      const expectedContractAddress = getChainById(networkChainId, "testnet")
        ?.contracts?.builders?.address;

      // Ensure we're using the correct contract address
      if (
        expectedContractAddress &&
        contractAddress?.toLowerCase() !== expectedContractAddress.toLowerCase()
      ) {
        toaster.create({
          description: `Contract address mismatch! Using ${contractAddress} but expected ${expectedContractAddress}`,
          type: "warning",
        });
      }

      // Make sure the subnetId is properly formatted as bytes32
      if (!subnetId?.startsWith("0x") || subnetId.length !== 66) {
        toaster.create({
          description: `Subnet ID format may be incorrect: ${subnetId}`,
          type: "warning",
        });
      }

      // Optimize gas settings for Arbitrum Sepolia
      const gasConfig =
        networkChainId === arbitrumSepolia.id
          ? {
              gas: BigInt(3000000), // Fixed gas limit to avoid over-estimation
              gasPrice: undefined, // Let Arbitrum estimate the gas price
            }
          : {};

      await writeStake(
        {
          address: contractAddress!,
          abi: BuilderSubnetsV2Abi,
          functionName: "stake",
          args: [subnetId, connectedAddress, parsedAmount, claimLockEndUint128],
          chainId: networkChainId,
          ...gasConfig,
        },
        {
          onSuccess: async (result) => {
            const receipt = await waitForTransactionReceipt(config, {
              hash: result,
            });

            if (receipt.status === "success") {
              onStakingSuccess();
            }
          },
        }
      );
    } catch (error) {
      toaster.create({
        description: `Failed to stake: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        type: "error",
      });
    }
  };

  //  Network switching
  const onHandleNetworkSwitch = async () => {
    if (isCorrectNetwork()) return true;

    setIsNetworkSwitching(true);
    try {
      const targetNetwork = getNetworkName(networkChainId);

      toaster.create({
        description: `Switching to ${targetNetwork}...`,
        type: "loading",
      });

      await switchToChain(networkChainId);

      toaster.create({
        description: `Switched to ${targetNetwork} successfully!`,
        type: "success",
      });
    } catch {
      toaster.create({
        description: `Failed to switch to ${getNetworkName(
          networkChainId
        )}. Please switch manually.`,
        type: "error",
      });
    } finally {
      setIsNetworkSwitching(false);
    }
  };

  // =============== BATCHED DATA FETCHING
  // Fetch all read-only contract data in a single multicall to reduce RPC calls from 7+ to 1
  const fetchBatchedData = useCallback(async () => {
    if (
      !tokenAddress ||
      !contractAddress ||
      !connectedAddress ||
      !subnetId ||
      !isCorrectNetwork()
    ) {
      return;
    }

    setIsBatchedLoading(true);

    try {
      // Batch all contract reads into ONE multicall RPC request
      const contracts = [
        // 0: Token Symbol
        {
          address: tokenAddress,
          abi: ERC20Abi as Abi,
          functionName: "symbol",
          chainId: networkChainId,
        },
        // 1: Token Balance
        {
          address: tokenAddress,
          abi: ERC20Abi as Abi,
          functionName: "balanceOf",
          args: [connectedAddress],
          chainId: networkChainId,
        },
        // 2: Allowance
        {
          address: tokenAddress,
          abi: ERC20Abi as Abi,
          functionName: "allowance",
          args: [connectedAddress, contractAddress],
          chainId: networkChainId,
        },
        // 3: Staker Data
        {
          address: contractAddress,
          abi: (isTestnet ? BuilderSubnetsV2Abi : BuildersAbi) as Abi,
          functionName: isTestnet ? "stakers" : "usersData",
          args: isTestnet
            ? [subnetId, connectedAddress]
            : [connectedAddress, subnetId],
          chainId: networkChainId,
        },
        // 4: Claimable Amount
        {
          address: contractAddress,
          abi: (isTestnet ? BuilderSubnetsV2Abi : BuildersAbi) as Abi,
          functionName: isTestnet
            ? "getStakerRewards"
            : "getCurrentBuilderReward",
          args: isTestnet ? [subnetId, connectedAddress] : [subnetId],
          chainId: networkChainId,
        },
      ];

      const results = await readContracts(config, { contracts });

      // Update all state from batched results
      if (results[0].status === "success") {
        setTokenSymbol(results[0].result as string);
      }
      if (results[1].status === "success") {
        setTokenBalance(results[1].result as bigint);
      }
      if (results[2].status === "success") {
        setAllowance(results[2].result as bigint);
      }
      if (results[3].status === "success") {
        setStakerData(results[3].result);
      }
    } catch (error) {
      console.error("Error fetching batched data:", error);
    } finally {
      setIsBatchedLoading(false);
    }
  }, [
    config,
    tokenAddress,
    contractAddress,
    connectedAddress,
    subnetId,
    networkChainId,
    isTestnet,
    isCorrectNetwork,
  ]);

  // Refetch functions for manual refresh
  const refetchStakerDataForUser = fetchBatchedData;
  const refetchBalance = fetchBatchedData;
  const refetchAllowance = fetchBatchedData;
  const refetchClaimableAmount = fetchBatchedData;

  // =============== READ CONTRACT HOOKS (LEGACY - NOW USING BATCHED APPROACH)
  // Only keep the token address read for Base network since it's predefined
  const { data: morTokenAddressData } = useReadContract({
    address: contractAddress,
    abi: getAbi(),
    functionName: "token",
    chainId: networkChainId,
    query: {
      enabled:
        isCorrectNetwork() &&
        !!contractAddress &&
        networkChainId !== CHAIN_ID.BASE, // Skip for Base network
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchInterval: false,
    },
  });

  // =============== WRITE CONTRACT HOOKS
  // Stake tokens
  const {
    data: stakeTxResult,
    writeContract: writeStake,
    isPending: isStakePending,
    error: stakeError,
    reset: resetStakeContract,
  } = useWriteContract();

  // Approve tokens for staking
  const {
    data: approveTxResult,
    writeContract: writeApprove,
    isPending: isApprovePending,
    error: approveError,
    reset: resetApproveContract,
  } = useWriteContract();

  const {
    data: withdrawTxResult,
    writeContract: writeWithdraw,
    isPending: isWithdrawPending,
    error: withdrawError,
    reset: resetWithdrawContract,
  } = useWriteContract();

  // =============== WAIT FOR TRANSACTION HOOKS
  // Wait for staking transaction to be mined
  const { isLoading: isStakeTxLoading, isSuccess: isStakeTxSuccess } =
    useWaitForTransactionReceipt({ hash: stakeTxResult });
  // Wait for approval transaction to be mined
  const { isLoading: isApproveTxLoading, isSuccess: isApproveTxSuccess } =
    useWaitForTransactionReceipt({ hash: approveTxResult });

  const { isLoading: isWithdrawTxLoading, isSuccess: isWithdrawTxSuccess } =
    useWaitForTransactionReceipt({ hash: withdrawTxResult });

  // =============== EFFECTS
  // This effect updates the token address from the contract (non-Base networks only)
  useEffect(() => {
    if (
      networkChainId !== CHAIN_ID.BASE &&
      morTokenAddressData &&
      isAddress(morTokenAddressData as string)
    ) {
      setTokenAddress(morTokenAddressData as Address);
    }
  }, [morTokenAddressData, networkChainId]);

  // This effect set the initial contract and token addresses based on the network config defined in lib/networks.ts
  useEffect(() => {
    const result = validateAndExtractChainConfig({
      networkChainId,
      isTestnet,
      onError: (message) => {
        showToast({
          title: "Something went wrong",
          description: message,
          type: "error",
        });
      },
      onWarning: (message) => {
        showToast({
          title: "Warning",
          description: message,
          type: "warning",
        });
      },
    });

    if (result) {
      setContractAddress(result.builders);
      setTokenAddress(result.token);
    }
  }, [networkChainId, isTestnet]);

  // Trigger batched data fetch when addresses are ready
  useEffect(() => {
    if (
      tokenAddress &&
      contractAddress &&
      connectedAddress &&
      subnetId &&
      isCorrectNetwork()
    ) {
      fetchBatchedData();
    }
  }, [
    tokenAddress,
    contractAddress,
    connectedAddress,
    subnetId,
    isCorrectNetwork,
    fetchBatchedData,
  ]);

  // Handle Approval Transaction Notifications
  useEffect(() => {
    if (isApprovePending) {
      void showEnhancedLoadingToast(
        "Confirm approval in wallet...",
        "approve-toast"
      );
    }
    if (isApproveTxSuccess) {
      showToast({
        title: "Approval Successful",
        description: "Approval transaction confirmed!",
        type: "success",
        method: "update",
        id: "approve-toast",
      });

      // Improved allowance refresh for Base network and all networks
      // Add a delay to ensure blockchain state is updated
      const refreshAllowanceWithDelay = () => {
        setTimeout(() => {
          refetchAllowance()
            .then(() => {})
            .catch((error: unknown) => {
              console.error(
                "Error refreshing allowance after approval:",
                error
              );
            });
        }, 2000); // 2 second delay for Base network compatibility
      };

      refreshAllowanceWithDelay();
      // Trigger MOR balance refresh across all chains
      if (typeof window !== 'undefined' && window.refreshMORBalances) {
        window.refreshMORBalances();
      }
      resetApproveContract();
    }
    if (approveError) {
      const errorMsg = approveError?.message || "Approval failed.";
      let displayError = errorMsg.split("(")[0].trim();
      const detailsMatch = errorMsg.match(
        /(?:Details|Reason): (.*?)(?:\\n|\.|$)/i
      );
      if (detailsMatch && detailsMatch[1])
        displayError = detailsMatch[1].trim();

      showToast({
        title: "Approval Failed",
        description: displayError,
        type: "error",
        method: "update",
        id: "approve-toast",
      });
      resetApproveContract();
    }
  }, [
    isApprovePending,
    isApproveTxSuccess,
    approveError,
    resetApproveContract,
    refetchAllowance,
    showEnhancedLoadingToast,
  ]);

  // Handle Staking Transaction Notifications
  useEffect(() => {
    if (isStakePending) {
      void showEnhancedLoadingToast("Confirm staking in wallet...", "stake-toast");
    }
    if (isStakeTxSuccess) {
      showToast({
        method: "update",
        id: "stake-toast",
        title: "Successfully Staked Token!",
        description: `Tx: ${stakeTxResult?.substring(0, 10)}...`,
        type: "success",
        action: {
          label: "View on Explorer",
          onClick: () => {
            const chain = getChainById(
              networkChainId,
              isTestnet ? "testnet" : "mainnet"
            );
            const explorerUrl = chain?.blockExplorers?.default.url;
            if (explorerUrl && stakeTxResult) {
              window.open(`${explorerUrl}/tx/${stakeTxResult}`, "_blank");
            }
          },
        },
      });

      resetStakeContract();
      // Refresh balance and allowance after staking
      refetchBalance();
      refetchAllowance();
      refetchStakerDataForUser();
      refetchClaimableAmount();
      // Trigger MOR balance refresh across all chains
      if (typeof window !== 'undefined' && window.refreshMORBalances) {
        window.refreshMORBalances();
      }
      if (onTxSuccess) {
        onTxSuccess();
      }
    }
    if (stakeError) {
      const errorMsg = stakeError?.message || "Staking failed.";
      let displayError = errorMsg.split("(")[0].trim();
      const detailsMatch = errorMsg.match(
        /(?:Details|Reason): (.*?)(?:\\n|\.|$)/i
      );
      if (detailsMatch && detailsMatch[1])
        displayError = detailsMatch[1].trim();

      showToast({
        title: "Staking Failed",
        description: displayError,
        type: "error",
        method: "update",
        id: "stake-toast",
      });
      resetStakeContract();
    }
  }, [
    isStakePending,
    isStakeTxSuccess,
    stakeTxResult,
    stakeError,
    resetStakeContract,
    onTxSuccess,
    refetchBalance,
    refetchAllowance,
    refetchStakerDataForUser,
    refetchClaimableAmount,
    showEnhancedLoadingToast,
    networkChainId,
    isTestnet,
  ]);

  // Handle Withdrawal Transaction Notifications
  useEffect(() => {
    if (isWithdrawPending) {
      void showEnhancedLoadingToast(
        "Confirm withdrawal in wallet...",
        "withdraw-tx"
      );
    }
    if (isWithdrawTxSuccess) {
      showToast({
        type: "success",
        method: "update",
        id: "withdraw-tx",
        title: "Withdrawal Successful",
        description: `Tx: ${withdrawTxResult?.substring(0, 10)}...`,
        action: {
          label: "View on Explorer",
          onClick: () => {
            const chain = getChainById(
              networkChainId,
              isTestnet ? "testnet" : "mainnet"
            );
            const explorerUrl = chain?.blockExplorers?.default.url;
            if (explorerUrl && withdrawTxResult) {
              window.open(`${explorerUrl}/tx/${withdrawTxResult}`, "_blank");
            }
          },
        },
      });

      resetWithdrawContract();
      // Refresh balance after withdrawal
      refetchBalance();
      refetchStakerDataForUser();
      refetchClaimableAmount();
      // Trigger MOR balance refresh across all chains
      if (typeof window !== 'undefined' && window.refreshMORBalances) {
        window.refreshMORBalances();
      }
      if (onTxSuccess) {
        onTxSuccess();
      }
    }
    if (withdrawError) {
      const errorMsg = withdrawError?.message || "Withdrawal failed.";
      let displayError = errorMsg.split("(")[0].trim();
      const detailsMatch = errorMsg.match(
        /(?:Details|Reason): (.*?)(?:\\n|\.|$)/i
      );
      if (detailsMatch && detailsMatch[1])
        displayError = detailsMatch[1].trim();

      showToast({
        title: "Withdrawal Failed",
        description: displayError,
        type: "error",
        method: "update",
        id: "withdraw-tx",
      });
      resetWithdrawContract();
    }
  }, [
    isWithdrawPending,
    isWithdrawTxSuccess,
    withdrawTxResult,
    withdrawError,
    resetWithdrawContract,
    onTxSuccess,
    refetchBalance,
    refetchStakerDataForUser,
    refetchClaimableAmount,
    showEnhancedLoadingToast,
    networkChainId,
    isTestnet,
  ]);

  // =============== VARIABLES
  // 2 condition flags to ensure correct loading states, first for writing transactions, second for waiting for them to be mined
  const isStaking = isStakePending || isStakeTxLoading;
  const isApproving = isApprovePending || isApproveTxLoading;
  // Loading state for all read contract data - now using batched loading
  const isLoadingData = isBatchedLoading;

  // @TODO withdraw
  const isAnyTxPending = isApproving || isStaking;
  // || isWithdrawing || isClaiming;
  const isSubmitting = isAnyTxPending || isNetworkSwitching;
  const isWithdrawing = isWithdrawPending || isWithdrawTxLoading;

  // =============== RETURN
  return {
    getAbi,
    isStaking,
    stakerData,
    tokenSymbol,
    isApproving,
    tokenBalance,
    isSubmitting,
    isWithdrawing,
    isLoadingData,
    needsApproval,
    onHandleApprove,
    contractAddress,
    onHandleStaking,
    onHandleWithdraw,
    isCorrectNetwork,
    onHandleNetworkSwitch,
    refetchStakerDataForUser,
    checkAndUpdateApprovalNeeded,
  };
};
