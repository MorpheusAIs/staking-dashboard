"use client";
import { Button, Input, InputGroup, Text, VStack } from "@chakra-ui/react";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useEffect, useMemo, useState } from "react";
import { arbitrum } from "wagmi/chains";
import { useAccount, useSwitchChain } from "wagmi";
import "staking-dashboard/app/global.css";
import { toaster } from "staking-dashboard/components/ui/toaster";
import { formatToOneDecimal } from "staking-dashboard/lib/helpers";
import { SUBNET_CONFIG } from "staking-dashboard/lib/configs/subnet.config";
import { formatEther } from "viem";

export type StakeFormProps = {
  subnetId: string;
  isTestnet: boolean;
  isStaking: boolean;
  tokenSymbol: string;
  isApproving: boolean;
  tokenBalance: number;
  isLoadingData: boolean;
  needsApproval: boolean;
  isSubmitting?: boolean;
  isCorrectNetwork: () => boolean;
  onHandleApprove: (amount: string) => Promise<void>;
  onHandleStaking: (amount: string) => Promise<void>;
  onHandleNetworkSwitch: () => Promise<true | undefined>;
  checkAndUpdateApprovalNeeded: (amount: string) => boolean;
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
});

/**
 * ===========================
 * MAIN
 * ===========================
 */
