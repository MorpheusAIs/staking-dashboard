import { ChainContract, formatUnits, isAddress } from "viem";
import { addresses, CHAIN_ID, stakingErrorMap } from "./configs/constants";
import { getChainById } from "./networks";
import {
  ExtractChainConfigArgs,
  ExtractChainConfigReturn,
} from "staking-dashboard/@types/helpers";
import { SUBNET_CONFIG } from "./configs/subnet.config";

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
  console.log("networkChainId, isTestnet", networkChainId, isTestnet);
  const chain = getChainById(networkChainId, isTestnet ? "testnet" : "mainnet");

  console.log("chain config", chain);

  if (!chain) {
    return null;
  }

  // === Builders Contract
  const buildersAddr = chain.contracts?.builders?.address;
  console.log("buildersAddr", buildersAddr);
  if (!buildersAddr || !isAddress(buildersAddr)) {
    return null;
  }

  // === MOR Token Contract
  const tokenAddr = chain.contracts?.morToken?.address;
  if (!tokenAddr || !isAddress(tokenAddr)) {
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

export const formatStakerData = (
  stakerData: unknown,
  isTestnet = false
): {
  stakedRaw: bigint;
  stakedFormattedForUI: string;
  claimLockEnd: string;
  lastStake: string;
  timeLeft: string;
  formattedStaked?: number;
} => {
  let staked: bigint;
  let lastStake: bigint;
  let claimLockEndRaw: bigint;

  if (!stakerData)
    return {
      stakedRaw: BigInt(0),
      stakedFormattedForUI: "0.00",
      claimLockEnd: "-",
      lastStake: "-",
      timeLeft: "-",
      formattedStaked: 0,
    };

  if (isTestnet) {
    // Testnet data structure: [staked, virtualStaked, pendingRewards, rate, lastStake, claimLockEnd]
    const [stakedData, , , , lastStakeData, claimLockEndData] = stakerData as [
      bigint,
      bigint,
      bigint,
      bigint,
      bigint,
      bigint
    ];
    staked = stakedData;
    lastStake = lastStakeData;
    claimLockEndRaw = claimLockEndData;
  } else {
    // Mainnet structure from usersData:
    // [lastDeposit, claimLockStart, deposited, virtualDeposited]
    // [uint128, uint128, uint256, uint256]
    // Only extract the values we need (index 0 and 2)
    const stakerArray = stakerData as [bigint, bigint, bigint, bigint];
    const lastStakeData = stakerArray[0];
    const depositedData = stakerArray[2];
    staked = depositedData;
    lastStake = lastStakeData;
    // For mainnet, calculate claimLockEnd
    claimLockEndRaw = BigInt(0); // Default to 0
    if (lastStake !== BigInt(0)) {
      const lpSeconds = SUBNET_CONFIG.lockPeriodInSeconds;
      claimLockEndRaw = BigInt(Number(lastStake) + lpSeconds);
    }
  }

  // Determine effective claimLockEnd. If contract returned 0 (or an old value),
  // fallback to lastStake + appropriate lock period based on network
  let effectiveClaimLockEnd = claimLockEndRaw;
  if (
    claimLockEndRaw === BigInt(0) ||
    Number(claimLockEndRaw) < Number(lastStake)
  ) {
    const lpSeconds = SUBNET_CONFIG.lockPeriodInSeconds;
    effectiveClaimLockEnd = BigInt(Number(lastStake) + lpSeconds);
  }

  // Format the staked amount for UI display
  const formattedStaked = parseFloat(formatUnits(staked, 18));
  // Calculate time until unlock
  const now = Math.floor(Date.now() / 1000);
  const claimLockEndNumber = Number(effectiveClaimLockEnd);
  let calculatedTimeLeft: string;

  if (claimLockEndNumber > now) {
    const secondsRemaining = claimLockEndNumber - now;

    if (secondsRemaining < 60) {
      calculatedTimeLeft = `${secondsRemaining} seconds`;
    } else if (secondsRemaining < 3600) {
      calculatedTimeLeft = `${Math.floor(secondsRemaining / 60)} minutes`;
    } else if (secondsRemaining < 86400) {
      calculatedTimeLeft = `${Math.floor(secondsRemaining / 3600)} hours`;
    } else {
      calculatedTimeLeft = `${Math.floor(secondsRemaining / 86400)} days`;
    }
  } else {
    calculatedTimeLeft = "Unlocked";
  }

  return {
    stakedRaw: staked,
    formattedStaked,
    stakedFormattedForUI: formattedStaked.toFixed(2),
    claimLockEnd: new Date(Number(effectiveClaimLockEnd) * 1000).toLocaleString(
      "en-US"
    ),
    lastStake: new Date(Number(lastStake) * 1000).toLocaleString("en-US"),
    timeLeft: calculatedTimeLeft,
  };
};
