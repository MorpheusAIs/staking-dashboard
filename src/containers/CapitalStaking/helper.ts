"use client";
import {
  durationToSeconds,
  getMaxAllowedValue,
  getMinAllowedValue,
} from "staking-dashboard/lib/powerFactorUtils";
import { parseUnits } from "viem";
import * as yup from "yup";

import { isAddress } from "viem";
import { GetEnsAddressReturnType } from "wagmi/actions";
import { AssetSymbol } from "staking-dashboard/lib/configs/asset";
import {
  BuildUserAssetArgs,
  BuildUserAssetReturn,
  EnsValidationResult,
  MinimalAssetData,
  SchemaValidation,
} from "./type";
import { parseDepositAmount } from "staking-dashboard/lib/helpers";

export const withdrawSchemaValidation = ({
  canWithdraw,
  currentAsset,
}: SchemaValidation) => {
  return yup.object({
    withdrawAmount: yup
      .string()
      .required("Withdraw amount is required")
      .matches(/^\d*\.?\d*$/, "Enter a valid number")
      .test("is-valid-number", "Enter a valid number", (value) => {
        if (value === undefined || value === null) return false;
        const num = parseFloat(value);
        return !isNaN(num);
      })
      .test("is-positive", "Must be greater than 0", (value) => {
        const num = parseFloat(value || "");
        return !isNaN(num) && num > 0;
      })
      .test("canWithdraw", "Withdrawals are currently locked", function () {
        if (!canWithdraw) {
          return this.createError({
            message: "Withdrawals are currently locked for this asset.",
          });
        }
        return true;
      })
      .test(
        "max-deposit",
        "Withdraw amount exceeds deposited amount",
        function (value) {
          if (!value) return true;
          const amountBigInt = parseUnits(
            value.toString(),
            currentAsset.config.decimals
          );

          return amountBigInt <= currentAsset.userDeposited;
        }
      ),
  });
};

export const rewardsSchemaValidation = ({
  currentAsset,
  selectedAsset,
}: SchemaValidation) => {
  return yup.object({
    lockDuration: yup.object({
      duration: yup
        .string()
        .typeError("Duration is required")
        .required("Duration is required")
        .test("min-lock-period", "Lock period too short", function (value) {
          if (!value) return true;
          const { unit } = this.parent;
          const path = this.path;
          const numValue = parseInt(value, 10);
          if (isNaN(numValue)) return false;

          if (isNaN(numValue) || numValue <= 0)
            return this.createError({ path, message: "Enter a valid number" });

          const minAllowed = getMinAllowedValue(unit);
          if (numValue < minAllowed) {
            return this.createError({
              path,
              message: `Minimum ${minAllowed} ${unit} required for MOR rewards`,
            });
          }

          return true;
        })
        .test("max-lock-period", "Lock period too long", function (value) {
          if (!value) return true;
          const { unit } = this.parent;
          const path = this.path;
          const numValue = parseInt(value, 10);
          if (isNaN(numValue)) return false;

          if (isNaN(numValue) || numValue <= 0) return true;

          const maxAllowed = getMaxAllowedValue(unit);
          if (numValue > maxAllowed) {
            return this.createError({
              path,
              message: `Maximum ${maxAllowed} ${unit} allowed`,
            });
          }

          return true;
        })
        .test("lock-period-error", "Invalid lock period", function (value) {
          const { unit, duration } = this.parent;
          const path = this.path;

          const currentTimestamp = Math.floor(Date.now() / 1000);
          const lockDurationSeconds = durationToSeconds(duration, unit);
          const proposedClaimLockEnd =
            BigInt(currentTimestamp) + lockDurationSeconds;
          const existingLockEnd = currentAsset.claimUnlockTimestamp;
          if (
            existingLockEnd &&
            existingLockEnd > BigInt(0) &&
            proposedClaimLockEnd < existingLockEnd
          ) {
            const existingDate = new Date(Number(existingLockEnd) * 1000);
            return this.createError({
              path,
              message: `Lock period too short. Your existing ${selectedAsset} position is locked until ${existingDate.toLocaleDateString()}. New deposits must have a lock period that ends on or after this date.`,
            });
          }

          return true;
        }),
      unit: yup
        .mixed<"Days" | "Months" | "Years">()
        .oneOf(["Days", "Months", "Years"])
        .required("Unit is required"),
    }),
  });
};

