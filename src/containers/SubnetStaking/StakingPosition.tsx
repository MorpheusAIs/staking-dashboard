import { Grid, GridItem, HStack, Text, VStack } from "@chakra-ui/react";
import { formatStakerData } from "staking-dashboard/lib/helpers";

export type StakingPositionProps = {
  stakerData: unknown;
  isTestnet?: boolean;
  tokenSymbol: string;
};

/**
 * ===========================
 * MAIN
 * ===========================
 */
export const StakingPosition: React.FC<StakingPositionProps> = (props) => {
  const { stakerData, isTestnet, tokenSymbol } = props;

  const { stakedRaw, stakedFormattedForUI, claimLockEnd, lastStake, timeLeft } =
    formatStakerData(stakerData, isTestnet) || {};

  console.log("StakingPosition props", {
    stakerData,
    isTestnet,
    stakedRaw,
    stakedFormattedForUI,
    claimLockEnd,
    lastStake,
    timeLeft,
  });
  // =============== HOOKS

  // =============== STATE

  // =============== API

  // =============== EVENTS

  // =============== VARIABLES
  const userData = [
    {
      label: "Staked Amount",
      value: `${stakedFormattedForUI || "0"} ${tokenSymbol}`,
    },
    { label: "Claim Lock End", value: claimLockEnd || "N/A" },
    { label: "Last Stake", value: lastStake || "N/A" },
    { label: "Time Left Until Unlock", value: timeLeft || "N/A" },
  ];

  // =============== RENDER FUNCTIONS

  // =============== VIEWS
  return (
    <HStack>
      <Grid templateColumns="repeat(4, 1fr)" gap={4}>
        {userData.map((item) => (
          <GridItem key={item.label}>
            <VStack bg="card" padding={2} borderRadius={"md"}>
              <Text>{item.label}:</Text>
              <Text>{item.value}</Text>
            </VStack>
          </GridItem>
        ))}
      </Grid>
    </HStack>
  );
};

/**
 * ===========================
 * EXPORTS
 * ===========================
 */
export default StakingPosition;
