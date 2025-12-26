"use client";
import { Dialog, Portal, CloseButton, Alert, Stack } from "@chakra-ui/react";
import { yupResolver } from "@hookform/resolvers/yup";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useCapitalStaking } from "staking-dashboard/hooks/useCapitalStaking";
import CapitalStakingForm from "../forms/CapitalStakeForm";
import { durationToSeconds } from "staking-dashboard/lib/power-factor-utils";
import { SUBNET_CONFIG } from "staking-dashboard/lib/configs/subnet.config";
import {
  depositSchemaValidation,
  validateReferrerAddressHelper,
} from "../../helper";
import { useEnsAddress } from "wagmi";
import { showToast } from "staking-dashboard/lib/showToast";
import { useSelectedAsset } from "../../../SelectedAssetProvider";
import { toaster } from "staking-dashboard/components/ui/toaster";

export type DepositDialogProps = {
  open: boolean;
  onHandleOpen: (open: boolean) => void;
};

export const ETH_ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/;

/**
 * ===========================
 * MAIN
 * ===========================
 */
export const DepositDialog: React.FC<DepositDialogProps> = (props) => {
  const { open, onHandleOpen } = props;
  // =============== HOOKS
  const {
    assets,
    l1ChainId,
    networkEnv,
    onHandleDeposit,
    checkAndUpdateApprovalNeeded,
    onHandleApproveToken,
    userAddress,
    isProcessingDeposit,
  } = useCapitalStaking();
  const { selectedAsset, onHandleSetSelectedAsset } = useSelectedAsset();

  // =============== STATE
  const [currentlyNeedsApproval, setCurrentlyNeedsApproval] = useState(false);
  const [referralAddressError, setReferralAddressError] = useState<
    string | null
  >(null);
  const [errors, setErrors] = useState<string | null>(null);

  // =============== HOOKS
  const form = useForm({
    resolver: yupResolver(
      depositSchemaValidation({
        currentAsset: assets[selectedAsset],
        selectedAsset,
      })
    ),
    mode: "all",
    defaultValues: {
      depositAmount: "",
      lockDuration: {
        duration: "7",
        unit: "Days" as "Days" | "Months" | "Years",
      },
    },
  });

  // =============== VARIABLES
  const amount = form.watch("depositAmount");
  const referralAddress = SUBNET_CONFIG.referralAddress;
  const isEnsName =
    referralAddress.endsWith(".eth") &&
    !ETH_ADDRESS_REGEX.test(referralAddress);

  // Check approval status
  const checkApprovalStatus = useCallback(async () => {
    if (amount && parseFloat(amount) > 0 && userAddress) {
      // Use checkAndUpdateApprovalNeeded to get fresh data from blockchain
      const needsApproval = await checkAndUpdateApprovalNeeded(
        selectedAsset,
        amount
      );
      setCurrentlyNeedsApproval(needsApproval);
    } else {
      setCurrentlyNeedsApproval(false);
    }
  }, [amount, userAddress, selectedAsset, checkAndUpdateApprovalNeeded]);

  // =============== HOOKS
  const {
    data: resolvedAddress,
    isLoading: isResolvingEns,
    error: ensError,
  } = useEnsAddress({
    name: isEnsName ? referralAddress.trim() : undefined,
    chainId: 1,
    query: {
      enabled: isEnsName,
      retry: 2,
      retryDelay: 1000,
    },
  });

  console.log("resolvedAddress:", resolvedAddress);

  // =============== EFFECTS
  // Check approval status when dependencies change
  useEffect(() => {
    checkApprovalStatus();
  }, [checkApprovalStatus]);

  // validate referral address when it or its resolution state changes
  useEffect(() => {
    if (referralAddress) {
      const { isValid, error } = validateReferrerAddressHelper(
        referralAddress,
        resolvedAddress,
        isEnsName,
        isResolvingEns,
        ensError,
        ETH_ADDRESS_REGEX
      );

      if (!isValid && error) {
        setReferralAddressError(error);
        showToast({
          title: "Invalid Referrer Address",
          description: error,
          type: "error",
          id: "deposit-referrer-error",
        });
      }
    }
  }, [referralAddress, resolvedAddress, isEnsName, isResolvingEns, ensError]);

  // =============== EVENTS
  const onSubmit = async (data: {
    depositAmount: string;
    lockDuration: { duration: string; unit: "Days" | "Months" | "Years" };
  }) => {
    const { depositAmount, lockDuration } = data;

    try {
      // Double-check approval status with fresh blockchain data before proceeding
      const freshApprovalNeeded = await checkAndUpdateApprovalNeeded(
        selectedAsset,
        depositAmount
      );

      if (freshApprovalNeeded || currentlyNeedsApproval) {
        await onHandleApproveToken(selectedAsset);
      } else {
        // Calculate lock duration in seconds
        const lockDurationInSeconds = durationToSeconds(
          lockDuration.duration,
          lockDuration.unit
        );

        // Use resolved address if available, otherwise use the original input
        const finalReferrerAddress =
          resolvedAddress || SUBNET_CONFIG.referralAddress;

        // @TODO can be removed after testing
        // Debug lock period validation
        const currentTimestamp = Math.floor(Date.now() / 1000);
        const proposedClaimLockEnd =
          BigInt(currentTimestamp) + lockDuration.duration;
        // Get existing lock end for debugging - Using dynamic assets system
        const existingLockEnd = assets[selectedAsset]?.claimUnlockTimestamp;

        console.log("🏦 Proceeding with deposit:", {
          selectedAsset,
          amount,
          lockDuration: lockDurationInSeconds,
          currentTimestamp,
          proposedClaimLockEnd: proposedClaimLockEnd.toString(),
          existingLockEnd: existingLockEnd?.toString(),
          proposedDate: new Date(
            Number(proposedClaimLockEnd) * 1000
          ).toISOString(),
          existingDate: existingLockEnd
            ? new Date(Number(existingLockEnd) * 1000).toISOString()
            : "none",
        });

        await onHandleDeposit(
          selectedAsset,
          depositAmount,
          lockDurationInSeconds,
          finalReferrerAddress
        );
      }
    } catch (error) {
      console.error("Deposit/Approve Action Error:", error);

      // Handle user rejection specifically
      const errorMessage = (error as Error)?.message || "";
      if (
        errorMessage.includes("User rejected") ||
        errorMessage.includes("User denied") ||
        errorMessage.includes("rejected the request") ||
        errorMessage.includes("denied transaction signature")
      ) {
        // Don't set formError for user cancellation - it's not a form validation error
        // The toast notification will be shown by the context/hook that handles the transaction
        return;
      }

      // Handle other errors with a more user-friendly message
      if (errorMessage.includes("insufficient funds")) {
        setErrors("Insufficient funds for this transaction.");
        toaster.create({
          description: "Insufficient funds for this transaction.",
          type: "error",
        });
      } else if (errorMessage.includes("gas")) {
        setErrors("Transaction failed due to gas issues. Please try again.");
        toaster.create({
          description:
            "Transaction failed due to gas issues. Please try again.",
          type: "error",
        });
      } else if (errorMessage.includes("lock duration")) {
        setErrors("Invalid lock duration specified.");
        toaster.create({
          description: "Invalid lock duration specified.",
          type: "error",
        });
      } else {
        setErrors(errorMessage);
        toaster.create({
          description: errorMessage,
          type: "error",
        });
      }
    }
  };

  // =============== VIEWS
  return (
    <Dialog.Root
      lazyMount
      open={open}
      onOpenChange={(e) => {
        onHandleOpen(e.open);
      }}
      onExitComplete={() => {
        // reset all the errors state or value when dialog is closed
        form.reset();
        form.clearErrors();
        setErrors(null);
      }}
      placement={"center"}
      trapFocus={false}
    >
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header pb={0}>
              <Dialog.Title color="primary">Deposit Capital</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <CapitalStakingForm
                form={form}
                assets={assets}
                isProcessingDeposit={isProcessingDeposit}
                onHandleSetSelectedAsset={onHandleSetSelectedAsset}
                onSubmit={onSubmit}
                networkEnv={networkEnv}
                l1ChainId={l1ChainId}
                selectedAsset={selectedAsset}
                currentlyNeedsApproval={currentlyNeedsApproval}
                disabled={!!referralAddressError}
              />
              {(errors || referralAddressError) && (
                <Stack pt={5}>
                  <Alert.Root status="error">
                    <Alert.Indicator />
                    <Alert.Content>
                      <Alert.Title>
                        {errors || referralAddressError}
                      </Alert.Title>
                    </Alert.Content>
                  </Alert.Root>
                </Stack>
              )}
            </Dialog.Body>
            <Dialog.CloseTrigger asChild>
              <CloseButton size="sm" />
            </Dialog.CloseTrigger>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
};

/**
 * ===========================
 * EXPORTS
 * ===========================
 */
export default DepositDialog;
