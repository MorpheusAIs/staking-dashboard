"use client";
import {
  Button,
  Input,
  InputGroup,
  Stack,
  Text,
  useRecipe,
  VStack,
} from "@chakra-ui/react";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { formatUnits, parseUnits } from "viem";
import { formatStakerData } from "staking-dashboard/lib/helpers";
import { buttonRecipe } from "staking-dashboard/lib/configs/theme";

export type WithdrawFormProps = {
  stakerData: unknown;
  isTestnet: boolean;
  tokenSymbol: string;
  isWithdrawing?: boolean;
  isCorrectNetwork: () => boolean;
  onToggleAlert: (message: string) => void;
  onHandleWithdraw: (
    amount: string,
    onWithdrawSuccess: () => void
  ) => Promise<void>;
  onHandleNetworkSwitch: () => Promise<true | undefined>;
};

const schema = yup.object({
  withdrawAmount: yup
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
});

/**
 * ===========================
 * MAIN
 * ===========================
 */
export const WithdrawForm: React.FC<WithdrawFormProps> = (props) => {
  const {
    isTestnet,
    stakerData,
    tokenSymbol,
    onToggleAlert,
    isCorrectNetwork,
    onHandleWithdraw,
    onHandleNetworkSwitch,
    isWithdrawing = false,
  } = props;
  // =============== HOOKS
  const {
    watch,
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      withdrawAmount: "",
    },
  });
  const { address: userAddress, isConnected } = useAccount();
  const recipe = useRecipe({ recipe: buttonRecipe });

  // =============== STATE
  const [userStakedAmount, setUserStakedAmount] = useState<number>(0);
  const [rawStakedAmount, setRawStakedAmount] = useState<bigint | null>(null);
  const [timeLeft, setTimeLeft] = useState<string>("");

  // =============== VARIABLES
  const withdrawAmount = watch("withdrawAmount");
  const isAmountExceedingBalance =
    parseFloat(withdrawAmount) > userStakedAmount;
  const isAmountInvalid = parseFloat(withdrawAmount) <= 0;
  const disableWithdraw =
    !userStakedAmount ||
    timeLeft !== "Unlocked" ||
    isWithdrawing ||
    !withdrawAmount ||
    isAmountExceedingBalance ||
    isAmountInvalid;
  const styles = recipe({ visual: "outline" });

  // =============== EVENTS
  const onSubmit = async (data: { withdrawAmount: string }) => {
    const { withdrawAmount: amountUserWantsToWithdrawStr } = data;

    const amountUserWantsToWithdraw = parseFloat(amountUserWantsToWithdrawStr);

    // Basic validation - ensure valid withdrawal amount
    if (isNaN(amountUserWantsToWithdraw) || amountUserWantsToWithdraw <= 0) {
      return onToggleAlert(
        "Please enter a valid withdrawal amount greater than zero."
      );
    }

    if (userStakedAmount === null || userStakedAmount <= 0) {
      return onToggleAlert("You have no staked amount to withdraw.");
    }

    // Check if user is trying to withdraw more than they have staked
    if (amountUserWantsToWithdraw > userStakedAmount) {
      return onToggleAlert(
        `You cannot withdraw ${amountUserWantsToWithdraw.toFixed(
          6
        )} ${tokenSymbol} because you only have ${userStakedAmount.toFixed(
          6
        )} ${tokenSymbol} staked.`
      );
    }

    if (!isCorrectNetwork()) {
      return await onHandleNetworkSwitch();
    }

    if (!rawStakedAmount || rawStakedAmount <= BigInt(0)) {
      return onToggleAlert("You have no staked amount to withdraw.");
    }

    let amountToWithdrawWei: bigint;
    try {
      amountToWithdrawWei = parseUnits(amountUserWantsToWithdrawStr, 18); // Convert user input (e.g., "4") to BigInt wei
    } catch {
      return onToggleAlert(
        "Invalid amount format. Please enter a valid number."
      );
    }

    if (amountToWithdrawWei <= BigInt(0)) {
      return onToggleAlert("Withdrawal amount must be greater than zero.");
    }

    if (amountToWithdrawWei > rawStakedAmount) {
      const maxWithdrawFriendly = formatUnits(rawStakedAmount, 18);
      return onToggleAlert(
        `Error: You are trying to withdraw ${amountUserWantsToWithdrawStr} ${tokenSymbol}, but you only have ${maxWithdrawFriendly} ${tokenSymbol} staked. Please enter a valid amount.`
      );
    }
    // Pass the original string (e.g., "4") to handleWithdraw, as the hook expects token units.
    await onHandleWithdraw(amountUserWantsToWithdrawStr, () => {
      setValue("withdrawAmount", "");
    });
  };

  const onHandleChange = ({
    onChange,
    value,
  }: {
    onChange: (value: string) => void;
    value: string;
  }) => {
    // Ensure non-negative
    const numericValue = Math.max(parseFloat(value) || 0, 0);

    // Round to 1 decimal place
    const formattedValue = Math.floor(numericValue * 10) / 10;

    onChange(formattedValue.toString());
  };

  const onMaxClick = () => {
    // Use raw staked amount for accurate MAX button to avoid rounding issues
    if (rawStakedAmount && rawStakedAmount > BigInt(0)) {
      // Convert raw amount to string with full precision, then format to reasonable decimals
      const exactAmount = formatUnits(rawStakedAmount, 18);
      setValue("withdrawAmount", exactAmount);
    } else {
      // Fallback to formatted amount if raw amount is not available
      const formattedMaxAmount =
        userStakedAmount > 0 ? userStakedAmount.toFixed(2) : "0";
      setValue("withdrawAmount", formattedMaxAmount);
    }
  };

  // =============== EFFECTS
  useEffect(() => {
    if (stakerData) {
      const { stakedRaw, formattedStaked, timeLeft } = formatStakerData(
        stakerData,
        isTestnet
      );

      setRawStakedAmount(stakedRaw);
      setUserStakedAmount(formattedStaked || 0);

      setTimeLeft(timeLeft || "");
    } else {
      setUserStakedAmount(0);
      setRawStakedAmount(null);
      setTimeLeft("Not staked");
    }
  }, [stakerData, isTestnet, userAddress]);

  // =============== RENDER FUNCTIONS
  const renderButtonText = () => {
    if (isWithdrawing) return "Withdrawing...";
    if (!isCorrectNetwork()) return "Switch Network";
    return `Withdraw ${tokenSymbol}`;
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
          Withdraw MOR
        </Text>
      </VStack>{" "}
      <form onSubmit={handleSubmit(onSubmit)} style={{ width: "100%" }}>
        <VStack width="full" gap={4} px={{ md: 2 }}>
          <Controller
            name="withdrawAmount"
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
                    Amount to withdraw
                  </Text>
                  <Text fontSize={"xs"} color="gray.400">
                    Time until unlock:
                    <span
                      style={{
                        marginLeft: 4,
                        color: "white",
                      }}
                    >
                      {timeLeft}
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
                        isWithdrawing || !isConnected || userStakedAmount <= 0
                      }
                    >
                      Max
                    </Button>
                  }
                >
                  <Input
                    {...field}
                    placeholder="Enter amount"
                    onChange={(e) => {
                      onHandleChange({
                        onChange: field.onChange,
                        value: e.target.value,
                      });
                    }}
                    css={{ "--focus-color": "{colors.primary}" }}
                    type="number"
                    min={0}
                    step={0.01}
                  />
                </InputGroup>
                {errors.withdrawAmount && (
                  <Text color="red.400" fontSize="sm" mt={1}>
                    {errors.withdrawAmount.message}
                  </Text>
                )}
              </VStack>
            )}
          />
          <Button
            type="submit"
            css={styles}
            width={"full"}
            borderRadius={"sm"}
            loading={isWithdrawing}
            disabled={disableWithdraw}
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
export default WithdrawForm;
