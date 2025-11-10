"use client";
import { HStack, Text, VStack, Box } from "@chakra-ui/react";
import { CAPITAL_CONFIG } from "staking-dashboard/lib/configs/capital.config";
import { mainnet } from "wagmi/chains";

export type TokenSelectorProps = {
  selectedToken: string;
  onTokenSelect: (token: string) => void;
};

/**
 * ===========================
 * MAIN
 * ===========================
 */
export const TokenSelector: React.FC<TokenSelectorProps> = (props) => {
  const { selectedToken, onTokenSelect } = props;

  // =============== VARIABLES
  const tokens = CAPITAL_CONFIG.supportedTokens[mainnet.id] || [];

  // =============== VIEWS
  return (
    <VStack width="full" alignItems="flex-start" gap={3}>
      <Text fontSize="sm" fontWeight="medium" color="gray.300">
        Select Token
      </Text>
      <HStack
        width="full"
        gap={2}
        flexWrap="wrap"
        justifyContent={{ base: "center", md: "flex-start" }}
      >
        {tokens.map((token) => (
          <Box
            key={token.symbol}
            as="button"
            onClick={() => token.isActive && onTokenSelect(token.symbol)}
            p={3}
            px={4}
            borderRadius="md"
            border="2px solid"
            borderColor={
              selectedToken === token.symbol ? "primary" : "border"
            }
            bg={selectedToken === token.symbol ? "primary/10" : "card"}
            cursor={token.isActive ? "pointer" : "not-allowed"}
            transition="all 0.2s"
            _hover={token.isActive ? {
              borderColor: "primary",
              transform: "translateY(-2px)",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
            } : {}}
            opacity={token.isActive ? 1 : 0.5}
          >
            <VStack gap={1}>
              <HStack gap={2}>
                {/* Token Icon Placeholder */}
                <Box
                  width="24px"
                  height="24px"
                  borderRadius="full"
                  bg="gray.700"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                >
                  <Text fontSize="xs" fontWeight="bold">
                    {token.symbol.charAt(0)}
                  </Text>
                </Box>
                <Text fontSize="md" fontWeight="bold">
                  {token.symbol}
                </Text>
              </HStack>
              <Text fontSize="xs" color="gray.400">
                {token.name}
              </Text>
            </VStack>
          </Box>
        ))}
      </HStack>
    </VStack>
  );
};

/**
 * ===========================
 * EXPORTS
 * ===========================
 */
export default TokenSelector;

