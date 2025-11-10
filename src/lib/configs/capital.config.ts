import { CHAIN_ID } from "./constants";

/**
 * ============================================================================
 * CAPITAL STAKING CONFIGURATION
 * ============================================================================
 * 
 * This file contains all configuration for the Capital Staking feature,
 * including supported tokens, contract addresses, and staking parameters.
 * 
 * 
 * 🔧 QUICK START - CONFIGURE YOUR REFERRER ADDRESS:
 * ----------------------------------------------------------------------------
 * To earn referral rewards from staking activity on your interface, update
 * the `referrerAddress` field below with your Ethereum wallet address.
 * 
 * This is the FIRST thing you should configure when deploying this dApp!
 * 
 * See the referrerAddress field in CAPITAL_CONFIG below.
 * ============================================================================
 */

export const CAPITAL_CONFIG = {
  /**
   * ⚠️ IMPORTANT: Configure Your Referrer Address Here
   * 
   * This address will receive referral rewards when users stake through your interface.
   * Replace the zero address below with your Ethereum wallet address to earn referral rewards.
   * 
   * Example: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb" as `0x${string}`
   * 
   * Leave as zero address (0x0000...0000) if you don't want to use a referrer.
   */
  referrerAddress: "0x0000000000000000000000000000000000000000" as `0x${string}`,

  /**
   * Smart contract addresses for capital staking on Ethereum Mainnet
   */
  contracts: {
    [CHAIN_ID.MAINNET]: {
      // Supporting Contracts
      distributorV2: "0xDf1AC1AC255d91F5f4B1E3B4Aef57c5350F64C7A" as `0x${string}`,
      rewardPoolV2: "0xb7994dE339AEe515C9b2792831CD83f3C9D8df87" as `0x${string}`,
      l1SenderV2: "0x2Efd4430489e1a05A89c2f51811aC661B7E5FF84" as `0x${string}`,
      
      // MOR token address on mainnet
      morToken: "0x092baadb7def4c3981454dd9c0a0d7ff07bcfc86" as `0x${string}`,
      
      // Deposit Pool Contracts (one per supported token)
      depositPools: {
        stETH: "0x47176B2Af9885dC6C4575d4eFd63895f7Aaa4790" as `0x${string}`,
        USDC: "0x6cCE082851Add4c535352f596662521B4De4750E" as `0x${string}`,
        USDT: "0x3B51989212BEdaB926794D6bf8e9E991218cf116" as `0x${string}`,
        wBTC: "0xdE283F8309Fd1AA46c95d299f6B8310716277A42" as `0x${string}`,
        wETH: "0x9380d72aBbD6e0Cc45095A2Ef8c2CA87d77Cb384" as `0x${string}`,
      },
    },
  },

  /**
   * Supported tokens for capital staking
   * Each token has its own deposit pool contract
   */
  supportedTokens: {
    [CHAIN_ID.MAINNET]: [
      {
        symbol: "stETH",
        name: "Lido Staked ETH",
        address: "0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84" as `0x${string}`,
        decimals: 18,
        logo: "/icons/steth-logo.svg",
        isActive: true,
        depositPool: "0x47176B2Af9885dC6C4575d4eFd63895f7Aaa4790" as `0x${string}`,
      },
      {
        symbol: "USDC",
        name: "USD Coin",
        address: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48" as `0x${string}`,
        decimals: 6,
        logo: "/icons/usdc-logo.svg",
        isActive: true,
        depositPool: "0x6cCE082851Add4c535352f596662521B4De4750E" as `0x${string}`,
      },
      {
        symbol: "USDT",
        name: "Tether USD",
        address: "0xdac17f958d2ee523a2206206994597c13d831ec7" as `0x${string}`,
        decimals: 6,
        logo: "/icons/usdt-logo.svg",
        isActive: true,
        depositPool: "0x3B51989212BEdaB926794D6bf8e9E991218cf116" as `0x${string}`,
      },
      {
        symbol: "wBTC",
        name: "Wrapped Bitcoin",
        address: "0x2260fac5e5542a773aa44fbcfedf7c193bc2c599" as `0x${string}`,
        decimals: 8,
        logo: "/icons/wbtc-logo.svg",
        isActive: true,
        depositPool: "0xdE283F8309Fd1AA46c95d299f6B8310716277A42" as `0x${string}`,
      },
      {
        symbol: "wETH",
        name: "Wrapped Ether",
        address: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2" as `0x${string}`,
        decimals: 18,
        logo: "/icons/weth-logo.svg",
        isActive: true,
        depositPool: "0x9380d72aBbD6e0Cc45095A2Ef8c2CA87d77Cb384" as `0x${string}`,
      },
    ],
  },

  /**
   * Capital staking parameters
   */
  params: {
    // Minimum lock period in days (enforced by contract)
    minLockPeriodDays: 90,
    
    // Minimum lock period in seconds
    minLockPeriodSeconds: 90 * 24 * 60 * 60, // 90 days
    
    // Reward pool index (always 0 for mainnet public pool)
    rewardPoolIndex: BigInt(0),
    
    // Approval amount (unlimited for better UX)
    unlimitedApproval: true,
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
  return CAPITAL_CONFIG.supportedNetworks.includes(chainId as CapitalStakingNetwork);
};

/**
 * Get deposit pool address for a token
 */
export const getDepositPool = (symbol: string, chainId: number = CHAIN_ID.MAINNET) => {
  const token = getTokenBySymbol(symbol, chainId);
  return token?.depositPool;
};

/**
 * Get DistributorV2 address (used for token approvals)
 */
export const getDistributorV2Address = (chainId: number = CHAIN_ID.MAINNET) => {
  return CAPITAL_CONFIG.contracts[chainId]?.distributorV2;
};

/**
 * Calculate claim lock end timestamp
 * @param lockDurationDays - Lock duration in days
 * @returns Timestamp when lock period ends
 */
export const calculateClaimLockEnd = (lockDurationDays: number): bigint => {
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const lockDurationSeconds = lockDurationDays * 24 * 60 * 60;
  return BigInt(currentTimestamp + lockDurationSeconds);
};

