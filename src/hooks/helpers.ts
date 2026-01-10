// This is helper tailored for Hooks only

import { UserClaimEventsData } from "staking-dashboard/@types/useTotalMorEarned";
import { toaster } from "staking-dashboard/components/ui/toaster";
import { getChainById } from "staking-dashboard/lib/networks";
import { ChainContract } from "viem";
import { mainnet } from "viem/chains";

export const validatePreApproval = (
  tokenAddress?: `0x${string}`,
  contractAddress?: `0x${string}`
): tokenAddress is `0x${string}` => {
  if (!tokenAddress) {
    toaster.create({
      description:
        "Cannot approve: Token address is missing. Please try refreshing the page.",
      type: "error",
    });
    return false;
  }

  if (!contractAddress) {
    toaster.create({
      description:
        "Cannot approve: Contract address is missing. Please try refreshing the page.",
      type: "error",
    });
    return false;
  }

  return true;
};

export const validatePreStake = ({
  connectedAddress,
  contractAddress,
  isCorrectNetwork,
  subnetId,
}: {
  connectedAddress?: `0x${string}`;
  contractAddress?: `0x${string}`;
  isCorrectNetwork: () => boolean;
  subnetId?: string;
}) => {
  if (!connectedAddress || !isCorrectNetwork()) {
    toaster.create({
      description: "Cannot stake: Wallet or network issue.",
      type: "error",
    });
    return false;
  }

  if (!contractAddress) {
    toaster.create({
      description: "Builder contract address not found.",
      type: "error",
    });
    return false;
  }

  if (!subnetId) {
    toaster.create({
      description: "Subnet ID is required for staking.",
      type: "error",
    });
    return false;
  }
  return true;
};

const isChainContract = (obj: unknown): obj is ChainContract => {
  return !!obj && typeof obj === "object" && "address" in obj;
};

export const getCapitalV2Pools = () => {
  const chainId = mainnet.id;

  const chainConfig = getChainById(chainId, "mainnet");

  if (!chainConfig?.contracts) {
    return {};
  }

  const pools = Object.entries(chainConfig.contracts).reduce(
    (acc, [contractName, contract]) => {
      if (contractName.endsWith("DepositPool") && isChainContract(contract)) {
        const assetSymbol = contractName.replace("DepositPool", "");
        acc[assetSymbol] = contract.address;
      }
      return acc;
    },
    {} as { [assetSymbol: string]: `0x${string}` }
  );

  return pools;
};

export const processLifetimeEarnings = (data: UserClaimEventsData) => {
  if (!data) {
    return {
      totalEarned: 0,
    };
  }

  const allClaimEvents = Object.values(data).flat();

  // Sum all claim amounts (each claim event represents MOR claimed)
  const totalClaimedWei = allClaimEvents.reduce((sum, event) => {
    return sum + BigInt(event.amount || "0");
  }, BigInt(0));

  // Convert from wei (18 decimals) to MOR tokens
  const totalEarned = Number(totalClaimedWei) / Math.pow(10, 18);

  return {
    totalEarned,
  };
};
