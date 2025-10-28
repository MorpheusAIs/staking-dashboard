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
      borderRadius="md"
      p={100}
      width="full"
      justifyContent="center"
      backdropFilter="blur(8px)"
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
