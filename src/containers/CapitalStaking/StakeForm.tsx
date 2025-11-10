"use client";
import {
  Button,
  Input,
  InputGroup,
  Stack,
  Text,
  useRecipe,
  VStack,
  HStack,
} from "@chakra-ui/react";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useEffect } from "react";
import { toaster } from "staking-dashboard/components/ui/toaster";
import { formatToOneDecimal } from "staking-dashboard/lib/helpers";
import { CAPITAL_CONFIG } from "staking-dashboard/lib/configs/capital.config";
import { buttonRecipe } from "staking-dashboard/lib/configs/theme";

export type StakeFormProps = {
  selectedToken: string;
  isApproving: boolean;
  tokenBalance: number;
  isLoadingData: boolean;
  needsApproval: boolean;
  isSubmitting?: boolean;
  lockPeriodDays: number;
  isCorrectNetwork: () => boolean;
  onHandleApprove: (amount: string) => Promise<void>;
  onHandleStaking: (
    amount: string,
    lockPeriodDays: number,
    onStakingSuccess: () => void
  ) => Promise<void>;
  onHandleNetworkSwitch: () => Promise<true | undefined>;
  onLockPeriodChange: (days: number) => void;
  checkAndUpdateApprovalNeeded: (amount?: string) => Promise<boolean>;
};

const schema = yup.object({
  stakeAmount: yup
    .string()
    .required("Required")
    .test("is-valid-number", "Enter a valid number", (value) => {
      if (value === undefined || value === null) return false;
      const num = parseFloat(value);
      return !isNaN(num);
    })
    .test("is-positive", "Must be greater than 0", (value) => {
      const num = parseFloat(value || "");
      return !isNaN(num) && num > 0;
    }),
  lockPeriod: yup
    .number()
    .required("Lock period is required")
    .min(
      CAPITAL_CONFIG.params.minLockPeriodDays,
      `Minimum lock period is ${CAPITAL_CONFIG.params.minLockPeriodDays} days`
    ),
});

/**
 * ===========================
 * MAIN
 * ===========================
 */
