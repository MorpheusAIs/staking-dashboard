"use client";
import {
  Dialog,
  Portal,
  CloseButton,
  Stack,
  Text,
  Button,
  HStack,
  Badge,
  VStack,
  useRecipe,
} from "@chakra-ui/react";
import { useCapitalStaking } from "staking-dashboard/hooks/useCapitalStaking";
import { useContractPowerFactor } from "staking-dashboard/hooks/useContractPowerFactor";
import { useForm } from "react-hook-form";
import { AssetIcon } from "staking-dashboard/components/Icons";
import { GoLock } from "react-icons/go";
import { GoUnlock } from "react-icons/go";
import LockPeriodSelector from "staking-dashboard/components/LockPeriodSelector";
import { Controller } from "react-hook-form";
import {
  durationToSeconds,
  TimeUnit,
} from "staking-dashboard/lib/powerFactorUtils";
import { buttonRecipe } from "staking-dashboard/lib/configs/theme";
import { useModalActions, useModalState } from "../../../ModalProvider";
import { useSelectedAsset } from "../../../SelectedAssetProvider";
import { yupResolver } from "@hookform/resolvers/yup";
import { rewardsSchemaValidation } from "../../helper";

export type MorRewardsModalProps = {
  open: boolean;
  onHandleOpen: (open: boolean) => void;
};

/**
 * ===========================
 * MAIN
 * ===========================
 */
