import { Text, VStack } from "@chakra-ui/react";

/**
 * ===========================
 * MAIN
 * ===========================
 */
export const CapitalStaking = () => {
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
      <Text>Capital Staking</Text>
    </VStack>
  );
};

/**
 * ===========================
 * EXPORTS
 * ===========================
 */
export default CapitalStaking;
