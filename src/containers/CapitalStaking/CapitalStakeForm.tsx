"use client";
import {
  Button,
  InputGroup,
  Stack,
  Text,
  VStack,
  Input,
  HStack,
  Menu,
  Box,
  Alert,
  useRecipe,
} from "@chakra-ui/react";
import { Controller } from "react-hook-form";
import { AssetData } from "staking-dashboard/@types/useCapitalStaking";
import AssetDropdown from "staking-dashboard/components/AssetDropdown";
import { AssetSymbol } from "staking-dashboard/lib/configs/asset";
import "staking-dashboard/app/global.css";
import { formatUnits } from "viem";
import { buttonRecipe } from "staking-dashboard/lib/configs/theme";
import { useNetwork } from "../NetworkProvider";
import { mainnet } from "viem/chains";
import { useContractPowerFactor } from "staking-dashboard/hooks/useContractPowerFactor";

export type CapitalStakingFormProps = {
  assets: Record<AssetSymbol, AssetData>;
  l1ChainId: number;
  networkEnv: "mainnet" | "testnet";
  selectedAsset: AssetSymbol;
  onHandleSetSelectedAsset: (asset: AssetSymbol) => void;
  // @TODO fix any
  onSubmit: (data: any) => void;
  form: any;
  isProcessingDeposit: boolean;
  currentlyNeedsApproval: boolean;
};

/**
 * ===========================
 * MAIN
 * ===========================
 */
