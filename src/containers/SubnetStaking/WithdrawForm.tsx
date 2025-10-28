"use client";
import {
  Button,
  HStack,
  Input,
  InputGroup,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useEffect, useRef, useState } from "react";
import { useAccount } from "wagmi";
import { SUBNET_CONFIG } from "staking-dashboard/lib/configs/subnet.config";
import { formatUnits, parseUnits } from "viem";

export type WithdrawFormProps = {
  stakerData: unknown;
  isTestnet: boolean;
  tokenSymbol: string;
  isWithdrawing?: boolean;
  isCorrectNetwork: () => boolean;
  onToggleAlert: (message: string) => void;
  onHandleWithdraw: (amount: string) => Promise<void>;
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
  const { address: userAddress } = useAccount();

  // =============== STATE
  const [userStakedAmount, setUserStakedAmount] = useState<number>(0);
  const [rawStakedAmount, setRawStakedAmount] = useState<bigint | null>(null);
  const [timeLeft, setTimeLeft] = useState<string>("");

  // =============== REF
  const previousStakedAmountRef = useRef<number | null>(null); // Add ref to track previous staked amount

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
    } catch (error) {
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
    await onHandleWithdraw(amountUserWantsToWithdrawStr);
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
    console.log("Processing staker data:", {
      stakerData,
      isTestnet,
      userAddress,
    });

    if (stakerData) {
      let staked: bigint;
      let lastStake: bigint;
      let claimLockEndRaw: bigint;

      if (isTestnet) {
        // Testnet data structure: [staked, virtualStaked, pendingRewards, rate, lastStake, claimLockEnd]
        const [stakedData, , , , lastStakeData, claimLockEndData] =
          stakerData as [bigint, bigint, bigint, bigint, bigint, bigint];
        staked = stakedData;
        lastStake = lastStakeData;
        claimLockEndRaw = claimLockEndData;
      } else {
        // Mainnet structure from usersData:
        // [lastDeposit, claimLockStart, deposited, virtualDeposited]
        // [uint128, uint128, uint256, uint256]
        // Only extract the values we need (index 0 and 2)
        const stakerArray = stakerData as [bigint, bigint, bigint, bigint];
        const lastStakeData = stakerArray[0];
        const depositedData = stakerArray[2];
        staked = depositedData;
        lastStake = lastStakeData;
        // For mainnet, calculate claimLockEnd
        claimLockEndRaw = BigInt(0); // Default to 0
        if (lastStake !== BigInt(0)) {
          const lpSeconds = SUBNET_CONFIG.lockPeriodInSeconds;
          claimLockEndRaw = BigInt(Number(lastStake) + lpSeconds);
        }
      }

      // Determine effective claimLockEnd. If contract returned 0 (or an old value),
      // fallback to lastStake + appropriate lock period based on network
      let effectiveClaimLockEnd = claimLockEndRaw;
      if (
        claimLockEndRaw === BigInt(0) ||
        Number(claimLockEndRaw) < Number(lastStake)
      ) {
        const lpSeconds = SUBNET_CONFIG.lockPeriodInSeconds;
        effectiveClaimLockEnd = BigInt(Number(lastStake) + lpSeconds);
      }

      setRawStakedAmount(staked); // Store the raw bigint value

      // Format the staked amount for UI display
      const formattedStaked = parseFloat(formatUnits(staked, 18));
      const previousUserStakedAmount = previousStakedAmountRef.current;
      setUserStakedAmount(formattedStaked); // Keep decimal precision
      previousStakedAmountRef.current = formattedStaked; // Update ref with new value

      console.log("Updated user staked amount:", {
        previousAmount: previousUserStakedAmount,
        newAmount: formattedStaked,
        rawStaked: staked.toString(),
        formattedForDisplay: formattedStaked.toFixed(2),
      });

      // Calculate time until unlock
      const now = Math.floor(Date.now() / 1000);
      const claimLockEndNumber = Number(effectiveClaimLockEnd);
      let calculatedTimeLeft: string;

      if (claimLockEndNumber > now) {
        const secondsRemaining = claimLockEndNumber - now;

        if (secondsRemaining < 60) {
          calculatedTimeLeft = `${secondsRemaining} seconds`;
        } else if (secondsRemaining < 3600) {
          calculatedTimeLeft = `${Math.floor(secondsRemaining / 60)} minutes`;
        } else if (secondsRemaining < 86400) {
          calculatedTimeLeft = `${Math.floor(secondsRemaining / 3600)} hours`;
        } else {
          calculatedTimeLeft = `${Math.floor(secondsRemaining / 86400)} days`;
        }
      } else {
        calculatedTimeLeft = "Unlocked";
      }

      setTimeLeft(calculatedTimeLeft);

      console.log("Staker data processed:", {
        isTestnet,
        stakedRaw: staked.toString(),
        stakedFormattedForUI: formattedStaked.toFixed(2),
        claimLockEnd: new Date(
          Number(effectiveClaimLockEnd) * 1000
        ).toLocaleString("en-US"),
        lastStake: new Date(Number(lastStake) * 1000).toLocaleString("en-US"),
        timeLeft: calculatedTimeLeft,
      });
    } else {
      // Reset values if no data
      console.log("No staker data found, resetting values");
      setUserStakedAmount(0);
      setRawStakedAmount(null); // Reset raw amount
      setTimeLeft("Not staked");
    }
  }, [stakerData, isTestnet, userAddress]);

  // =============== VARIABLES

  // =============== RENDER FUNCTIONS
  const renderButtonText = () => {
    if (isWithdrawing) return "Withdrawing...";
    if (!isCorrectNetwork()) return "Switch Network";
    return `Widthdraw ${tokenSymbol}`;
  };

  // =============== VIEWS
  return (
    <VStack
      p={4}
      bg="card"
      borderRadius="md"
      width="full"
      border="1px solid"
      borderColor="border"
      gap={4}
    >
      <VStack alignItems={"flex-start"} width="full">
        <Text fontSize={"xl"} fontWeight={"medium"}>
          Withdraw MOR
        </Text>
      </VStack>{" "}
      <form onSubmit={handleSubmit(onSubmit)} style={{ width: "100%" }}>
        <VStack width="full" gap={3}>
          <Controller
            name="withdrawAmount"
            control={control}
            render={({ field }) => (
              <VStack width="full" alignItems={"flex-start"}>
                <HStack>
                  <Text fontSize={"xs"}>Amount to withdraw</Text>
                  <Text>{timeLeft}</Text>
                </HStack>
                <InputGroup
                  endElement={
                    <Button
                      size="2xs"
                      borderColor="primary"
                      borderRadius={"xs"}
                      color="primary"
                      variant={"outline"}
                      onClick={onMaxClick}
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
            bgColor="primary"
            color="white"
            width={"full"}
            borderRadius={"sm"}
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
