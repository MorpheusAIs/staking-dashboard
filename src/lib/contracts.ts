import { mainnetChains, testnetChains } from "./networks";
import { CHAIN_ID } from "./utils/constants";

// MOR token addresses by chain ID - derived from networks.ts for single source of truth
export const morTokenContracts: Record<number, string> = {
  // Arbitrum
  [CHAIN_ID.ARBITRUM]:
    mainnetChains.arbitrum.contracts?.morToken?.address || "",
  // Base
  [CHAIN_ID.BASE]: mainnetChains.base.contracts?.morToken?.address || "",

  // Arbitrum Sepolia
  [CHAIN_ID.ARBITRUM_SEPOLIA]:
    testnetChains.arbitrumSepolia.contracts?.morToken?.address || "",
} as const;