export const CapitalStakingForm: React.FC<CapitalStakingFormProps> = (
  props
) => {
  const {
    assets,
    l1ChainId,
    networkEnv,
    selectedAsset,
    onSubmit,
    form,
    currentlyNeedsApproval,
    onHandleSetSelectedAsset,
    isProcessingDeposit,
  } = props;
  // =============== HOOKS
  const recipe = useRecipe({ recipe: buttonRecipe });
  const { switchToChain, currentChainId, isNetworkSwitching } = useNetwork();

  // =============== HELPER FUNCTIONS
  const getUserBalanceForAsset = (asset: AssetSymbol) => {
    return {
      balance: assets[asset].userBalance,
      formatted: assets[asset].userBalanceFormatted,
    };
  };

  // =============== VARIABLES
  const isOnMainnet = currentChainId === mainnet.id;
  const styles = recipe({ visual: "solid" });
  const currentAssetBalance = getUserBalanceForAsset(selectedAsset);
  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = form;
  const amount = watch("depositAmount");
  const lockDuration = watch("lockDuration");
  const lockValue = lockDuration?.duration;
  const lockUnit = lockDuration?.unit;

  // ============== HOOKS
  const contractPowerFactor = useContractPowerFactor({
    lockUnit,
    lockValue,
    chainId: l1ChainId,
    enabled: true,
  });

  const { currentResult } = contractPowerFactor || {};

  const { unlockDate, isLoading, powerFactor, warning, error } =
    currentResult || {};

  console.log("Unlock Date:", unlockDate);

  // =============== EVENTS
  const onSetSelectedAsset = (asset: AssetSymbol) => {
    setValue("depositAmount", "");
    onHandleSetSelectedAsset(asset);
  };

  const onHandleMaxAmount = () => {
    if (
      currentAssetBalance.balance &&
      currentAssetBalance.balance > BigInt(0)
    ) {
      const assetInfo = Object.values(assets).find(
        (asset) => asset.config.symbol === selectedAsset
      );
      const decimals = assetInfo?.config.decimals || 18;

      const rawAmountForTx = formatUnits(currentAssetBalance.balance, decimals);

      setValue("depositAmount", rawAmountForTx);
    }
  };

  const onHandleSubmit = async (data: any) => {
    if (!isOnMainnet) {
      await switchToChain(mainnet.id);
      return;
    }

    onSubmit(data);
  };

  // =============== VARIABLES
  const formattedBalance = currentAssetBalance.formatted;
  const rawBalance = currentAssetBalance.balance;
  const zeroBalance = !rawBalance || rawBalance === BigInt(0);
  const commonDisableCondition = isProcessingDeposit || zeroBalance;
  const buttonDisableCondition = commonDisableCondition || isNetworkSwitching;

  // =============== RENDER
  const renderButtonText = () => {
    if (isNetworkSwitching) {
      return "Switching";
    }
    if (!isOnMainnet) return "Switch to Mainnet";

    if (currentlyNeedsApproval) return `Approve ${selectedAsset}`;

    return "Confirm Deposit";
  };

  const renderSummary = () => {
    if (!amount || parseFloat(amount) <= 0) return null;
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
          <Text color="gray.300">Deposit Amount</Text>
          <Text>
            {amount} {selectedAsset}{" "}
          </Text>
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
          <Text>{isLoading ? "Calculating..." : powerFactor}</Text>
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

  // =============== VIEWS
  return (
    <Stack width="full">
      <Stack pb={4}>
        <Text color="gray.400">
          Deposit an asset to start earning MOR rewards. Power factor activates
          after ~7-8 months and reaches maximum x10.7 at ~7 years from now.
        </Text>
      </Stack>
      <VStack width="full" alignItems={"flex-start"} position={"relative"}>
        <Text fontSize={"sm"} fontWeight={"medium"}>
          Select Asset
        </Text>
        <AssetDropdown
          assets={assets}
          networkEnv={networkEnv}
          onHandleSetSelectedAsset={onSetSelectedAsset}
          l1ChainId={l1ChainId}
          selectedAsset={selectedAsset}
          currentAssetBalance={formattedBalance || "0"}
          getUserBalanceForAsset={getUserBalanceForAsset}
        />
      </VStack>
      <form style={{ width: "100%" }} onSubmit={handleSubmit(onHandleSubmit)}>
        <Controller
          name="depositAmount"
          control={control}
          render={({ field }) => (
            <VStack width="full" alignItems="flex-start" mt={4}>
              <Text fontSize={"sm"} fontWeight={"medium"}>
                Deposit Amount
              </Text>
              <InputGroup
                endElement={
                  <Button
                    size="2xs"
                    borderColor="primary"
                    borderRadius={"xs"}
                    color="primary"
                    variant={"outline"}
                    onClick={onHandleMaxAmount}
                    disabled={commonDisableCondition}
                  >
                    Max
                  </Button>
                }
              >
                <Input
                  {...field}
                  width="full"
                  css={{ "--focus-color": "{colors.primary}" }}
                  placeholder={
                    zeroBalance ? "Insufficient balance" : "Enter amount"
                  }
                  type="number"
                  min={0}
                  step={0.01}
                  disabled={commonDisableCondition}
                />
              </InputGroup>
              {errors.depositAmount && (
                <Text color="red.400" fontSize="xs">
                  {errors.depositAmount.message}
                </Text>
              )}
            </VStack>
          )}
        />
        <Controller
          name="lockDuration"
          control={control}
          render={({ field }) => (
            <VStack width="full" alignItems="flex-start" mt={4}>
              <Text fontSize="sm" fontWeight="medium">
                MOR Claims Lock Period
              </Text>

              <Text fontSize="xs" color="gray.400" lineHeight="1.4" mb={1}>
                Minimum 7 days required. Locking MOR claims increases your power
                factor for future rewards but delays claiming. Power Factor
                activates after ~7–8 months, scales up to x10.7 at ~7 years, and
                remains capped at x10.7 for longer periods.
              </Text>

              <HStack width="full" gap={2}>
                <Input
                  value={field.value?.duration ?? ""}
                  placeholder="Enter duration"
                  css={{ "--focus-color": "{colors.primary}" }}
                  onChange={(e) => {
                    if (e.target.value === "") {
                      field.onChange({ ...field.value, duration: "" });
                      return;
                    }
                    field.onChange({
                      ...field.value,
                      duration: Number(e.target.value),
                    });
                  }}
                />

                <Menu.Root>
                  <Menu.Trigger asChild>
                    <Box
                      display="flex"
                      alignItems="center"
                      justifyContent="space-between"
                      gap={2}
                      px={{ base: 5, md: 4 }}
                      py={2}
                      border="1px solid"
                      borderColor="border"
                      borderRadius={"sm"}
                      color="white"
                      cursor="pointer"
                      _hover={{ bg: "gray.700" }}
                    >
                      {field.value?.unit ?? "Days"}
                    </Box>
                  </Menu.Trigger>

                  <Menu.Positioner>
                    <Menu.Content>
                      {["Days", "Months", "Years"].map((unit) => (
                        <Menu.Item
                          key={unit}
                          onClick={() =>
                            field.onChange({ ...field.value, unit })
                          }
                          value={unit}
                          py={2}
                          cursor="pointer"
                          _hover={{ bg: "gray.700" }}
                        >
                          {unit}
                        </Menu.Item>
                      ))}
                    </Menu.Content>
                  </Menu.Positioner>
                </Menu.Root>
              </HStack>

              {(errors.lockDuration?.duration || errors.lockDuration?.unit) && (
                <Text color="red.400" fontSize="xs">
                  {errors.lockDuration.duration?.message ||
                    errors.lockDuration.unit?.message}
                </Text>
              )}
            </VStack>
          )}
        />
        {renderSummary()}
        <Stack mt={8}>
          <Button
            type="submit"
            borderRadius={"sm"}
            css={styles}
            loading={isProcessingDeposit}
            disabled={buttonDisableCondition}
          >
            {renderButtonText()}
          </Button>
        </Stack>
      </form>
    </Stack>
  );
};

/**
 * ===========================
 * EXPORTS
 * ===========================
 */
export default CapitalStakingForm;
