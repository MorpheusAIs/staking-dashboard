"use client";
import { VStack, HStack, Text } from "@chakra-ui/react";
import StakeForm from "./StakeForm";
import WithdrawForm from "./WithdrawForm";
import StakingPosition from "./StakingPosition";
import { useStaking } from "staking-dashboard/hooks/useStaking";
import { SUBNET_CONFIG } from "staking-dashboard/lib/utils/subnet.config";
import { useChainId } from "wagmi";
import { useEffect, useRef } from "react";
import { arbitrumSepolia } from "viem/chains";
import { formatEther } from "viem";

/**
 * ===========================
 * MAIN
 * ===========================
 */
export const SubnetStaking = () => {
  // =============== HOOKS
  const chainId = useChainId();

  // =============== VARIABLES
  const subnetId = SUBNET_CONFIG.subnetID || "";
  const isTestnet = chainId === arbitrumSepolia.id;

  // =============== REFS
  // Ref to store the approval refresh function
  const refreshApprovalRef = useRef<
    ((amount: string) => Promise<boolean> | boolean) | null
  >(null);

  // =============== HOOKS
  const {
    isStaking,
    isApproving,
    tokenSymbol,
    tokenBalance,
    isLoadingData,
    needsApproval,
    onHandleStaking,
    onHandleApprove,
    isCorrectNetwork,
    onHandleNetworkSwitch,
    checkAndUpdateApprovalNeeded,
  } = useStaking({
    subnetId,
    networkChainId: chainId,
    onTxSuccess: () => {},
    lockPeriodInSeconds: SUBNET_CONFIG.lockPeriodInSeconds,
  });

  // =============== EFFECTS
  // Set the ref to the actual function for use in the onTxSuccess callback
  useEffect(() => {
    refreshApprovalRef.current = checkAndUpdateApprovalNeeded;
  }, [checkAndUpdateApprovalNeeded]);

  // =============== VIEWS
  return (
    <VStack
      bg="card"
      borderRadius="xl"
      p={6}
      gap={7}
      width="full"
      justifyContent="center"
      backdropFilter="blur(10px)"
      border="1px solid"
      borderColor="border"
      alignItems="center"
    >
      <HStack justifyContent={"flex-start"}>
        <Text fontWeight="medium" fontSize={"xl"}>
          MOR Subnet Staking
        </Text>
      </HStack>
      <HStack width={"full"} gap={5}>
        <StakeForm
          subnetId={subnetId}
          isTestnet={isTestnet}
          isStaking={isStaking}
          tokenSymbol={tokenSymbol}
          isApproving={isApproving}
          tokenBalance={
            tokenBalance ? parseFloat(formatEther(tokenBalance)) : 0
          }
          isLoadingData={isLoadingData}
          needsApproval={needsApproval}
          onHandleApprove={onHandleApprove}
          onHandleStaking={onHandleStaking}
          isCorrectNetwork={isCorrectNetwork}
          onHandleNetworkSwitch={onHandleNetworkSwitch}
          checkAndUpdateApprovalNeeded={checkAndUpdateApprovalNeeded}
        />
        <WithdrawForm />
      </HStack>
      <VStack>
        <Text fontWeight="medium" fontSize={"xl"}>
          My Staking Positions
        </Text>
        <StakingPosition />
      </VStack>
    </VStack>
  );
};

/**
 * ===========================
 * EXPORTS
 * ===========================
 */
export default SubnetStaking;