export const StakeForm: React.FC<StakeFormProps> = (props) => {
  const {
    selectedToken,
    isApproving,
    isSubmitting,
    tokenBalance,
    isLoadingData,
    needsApproval,
    onHandleApprove,
    onHandleStaking,
    isCorrectNetwork,
    onLockPeriodChange,
    onHandleNetworkSwitch,
    checkAndUpdateApprovalNeeded,
  } = props;

  // =============== HOOKS

  const {
    watch,
    control,
    setValue,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      stakeAmount: "",
      lockPeriod: CAPITAL_CONFIG.params.minLockPeriodDays,
    },
  });
  const recipe = useRecipe({ recipe: buttonRecipe });

  // =============== VARIABLES
  const stakeAmount = watch("stakeAmount");
  const lockPeriod = watch("lockPeriod");
  const styles = recipe({ visual: "solid" });
  const validStakeAmount = stakeAmount && parseFloat(stakeAmount) > 0;
  const approvalState = isApproving || (needsApproval && validStakeAmount);
  const loadingState = isSubmitting;

  // =============== EFFECTS
  // Check if approval is needed when stake amount changes
  useEffect(() => {
    if (!validStakeAmount || isLoadingData) return;
    checkAndUpdateApprovalNeeded(stakeAmount);
  }, [stakeAmount, isLoadingData, checkAndUpdateApprovalNeeded, validStakeAmount]);

  // Update lock period in parent
  useEffect(() => {
    if (lockPeriod) {
      onLockPeriodChange(lockPeriod);
    }
  }, [lockPeriod, onLockPeriodChange]);

  // =============== EVENTS
  const onMaxClick = () => {
    if (!tokenBalance) return;
    const formattedMaxAmount = formatToOneDecimal(tokenBalance);
    setValue("stakeAmount", formattedMaxAmount);
  };

  const onHandleChange = ({
    onChange,
    value,
  }: {
    onChange: (value: string) => void;
    value: string;
  }) => {
    if (value === "") {
      return onChange("");
    }

    // Ensure non-negative
    const numericValue = Math.max(parseFloat(value) || 0, 0);

    // Round to appropriate decimal places based on token
    const token = CAPITAL_CONFIG.supportedTokens[1]?.find(
      (t) => t.symbol === selectedToken
    );
    const decimals = token?.decimals || 18;
    const decimalPlaces = decimals === 6 ? 2 : decimals === 8 ? 4 : 4;
    
    const formattedValue =
      Math.floor(numericValue * Math.pow(10, decimalPlaces)) /
      Math.pow(10, decimalPlaces);

    // Update the form field
    onChange(formattedValue.toString());

    // Trigger approval check if positive
    if (formattedValue > 0) {
      checkAndUpdateApprovalNeeded(formattedValue.toString());
    }
  };

  const onSubmit = async () => {
    if (!validStakeAmount) {
      toaster.create({
        title: "Invalid stake amount",
        description: "Please enter a valid stake amount greater than 0.",
        type: "error",
      });
      return;
    }

    // If not on the correct network, switch first
    if (!isCorrectNetwork()) {
      await onHandleNetworkSwitch();
      return;
    }

    // Force a fresh check for approval before proceeding
    const currentlyNeedsApproval = stakeAmount
      ? await checkAndUpdateApprovalNeeded(stakeAmount)
      : false;

    // Handle approval or staking
    if (currentlyNeedsApproval || needsApproval) {
      await onHandleApprove(stakeAmount);
    } else if (stakeAmount && parseFloat(stakeAmount) > 0) {
      await onHandleStaking(stakeAmount, lockPeriod, () => {
        setValue("stakeAmount", "");
      });
    }
  };

  // =============== HELPERS
  const isAmountValid = () => {
    const amount = parseFloat(stakeAmount);
    if (isNaN(amount) || amount <= 0) return false;
    if (tokenBalance !== undefined && amount > tokenBalance) return false;
    return true;
  };

  const hasPositiveAmount = () => {
    const amount = parseFloat(stakeAmount);
    return !isNaN(amount) && amount > 0;
  };

  // Calculate APY boost based on lock period
  const calculateAPYBoost = () => {
    const minDays = CAPITAL_CONFIG.params.minLockPeriodDays;
    const maxBoost = 2.0; // 2x multiplier at max lock
    const maxDays = 365; // 1 year for max boost
    
    const boost = 1 + ((lockPeriod - minDays) / (maxDays - minDays)) * (maxBoost - 1);
    return Math.min(boost, maxBoost).toFixed(2);
  };

  // =============== RENDER
  const renderButtonText = () => {
    if (!isCorrectNetwork()) return "Switch to Mainnet";
    if (needsApproval && validStakeAmount) return `Approve ${selectedToken}`;
    return `Stake ${selectedToken}`;
  };

  // =============== VIEWS
  return (
    <VStack
      p={4}
      pb={6}
      bg="card"
      borderRadius="md"
      width="full"
      border="1px solid"
      borderColor="border"
      gap={{ base: 2, md: 3 }}
    >
      <VStack alignItems={"flex-start"} width="full">
        <Text fontSize={"lg"} fontWeight={"bold"} color="gray.200">
          Stake {selectedToken}
        </Text>
        <Text fontSize={"xs"} color="gray.400">
          Lock your tokens to earn MOR rewards
        </Text>
      </VStack>
      <form onSubmit={handleSubmit(onSubmit)} style={{ width: "100%" }}>
        <VStack width="full" gap={4} px={{ md: 2 }}>
          {/* Amount Input */}
          <Controller
            name="stakeAmount"
            control={control}
            render={({ field }) => (
              <VStack width="full" alignItems={"flex-start"}>
                <Stack
                  w="full"
                  justifyContent="space-between"
                  alignItems={{ base: "flex-start", md: "flex-end" }}
                  direction={{ base: "column", md: "row" }}
                >
                  <Text fontSize={"sm"} fontWeight={"medium"}>
                    Amount to stake
                  </Text>
                  <Text fontSize={"xs"} color="gray.400">
                    Available:
                    <span
                      style={{
                        marginLeft: 4,
                        color: "white",
                      }}
                    >
                      {tokenBalance?.toFixed(4) || "0"} {selectedToken}
                    </span>
                  </Text>
                </Stack>
                <InputGroup
                  endElement={
                    <Button
                      size="2xs"
                      borderColor="primary"
                      borderRadius={"xs"}
                      color="primary"
                      variant={"outline"}
                      onClick={onMaxClick}
                      disabled={
                        tokenBalance === undefined ||
                        tokenBalance <= 0 ||
                        isSubmitting
                      }
                    >
                      Max
                    </Button>
                  }
                >
                  <Input
                    {...field}
                    onChange={(e) => {
                      onHandleChange({
                        onChange: field.onChange,
                        value: e.target.value,
                      });
                    }}
                    width="full"
                    css={{ "--focus-color": "{colors.primary}" }}
                    placeholder="Enter amount"
                    type="number"
                    min={0}
                    step={0.01}
                  />
                </InputGroup>
                {errors.stakeAmount && (
                  <Text color="red.400" fontSize="sm" mt={1}>
                    {errors.stakeAmount.message}
                  </Text>
                )}
              </VStack>
            )}
          />

          {/* Lock Period Input */}
          <Controller
            name="lockPeriod"
            control={control}
            render={({ field }) => (
              <VStack width="full" alignItems={"flex-start"}>
                <Stack
                  w="full"
                  justifyContent="space-between"
                  alignItems={{ base: "flex-start", md: "flex-end" }}
                  direction={{ base: "column", md: "row" }}
                >
                  <Text fontSize={"sm"} fontWeight={"medium"}>
                    Lock Period (Days)
                  </Text>
                  <Text fontSize={"xs"} color="gray.400">
                    Minimum: {CAPITAL_CONFIG.params.minLockPeriodDays} days
                  </Text>
                </Stack>
                <HStack width="full" gap={2}>
                  <Input
                    {...field}
                    width="full"
                    css={{ "--focus-color": "{colors.primary}" }}
                    placeholder="Enter lock period"
                    type="number"
                    min={CAPITAL_CONFIG.params.minLockPeriodDays}
                    step={1}
                    onChange={(e) => field.onChange(parseInt(e.target.value))}
                  />
                  <VStack width="200px" alignItems="flex-start" gap={1}>
                    <Text fontSize="xs" color="gray.400">
                      Quick select:
                    </Text>
                    <HStack width="full" gap={1}>
                      <Button
                        size="xs"
                        flex="1"
                        variant="outline"
                        borderColor="border"
                        onClick={() => field.onChange(90)}
                      >
                        90d
                      </Button>
                      <Button
                        size="xs"
                        flex="1"
                        variant="outline"
                        borderColor="border"
                        onClick={() => field.onChange(180)}
                      >
                        180d
                      </Button>
                      <Button
                        size="xs"
                        flex="1"
                        variant="outline"
                        borderColor="border"
                        onClick={() => field.onChange(365)}
                      >
                        365d
                      </Button>
                    </HStack>
                  </VStack>
                </HStack>
                {errors.lockPeriod && (
                  <Text color="red.400" fontSize="sm" mt={1}>
                    {errors.lockPeriod.message}
                  </Text>
                )}
                {lockPeriod >= CAPITAL_CONFIG.params.minLockPeriodDays && (
                  <HStack
                    width="full"
                    p={2}
                    bg="blue.900/20"
                    borderRadius="sm"
                    border="1px solid"
                    borderColor="blue.700/30"
                  >
                    <Text fontSize={"xs"} color="blue.300">
                      Reward Multiplier: {calculateAPYBoost()}x
                    </Text>
                  </HStack>
                )}
              </VStack>
            )}
          />

          {/* Submit Button */}
          <Button
            type="submit"
            width={"full"}
            borderRadius={"sm"}
            css={styles}
            loading={loadingState}
            disabled={
              isSubmitting ||
              (approvalState ? !hasPositiveAmount() : !isAmountValid())
            }
          >
            {renderButtonText()}
          </Button>
        </VStack>
      </form>
    </VStack>
  );
};

/**
 * ===========================
 * EXPORTS
 * ===========================
 */
export default StakeForm;

