// This is helper tailored for Hooks only

import { toaster } from "staking-dashboard/components/ui/toaster";

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