export const depositSchemaValidation = ({
  currentAsset,
  selectedAsset,
}: SchemaValidation) => {
  return yup.object({
    depositAmount: yup
      .string()
      .required("Deposit amount is required")
      .matches(/^\d*\.?\d*$/, "Enter a valid number")
      .test("is-valid-number", "Enter a valid number", (value) => {
        if (value === undefined || value === null) return false;
        const num = parseFloat(value);
        return !isNaN(num);
      })
      .test("is-positive", "Must be greater than 0", (value) => {
        const num = parseFloat(value || "");
        return !isNaN(num) && num > 0;
      })
      .test("max-balance", "Deposit exceeds available balance", (value) => {
        if (!value) return true;
        const amountBigInt = parseUnits(
          value.toString(),
          currentAsset.config.decimals
        );
        return amountBigInt <= currentAsset.userBalance;
      }),

    lockDuration: yup.object({
      duration: yup
        .string()
        .typeError("Duration is required")
        .required("Duration is required")
        .test("min-lock-period", "Lock period too short", function (value) {
          if (!value) return true;
          const { unit } = this.parent;
          const path = this.path;
          const numValue = parseInt(value, 10);
          if (isNaN(numValue)) return false;

          if (isNaN(numValue) || numValue <= 0)
            return this.createError({ path, message: "Enter a valid number" });

          const minAllowed = getMinAllowedValue(unit);
          if (numValue < minAllowed) {
            return this.createError({
              path,
              message: `Minimum ${minAllowed} ${unit} required for MOR rewards`,
            });
          }

          return true;
        })
        .test("max-lock-period", "Lock period too long", function (value) {
          if (!value) return true;
          const { unit } = this.parent;
          const path = this.path;
          const numValue = parseInt(value, 10);
          if (isNaN(numValue)) return false;

          if (isNaN(numValue) || numValue <= 0) return true;

          const maxAllowed = getMaxAllowedValue(unit);
          if (numValue > maxAllowed) {
            return this.createError({
              path,
              message: `Maximum ${maxAllowed} ${unit} allowed`,
            });
          }

          return true;
        })
        .test("lock-period-error", "Invalid lock period", function (value) {
          const { unit, duration } = this.parent;
          const path = this.path;

          const currentTimestamp = Math.floor(Date.now() / 1000);
          const lockDurationSeconds = durationToSeconds(duration, unit);
          const proposedClaimLockEnd =
            BigInt(currentTimestamp) + lockDurationSeconds;
          const existingLockEnd = currentAsset.claimUnlockTimestamp;
          if (
            existingLockEnd &&
            existingLockEnd > BigInt(0) &&
            proposedClaimLockEnd < existingLockEnd
          ) {
            const existingDate = new Date(Number(existingLockEnd) * 1000);
            return this.createError({
              path,
              message: `Lock period too short. Your existing ${selectedAsset} position is locked until ${existingDate.toLocaleDateString()}. New deposits must have a lock period that ends on or after this date.`,
            });
          }

          return true;
        }),
      unit: yup
        .mixed<"Days" | "Months" | "Years">()
        .oneOf(["Days", "Months", "Years"])
        .required("Unit is required"),
    }),
  });
};

/**
 * Validate a referrer input (ENS or Ethereum address)
 * @param referrerAddress - user input
 * @param resolvedAddress - ENS resolved address, if available
 * @param isEnsName - whether input is an ENS name
 * @param isResolvingEns - ENS resolution loading state
 * @param ensError - ENS resolution error, if any
 * @returns object with isValid boolean and error message
 */
export function validateReferrerAddressHelper(
  referrerAddress: string,
  resolvedAddress: GetEnsAddressReturnType | undefined,
  isEnsName: boolean,
  isResolvingEns: boolean,
  ensError: Error | null,
  ETH_ADDRESS_REGEX: RegExp
): EnsValidationResult {
  if (!referrerAddress || referrerAddress.trim() === "") {
    return { isValid: true, error: null };
  }

  const trimmedAddress = referrerAddress.trim();

  // ENS name
  if (trimmedAddress.endsWith(".eth")) {
    if (isResolvingEns) {
      return { isValid: false, error: "Resolving ENS name..." };
    }
    if (ensError) {
      return {
        isValid: false,
        error: `ENS resolution failed: ${
          ensError.message || "Unknown ENS error"
        }. Please contact subnet administrator.`,
      };
    }
    if (isEnsName && !resolvedAddress && !isResolvingEns) {
      return {
        isValid: false,
        error:
          "ENS name could not be resolved. Please check the name or try again or contact subnet administrator.",
      };
    }
    if (resolvedAddress) {
      return { isValid: true, error: null };
    }
    return { isValid: !isResolvingEns, error: null };
  }

  // Ethereum address format check
  if (!ETH_ADDRESS_REGEX.test(trimmedAddress)) {
    return {
      isValid: false,
      error:
        "Invalid Ethereum address format. Please contact subnet administrator.",
    };
  }
  if (!isAddress(trimmedAddress)) {
    return {
      isValid: false,
      error:
        "Invalid Ethereum address checksum. Please contact subnet administrator.",
    };
  }

  return { isValid: true, error: null };
}

/**
 * Check if user has any staked assets
 */
export const checkHasStakedAssets = (
  assets: Record<AssetSymbol, MinimalAssetData>
): boolean => {
  // Check all available assets dynamically instead of hardcoded stETH/LINK
  return Object.values(assets).some((asset) => {
    const deposited = parseDepositAmount(asset.userDepositedFormatted);

    // Handle very small amounts (like 0.0001 wBTC) by checking if formatted value is not just "0" or "0.00"
    return (
      deposited > 0 ||
      (asset.userDepositedFormatted !== "0" &&
        asset.userDepositedFormatted !== "0.00")
    );
  });
};

