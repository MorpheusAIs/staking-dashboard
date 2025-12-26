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
import { useNetwork } from "../../../NetworkProvider";
import { getContractAddress } from "staking-dashboard/lib/networks";
import { useContractPowerFactor } from "staking-dashboard/hooks/useContractPowerFactor";
import { useForm } from "react-hook-form";
import { AssetIcon } from "staking-dashboard/components/Icons";
import { GoLock } from "react-icons/go";
import { GoUnlock } from "react-icons/go";
import LockPeriodSelector from "staking-dashboard/components/LockPeriodSelector";
import { Controller } from "react-hook-form";
import { durationToSeconds } from "staking-dashboard/lib/power-factor-utils";
import { buttonRecipe } from "staking-dashboard/lib/configs/theme";
import { useModalActions, useModalState } from "../../../ModalProvider";
import { useSelectedAsset } from "../../../SelectedAssetProvider";

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
    networkEnv,
    l1ChainId,
  } = useCapitalStaking();
  const { selectedAsset, selectedAssetCanClaim } = useSelectedAsset();
  // @TODO refactor this, component need to be dumb
  const { onHandleSetModal } = useModalActions();
  const { activeModal } = useModalState();
  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm({
    mode: "onChange",
    // @TODO validation schema: extract from deposit schema validation
    defaultValues: {
      lockDuration: {
        duration: "7",
        unit: "Days" as "Days" | "Months" | "Years",
      },
    },
  });

  // @TODO FOR TESTING ONLY
  // const activeModal = "lockMorRewards";
  // const activeModal = "claimMorRewards";

  const recipe = useRecipe({ recipe: buttonRecipe });

  // =============== STATE

  // =============== API

  // =============== VARIABLES
  const styles = recipe({ visual: "solid" });
  const lockDuration = watch("lockDuration");
  const lockValue = lockDuration?.duration;
  const lockUnit = lockDuration?.unit;
  const poolContractAddress = getContractAddress(
    l1ChainId,
    "distributorV2",
    "mainnet"
  );

  // Initialize power factor hook
  const powerFactor = useContractPowerFactor({
    chainId: l1ChainId,
    enabled: true,
    lockUnit,
    lockValue,
  });
  // Add network detection
  const { currentChainId, switchToChain, isNetworkSwitching } = useNetwork();

  const isLockMode = activeModal === "lockMorRewards";
  const isClaimMode = activeModal === "claimMorRewards";
  const currentSelectedAsset = assets[selectedAsset];
  const cleanedValue = currentSelectedAsset.claimableAmountFormatted.replace(
    /,/g,
    ""
  );

  // @TODO uncommment
  // const claimableAmount = parseFloat(cleanedValue) || 0;
  const claimableAmount = 1000;
  const symbol = selectedAsset;
  const icon = currentSelectedAsset.config.icon;
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
  const onHandleSubmit = async () => {
    if (isLockMode) {
      if (!selectedAsset) return;

      const lockDurationSeconds = durationToSeconds(lockValue, lockUnit);
      if (lockDurationSeconds <= BigInt(0)) {
        console.error("Invalid lock duration");
        return;
      }

      try {
        // Lock rewards for the selected asset
        await onHandleLockMorRewards(symbol, lockDurationSeconds);
        // @TODO test this
        onHandleSetModal(null);
      } catch (error) {
        console.error("Error locking rewards:", error);
        // Error handling is done in the context via toast notifications
      }
    }

    if (isClaimMode) {
      if (!selectedAsset) return;

      try {
        // Claim rewards for the selected asset
        if (canClaim) {
          await onHandleClaimMorRewards(symbol);
        }
        // @TODO test this
        onHandleSetModal(null);
      } catch (error) {
        console.error("Error claiming rewards:", error);
        // Error handling is done in the context via toast notifications
      }
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
            <Text fontSize={"xs"} color="gray.400">
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
          >
            Lock MOR Rewards
          </Button>
          <Text textAlign={"center"} color="gray.400" fontSize="sm">
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
            disabled={buttonDisableCondition}
            css={styles}
            width="full"
          >
            Claim MOR Rewards
          </Button>
          <Text textAlign={"center"} color="gray.400" fontSize="sm">
            ⚠️ Claims require ~0.001 ETH for cross-chain gas. MOR tokens will be
            minted on Arbitrum One
          </Text>
        </>
      );
    }
  };

  const renderSelectedAssetData = () => {
    // @TODO test this
    if (!currentSelectedAsset)
      return (
        <Stack>
          <Text>No asset selected.</Text>
          {/**@TODO */}
          <Button>Close</Button>
        </Stack>
      );

    return (
      <Stack>
        <form onSubmit={handleSubmit(onHandleSubmit)}>
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
        // reset all the errors state or value when dialog is closed
        reset();
        onHandleOpen(e.open);
      }}
      lazyMount
      placement={"center"}
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
                <Text color="gray.400">
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
