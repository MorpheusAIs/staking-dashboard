"use client";
import { VStack, HStack, Text, Alert, Button, Stack } from "@chakra-ui/react";
import StakeForm from "./StakeForm";
import WithdrawForm from "./WithdrawForm";
import StakingPosition from "./StakingPosition";
import { useStaking } from "staking-dashboard/hooks/useSubnetStaking";
import { getSubnetConfig } from "staking-dashboard/lib/helpers";
import { useChainId, useSwitchChain } from "wagmi";
import { useEffect, useRef, useState } from "react";
import { arbitrum, arbitrumSepolia, mainnet } from "viem/chains";
import { formatEther } from "viem";
import { NetworkDropdown } from "staking-dashboard/components/NetworkSwitchDropdown";
import SubnetStats from "../SubnetStats";
import Image from "next/image";
import LogoSrc from "../../../public/logo.png";

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
  const isTestnet = chainId === arbitrumSepolia.id;
  const subnetConfig = getSubnetConfig(isTestnet);
  const subnetId = subnetConfig.subnetID;

  // =============== REFS
  // Ref to store the approval refresh function
  const refreshApprovalRef = useRef<
    ((amount: string) => Promise<boolean> | boolean) | null
  >(null);

  // =============== HOOKS
  const {
    getAbi,
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
    contractAddress,
    isCorrectNetwork,
    onHandleWithdraw,
    onHandleNetworkSwitch,
    refetchStakerDataForUser,
    checkAndUpdateApprovalNeeded,
  } = useStaking({
    subnetId,
    networkChainId: chainId,
    onTxSuccess: () => {
      // Refetch the current user's staker data with logging
      if (refetchStakerDataForUser) {
        refetchStakerDataForUser()
          .then(() => {})
          .catch((error: unknown) => {
            console.error("Error refetching user staker data:", error);
          });
      } else {
        console.warn("refetchStakerDataForUser is not available");
      }
    },
    lockPeriodInSeconds: subnetConfig.lockPeriodInSeconds,
  });
  const { switchChain } = useSwitchChain();

  // =============== EVENTS
  const onToggleAlert = (message: string | null) => {
    setAlertMessage(message);
  };

  // =============== EFFECTS
  // Set the ref to the actual function for use in the onTxSuccess callback
  useEffect(() => {
    refreshApprovalRef.current = checkAndUpdateApprovalNeeded;
  }, [checkAndUpdateApprovalNeeded]);

  useEffect(() => {
    if (!isTestnet && chainId === mainnet.id) {
      switchChain({ chainId: arbitrum.id });
    }
  }, [chainId, isTestnet]);

  // =============== VARIABLES
  const formattedTokenBalance = tokenBalance
    ? parseFloat(formatEther(tokenBalance))
    : 0;

  // =============== VIEWS
  return (
    <VStack
      gap={{ base: 4, md: 4 }}
      width="full"
      h="full"
      mb={2}
      justifyContent={"center"}
    >
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
        width={"full"}
        justifyContent={"center"}
        alignItems={"center"}
        gap={3}
        pb={2}
      >
        <Image
          src={LogoSrc.src}
          width={125}
          height={125}
          alt="Logo"
          style={{ borderRadius: "12px" }}
        />
        <Stack justifyContent={"center"} alignItems={"center"}>
          <Text fontSize={"2xl"} fontWeight={"bold"}>
            {subnetConfig.name}
          </Text>
          {subnetConfig.description && (
            <Text fontSize={"md"} color="secondaryText" textAlign={"center"}>
              {subnetConfig.description}
            </Text>
          )}
        </Stack>
      </VStack>
      <SubnetStats tokenSymbol={tokenSymbol} isTestnet={isTestnet} />
      <VStack
        bg="card"
        borderRadius="xl"
        p={{ base: 5, md: 6 }}
        gap={7}
        width="full"
        justifyContent="center"
        backdropFilter="blur(20px)"
        border="1px solid"
        borderColor="border"
        alignItems="center"
      >
        <VStack w="full" gap={4} alignItems={"flex-start"}>
          <HStack
            justifyContent={"space-between"}
            w={"full"}
            alignItems={"center"}
            pb={2}
          >
            <Text fontWeight="medium" fontSize={{ base: "lg", md: "xl" }}>
              MOR Subnet Staking
            </Text>
            <NetworkDropdown />
          </HStack>
          <Stack
            width={"full"}
            gap={5}
            align={{ base: "center", md: "stretch" }}
            direction={{ base: "column", md: "row" }}
          >
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
          </Stack>
        </VStack>
        <VStack alignItems={"flex-start"} gap={4} w={"full"}>
          <Text fontWeight="medium" fontSize={"xl"}>
            My Staking Positions
          </Text>
          <StakingPosition
            getAbi={getAbi}
            subnetId={subnetId}
            isTestnet={isTestnet}
            contractAddress={contractAddress}
            stakerData={stakerData as unknown[]}
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
