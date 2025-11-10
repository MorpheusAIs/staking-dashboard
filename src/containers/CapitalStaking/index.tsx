"use client";
import { Text, VStack, HStack, Button, Grid, Box, Tabs } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { useChainId, useSwitchChain, useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { mainnet } from "wagmi/chains";
import { CAPITAL_CONFIG, getActiveTokens, getTokenBySymbol, getDistributorV2Address, calculateClaimLockEnd } from "staking-dashboard/lib/configs/capital.config";
import TokenSelector from "./TokenSelector";
import StakeForm from "./StakeForm";
import StakingPosition from "./StakingPosition";
import { useCapitalStakingBalance } from "staking-dashboard/hooks/useCapitalStakingBalance";
import { formatUnits, parseUnits } from "viem";
import ERC20Abi from "staking-dashboard/lib/abi/ERC20.json";
import DepositPoolAbi from "staking-dashboard/lib/abi/DepositPool.json";
import { toaster } from "staking-dashboard/components/ui/toaster";
import type { Abi } from "viem";

/**
 * ===========================
 * MAIN
 * ===========================
 */
export const CapitalStaking = () => {
  // =============== HOOKS
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const { isConnected, address } = useAccount();
  
  // =============== STATE
  const [hasSwitched, setHasSwitched] = useState(false);
  const [selectedToken, setSelectedToken] = useState("stETH");
  const [lockPeriodDays, setLockPeriodDays] = useState<number>(
    CAPITAL_CONFIG.params.minLockPeriodDays
  );
  const [needsApproval, setNeedsApproval] = useState(false);

  // =============== CUSTOM HOOKS
  const { balance, allowance, decimals, refreshBalance, isLoading } = 
    useCapitalStakingBalance(address, selectedToken);

  // Write contract hooks for transactions
  const {
    data: approveTxHash,
    writeContract: writeApprove,
    isPending: isApprovePending,
    error: approveError,
  } = useWriteContract();

  const {
    data: stakeTxHash,
    writeContract: writeStake,
    isPending: isStakePending,
    error: stakeError,
  } = useWriteContract();

  // Transaction receipt hooks
  const { isLoading: isApproveTxLoading, isSuccess: isApproveTxSuccess } =
    useWaitForTransactionReceipt({ hash: approveTxHash });

  const { isLoading: isStakeTxLoading, isSuccess: isStakeTxSuccess } =
    useWaitForTransactionReceipt({ hash: stakeTxHash });

  // =============== EFFECTS
  // Auto-switch to mainnet when component mounts (only once and only if connected)
  useEffect(() => {
    if (isConnected && chainId !== mainnet.id && switchChain && !hasSwitched) {
      switchChain({ chainId: mainnet.id });
      setHasSwitched(true);
    }
  }, [chainId, switchChain, hasSwitched, isConnected]);

  // Handle approval transaction success
  useEffect(() => {
    if (isApproveTxSuccess) {
      toaster.create({
        title: "Approval Successful",
        description: `${selectedToken} approved successfully!`,
        type: "success",
      });
      setNeedsApproval(false);
      refreshBalance(); // Refresh to get updated allowance
    }
  }, [isApproveTxSuccess, selectedToken, refreshBalance]);

  // Handle staking transaction success
  useEffect(() => {
    if (isStakeTxSuccess) {
      toaster.create({
        title: "Staking Successful",
        description: `Successfully staked ${selectedToken}!`,
        type: "success",
      });
      refreshBalance(); // Refresh to get updated balance
    }
  }, [isStakeTxSuccess, selectedToken, refreshBalance]);

  // Handle approval errors
  useEffect(() => {
    if (approveError) {
      toaster.create({
        title: "Approval Failed",
        description: approveError.message || "Failed to approve token",
        type: "error",
      });
    }
  }, [approveError]);

  // Handle staking errors
  useEffect(() => {
    if (stakeError) {
      toaster.create({
        title: "Staking Failed",
        description: stakeError.message || "Failed to stake tokens",
        type: "error",
      });
    }
  }, [stakeError]);

  // =============== VARIABLES
  const isCorrectNetwork = () => !isConnected || chainId === mainnet.id;
  const activeTokens = getActiveTokens(mainnet.id);

  // Convert balance from bigint to number for display
  const tokenBalance = balance && decimals !== undefined 
    ? parseFloat(formatUnits(balance, decimals))
    : 0;

  // TODO: Replace staking position data with actual contract reads
  const mockPositionData = {
    stakedAmount: "0",
    claimLockEnd: "N/A",
    lastStake: "N/A",
    pendingRewards: "0",
  };

  // =============== HANDLERS
  const handleTokenSelect = (token: string) => {
    setSelectedToken(token);
    // Reset approval state when switching tokens
    setNeedsApproval(false);
    // Balance will auto-refresh via useEffect in the hook
  };

  const handleApprove = async (amount: string) => {
    const token = getTokenBySymbol(selectedToken, mainnet.id);
    const distributorAddress = getDistributorV2Address(mainnet.id);

    if (!token || !distributorAddress) {
      toaster.create({
        title: "Configuration Error",
        description: "Token or distributor address not found",
        type: "error",
      });
      return;
    }

    try {
      // Convert amount to wei using token decimals
      const amountInWei = parseUnits(amount, token.decimals);

      // Use unlimited approval for better UX (as per config)
      const approvalAmount = CAPITAL_CONFIG.params.unlimitedApproval
        ? BigInt("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff")
        : amountInWei;

      await writeApprove({
        address: token.address,
        abi: ERC20Abi as Abi,
        functionName: "approve",
        args: [distributorAddress, approvalAmount],
        chainId: mainnet.id,
      });
    } catch (error) {
      console.error("Approval error:", error);
      // Error toast will be shown by the error effect
    }
  };

  const handleStaking = async (
    amount: string,
    lockDays: number,
    onSuccess: () => void
  ) => {
    const token = getTokenBySymbol(selectedToken, mainnet.id);

    if (!token || !token.depositPool) {
      toaster.create({
        title: "Configuration Error",
        description: "Token or deposit pool address not found",
        type: "error",
      });
      return;
    }

    try {
      // Convert amount to wei using token decimals
      const amountInWei = parseUnits(amount, token.decimals);

      // Calculate claim lock end timestamp
      const claimLockEnd = calculateClaimLockEnd(lockDays);

      // Use configured referral address
      const referrer = CAPITAL_CONFIG.referrerAddress;

      // Reward pool index (always 0 for public pool)
      const rewardPoolIndex = CAPITAL_CONFIG.params.rewardPoolIndex;

      await writeStake({
        address: token.depositPool,
        abi: DepositPoolAbi as Abi,
        functionName: "stake",
        args: [rewardPoolIndex, amountInWei, claimLockEnd, referrer],
        chainId: mainnet.id,
      });

      // Call onSuccess after transaction is submitted
      onSuccess();
    } catch (error) {
      console.error("Staking error:", error);
      // Error toast will be shown by the error effect
    }
  };

  const handleNetworkSwitch = async () => {
    if (switchChain) {
      await switchChain({ chainId: mainnet.id });
      return true;
    }
    return undefined;
  };

  const checkAndUpdateApprovalNeeded = async (amountToStake?: string) => {
    if (!allowance || !decimals) {
      setNeedsApproval(false);
      return false;
    }

    // If no amount specified, don't require approval
    if (!amountToStake || parseFloat(amountToStake) <= 0) {
      setNeedsApproval(false);
      return false;
    }

    // Convert amount to stake to bigint using the token's decimals
    const token = getTokenBySymbol(selectedToken, mainnet.id);
    if (!token) return false;

    const amountInWei = BigInt(Math.floor(parseFloat(amountToStake) * Math.pow(10, token.decimals)));
    
    // Check if allowance is sufficient
    const needsApprovalCheck = allowance < amountInWei;
    setNeedsApproval(needsApprovalCheck);
    return needsApprovalCheck;
  };

  const handleLockPeriodChange = (days: number) => {
    setLockPeriodDays(days);
  };

  // =============== VIEWS
  return (
    <VStack
      bg="card"
      borderRadius="xl"
      p={{ base: 4, md: 6 }}
      gap={6}
      width="full"
      minH="calc(100vh - 200px)"
      backdropFilter="blur(20px)"
      border="1px solid"
      borderColor="border"
      alignItems="stretch"
    >
      {/* Header */}
      <VStack alignItems="flex-start" gap={2} width="full">
        <Text fontSize="2xl" fontWeight="bold" color="white">
          Capital Staking
        </Text>
        <Text fontSize="sm" color="gray.400">
          Stake tokens to earn MOR rewards on Ethereum Mainnet
        </Text>
      </VStack>

      {/* Network Warning */}
      {!isCorrectNetwork() && (
        <HStack
          bg="yellow.500/20"
          p={3}
          borderRadius="md"
          justifyContent="space-between"
          alignItems="center"
          border="1px solid"
          borderColor="yellow.500/40"
          width="full"
        >
          <Text color="yellow.200" fontWeight="medium" fontSize="sm">
            ⚠️ Please switch to Ethereum Mainnet to continue
          </Text>
          <Button
            size="sm"
            onClick={() => switchChain?.({ chainId: mainnet.id })}
            colorScheme="yellow"
            variant="solid"
          >
            Switch Network
          </Button>
        </HStack>
      )}

      {/* Token Selector */}
      <TokenSelector
        selectedToken={selectedToken}
        onTokenSelect={handleTokenSelect}
      />

      {/* Tabs for Stake/Position */}
      <Tabs.Root defaultValue="stake" width="full">
        <Tabs.List bg="gray.800/50" borderRadius="md" p={1}>
          <Tabs.Trigger value="stake" flex="1">
            <Text fontSize="sm" fontWeight="medium">
              Stake
            </Text>
          </Tabs.Trigger>
          <Tabs.Trigger value="position" flex="1">
            <Text fontSize="sm" fontWeight="medium">
              My Position
            </Text>
          </Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="stake" py={4}>
          <Grid
            templateColumns={{ base: "1fr", lg: "1fr 1fr" }}
            gap={6}
            width="full"
          >
            {/* Stake Form */}
            <StakeForm
              selectedToken={selectedToken}
              isApproving={isApprovePending || isApproveTxLoading}
              tokenBalance={tokenBalance}
              isLoadingData={isLoading}
              needsApproval={needsApproval}
              isSubmitting={isStakePending || isStakeTxLoading}
              lockPeriodDays={lockPeriodDays}
              isCorrectNetwork={isCorrectNetwork}
              onHandleApprove={handleApprove}
              onHandleStaking={handleStaking}
              onHandleNetworkSwitch={handleNetworkSwitch}
              onLockPeriodChange={handleLockPeriodChange}
              checkAndUpdateApprovalNeeded={checkAndUpdateApprovalNeeded}
            />

            {/* Info Card */}
            <VStack
              p={4}
              bg="blue.900/20"
              borderRadius="md"
              border="1px solid"
              borderColor="blue.700/30"
              alignItems="flex-start"
              gap={3}
              height="fit-content"
            >
              <Text fontSize="md" fontWeight="bold" color="blue.300">
                How it works
              </Text>
              <VStack alignItems="flex-start" gap={2} fontSize="sm" color="gray.300">
                <Text>
                  • Select a token from the supported assets
                </Text>
                <Text>
                  • Enter the amount you want to stake
                </Text>
                <Text>
                  • Choose your lock period (minimum {CAPITAL_CONFIG.params.minLockPeriodDays} days)
                </Text>
                <Text>
                  • Longer lock periods earn higher reward multipliers
                </Text>
                <Text>
                  • Approve and stake to start earning MOR rewards
                </Text>
              </VStack>
            </VStack>
          </Grid>
        </Tabs.Content>

        <Tabs.Content value="position" py={4}>
          <StakingPosition
            selectedToken={selectedToken}
            stakedAmount={mockPositionData.stakedAmount}
            claimLockEnd={mockPositionData.claimLockEnd}
            lastStake={mockPositionData.lastStake}
            pendingRewards={mockPositionData.pendingRewards}
            isLoadingData={isLoading}
          />
        </Tabs.Content>
      </Tabs.Root>

      {/* Footer Info */}
      <Box
        p={3}
        bg="gray.800/30"
        borderRadius="md"
        border="1px solid"
        borderColor="gray.700/50"
      >
        <HStack justifyContent="space-between" fontSize="xs" color="gray.400">
          <Text>Active Tokens: {activeTokens.length}</Text>
          <Text>Network: Ethereum Mainnet</Text>
          <Text>Minimum Lock: {CAPITAL_CONFIG.params.minLockPeriodDays} days</Text>
        </HStack>
      </Box>
    </VStack>
  );
};

/**
 * ===========================
 * EXPORTS
 * ===========================
 */
export default CapitalStaking;
