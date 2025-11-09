"use client";
import { Text, VStack, HStack, Button } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { useChainId, useSwitchChain, useAccount } from "wagmi";
import { mainnet } from "wagmi/chains";
import { CAPITAL_CONFIG } from "staking-dashboard/lib/configs/capital.config";

/**
 * ===========================
 * MAIN
 * ===========================
 */
export const CapitalStaking = () => {
  // =============== HOOKS
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const { isConnected } = useAccount();
  const [hasSwitched, setHasSwitched] = useState(false);

  // =============== EFFECTS
  // Auto-switch to mainnet when component mounts (only once and only if connected)
  useEffect(() => {
    if (isConnected && chainId !== mainnet.id && switchChain && !hasSwitched) {
      switchChain({ chainId: mainnet.id });
      setHasSwitched(true);
    }
  }, [chainId, switchChain, hasSwitched, isConnected]);

  // =============== VARIABLES
  const isCorrectNetwork = !isConnected || chainId === mainnet.id;
  
  // Example: Access capital config
  const { supportedTokens, contracts, referralAddress } = CAPITAL_CONFIG;
  const activeTokens = supportedTokens[mainnet.id] || [];

  // =============== VIEWS
  return (
    <VStack
      bg="card"
      borderRadius="xl"
      p={{ base: 5, md: 6 }}
      gap={7}
      width="full"
      h={"full"}
      justifyContent="center"
      backdropFilter="blur(20px)"
      border="1px solid"
      borderColor="border"
      alignItems="center"
    >
      {!isCorrectNetwork && (
        <HStack
          bg="yellow.200"
          p={3}
          borderRadius="md"
          justifyContent="center"
          alignItems="center"
          gap={3}
        >
          <Text color="black" fontWeight="medium">
            Please switch to Ethereum Mainnet
          </Text>
          <Button
            size="sm"
            onClick={() => switchChain({ chainId: mainnet.id })}
            bg="black"
            color="white"
            _hover={{ bg: "gray.800" }}
          >
            Switch Network
          </Button>
        </HStack>
      )}
      <VStack gap={3} width="full" maxW="600px">
        <Text fontSize="2xl" fontWeight="bold">Capital Staking</Text>
        <Text fontSize="sm" color="gray.400">
          Stake liquid staking tokens to earn MOR rewards
        </Text>
        
        {/* TODO: Implement staking interface with token selection */}
        {/* Available tokens: {activeTokens.length} */}
        {/* Referral: {referralAddress} */}
        {/* Contract: {contracts[mainnet.id]?.stakingContract} */}
      </VStack>
    </VStack>
  );
};

/**
 * ===========================
 * EXPORTS
 * ===========================
 */
export default CapitalStaking;
