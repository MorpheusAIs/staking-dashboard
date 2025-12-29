"use client";
import {
  Button,
  HStack,
  Input,
  InputGroup,
  Stack,
  Text,
  useRecipe,
  VStack,
} from "@chakra-ui/react";
import { Controller, UseFormReturn } from "react-hook-form";
import { buttonRecipe } from "staking-dashboard/lib/configs/theme";
import { formatUnits } from "viem";

export type WithdrawFormProps = {
  form: UseFormReturn<{ withdrawAmount: string }>;
  assetUnit?: string;
  canWithdraw: boolean;
  assetDecimals: number;
  rawDepositedAmount: bigint;
  isProcessingWithdraw: boolean;
  userAddress: `0x${string}` | undefined;
  onHandleSetModal: (modal: "withdraw" | null) => void;
  onHandleSubmit: (data: { withdrawAmount: string }) => Promise<void>;
};

/**
 * ===========================
 * MAIN
 * ===========================
 */
export const WithdrawForm: React.FC<WithdrawFormProps> = (props) => {
  const {
    form,
    assetUnit,
    assetDecimals,
    userAddress,
    canWithdraw,
    onHandleSubmit,
    onHandleSetModal,
    rawDepositedAmount,
    isProcessingWithdraw,
  } = props;

  // =============== HOOKS
  const recipe = useRecipe({ recipe: buttonRecipe });

  // =============== VARIABLES
  const styles = recipe({ visual: "solid" });
  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = form;

  const actualDepositedAmount = formatUnits(rawDepositedAmount, assetDecimals);
  const disabledCommonCondition =
    isProcessingWithdraw || !canWithdraw || !userAddress;

  // =============== EVENTS
  const onHandleMaxAmount = () => {
    if (!actualDepositedAmount) return;
    setValue("withdrawAmount", actualDepositedAmount);
  };

  // =============== VIEWS
  return (
    <Stack>
      <form style={{ width: "100%" }} onSubmit={handleSubmit(onHandleSubmit)}>
        <Controller
          name="withdrawAmount"
          control={control}
          render={({ field }) => (
            <VStack width="full" alignItems="flex-start" mt={4}>
              <Text fontSize={"sm"} fontWeight={"medium"}>
                Amount to withdraw
              </Text>
              <InputGroup
                endElement={
                  <HStack gap={3}>
                    <Text fontSize="xs" color="secondaryText">
                      {parseFloat(actualDepositedAmount).toLocaleString(
                        "en-US",
                        {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 6,
                        }
                      )}{" "}
                      {assetUnit}
                    </Text>
                    <Button
                      size="2xs"
                      borderColor="primary"
                      borderRadius={"xs"}
                      color="primary"
                      variant={"outline"}
                      onClick={onHandleMaxAmount}
                      disabled={disabledCommonCondition}
                    >
                      Max
                    </Button>
                  </HStack>
                }
              >
                <Input
                  {...field}
                  width="full"
                  css={{ "--focus-color": "{colors.primary}" }}
                  placeholder={"0.0"}
                  type="number"
                  min={0}
                  step={0.01}
                  disabled={disabledCommonCondition}
                />
              </InputGroup>
              {errors.withdrawAmount && (
                <Text color="red.400" fontSize="xs">
                  {errors.withdrawAmount.message}
                </Text>
              )}
            </VStack>
          )}
        />

        <Stack mt={8} direction={"row"} justifyContent={"flex-end"} gap={3}>
          <Button
            variant="outline"
            onClick={() => onHandleSetModal(null)}
            disabled={isProcessingWithdraw}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            borderRadius={"sm"}
            css={styles}
            loading={isProcessingWithdraw}
            disabled={disabledCommonCondition}
            loadingText={"Processing Withdraw..."}
          >
            Confirm Withdraw
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
export default WithdrawForm;
