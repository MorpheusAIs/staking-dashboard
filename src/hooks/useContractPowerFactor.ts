import { useMemo, useState } from "react";
import { useNetwork } from "staking-dashboard/containers/NetworkProvider";
import { getContractAddress } from "staking-dashboard/lib/networks";
import {
  calculateUnlockDate,
  durationToSeconds,
  formatPowerFactorPrecise,
  TimeUnit,
  validateLockDuration,
  willActivatePowerFactor,
} from "staking-dashboard/lib/power-factor-utils";
import { useReadContract } from "wagmi";
import LockMultiplierMathAbi from "staking-dashboard/lib/abi/LockMultiplierMath.json";

export type UsePowerFactorParams = {
  chainId: number;
  enabled?: boolean;
  lockValue: string;
  lockUnit: TimeUnit;
};

export type PowerFactorResult = {
  powerFactor: string;
  isValid: boolean;
  isLoading: boolean;
  error?: string;
  warning?: string;
  unlockDate?: Date;
  willActivate: boolean;
};

export const useContractPowerFactor = (args: UsePowerFactorParams) => {
  const { chainId, enabled = true, lockUnit, lockValue } = args;
  const { environment } = useNetwork();

  // Get the LockMultiplierMath contract address
  const lockMultiplierMathAddress = getContractAddress(
    chainId,
    "lockMultiplierMath",
    environment
  );

  // Calculate lock timestamps for contract call
  const contractArgs = useMemo(() => {
    if (process.env.NODE_ENV !== "production") {
      console.group("⚙️ [Power Factor Debug] Contract Args Calculation");
      console.log("Lock Value:", lockValue);
      console.log("Lock Unit:", lockUnit);
      console.log("Enabled:", enabled);
      console.log("Chain ID:", chainId);
      console.log("LockMultiplierMath Address:", lockMultiplierMathAddress);
    }

    if (!lockValue || !enabled || !lockMultiplierMathAddress) {
      if (process.env.NODE_ENV !== "production") {
        console.log(
          "Early return: No lock value, not enabled, or no contract address"
        );
        console.groupEnd();
      }
      return undefined;
    }

    const validation = validateLockDuration(lockValue, lockUnit);
    if (!validation.isValid) {
      if (process.env.NODE_ENV !== "production") {
        console.log("Early return: Validation failed:", validation);
        console.groupEnd();
      }
      return undefined;
    }

    const durationSeconds = durationToSeconds(lockValue, lockUnit);
    if (durationSeconds <= BigInt(0)) {
      if (process.env.NODE_ENV !== "production") {
        console.log(
          "Early return: Invalid duration seconds:",
          durationSeconds.toString()
        );
        console.groupEnd();
      }
      return undefined;
    }

    const lockStart = BigInt(Math.floor(Date.now() / 1000)); // Current timestamp
    const lockEnd = lockStart + durationSeconds;
    const args = [lockStart, lockEnd];

    if (process.env.NODE_ENV !== "production") {
      console.log("Duration Seconds:", durationSeconds.toString());
      console.log("Lock Start Timestamp:", lockStart.toString());
      console.log("Lock End Timestamp:", lockEnd.toString());
      console.log(
        "Final Contract Args:",
        args.map((arg) => arg.toString())
      );

      // Special debugging for maximum lock periods
      const durationYears = Number(durationSeconds) / (365.25 * 24 * 60 * 60);
      if (durationYears >= 5.5) {
        console.log("🎯 [MAX LOCK DEBUG] Detected maximum lock period");
        console.log("Duration in years:", durationYears.toFixed(2));
        console.log(
          "Expected max power factor: x9.7 (actual contract maximum)"
        );
        console.log("Lock period details:", { lockValue, lockUnit });
      }

      console.groupEnd();
    }

    return args;
  }, [lockValue, lockUnit, enabled, lockMultiplierMathAddress]);

  // Contract call to get the multiplier
  const {
    data: rawMultiplier,
    isLoading,
    error: contractError,
    refetch,
  } = useReadContract({
    address: lockMultiplierMathAddress as `0x${string}`,
    abi: LockMultiplierMathAbi,
    functionName: "getLockPeriodMultiplier",
    args: contractArgs,
    chainId,
    query: {
      enabled:
        !!contractArgs && !!lockMultiplierMathAddress && !!chainId && enabled,
      retry: 3,
      retryDelay: 1000,
    },
  });

  /**
   * Calculate power factor for given lock parameters
   * @param value Duration value
   * @param unit Time unit
   * @returns Power factor calculation result
   */
  const calculatePowerFactor = (
    value: string,
    unit: TimeUnit
  ): PowerFactorResult => {
    // Validate the input
    const validation = validateLockDuration(value, unit);

    console.log("validation", validation);

    // Set validation states
    if (!validation.isValid) {
      return {
        powerFactor: "x1.0",
        isValid: false,
        isLoading: false,
        error: validation.errorMessage,
        willActivate: false,
      };
    }

    // Check if this period will activate power factor
    const willActivate = willActivatePowerFactor(value, unit);

    // Calculate unlock date
    const unlockDate = calculateUnlockDate(value, unit);

    console.log("unlockDate", unlockDate);
    console.log("willActivate", willActivate);
    console.log("isLoading", isLoading);
    console.log("contractError", contractError);
    console.log("rawMultiplier", rawMultiplier);
    console.log("current lockValue", lockValue);
    console.log("current lockUnit", lockUnit);

    // If we're currently loading a contract call, return loading state
    if (isLoading && lockValue === value && lockUnit === unit) {
      return {
        powerFactor: "Loading...",
        isValid: true,
        isLoading: true,
        warning: validation.warningMessage,
        unlockDate: unlockDate || undefined,
        willActivate,
      };
    }

    // If we have contract error, return error state
    if (contractError && lockValue === value && lockUnit === unit) {
      return {
        powerFactor: "x1.0",
        isValid: true,
        isLoading: false,
        error: "Failed to calculate power factor",
        warning: validation.warningMessage,
        unlockDate: unlockDate || undefined,
        willActivate,
      };
    }

    // If we have a result from the contract and it matches current params
    if (rawMultiplier && lockValue === value && lockUnit === unit) {
      const formattedPowerFactor = formatPowerFactorPrecise(
        rawMultiplier as bigint
      );

      return {
        powerFactor: formattedPowerFactor,
        isValid: true,
        isLoading: false,
        warning: validation.warningMessage,
        unlockDate: unlockDate || undefined,
        willActivate,
      };
    }

    // Default case - return base multiplier
    return {
      powerFactor: "x1.0",
      isValid: true,
      isLoading: false,
      warning: validation.warningMessage,
      unlockDate: unlockDate || undefined,
      willActivate,
    };
  };

  /**
   * Get current power factor result
   */

  const currentResult = useMemo((): PowerFactorResult => {
    if (!lockValue) {
      const defaultResult = {
        powerFactor: "x1.0",
        isValid: true,
        isLoading: false,
        willActivate: false,
      };

      return defaultResult;
    }

    const result = calculatePowerFactor(lockValue, lockUnit);

    if (process.env.NODE_ENV !== "production") {
      console.log("Calculated Result:", result);
    }

    return result;
  }, [lockValue, lockUnit, calculatePowerFactor]);

  /**
   * Retry the contract call if it failed
   */
  const retry = () => {
    if (contractError) {
      refetch();
    }
  };

  return {
    // Current state
    lockValue,
    lockUnit,
    // Contract state
    isLoading,
    contractError,

    // Calculation functions
    calculatePowerFactor,

    // Current result
    currentResult,

    // Utility functions
    retry,

    // Raw data for debugging
    rawMultiplier,
    contractArgs,
  };
};
