import { HStack, Text } from "@chakra-ui/react";
import { ArbitrumIcon } from "../Icons/ArbitrumIcon";
import { useAccount, useChainId } from "wagmi";
import { useMORBalances } from "staking-dashboard/hooks/useMORBalances";
import { useEffect } from "react";
import { formatBalance } from "staking-dashboard/lib/helpers";
import { BaseIcon } from "../Icons/BaseIcon";
import { EthereumIcon } from "../Icons/EthereumIcon";
import { CHAIN_ID } from "staking-dashboard/lib/configs/constants";
import { useRouteNetwork } from "staking-dashboard/hooks/useRouteNetwork";

/**
 * ===========================
 * MAIN
 * ===========================
 */
export const TokenBalance: React.FC = () => {
  // =============== HOOKS
  const { address } = useAccount();
  const chainId = useChainId();
  const { isCapitalRoute } = useRouteNetwork();
  const {
    mainnetBalance,
    arbitrumBalance,
    baseBalance,
    refreshBalances,
    arbitrumSepoliaBalance,
  } = useMORBalances(address);

  // =============== EFFECTS
  useEffect(() => {
    // Store refresh function in window object so other components can access it
    if (typeof window !== "undefined") {
      window.refreshMORBalances = refreshBalances;
    }
  }, [refreshBalances]);

  // =============== VARIABLES
  const isTestnet =
    chainId === CHAIN_ID.ARBITRUM_SEPOLIA || chainId === CHAIN_ID.SEPOLIA; // Arbitrum Sepolia or Sepolia

  // =============== VIEWS
  if (isTestnet) {
    return (
      <HStack gap={1}>
        <ArbitrumIcon size={24} />
        <span
          style={{
            fontSize: "0.75rem",
          }}
        >
          (Sepolia)
        </span>
        <Text>{formatBalance(arbitrumSepoliaBalance as bigint)} MOR</Text>
      </HStack>
    );
  }

  // For capital route, show only mainnet
  if (isCapitalRoute) {
    return (
      <HStack gap={1} display={{ base: "none", md: "flex" }}>
        <EthereumIcon size={24} />
        <Text>{formatBalance(mainnetBalance as bigint)} MOR</Text>
      </HStack>
    );
  }

  // For other routes, show ARB + BASE
  return (
    <HStack gap={5} display={{ base: "none", md: "flex" }}>
      <HStack>
        <ArbitrumIcon size={24} />
        <Text>{formatBalance(arbitrumBalance as bigint)} MOR</Text>
      </HStack>
      <HStack>
        <BaseIcon size={24} />
        <Text>{formatBalance(baseBalance as bigint)} MOR</Text>
      </HStack>
    </HStack>
  );
};

/**
 * ===========================
 * EXPORTS
 * ===========================
 */
export default TokenBalance;
