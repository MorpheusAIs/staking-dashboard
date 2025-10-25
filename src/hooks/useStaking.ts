"use client";

import { useCallback, useEffect, useState } from "react";
import { toaster } from "staking-dashboard/components/ui/toaster";
import {
  formatStakingError,
  formatTimePeriod,
  getMissingApprovalData,
  isStakeAmountInvalid,
  validateAndExtractChainConfig,
} from "staking-dashboard/lib/helpers";
import {
  useAccount,
  useChainId,
  useReadContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import ERC20Abi from "staking-dashboard/lib/abi/ERC20.json";
import BuilderSubnetsAbi from "staking-dashboard/lib/abi/BuilderSubnets.json";
import BuilderSubnetsV2Abi from "staking-dashboard/lib/abi/BuilderSubnetsV2.json";
import BuildersAbi from "staking-dashboard/lib/abi/Builders.json";
import { Address, formatEther, isAddress, parseEther } from "viem";
import { getChainById } from "staking-dashboard/lib/networks";
import { arbitrumSepolia } from "viem/chains";
import { CHAIN_ID } from "staking-dashboard/lib/utils/constants";
import {
  ConstructReadContractArgs,
  UseStakingProps,
} from "staking-dashboard/@types/useStaking";
import { validatePreApproval, validatePreStake } from "./helpers";
import { useNetwork } from "staking-dashboard/containers/NetworkProvider";

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
  // =============== HOOKS
  const walletChainId = useChainId();
  const { address: connectedAddress } = useAccount();
  const { switchToChain } = useNetwork();

  // =============== VARIABLES
  const isTestnet = networkChainId === arbitrumSepolia.id;

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

        // @TODO remove
        console.log(
          `Approval check on ${
            isTestnet ? "testnet" : "mainnet"
          } (chain ${networkChainId}):`,
          {
            parsedAmount: parsedAmount.toString(),
            currentAllowance: currentAllowance.toString(),
            formattedAmount: formatEther(parsedAmount),
            formattedAllowance: formatEther(currentAllowance),
            needsApproval: approvalNeeded,
            tokenAddress,
            contractAddress,
            networkName:
              networkChainId === 8453
                ? "Base"
                : networkChainId === 42161
                ? "Arbitrum"
                : "Unknown",
          }
        );

        setNeedsApproval(approvalNeeded);
        return approvalNeeded;
      } catch (error) {
        setNeedsApproval(true);
        return true; // Assume approval needed on error
      }
    },
    [allowance, tokenAddress, contractAddress, networkChainId, isTestnet]
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

  // Helper to construct read contract args with common parameters
  const constructReadContractArgs = (args: ConstructReadContractArgs) => {
    const {
      address,
      abi,
      functionName,
      enabled,
      retry,
      args: readArgs,
      staleTime,
    } = args;

    return {
      address,
      abi,
      functionName,
      chainId: networkChainId,
      args: readArgs,
      query: {
        enabled,
        retry: retry || (networkChainId === CHAIN_ID.BASE ? 3 : 1), // More retries for Base network
        staleTime,
      },
    };
  };

  // =============== EVENT HANDLERS
  // Handle token approval before staking
  const onHandleApprove = async (amount: string) => {
    console.log("Approval request with parameters:", {
      tokenAddress,
      contractAddress,
      networkChainId,
      amount,
    });

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

  // Handle staking
  const onHandleStaking = async (amount: string) => {
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
        // For mainnet using BuilderSubnets
        // Get the network name for clearer logging
        const networkName =
          networkChainId === CHAIN_ID.ARBITRUM ? "Arbitrum" : "Base";

        console.log(
          `Mainnet staking transaction parameters (${networkName}):`,
          {
            builderPoolId: subnetId, // Log this to debug
            amount: parsedAmount.toString(),
            formattedAmount: formatEther(parsedAmount),
            contractAddress,
            chainId: networkChainId,
            networkName,
          }
        );

        // For mainnet, we need to use deposit(bytes32,uint256) from BuildersAbi
        // Mainnet uses a different contract interface: Builders.json
        await writeStake({
          // We are sure that contractAddress is defined due to validatePreStake check
          address: contractAddress!,
          abi: BuildersAbi, // Changed from BuilderSubnetsAbi to BuildersAbi
          functionName: "deposit", // Changed from 'stake' to 'deposit'
          args: [subnetId, parsedAmount], // Changed to include subnetId
          chainId: networkChainId,
        });
      }

      // Different staking function for testnet
      // For testnet using BuilderSubnetsV2
      const now = Math.floor(Date.now() / 1000);

      // Use the subnet-specific lock period if provided, otherwise default to 30 days
      const lockPeriod = lockPeriodInSeconds || 30 * 24 * 60 * 60; // Default to 30 days in seconds
      console.log(
        `Using lock period: ${lockPeriod} seconds (${formatTimePeriod(
          lockPeriod
        )})`
      );

      const lockEndTimestamp = BigInt(now + lockPeriod);

      // Explicitly convert to uint128 by ensuring it's within range
      const claimLockEndUint128 =
        lockEndTimestamp & BigInt("0xFFFFFFFFFFFFFFFF"); // Mask to uint128 range

      // Verify the contract address is the one from the networks.ts config
      const expectedContractAddress = getChainById(networkChainId, "testnet")
        ?.contracts?.builders?.address;

      console.log("Testnet staking transaction parameters:", {
        subnetId,
        stakerAddress: connectedAddress,
        amount: parsedAmount.toString(),
        formattedAmount: formatEther(parsedAmount),
        lockPeriodInSeconds: lockPeriod,
        claimLockEnd: claimLockEndUint128.toString(),
        formattedLockEnd: new Date(
          Number(claimLockEndUint128) * 1000
        ).toISOString(),
        contractAddress,
        expectedContractAddress,
        chainId: networkChainId,
      });

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
        networkChainId === 421614
          ? {
              gas: BigInt(3000000), // Fixed gas limit to avoid over-estimation
              gasPrice: undefined, // Let Arbitrum estimate the gas price
            }
          : {};

      await writeStake({
        address: contractAddress!,
        abi: BuilderSubnetsV2Abi,
        functionName: "stake",
        args: [subnetId, connectedAddress, parsedAmount, claimLockEndUint128],
        chainId: networkChainId,
        ...gasConfig,
      });
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
      const networkType = isTestnet ? "testnet" : "mainnet";

      console.log(
        `Switching to ${targetNetwork} (${networkType}, chainId: ${networkChainId})...`
      );
      toaster.create({
        description: `Switching to ${targetNetwork}...`,
        type: "loading",
      });

      await switchToChain(networkChainId);

      toaster.create({
        description: `Switched to ${targetNetwork} successfully!`,
        type: "success",
      });
    } catch (error) {
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

  // =============== READ CONTRACT HOOKS
  // Reads token symbol ("MOR")
  const {
    data: tokenSymbolData,
    isFetching: isFetchingSymbol,
    error: tokenSymbolError,
  } = useReadContract(
    constructReadContractArgs({
      address: tokenAddress,
      abi: ERC20Abi,
      functionName: "symbol",
      enabled: isCorrectNetwork() && !!tokenAddress,
    })
  );

  // Reads token address from the staking contract
  const {
    data: morTokenAddressData,
    isFetching: isFetchingToken,
    error: tokenAddressError,
  } = useReadContract(
    constructReadContractArgs({
      address: contractAddress,
      abi: getAbi(),
      functionName: "token",
      enabled:
        isCorrectNetwork() &&
        !!contractAddress &&
        networkChainId !== CHAIN_ID.BASE, // Skip for Base network
    })
  );

  // Reads user’s MOR token balance
  const {
    data: balanceData,
    refetch: refetchBalance,
    isFetching: isFetchingBalance,
    error: balanceError,
  } = useReadContract(
    constructReadContractArgs({
      address: tokenAddress,
      abi: ERC20Abi,
      functionName: "balanceOf",
      args: [connectedAddress!],
      enabled: isCorrectNetwork() && !!tokenAddress && !!connectedAddress,
    })
  );

  // Reads how much MOR is approved for the staking contract
  const {
    data: allowanceData,
    refetch: refetchAllowance,
    isFetching: isFetchingAllowance,
    error: allowanceError,
  } = useReadContract(
    constructReadContractArgs({
      address: tokenAddress,
      abi: ERC20Abi,
      functionName: "allowance",
      args: [connectedAddress!, contractAddress!],
      enabled:
        isCorrectNetwork() &&
        !!tokenAddress &&
        !!connectedAddress &&
        !!contractAddress,
    })
  );

  // Get claimable amount - different functions for mainnet vs testnet
  const {
    data: claimableAmountData,
    refetch: refetchClaimableAmount,
    isFetching: isFetchingClaimableAmount,
  } = useReadContract(
    constructReadContractArgs({
      address: contractAddress,
      abi: isTestnet ? BuilderSubnetsV2Abi : BuildersAbi,
      functionName: isTestnet ? "getStakerRewards" : "getCurrentBuilderReward",
      args: isTestnet
        ? [subnetId!, connectedAddress!] // testnet: getStakerRewards(subnetId, stakerAddress)
        : [subnetId!], // mainnet: getCurrentBuilderReward(builderPoolId)
      enabled:
        isCorrectNetwork() &&
        !!contractAddress &&
        !!subnetId &&
        !!connectedAddress,
      staleTime: 5 * 60 * 1000, // 5 minutes
    })
  );

  // =============== WRITE CONTRACT HOOKS
  // Stake tokens
  const {
    data: stakeTxResult,
    writeContract: writeStake,
    isPending: isStakePending,
    error: stakeError,
    reset: resetStakeContract,
  } = useWriteContract({
    mutation: {
      onError: (error) => {
        const errorMessage = formatStakingError(error, "stakeError");
        toaster.create({
          title: "Staking Failed",
          description: errorMessage,
          type: "error",
        });
      },
    },
  });

  // Approve tokens for staking
  const {
    data: approveTxResult,
    writeContract: writeApprove,
    isPending: isApprovePending,
    error: approveError,
    reset: resetApproveContract,
  } = useWriteContract({
    mutation: {
      onError: (error) => {
        const errorMessage = formatStakingError(error, "approveError");
        toaster.create({
          title: "Token Approval Failed",
          description: errorMessage,
          type: "error",
        });
      },
    },
  });

  // =============== WAIT FOR TRANSACTION HOOKS
  // Wait for staking transaction to be mined
  const { isLoading: isStakeTxLoading, isSuccess: isStakeTxSuccess } =
    useWaitForTransactionReceipt({ hash: stakeTxResult });
  // Wait for approval transaction to be mined
  const { isLoading: isApproveTxLoading, isSuccess: isApproveTxSuccess } =
    useWaitForTransactionReceipt({ hash: approveTxResult });

  // =============== EFFECTS
  // This effect updates the token address, symbol, balance, and allowance states after reading from the contracts
  useEffect(() => {
    if (
      networkChainId !== CHAIN_ID.BASE &&
      morTokenAddressData &&
      isAddress(morTokenAddressData as string)
    ) {
      setTokenAddress(morTokenAddressData as Address);
    }

    if (tokenSymbolData) setTokenSymbol(tokenSymbolData as string);
    if (balanceData !== undefined) setTokenBalance(balanceData as bigint);
    if (allowanceData !== undefined) setAllowance(allowanceData as bigint);
  }, [
    morTokenAddressData,
    tokenSymbolData,
    balanceData,
    allowanceData,
    networkChainId,
  ]);

  // This effect set the initial contract and token addresses based on the network config defined in lib/networks.ts
  useEffect(() => {
    const result = validateAndExtractChainConfig({
      networkChainId,
      isTestnet,
      onError: (message) => {
        toaster.create({
          title: "Something went wrong",
          description: message,
          type: "error",
        });
      },
      onWarning: (message) => {
        toaster.create({
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
  }, [networkChainId, isTestnet, getChainById]);

  // =============== VARIABLES
  // 2 condition flags to ensure correct loading states, first for writing transactions, second for waiting for them to be mined
  const isStaking = isStakePending || isStakeTxLoading;
  const isApproving = isApprovePending || isApproveTxLoading;
  // Loading state for all read contract data
  const isLoadingData =
    isFetchingToken ||
    isFetchingSymbol ||
    isFetchingBalance ||
    isFetchingAllowance ||
    isFetchingClaimableAmount;

  // =============== RETURN
  return {
    isStaking,
    tokenSymbol,
    isApproving,
    tokenBalance,
    isLoadingData,
    needsApproval,
    onHandleApprove,
    onHandleStaking,
    isCorrectNetwork,
    onHandleNetworkSwitch,
    checkAndUpdateApprovalNeeded,
  };
};
