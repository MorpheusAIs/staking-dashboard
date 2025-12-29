export type ClaimEventData = {
  id: string;
  amount: string;
  blockTimestamp: string;
  blockNumber: string;
  transactionHash: string;
  type: string;
  user: {
    address: string;
    rewardPoolId: string;
  };
  depositPool: string;
  totalStaked: string;
  rate: string;
};

export type UserClaimEventsData = {
  [assetSymbol: string]: ClaimEventData[];
};

export type AssetEarnings = {
  [assetSymbol: string]: number;
};

export type TotalMorEarnedData = {
  totalEarned: number;
  assetEarnings: AssetEarnings;
  // Legacy fields for backward compatibility
  stETHEarned: number;
  linkEarned: number;
  isLoading: boolean;
  error: string | null;
};

export type UseTotalMorEarnedArgs = {
  userAddress: `0x${string}` | undefined;
};

export type UseTotalMorEarnedReturn = {
  totalEarnedMOR: number;
  isLoading: boolean;
  error: string | null;
};
