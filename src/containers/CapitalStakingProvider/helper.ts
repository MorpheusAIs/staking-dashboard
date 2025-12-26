import { formatBigInt } from "staking-dashboard/lib/helpers";
import { zeroAddress } from "viem";
import { ValidateWithdrawArgs } from "./type";

export const constructTransactionUrl = (url: string, hash: string) => {
  return `${url}/tx/${hash}`;
};

export const validateWithdraw = (args: ValidateWithdrawArgs) => {
  const {
    asset,
    amountBigInt,
    assetInfo,
    assetData,
    networkEnv,
    l1ChainId,
    userDeposited,
    userAddress,
  } = args;

  if (!assetData) {
    throw new Error(`Asset ${asset} data not available`);
  }

  if (!assetInfo) {
    throw new Error(`Asset ${asset} not supported on ${networkEnv}`);
  }

  if (amountBigInt <= BigInt(0)) throw new Error("Invalid withdraw amount");

  if (assetData.config.depositPoolAddress === zeroAddress) {
    throw new Error(
      `${asset} withdrawals not yet supported. Deposit pool contract not deployed.`
    );
  }

  if (!l1ChainId) {
    throw new Error("Chain ID not available");
  }

  if (!assetData.canWithdraw) {
    throw new Error(
      `${asset} withdrawal not allowed yet. Please check unlock requirements.`
    );
  }

  if (userDeposited <= BigInt(0)) {
    throw new Error(`No ${asset} deposited balance available`);
  }

  if (amountBigInt > userDeposited) {
    throw new Error(
      `Insufficient ${asset} deposited balance. Required: ${formatBigInt(
        amountBigInt,
        assetInfo.metadata.decimals,
        4
      )}`
    );
  }
  if (!userAddress) {
    throw new Error(
      "No wallet connected. Please connect your wallet to withdraw."
    );
  }
};

/**
 * Get the block explorer URL for a transaction hash on a specific chain
 * @param chainId - The chain ID
 * @param txHash - The transaction hash
 * @returns The full URL to the transaction on the block explorer, or null if not supported
 */
export function getTransactionUrl(
  chainId: number,
  txHash: string
): string | null {
  const explorers: Record<number, string> = {
    // Ethereum Mainnet
    1: `https://etherscan.io/tx/${txHash}`,
    // Arbitrum One
    42161: `https://arbiscan.io/tx/${txHash}`,
    // Base
    8453: `https://basescan.org/tx/${txHash}`,
    // Sepolia (testnet)
    11155111: `https://sepolia.etherscan.io/tx/${txHash}`,
    // Arbitrum Sepolia (testnet)
    421614: `https://sepolia.arbiscan.io/tx/${txHash}`,
    // Base Sepolia (testnet)
    84532: `https://sepolia.basescan.org/tx/${txHash}`,
  };

  return explorers[chainId] || null;
}
