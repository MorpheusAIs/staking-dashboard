import { ChainContract, formatUnits, isAddress } from "viem";
import { addresses, CHAIN_ID, stakingErrorMap } from "./utils/constants";
import { getChainById } from "./networks";
import {
  ExtractChainConfigArgs,
  ExtractChainConfigReturn,
} from "staking-dashboard/@types/helpers";

// Helper to ensure string arrays for RPC URLs
export function ensureStringArray(
  urlOrUrls: string | readonly string[] | unknown
): string[] {
  if (typeof urlOrUrls === "string") {
    return [urlOrUrls];
  }
  if (Array.isArray(urlOrUrls)) {
    return [...urlOrUrls] as string[];
  }
  return [];
}

// Helper to convert address to ChainContract
export function toContract(address: string): ChainContract {
  return {
    address: address as `0x${string}`,
  };
}

// Format the balance for display with one decimal
export const formatBalance = (balance: bigint | undefined): number => {
  if (!balance) return 0;
  const fullNumber = parseFloat(formatUnits(balance, 18));
  return Number(fullNumber.toFixed(1));
};

export const formatStakingError = (
  error: Error,
  context?: keyof typeof stakingErrorMap
) => {
  const errorMap = stakingErrorMap[context || "stakeError"];
  let errorMessage = "Unknown error";

  if (error instanceof Error) {
    errorMessage = error.message;

    // Try to extract the revert reason if available
    const revertMatch = errorMessage.match(
      /reverted with reason string '([^']*)'/
    );
    if (revertMatch && revertMatch[1]) {
      errorMessage = `${errorMap.title}: ${revertMatch[1]}`;
    }

    // Extract gas errors
    if (errorMessage.includes("gas")) {
      errorMessage = errorMap.description;
    }
  }
  return errorMessage;
};

export const validateAndExtractChainConfig = (
  args: ExtractChainConfigArgs
): ExtractChainConfigReturn | null => {
  const { networkChainId, isTestnet, onError, onWarning } = args;
  const chain = getChainById(networkChainId, isTestnet ? "testnet" : "mainnet");

  if (!chain) {
    onError(`Could not find chain configuration for chainId ${networkChainId}`);
    return null;
  }

  // === Builders Contract
  const buildersAddr = chain.contracts?.builders?.address;
  if (!buildersAddr || !isAddress(buildersAddr)) {
    onError(
      `Invalid or missing builders contract address for chain ${networkChainId}`
    );
    return null;
  }

  // === MOR Token Contract
  const tokenAddr = chain.contracts?.morToken?.address;
  if (!tokenAddr || !isAddress(tokenAddr)) {
    onError(
      `Invalid or missing MOR token contract address for chain ${networkChainId}`
    );
    return null;
  }

  if (networkChainId === CHAIN_ID.BASE) {
    if (buildersAddr.toLowerCase() !== addresses.BASE_BUILDERS.toLowerCase()) {
      onWarning(
        `⚠️ Base builders mismatch! Expected: ${addresses.BASE_BUILDERS}, Got: ${buildersAddr}`
      );
    }
    if (tokenAddr.toLowerCase() !== addresses.BASE_MOR.toLowerCase()) {
      onWarning(
        `⚠️ Base MOR mismatch! Expected: ${addresses.BASE_MOR}, Got: ${tokenAddr}`
      );
    }
  }

  return {
    builders: buildersAddr as `0x${string}`,
    token: tokenAddr as `0x${string}`,
  };
};

export const isStakeAmountInvalid = (stakeAmount: string) => {
  return !stakeAmount || stakeAmount === "0" || parseFloat(stakeAmount) <= 0;
};

export function getMissingApprovalData({
  allowance,
  tokenAddress,
  contractAddress,
}: {
  allowance?: bigint;
  tokenAddress?: string;
  contractAddress?: string;
}) {
  const missing: string[] = [];
  if (allowance === undefined) missing.push("allowance");
  if (!tokenAddress) missing.push("tokenAddress");
  if (!contractAddress) missing.push("contractAddress");
  return missing;
}

/**
 * Formats a time period in seconds to a human-readable string with appropriate units
 * Follows the format: "X days", "X hours", or "X min"
 *
 * @param seconds - Time period in seconds
 * @returns Formatted string with appropriate time unit
 */
export function formatTimePeriod(seconds: number | string): string {
  if (!seconds) return "-";

  // Convert to number if it's a string
  const secondsNum =
    typeof seconds === "string" ? parseInt(seconds, 10) : seconds;

  if (isNaN(secondsNum)) return "-";

  if (secondsNum >= 86400) {
    // If >= 24 hours, show in days
    const days = Math.floor(secondsNum / 86400);
    return `${days} day${days !== 1 ? "s" : ""}`;
  } else if (secondsNum >= 3600) {
    // If >= 60 minutes, show in hours
    const hours = Math.floor(secondsNum / 3600);
    return `${hours} hour${hours !== 1 ? "s" : ""}`;
  } else if (secondsNum >= 60) {
    // Show in minutes
    const minutes = Math.floor(secondsNum / 60);
    return `${minutes} min`;
  } else {
    // Less than a minute, show in seconds
    return `${secondsNum} sec`;
  }
}

// Format a value to one decimal place
export const formatToOneDecimal = (value: number): string => {
  return (Math.floor(value * 10) / 10).toString();
};
