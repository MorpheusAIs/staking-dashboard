import type { Chain, ChainContract } from "viem";

/// Contract addresses by network type
export type ContractAddresses = {
  erc1967Proxy: ChainContract;
  stETH: ChainContract;
  morToken: ChainContract;
  layerZeroEndpoint: ChainContract;
  l1Factory: ChainContract;
  l2Factory: ChainContract;
  subnetFactory: ChainContract;
  builders: ChainContract;
  // V2 Contracts
  stETHDepositPool?: ChainContract;
  linkDepositPool?: ChainContract;
  usdcDepositPool?: ChainContract;
  usdtDepositPool?: ChainContract;
  wbtcDepositPool?: ChainContract;
  wethDepositPool?: ChainContract;
  distributorV2?: ChainContract;
  rewardPoolV2?: ChainContract;
  l1SenderV2?: ChainContract;
  linkToken?: ChainContract;
  lockMultiplierMath?: ChainContract;
};

// Chain configuration with extended information
export type ChainConfig = Omit<Chain, "rpcUrls"> & {
  id: number;
  rpcUrls: {
    default: {
      http: string[];
    };
    public?: {
      http: string[];
    };
  };
  blockExplorers: {
    default: {
      name: string;
      url: string;
    };
  };
  contracts: Partial<ContractAddresses>;
  isL1?: boolean;
  isL2?: boolean;
  layerZeroEndpointId?: number;
};

export type TSUBNETCONFIG = {
  subnetID: `0x${string}`;
  lockPeriodInSeconds: number;
};

export type NetworkEnvironment = "mainnet" | "testnet";
