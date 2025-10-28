import { HStack, Text } from "@chakra-ui/react";
import { ArbitrumIcon } from "../Icons/ArbitrumIcon";
import { useAccount, useChainId } from "wagmi";
import { useMORBalances } from "staking-dashboard/hooks/useMORBalances";
import { useEffect } from "react";
import { formatBalance } from "staking-dashboard/lib/helpers";
import { BaseIcon } from "../Icons/BaseIcon";
import { CHAIN_ID } from "staking-dashboard/lib/configs/constants";

export type TokenBalanceProps = {};

/**
 * ===========================
 * MAIN
 * ===========================
 */
export const TokenBalance: React.FC<TokenBalanceProps> = () => {
  // =============== HOOKS
  const { address } = useAccount();
  console.log("address", address);
  const chainId = useChainId();
  const {
    arbitrumBalance,
    baseBalance,
    refreshBalances,
    arbitrumSepoliaBalance,
  } = useMORBalances(address);

  console.log("arbitrumBalance, baseBalance", arbitrumBalance, baseBalance);

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

  console.log("arbitrumSepoliaBalance", arbitrumSepoliaBalance);

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

  return (
    <HStack gap={5}>
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
