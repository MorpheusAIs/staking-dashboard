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
import { useEffect, useState } from "react";
import CapitalStakingProvider from "../CapitalStakingProvider";
import DepositDialog from "./DepositDialog";
import { buttonRecipe } from "staking-dashboard/lib/configs/theme";
import { useChainId, useSwitchChain } from "wagmi";
import { mainnet } from "viem/chains";
import StakingPosition from "./StakingPosition";
/**
 * ===========================
 * MAIN
 * ===========================
 */
export const CapitalStaking = () => {
  // =============== STATE
  const [isDepositDialogOpen, setIsDepositDialogOpen] = useState(false);

  // =============== HOOKS
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();

  // =============== VARIABLES
  const recipe = useRecipe({ recipe: buttonRecipe });
  const styles = recipe({ visual: "solid" });

  // =============== EVENTS
  const onHandleOpenDepositDialog = (open: boolean) => {
    setIsDepositDialogOpen(open);
  };

  // =============== EFFECTS
  useEffect(() => {
    if (chainId !== mainnet.id) {
      switchChain({ chainId: mainnet.id });
    }
  }, []);

  // =============== VIEWS
  return (
    <CapitalStakingProvider>
      <DepositDialog
        open={isDepositDialogOpen}
        onHandleOpen={onHandleOpenDepositDialog}
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
                Mainnet
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
              onClick={() => setIsDepositDialogOpen(true)}
            >
              Deposit
            </Button>
          </HStack>
          <StakingPosition />
          {/* <VStack py={5} w={"full"} alignItems={"center"}>
            <Text color="gray.400">No active staking positions found.</Text>
          </VStack> */}
        </VStack>
      </VStack>
    </CapitalStakingProvider>
  );
};

/**
 * ===========================
 * EXPORTS
 * ===========================
 */
export default CapitalStaking;