export const StakeForm: React.FC<StakeFormProps> = (props) => {
  const {
    subnetId,
    isStaking,
    isTestnet,
    tokenSymbol,
    isApproving,
    isSubmitting,
    tokenBalance,
    isLoadingData,
    needsApproval,
    onHandleApprove,
    onHandleStaking,
    isCorrectNetwork,
    onHandleNetworkSwitch,
    checkAndUpdateApprovalNeeded,
  } = props;
  // =============== STATE
  const [isWrongNetwork, setIsWrongNetwork] = useState(false);

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
    },
  });
  const { isConnected, chainId, chain } = useAccount();
  const { switchChain } = useSwitchChain();

  // =============== VARIABLES
  const stakeAmount = watch("stakeAmount");
  const validStakeAmount = stakeAmount && parseFloat(stakeAmount) > 0;
  const approvalState =
    isApproving ||
    (needsApproval && stakeAmount && parseFloat(stakeAmount) > 0);

  // Show warning based on logic or explicit flag
  const displayWarning =
    !isCorrectNetwork() ||
    needsApproval ||
    (!!stakeAmount && parseFloat(stakeAmount) > 0) ||
    (!!stakeAmount &&
      parseFloat(stakeAmount) >
        (tokenBalance
          ? parseFloat(formatEther(tokenBalance as unknown as bigint))
          : 0));
  tokenBalance !== undefined && parseFloat(stakeAmount) > tokenBalance;

  // =============== EFFECTS
  // Check if approval is needed when stake amount changes
  useEffect(() => {
    if (!validStakeAmount) return;
    checkAndUpdateApprovalNeeded(stakeAmount);
  }, [stakeAmount, checkAndUpdateApprovalNeeded]);

  // Refresh approval state when user returns to the page or when allowance data loads
  // This fixes the issue where interface keeps asking for approval after page reload
  useEffect(() => {
    if (!validStakeAmount || isLoadingData) return;
    checkAndUpdateApprovalNeeded(stakeAmount);
  }, [stakeAmount, checkAndUpdateApprovalNeeded, isLoadingData]);

  // Check if user is on correct network
  useEffect(() => {
    if (isConnected && chainId !== arbitrum.id) {
      setIsWrongNetwork(true);
    } else {
      setIsWrongNetwork(false);
    }
  }, [isConnected, chainId]);

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

    // Round to 1 decimal place
    const formattedValue = Math.floor(numericValue * 10) / 10;

    // Update the form field
    onChange(formattedValue.toString());

    // Trigger approval check if positive
    if (formattedValue > 0) {
      checkAndUpdateApprovalNeeded(formattedValue.toString());
    }
  };

  const onSubmit = async () => {
    // @TODO remove
    console.log("onStakeSubmit called with:", {
      needsApproval,
      stakeAmount,
      isCorrectNetwork: isCorrectNetwork(),
      tokenSymbol,
      subnetId, // Log subnetId here to debug
    });

    // Validate subnetId is present
    if (!subnetId) {
      toaster.create({
        title: "Failed to stake",
        description:
          "Subnet ID is missing. This is likely because the builder's mainnet project ID is not set correctly.",
        type: "error",
      });
      return;
    }

    // If not on the correct network, switch first
    if (!isCorrectNetwork()) {
      await onHandleNetworkSwitch();
      return; // Exit after network switch to prevent further action
    }

    // Force a fresh check for approval before proceeding
    const currentlyNeedsApproval = stakeAmount
      ? await checkAndUpdateApprovalNeeded(stakeAmount)
      : false;
    console.log(
      `Fresh approval check: ${
        currentlyNeedsApproval ? "Needs approval" : "No approval needed"
      }`
    );

    // Already on correct network, handle approval or staking
    if (
      (currentlyNeedsApproval || needsApproval) &&
      stakeAmount &&
      parseFloat(stakeAmount) > 0
    ) {
      console.log(`Calling onHandleApprove with amount: ${stakeAmount}`);
      await onHandleApprove(stakeAmount);
    } else if (stakeAmount && parseFloat(stakeAmount) > 0) {
      console.log(`Calling onHandleStaking with amount: ${stakeAmount}`);
      await onHandleStaking(stakeAmount);
    } else {
      console.warn("Neither approval nor staking conditions met:", {
        needsApproval,
        currentlyNeedsApproval,
        stakeAmount,
        parsed: parseFloat(stakeAmount || "0"),
      });
    }
  };

  // =============== MEMO
  const networksToDisplay = useMemo(() => {
    if (!chain) {
      // fallback logic if wallet not connected
      if (isTestnet) {
        console.log("[BuilderPage] Fallback to testnet network");
        return ["Arbitrum Sepolia"];
      }
      console.log("[BuilderPage] Fallback to Base network");
      return ["Base"];
    }

    // map common chain names
    switch (chain.id) {
      case 42161:
        return ["Arbitrum"];
      case 8453:
        return ["Base"];
      case 421614:
        return ["Arbitrum Sepolia"];
      default:
        return [chain.name]; // fallback to whatever network user connected to
    }
  }, [chain, isTestnet]);

  // =============== HELPERS
  // Check if entered amount is above minimum and below maximum
  const isAmountValid = () => {
    const amount = parseFloat(stakeAmount);
    if (isNaN(amount) || amount <= 0) return false;

    // Skip minimum validation if minAmount is undefined
    if (
      SUBNET_CONFIG.minDeposit !== undefined &&
      amount < SUBNET_CONFIG.minDeposit
    )
      return false;
    if (tokenBalance !== undefined && amount > tokenBalance) return false;

    return true;
  };

  // New: Check if the amount is just positive for approval
  const hasPositiveAmount = () => {
    const amount = parseFloat(stakeAmount);
    return !isNaN(amount) && amount > 0;
  };

  // =============== RENDER
  const renderButtonText = () => {
    if (!isCorrectNetwork()) return "Switch to Arbitrum";
    if (isStaking) return "Staking...";
    if (isApproving) return "Approving...";
    if (needsApproval && stakeAmount && parseFloat(stakeAmount) > 0)
      return `Approve ${tokenSymbol}`;
    return `Stake ${tokenSymbol}`;
  };

  const renderWarningText = () => {
    if (!isCorrectNetwork())
      return `Please switch to ${networksToDisplay[0]} network to stake`;
    if (needsApproval && stakeAmount && parseFloat(stakeAmount) > 0) {
      return `You need to approve ${tokenSymbol} spending first`;
    }
    return `Warning: You don't have enough ${tokenSymbol}`;
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
          Stake MOR
        </Text>
      </VStack>
      <form onSubmit={handleSubmit(onSubmit)} style={{ width: "100%" }}>
        <VStack width="full" gap={3}>
          <Controller
            name="stakeAmount"
            control={control}
            render={({ field }) => (
              <VStack width="full" alignItems={"flex-start"}>
                <Text fontSize={"xs"}>Amount to stake</Text>
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
          {displayWarning && (
            <Text color="colorPalette.warning">{renderWarningText()}</Text>
          )}
          <Button
            type="submit"
            bgColor="primary"
            color="white"
            fontWeight={"bold"}
            width={"full"}
            borderRadius={"sm"}
            disabled={
              isSubmitting ||
              // For approval buttons, only require a positive amount
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
