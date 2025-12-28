"use client";
import {
  Dialog,
  Portal,
  CloseButton,
  VStack,
  Stack,
  Alert,
} from "@chakra-ui/react";
import { useMemo, useState } from "react";
import { useCapitalStaking } from "staking-dashboard/hooks/useCapitalStaking";
import { getAssetConfig } from "staking-dashboard/lib/configs/asset";
import WithdrawForm from "../forms/WithdrawForm";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { withdrawSchemaValidation } from "../../helper";
import { useModalActions } from "../../../ModalProvider";
import { useSelectedAsset } from "../../../SelectedAssetProvider";
import { toaster } from "staking-dashboard/components/ui/toaster";

export type WithdrawModalProps = {
  open: boolean;
  onHandleOpen: (open: boolean) => void;
};

/**
 * ===========================
 * MAIN
 * ===========================
 */
export const WithdrawModal: React.FC<WithdrawModalProps> = (props) => {
  const { open, onHandleOpen } = props;
  // =============== STATE
  const [errors, setErrors] = useState<string | null>(null);

  // =============== HOOKS
  const { userAddress, onHandleWithdraw, isProcessingWithdraw, assets } =
    useCapitalStaking();
  const { canWithdraw, selectedAsset } = useSelectedAsset();
  const { onHandleSetModal } = useModalActions();

  const form = useForm({
    resolver: yupResolver(
      withdrawSchemaValidation({
        canWithdraw,
        currentAsset: assets[selectedAsset],
      })
    ),
    mode: "onChange",
    defaultValues: {
      withdrawAmount: "",
    },
  });

  // =============== EVENTS
  const onSubmit = async (data: { withdrawAmount: string }) => {
    try {
      const { withdrawAmount } = data;
      await onHandleWithdraw(selectedAsset, withdrawAmount);
    } catch (error) {
      const errorMessage = (error as Error)?.message || "";
      // @TODO can consider to refactor this into a helper function since similar logic is used in other files
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
      } else {
        setErrors(errorMessage);
        toaster.create({
          description: errorMessage,
          type: "error",
        });
      }
    }
  };

  // =============== VARIABLES
  const currentAsset = assets[selectedAsset];
  const rawDepositedAmount = currentAsset?.userDeposited || BigInt(0);
  const assetDisplayName = currentAsset?.config.symbol || selectedAsset;
  const assetUnit = currentAsset?.config.symbol || selectedAsset;

  const assetConfig = useMemo(() => {
    return getAssetConfig(selectedAsset, "mainnet");
  }, [selectedAsset]);

  const assetDecimals = assetConfig?.metadata.decimals || 18;

  // =============== VIEWS
  return (
    <Dialog.Root
      open={open}
      onOpenChange={(e) => {
        if (isProcessingWithdraw) return;
        onHandleOpen(e.open);
      }}
      onExitComplete={() => {
        // reset all the errors state or value when dialog is closed
        form.reset();
        form.clearErrors();
        setErrors(null);
      }}
      lazyMount
      placement={"center"}
    >
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header pb={0}>
              <VStack justifyContent={"flex-start"} alignItems={"flex-start"}>
                <Dialog.Title color="primary">Withdraw Capital</Dialog.Title>
                <Dialog.Description>
                  Withdraw your deposited {assetDisplayName} from the public
                  pool.
                </Dialog.Description>
              </VStack>
            </Dialog.Header>
            <Dialog.Body>
              <WithdrawForm
                form={form}
                assetUnit={assetUnit}
                canWithdraw={canWithdraw}
                onHandleSubmit={onSubmit}
                userAddress={userAddress}
                assetDecimals={assetDecimals}
                onHandleSetModal={onHandleSetModal}
                rawDepositedAmount={rawDepositedAmount}
                isProcessingWithdraw={isProcessingWithdraw}
              />
              {errors && (
                <Stack pt={5}>
                  <Alert.Root status="error">
                    <Alert.Indicator />
                    <Alert.Content>
                      <Alert.Title>{errors}</Alert.Title>
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
export default WithdrawModal;
