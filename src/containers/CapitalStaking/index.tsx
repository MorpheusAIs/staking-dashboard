"use client";

import {
  Box,
  HStack,
  Separator,
  Text,
  VStack,
  Image,
  Button,
  useRecipe,
} from "@chakra-ui/react";
import { useEffect } from "react";
import DepositDialog from "./components/modals/DepositDialog";
import { buttonRecipe } from "staking-dashboard/lib/configs/theme";
import { useChainId, useSwitchChain } from "wagmi";
import { mainnet } from "viem/chains";
import StakingPosition from "./components/views/StakingPosition";
import WithdrawModal from "./components/modals/WithdrawModal";
import MorRewardsModal from "./components/modals/MorRewardsModal";
import StakeMorRewardsModal from "./components/modals/StakeMorRewardsModal";
import { useModalActions, useModalState } from "../ModalProvider";

/**
 * ===========================
 * MAIN
 * ===========================
 */
export const CapitalStaking = () => {
  // =============== HOOKS
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const { activeModal } = useModalState();
  const { onHandleSetModal } = useModalActions();

  // =============== VARIABLES
  const recipe = useRecipe({ recipe: buttonRecipe });
  const styles = recipe({ visual: "solid" });
  const isDepositModalActive = activeModal === "deposit";
  const isWithdrawModalActive = activeModal === "withdraw";
  const isLockRewardsModalActive = activeModal === "lockMorRewards";
  const isClaimRewardsModalActive = activeModal === "claimMorRewards";
  const isStakeMorRewardsModalActive = activeModal === "stakeMorRewards";

  // =============== EVENTS
  const onHandleOpenDepositDialog = (open: boolean) => {
    onHandleSetModal(open ? "deposit" : null);
  };

  const onHandleOpenWithdrawModal = (open: boolean) => {
    onHandleSetModal(open ? "withdraw" : null);
  };

  const onHandleOpenMorRewardsModal = (open: boolean) => {
    onHandleSetModal(
      open
        ? isClaimRewardsModalActive
          ? "claimMorRewards"
          : "lockMorRewards"
        : null
    );
  };
  const onHandleOpenStakeMorRewardsModal = (open: boolean) => {
    onHandleSetModal(open ? "stakeMorRewards" : null);
  };

  // =============== EFFECTS
  useEffect(() => {
    if (chainId !== mainnet.id) {
      switchChain({ chainId: mainnet.id });
    }
  }, [chainId]);

  // =============== VIEWS
  return (
    <>
      <DepositDialog
        open={isDepositModalActive}
        onHandleOpen={onHandleOpenDepositDialog}
      />
      <WithdrawModal
        open={isWithdrawModalActive}
        onHandleOpen={onHandleOpenWithdrawModal}
      />
      <MorRewardsModal
        open={isClaimRewardsModalActive || isLockRewardsModalActive}
        onHandleOpen={onHandleOpenMorRewardsModal}
      />
      <StakeMorRewardsModal
        open={isStakeMorRewardsModalActive}
        onHandleOpen={onHandleOpenStakeMorRewardsModal}
      />
      <VStack
        bg="card"
        borderRadius="xl"
        p={{ base: 5, md: 6 }}
        gap={4}
        width="full"
        backdropFilter="blur(20px)"
        border="1px solid"
        borderColor="border"
        alignItems="center"
      >
        <HStack width="full" justifyContent={"space-between"}>
          <VStack alignItems={"flex-start"} gap={2} width={"full"}>
            <Text fontWeight="medium" fontSize={{ base: "lg", md: "xl" }}>
              Capital Staking
            </Text>
            <Text fontSize="sm" color="gray.400">
              Stake tokens to earn MOR rewards on Ethereum Mainnet
            </Text>
          </VStack>
          <Box
            display="flex"
            alignItems="center"
            justifyContent={"center"}
            px={{ base: 5, md: 8 }}
            paddingRight={10}
            py={1.5}
            border="1px solid"
            borderColor="border"
            borderRadius="md"
            bg="card"
            minW={"150px"}
            color="white"
          >
            <HStack
              width="full"
              justifyContent={"center"}
              alignItems={"center"}
              gap={2}
            >
              <Image
                src={"/icons/ethereum-eth-logo.svg"}
                alt={"Ethereum Mainnet"}
                boxSize="30px"
                borderRadius="full"
                objectFit={"contain"}
              />
              <Text
                fontWeight="medium"
                fontSize="md"
                display={{ base: "none", md: "block" }}
              >
                {chainId === mainnet.id ? "Mainnet" : "Wrong Network"}
              </Text>
            </HStack>
          </Box>
        </HStack>
        <Box py={1} width={"full"}>
          <Separator colorPalette={"border"} />
        </Box>
        <VStack alignItems={"flex-start"} gap={4} w={"full"} py={1}>
          <HStack
            width="100%"
            justifyContent={"space-between"}
            alignItems={"center"}
          >
            <Text fontWeight="medium" fontSize={"xl"}>
              My Staking Positions
            </Text>
            <Button
              borderRadius={"sm"}
              css={styles}
              px={5}
              onClick={() => onHandleOpenDepositDialog(true)}
            >
              Deposit
            </Button>
          </HStack>
          <StakingPosition />
        </VStack>
      </VStack>
    </>
  );
};

/**
 * ===========================
 * EXPORTS
 * ===========================
 */
export default CapitalStaking;