export const formatUIDisplay = (value: bigint, d: number) => {
  return Number(value) / Math.pow(10, d);
};

export const buildUserAsset = (
  args: BuildUserAssetArgs
): BuildUserAssetReturn => {
  const { assetData, assetConfigData, assetSymbol, emission } = args || {};

  const decimals = assetConfigData?.metadata.decimals || 18;
  const amountStaked = formatUIDisplay(assetData.userDeposited, decimals);
  const available = formatUIDisplay(assetData.userBalance, decimals);
  const claimable = formatUIDisplay(assetData.claimableAmount, 18);

  return {
    id: assetSymbol,
    symbol: assetData.symbol,
    assetSymbol,
    icon: assetData.config.icon,
    amountStaked,
    available,
    dailyEmissions: emission,
    powerFactor: assetData.userMultiplierFormatted || "x1.0",
    unlockDate: assetData.claimUnlockTimestampFormatted,
    withdrawUnlockDate: assetData.withdrawUnlockTimestampFormatted,
    availableToClaim: claimable,
    canClaim: assetData.canClaim,
    canWithdraw: assetData.canWithdraw,
  };
};

// Custom formatting for daily emissions and lifetime earnings (same logic)
export const formatDailyEmissions = (value: number): string => {
  const formatted = value < 0.01 ? value.toFixed(4) : value.toFixed(2);
  return formatted;
};

export function formatNumber(value: number): string {
  if (isNaN(value)) return "0";

  return value < 1
    ? value.toLocaleString("en-US", {
        maximumFractionDigits: 1,
        minimumFractionDigits: 1,
      })
    : value.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

// Helper to check if a string looks numeric (allows commas, decimals)
const isNumericString = (value: string | number): boolean => {
  if (typeof value === "number") return true;
  if (typeof value !== "string") return false;
  // Remove commas, check if it's a valid number (potentially with decimals)
  return !isNaN(parseFloat(value.replace(/,/g, "")));
};

// Format number values with decimals only when less than 1
const formatValue = (
  value: string | number,
  autoFormatNumbers: boolean
): string | number => {
  if (!autoFormatNumbers) return value;

  // Only process numeric values
  const numValue =
    typeof value === "string" ? parseFloat(value.replace(/,/g, "")) : value;

  // Check if it's a valid number
  if (isNaN(numValue)) return value;

  // Apply the formatting logic using the utility function
  return formatNumber(numValue);
};

const getNumericValue = (value: string | number): number => {
  return typeof value === "string"
    ? parseFloat(value.replace(/,/g, ""))
    : value;
};

export const formatMetricsValue = (
  value: string | number,
  autoFormatNumbers: boolean
) => {
  if (!value) return "-";
  if (isNumericString(value)) {
    return getNumericValue(formatValue(value, autoFormatNumbers));
  }
  return formatValue(value, autoFormatNumbers);
};

/**
 * Format staked amounts with conditional decimals based on asset type
 * USDC, USDT: always 2 decimals
 * wETH, wBTC, stETH: 4 decimals if < 0.01, 2 decimals if >= 0.01
 */
export const formatStakedAmount = (
  amount: number,
  assetSymbol?: AssetSymbol
): string => {
  if (assetSymbol === "USDC" || assetSymbol === "USDT") {
    return amount.toFixed(2);
  }

  if (
    assetSymbol === "wETH" ||
    assetSymbol === "wBTC" ||
    assetSymbol === "stETH"
  ) {
    return amount < 0.01 ? amount.toFixed(4) : amount.toFixed(2);
  }

  // Default to 1 decimal for other assets
  return amount.toFixed(1);
};

/**
 * Format asset amounts with conditional decimals based on asset type and remove trailing zeros
 * USDC, USDT: always 2 decimals (but trailing zeros removed)
 * wETH, wBTC, stETH: 3 decimals if < 1, 2 decimals if >= 1 (trailing zeros removed)
 */
export const formatAssetAmount = (
  amount: number,
  assetSymbol?: AssetSymbol
): string => {
  let formatted: string;

  if (assetSymbol === "USDC" || assetSymbol === "USDT") {
    formatted = amount.toFixed(2);
  } else if (
    assetSymbol === "wETH" ||
    assetSymbol === "wBTC" ||
    assetSymbol === "stETH"
  ) {
    formatted = amount < 1 ? amount.toFixed(3) : amount.toFixed(2);
  } else {
    // Default behavior for other assets: 2 decimals for small numbers
    if (amount < 1 && amount > 0) {
      formatted = amount.toFixed(2);
    } else {
      formatted = formatNumber(amount);
    }
  }

  // Remove trailing zeros and decimal point if no decimals remain
  return formatted.replace(/\.?0+$/, "");
};
