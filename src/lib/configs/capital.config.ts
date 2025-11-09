import { CHAIN_ID } from "./constants";

/**
 * Capital Staking Configuration
 * 
 * This file contains all configuration for the Capital Staking feature,
 * including supported tokens, contract addresses, and staking parameters.
 */

export const CAPITAL_CONFIG = {
  /**
   * ASSUMPTION: Referral address for capital staking rewards/tracking
   * TODO: Replace with actual referral address
   */
  referralAddress: "0x0000000000000000000000000000000000000000" as `0x${string}`,

  /**
   * Smart contract addresses for capital staking per network
   * ASSUMPTION: Using mainnet only for capital staking
   * TODO: Replace with actual deployed contract addresses
   */
  contracts: {
    [CHAIN_ID.MAINNET]: {
      // Main staking contract for capital deposits
      stakingContract: "0x0000000000000000000000000000000000000000" as `0x${string}`,
      
      // Distribution contract for rewards (if separate from staking)
      distributionContract: "0x0000000000000000000000000000000000000000" as `0x${string}`,
      
      // MOR token address on mainnet (already defined in networks.ts but included for convenience)
      morToken: "0x092baadb7def4c3981454dd9c0a0d7ff07bcfc86" as `0x${string}`,
    },
  },

  /**
   * Supported tokens for capital staking
   * ASSUMPTION: Supporting common Ethereum liquid staking tokens
   * These are verified contract addresses on Ethereum Mainnet
   */
  supportedTokens: {
    [CHAIN_ID.MAINNET]: [
      {
        symbol: "stETH",
        name: "Lido Staked ETH",
        address: "0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84" as `0x${string}`,
        decimals: 18,
        logo: "/icons/steth-logo.svg", // ASSUMPTION: Logo path (add logo to public/icons/)
        isActive: true, // Can be used to enable/disable tokens
      },
      {
        symbol: "wstETH",
        name: "Wrapped Staked ETH",
        address: "0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0" as `0x${string}`,
        decimals: 18,
        logo: "/icons/wsteth-logo.svg",
        isActive: true,
      },
      {
        symbol: "rETH",
        name: "Rocket Pool ETH",
        address: "0xae78736Cd615f374D3085123A210448E74Fc6393" as `0x${string}`,
        decimals: 18,
        logo: "/icons/reth-logo.svg",
        isActive: true,
      },
      {
        symbol: "cbETH",
        name: "Coinbase Wrapped Staked ETH",
        address: "0xBe9895146f7AF43049ca1c1AE358B0541Ea49704" as `0x${string}`,
        decimals: 18,
        logo: "/icons/cbeth-logo.svg",
        isActive: true,
      },
      {
        symbol: "WETH",
        name: "Wrapped Ether",
        address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2" as `0x${string}`,
        decimals: 18,
        logo: "/icons/weth-logo.svg",
        isActive: true,
      },
    ],
  },

  /**
   * Capital staking parameters
   * ASSUMPTION: Standard parameters based on typical Morpheus capital staking
   */
  params: {
    // Minimum stake amount in ETH equivalent
    // ASSUMPTION: Low minimum to encourage participation
    minStakeAmount: 0.01,
    
    // Lock period in seconds (0 = no lock, can withdraw anytime)
    // ASSUMPTION: No lock period for capital staking (typical for Morpheus)
    lockPeriodInSeconds: 0,
    
    // Maximum stake per user (undefined = no limit)
    // ASSUMPTION: No maximum limit
    maxStakeAmount: undefined as number | undefined,
    
    // Reward distribution frequency in seconds
    // ASSUMPTION: Daily rewards (86400 seconds = 1 day)
    rewardDistributionInterval: 86400,
    
    // Whether users need to claim rewards or auto-compound
    // ASSUMPTION: Manual claiming required
    autoCompound: false,
  },

  /**
   * Networks where capital staking is supported
   * ASSUMPTION: Mainnet only (Ethereum L1)
   */
  supportedNetworks: [CHAIN_ID.MAINNET] as const,

  /**
   * UI Configuration
   */
  ui: {
    // Show APY/APR information
    showAPY: true,
    
    // Show TVL (Total Value Locked)
    showTVL: true,
    
    // Show referral link/code
    showReferral: true,
    
    // Enable deposit/stake functionality
    enableDeposit: true,
    
    // Enable withdraw functionality
    enableWithdraw: true,
  },
} as const;

/**
 * Type helpers for TypeScript
 */
export type SupportedToken = (typeof CAPITAL_CONFIG.supportedTokens)[number][number];
export type CapitalStakingNetwork = (typeof CAPITAL_CONFIG.supportedNetworks)[number];
export type TokenSymbol = SupportedToken["symbol"];

/**
 * Helper functions
 */

/**
 * Get token by symbol
 */
export const getTokenBySymbol = (symbol: string, chainId: number = CHAIN_ID.MAINNET) => {
  const tokens = CAPITAL_CONFIG.supportedTokens[chainId];
  return tokens?.find((token) => token.symbol === symbol);
};

/**
 * Get token by address
 */
export const getTokenByAddress = (address: string, chainId: number = CHAIN_ID.MAINNET) => {
  const tokens = CAPITAL_CONFIG.supportedTokens[chainId];
  return tokens?.find(
    (token) => token.address.toLowerCase() === address.toLowerCase()
  );
};

/**
 * Get all active tokens
 */
export const getActiveTokens = (chainId: number = CHAIN_ID.MAINNET) => {
  const tokens = CAPITAL_CONFIG.supportedTokens[chainId];
  return tokens?.filter((token) => token.isActive) || [];
};

/**
 * Check if network supports capital staking
 */
export const isCapitalStakingSupported = (chainId: number): boolean => {
  return CAPITAL_CONFIG.supportedNetworks.includes(chainId as any);
};

