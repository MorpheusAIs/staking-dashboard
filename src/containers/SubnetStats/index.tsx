"use client";
import {
  Grid,
  GridItem,
  HStack,
  IconButton,
  Skeleton,
  Text,
  useDisclosure,
  VStack,
} from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import {
  GET_BUILDERS_PROJECT_BY_ID,
  GET_BUILDERS_PROJECT_BY_ID_TESTNET,
} from "staking-dashboard/lib/graphql/builders";
import { fetchQuery } from "staking-dashboard/lib/graphql/fetchQuery";
import { useChainId } from "wagmi";
import { GrCircleQuestion } from "react-icons/gr";
import {
  formatDuration,
  formatTimeDuration,
  toMOR,
} from "staking-dashboard/lib/helpers";
import { getSubnetConfig } from "staking-dashboard/lib/helpers";
import { Tooltip } from "staking-dashboard/components/ui/tooltip";

export type SubnetStatsProps = {
  isTestnet: boolean;
  tokenSymbol: string;
};

type Stat = {
  id: number;
  label: string;
  value: React.ReactNode;
  tooltip?: string;
};

const StatTooltip: React.FC<{ tooltip: string }> = ({ tooltip }) => {
  const { open, onOpen, onClose, onToggle } = useDisclosure();
  return (
    <Tooltip open={open} content={tooltip}>
      <IconButton
        aria-label="Info"
        variant="plain"
        size="xs"
        onMouseEnter={onOpen}
        onMouseLeave={onClose}
        onClick={onToggle}
      >
        <GrCircleQuestion size={10} color="gray" />
      </IconButton>
    </Tooltip>
  );
};

/**
 * ===========================
 * MAIN
 * ===========================
 */
export const SubnetStats: React.FC<SubnetStatsProps> = (props) => {
  const { isTestnet, tokenSymbol } = props;

  // =============== VARIABLES
  const subnetConfig = getSubnetConfig(isTestnet);
  const projectID = subnetConfig.subnetID;
  const chain = useChainId();

  // =============== HOOKS
  const {
    data: builderData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["builderProject", projectID, chain],
    queryFn: () =>
      fetchQuery({
        query: isTestnet
          ? GET_BUILDERS_PROJECT_BY_ID_TESTNET
          : GET_BUILDERS_PROJECT_BY_ID,
        variables: { id: projectID },
        chain,
      }),
  });

  // =============== HELPERS
  const userOrUsers = (count: number) => (count === 1 ? "user" : "users");

  // =============== VARIABLES
  const data = isTestnet
    ? builderData?.builderSubnet
    : builderData?.buildersProject;

  const withdrawPeriod = isTestnet
    ? data?.withdrawLockPeriodAfterStake
    : data?.withdrawLockPeriodAfterDeposit;

  const totalUsers = data?.totalUsers || 0;

  const stats: Stat[] = [
    {
      id: 0,
      label: "Total Staked",
      value: (
        <>
          {toMOR(data?.totalStaked)}{" "}
          <Text as="span" fontSize={{ base: "xs", md: "sm" }}>
            {tokenSymbol}
          </Text>
        </>
      ),
      tooltip: "Total amount of tokens staked in this subnet.",
    },
    {
      id: 4,
      label: "Total Claimed",
      value: (
        <>
          {toMOR(data?.totalClaimed)}{" "}
          <Text as="span" fontSize={{ base: "xs", md: "sm" }}>
            {tokenSymbol}
          </Text>
        </>
      ),
      tooltip: "Total amount of tokens claimed from this subnet.",
    },
    {
      id: 1,
      label: "Total Stakers",
      value: (
        <>
          {totalUsers}{" "}
          <Text as="span" fontSize={{ base: "xs", md: "sm" }}>
            {userOrUsers(totalUsers)}
          </Text>
        </>
      ),
      tooltip: "Total number of users staking in this subnet.",
    },
    {
      id: 2,
      label: "Lock Period",
      value: (
        <>
          {formatDuration(withdrawPeriod)}{" "}
          <Text as="span" fontSize={{ base: "xs", md: "sm" }}>
            {formatTimeDuration(withdrawPeriod)}
          </Text>
        </>
      ),
      tooltip:
        "The duration you must wait after withdrawing before you can claim your MOR tokens.",
    },
  ];

  // =============== VIEWS
  if (isLoading)
    return <Skeleton height={100} borderRadius={"md"} width={"full"} />;

  if (error) return null;

  return (
    <HStack width="full" gap={4}>
      <Grid
        templateColumns={"repeat(4, 1fr)"}
        gap={{ base: 1, md: 6 }}
        width="full"
        bg="card"
        backdropFilter="blur(20px)"
        p={1}
        borderRadius={"lg"}
        border="1px solid"
        borderColor="border"
        justifyContent={"center"}
      >
        {stats.map((stat) => (
          <GridItem
            key={stat.id}
            colSpan={1}
            p={{ base: 2, md: 4 }}
            justifyItems={"center"}
          >
            <VStack gap={{ base: 1, md: 4 }}>
              <VStack alignItems="flex-start" gap={0.5}>
                <HStack gap={0} alignItems={"center"}>
                  <Text
                    color="secondaryText"
                    fontWeight={"medium"}
                    fontSize={{ base: "xs", md: "sm" }}
                  >
                    {stat.label}
                  </Text>
                  {stat.tooltip && <StatTooltip tooltip={stat.tooltip} />}
                </HStack>
                <Text fontWeight="bold" fontSize={{ base: "sm", md: "xl" }}>
                  {stat.value}
                </Text>
              </VStack>
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
export default SubnetStats;
