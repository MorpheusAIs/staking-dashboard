"use client";
import { VStack, HStack, Text, Alert, Button } from "@chakra-ui/react";
import StakeForm from "./StakeForm";
import WithdrawForm from "./WithdrawForm";
import StakingPosition from "./StakingPosition";
import { useStaking } from "staking-dashboard/hooks/useStaking";
import { SUBNET_CONFIG } from "staking-dashboard/lib/configs/subnet.config";
import { useChainId } from "wagmi";
import { useEffect, useRef, useState } from "react";
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

  // =============== STATE
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  // =============== VARIABLES
  const subnetId = SUBNET_CONFIG.subnetID || "";
  const isTestnet = chainId === arbitrumSepolia.id;

  // =============== REFS
  const refreshStakingDataRef = useRef(false); // Add a ref to track if refresh has been called
  // Ref to store the approval refresh function
  const refreshApprovalRef = useRef<
    ((amount: string) => Promise<boolean> | boolean) | null
  >(null);

  // =============== HOOKS
  const {
    isStaking,
    stakerData,
    isApproving,
    tokenSymbol,
    tokenBalance,
    isSubmitting,
    isWithdrawing,
    isLoadingData,
    needsApproval,
    onHandleStaking,
    onHandleApprove,
    isCorrectNetwork,
    onHandleWithdraw,
    onHandleNetworkSwitch,
    refetchStakerDataForUser,
    checkAndUpdateApprovalNeeded,
  } = useStaking({
    subnetId,
    networkChainId: chainId,
    onTxSuccess: () => {
      console.log(
        "Transaction successful (stake/withdraw/claim), refreshing staking table and current user staker data."
      );
      refreshStakingDataRef.current = true; // For the main staking table
      // const currentStakeAmount = stakeAmount; // Capture current stake amount
      // setStakeAmount(""); // Clear stake input

      // Signal the WithdrawalPositionCard to reset its withdrawal amount
      if (window && window.document) {
        const resetWithdrawEvent = new CustomEvent("reset-withdraw-form");
        window.document.dispatchEvent(resetWithdrawEvent);
      }

      // Refetch the current user's staker data with logging
      if (refetchStakerDataForUser) {
        console.log(
          "Calling refetchStakerDataForUser to refresh user's staked amount..."
        );
        refetchStakerDataForUser()
          .then(() => {
            console.log(
              "Successfully refetched user staker data after transaction"
            );
          })
          .catch((error: unknown) => {
            console.error("Error refetching user staker data:", error);
          });
      } else {
        console.warn("refetchStakerDataForUser is not available");
      }

      // Force refresh approval state after successful transaction
      // Use timeout to allow blockchain state to update
      // setTimeout(() => {
      //   console.log(
      //     "Refreshing approval state after successful transaction..."
      //   );
      //   if (
      //     refreshApprovalRef.current &&
      //     currentStakeAmount &&
      //     parseFloat(currentStakeAmount) > 0
      //   ) {
      //     try {
      //       const result = refreshApprovalRef.current(currentStakeAmount);
      //       console.log(
      //         "Successfully refreshed approval state after transaction, result:",
      //         result
      //       );
      //     } catch (error: unknown) {
      //       console.error("Error refreshing approval state:", error);
      //     }
      //   }
      // }, 2000); // 2 second delay to allow blockchain state to update
    },
    lockPeriodInSeconds: SUBNET_CONFIG.lockPeriodInSeconds,
  });

  // =============== EVENTS
  const onToggleAlert = (message: string | null) => {
    setAlertMessage(message);
  };

  // =============== EFFECTS
  // Set the ref to the actual function for use in the onTxSuccess callback
  useEffect(() => {
    refreshApprovalRef.current = checkAndUpdateApprovalNeeded;
  }, [checkAndUpdateApprovalNeeded]);

  // =============== VARIABLES
  const formattedTokenBalance = tokenBalance
    ? parseFloat(formatEther(tokenBalance))
    : 0;

  // =============== VIEWS
  return (
    <VStack gap={5}>
      {alertMessage && (
        <Alert.Root status="error" alignItems={"center"} rounded="md">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>{alertMessage}</Alert.Title>
          </Alert.Content>
          <Button
            alignSelf="center"
            fontWeight="medium"
            onClick={() => onToggleAlert(null)}
            variant={"outline"}
          >
            Understood
          </Button>
        </Alert.Root>
      )}
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
            isSubmitting={isSubmitting}
            isLoadingData={isLoadingData}
            needsApproval={needsApproval}
            onHandleApprove={onHandleApprove}
            onHandleStaking={onHandleStaking}
            isCorrectNetwork={isCorrectNetwork}
            tokenBalance={formattedTokenBalance}
            onHandleNetworkSwitch={onHandleNetworkSwitch}
            checkAndUpdateApprovalNeeded={checkAndUpdateApprovalNeeded}
          />
          <WithdrawForm
            isTestnet={isTestnet}
            stakerData={stakerData}
            tokenSymbol={tokenSymbol}
            onToggleAlert={onToggleAlert}
            isWithdrawing={isWithdrawing}
            onHandleWithdraw={onHandleWithdraw}
            isCorrectNetwork={isCorrectNetwork}
            onHandleNetworkSwitch={onHandleNetworkSwitch}
          />
        </HStack>
        <VStack>
          <Text fontWeight="medium" fontSize={"xl"}>
            My Staking Positions
          </Text>
          <StakingPosition
            stakerData={stakerData}
            isTestnet={isTestnet}
            tokenSymbol={tokenSymbol}
          />
        </VStack>
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