export const MorRewardsModal: React.FC<MorRewardsModalProps> = (props) => {
  const { open, onHandleOpen } = props;
  // =============== HOOKS
  const {
    assets,
    onHandleClaimMorRewards,
    onHandleLockMorRewards,
    isProcessingClaim,
    isProcessingChangeLock,
    l1ChainId,
  } = useCapitalStaking();
  const { selectedAsset, selectedAssetCanClaim } = useSelectedAsset();
  const { onHandleSetModal } = useModalActions();
  const { activeModal } = useModalState();
  const {
    control,
    handleSubmit,
    reset,
    watch,
    clearErrors,
    formState: { errors },
  } = useForm({
    mode: "all",
    resolver: yupResolver(
      rewardsSchemaValidation({
        currentAsset: assets[selectedAsset],
        selectedAsset,
      })
    ),
    defaultValues: {
      lockDuration: {
        duration: "7",
        unit: "Days" as TimeUnit,
      },
    },
  });

  const recipe = useRecipe({ recipe: buttonRecipe });

  // =============== VARIABLES
  const styles = recipe({ visual: "solid" });
  const lockDuration = watch("lockDuration");
  const lockValue = lockDuration?.duration;
  const lockUnit = lockDuration?.unit;
  const isLockMode = activeModal === "lockMorRewards";
  const isClaimMode = activeModal === "claimMorRewards";

  // Initialize power factor hook
  const powerFactor = useContractPowerFactor({
    chainId: l1ChainId,
    enabled: true,
    lockUnit,
    lockValue,
  });

  const currentSelectedAsset = assets[selectedAsset];
  const cleanedValue = currentSelectedAsset.claimableAmountFormatted.replace(
    /,/g,
    ""
  );

  const claimableAmount = parseFloat(cleanedValue) || 0;
  const symbol = selectedAsset;
  const claimableAmountFormatted =
    currentSelectedAsset.claimableAmountFormatted;
  const canClaim = selectedAssetCanClaim && claimableAmount > 0;
  const {
    unlockDate,
    isLoading,
    powerFactor: powerFactorValue,
    warning,
    error,
  } = powerFactor.currentResult || {};

  // =============== EVENTS
  const onHandleLockRewards = async () => {
    if (!isLockMode) return;
    if (!selectedAsset) return;

    const lockDurationSeconds = durationToSeconds(lockValue, lockUnit);
    if (lockDurationSeconds <= BigInt(0)) {
      console.error("Invalid lock duration");
      return;
    }

    try {
      await onHandleLockMorRewards(symbol, lockDurationSeconds);
    } catch (error) {
      console.error("Error locking rewards:", error);
    }
  };

  const onHandleClaim = async () => {
    if (!isClaimMode || !selectedAsset) return;
    try {
      // Claim rewards for the selected asset
      if (canClaim) {
        await onHandleClaimMorRewards(symbol);
      }
    } catch (error) {
      console.error("Error claiming rewards:", error);
      // Error handling is done in the context via toast notifications
    }
  };

  // =============== RENDER FUNCTIONS
  const renderSelectedAssetDisplay = () => {
    return (
      <Stack>
        <Text fontSize={"sm"} fontWeight={"medium"}>
          Selected Asset
        </Text>
        <Stack
          direction={"row"}
          justify={"space-between"}
          align={"center"}
          bg="card"
          px={{ base: 5, md: 4 }}
          py={{ base: 1.5, md: 2.5 }}
          borderRadius="sm"
        >
          <HStack>
            <AssetIcon symbol={symbol} />
            <Text>{symbol}</Text>
          </HStack>
          <HStack>
            <Text>{claimableAmountFormatted} MOR</Text>

            {claimableAmount > 0 && (
              <Badge
                bg={canClaim ? "green.400" : "yellow.600"}
                color={canClaim ? "black" : "white"}
                border={"1px sold"}
                borderColor={canClaim ? "green.400" : "yellow.600"}
              >
                {canClaim ? <GoUnlock /> : <GoLock />}
              </Badge>
            )}
          </HStack>
        </Stack>
      </Stack>
    );
  };

  const renderLockPeriodSummary = () => {
    const shouldHide =
      !isLockMode ||
      !selectedAsset ||
      !lockValue ||
      parseInt(lockValue) <= 0 ||
      !powerFactor.currentResult;

    if (shouldHide) {
      return null;
    }

    return (
      <Stack
        mt={5}
        p={3}
        borderRadius="sm"
        width="full"
        css={{
          backgroundColor: "{colors.primary}/10",
        }}
      >
        <Stack direction="row" justifyContent="space-between">
          <Text color="gray.300">Rewards to Lock</Text>
          <Text>{claimableAmountFormatted} MOR</Text>
        </Stack>
        {unlockDate && (
          <Stack direction="row" justifyContent="space-between">
            <Text color="gray.300">MOR Unlock Date</Text>
            <Text>
              {unlockDate.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </Text>
          </Stack>
        )}
        <Stack direction="row" justifyContent="space-between">
          <Text color="gray.300">Power Factor</Text>
          <Text>{isLoading ? "Calculating..." : powerFactorValue}</Text>
        </Stack>
        {warning && (
          <Stack mt={1}>
            <Text fontSize={"xs"} color="secondaryText">
              {warning}
            </Text>
          </Stack>
        )}
        {error && (
          <Stack mt={1}>
            <Text fontSize={"xs"} color="red.400">
              {error}
            </Text>
          </Stack>
        )}
      </Stack>
    );
  };

  const renderFormFooter = () => {
    if (isLockMode) {
      const buttonDisableCondition = !selectedAsset;
      isProcessingChangeLock || isProcessingClaim;
      return (
        <>
          <Button
            type="submit"
            loading={isProcessingChangeLock}
            disabled={buttonDisableCondition}
            css={styles}
            width="full"
            loadingText="Locking Rewards..."
          >
            Lock MOR Rewards
          </Button>
          <Text textAlign={"center"} color="secondaryText" fontSize="sm">
            ⚠️ Locking requires ~0.001 ETH for cross-chain gas
          </Text>
        </>
      );
    }
    if (isClaimMode) {
      const buttonDisableCondition =
        !selectedAsset || isProcessingClaim || isProcessingChangeLock;
      return (
        <>
          <Button
            loading={isProcessingClaim}
            onClick={onHandleClaim}
            disabled={buttonDisableCondition}
            css={styles}
            width="full"
            loadingText="Claiming Rewards..."
          >
            Claim MOR Rewards
          </Button>
          <Text textAlign={"center"} color="secondaryText" fontSize="sm">
            ⚠️ Claims require ~0.001 ETH for cross-chain gas. MOR tokens will be
            minted on Arbitrum One
          </Text>
        </>
      );
    }
  };

  const renderSelectedAssetData = () => {
    if (!currentSelectedAsset)
      return (
        <Stack>
          <Text>No asset selected.</Text>
          <Button onClick={() => onHandleSetModal(null)}>Close</Button>
        </Stack>
      );

    return (
      <Stack>
        <form onSubmit={handleSubmit(onHandleLockRewards)}>
          {renderSelectedAssetDisplay()}
          {isLockMode && selectedAsset && (
            <Controller
              name="lockDuration"
              control={control}
              render={({ field }) => (
                <LockPeriodSelector field={field} errors={errors} />
              )}
            />
          )}
          {renderLockPeriodSummary()}
          {selectedAsset && (
            <VStack mt={6} gap={3} width="full">
              {renderFormFooter()}
            </VStack>
          )}
        </form>
      </Stack>
    );
  };

  // =============== VIEWS
  return (
    <Dialog.Root
      open={open}
      onOpenChange={(e) => {
        if (isProcessingClaim || isProcessingChangeLock) return;
        onHandleOpen(e.open);
      }}
      onExitComplete={() => {
        reset();
        clearErrors();
      }}
      lazyMount
      placement={"center"}
      trapFocus={false}
    >
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header pb={0}>
              <Dialog.Title color="primary">
                {isLockMode ? "Lock MOR Rewards" : "Claim MOR Rewards"}
              </Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <Stack gap={4}>
                <Text color="secondaryText">
                  {isLockMode
                    ? "Lock your MOR rewards for an increased power factor to earn more rewards in the future."
                    : "Claim rewards earned by staking capital to Morpheus."}
                </Text>
                {renderSelectedAssetData()}
              </Stack>
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
export default MorRewardsModal;
