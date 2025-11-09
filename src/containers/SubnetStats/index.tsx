import {
  Box,
  Grid,
  GridItem,
  HStack,
  Skeleton,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { SUBNET_CONFIG } from "staking-dashboard/lib/configs/subnet.config";
import {
  GET_BUILDERS_PROJECT_BY_ID,
  GET_BUILDERS_PROJECT_BY_ID_TESTNET,
} from "staking-dashboard/lib/graphql/builders";
import {
  fetchQuery,
  GRAPHQL_ENDPOINTS,
} from "staking-dashboard/lib/graphql/fetchQuery";
import { BsStack } from "react-icons/bs";
import { CHAIN_ID } from "staking-dashboard/lib/configs/constants";
import { FaUsers } from "react-icons/fa";
import { LuClock } from "react-icons/lu";
import {
  formatDuration,
  formatTimeDuration,
  toMOR,
} from "staking-dashboard/lib/helpers";

export type SubnetStatsProps = {
  isTestnet: boolean;
  tokenSymbol: string;
};

/**
 * ===========================
 * MAIN
 * ===========================
 */
export const SubnetStats: React.FC<SubnetStatsProps> = (props) => {
  const { tokenSymbol } = props;
  // =============== VARIABLES
  const projectID = SUBNET_CONFIG.subnetID;
  
  // ALWAYS fetch from the configured network (ARBITRUM)
  // User's current network is IRRELEVANT - stats are always from ARBITRUM
  const dataFetchNetwork = SUBNET_CONFIG.dataFetchNetwork;
  
  // Determine if the DATA network is testnet (not the user's network)
  const isDataNetworkTestnet = dataFetchNetwork === CHAIN_ID.ARBITRUM_SEPOLIA || dataFetchNetwork === CHAIN_ID.SEPOLIA;
  
  // Check if endpoint exists
  const hasEndpoint = GRAPHQL_ENDPOINTS[dataFetchNetwork];
  
  // =============== HOOKS
  const {
    data: builderData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["builderProject", projectID, dataFetchNetwork],
    queryFn: () =>
      fetchQuery({
        query: isDataNetworkTestnet
          ? GET_BUILDERS_PROJECT_BY_ID_TESTNET
          : GET_BUILDERS_PROJECT_BY_ID,
        variables: { id: projectID },
        chain: dataFetchNetwork, // ALWAYS fetch from configured network
      }),
    enabled: !!hasEndpoint, // Only check if endpoint exists, NOT current chain
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchInterval: false,
  });

  // =============== HELPERS
  const userOrUsers = (count: number) => (count === 1 ? "user" : "users");

  // =============== VARIABLES
  const data = isDataNetworkTestnet
    ? builderData?.builderSubnet
    : builderData?.buildersProject;

  const withdrawPeriod = isDataNetworkTestnet
    ? data?.withdrawLockPeriodAfterStake
    : data?.withdrawLockPeriodAfterDeposit;

  const totalUsers = data?.totalUsers || 0;

  const stats = [
    {
      id: 0,
      label: "Total Staked",
      icon: BsStack,
      value: (
        <>
          {toMOR(data?.totalStaked)}{" "}
          <Text as="span" fontSize={{ base: "xs", md: "sm" }}>
            {tokenSymbol}
          </Text>
        </>
      ),
    },
    {
      id: 1,
      label: "Total Stakers",
      icon: FaUsers,
      value: (
        <>
          {totalUsers}{" "}
          <Text as="span" fontSize={{ base: "xs", md: "sm" }}>
            {userOrUsers(totalUsers)}
          </Text>
        </>
      ),
    },
    {
      id: 2,
      label: "Lock Period",
      icon: LuClock,
      value: (
        <>
          {formatDuration(withdrawPeriod)}{" "}
          <Text as="span" fontSize={{ base: "xs", md: "sm" }}>
            {formatTimeDuration(withdrawPeriod)}
          </Text>
        </>
      ),
    },
  ];

  // =============== VIEWS
  if (isLoading)
    return <Skeleton height={100} borderRadius={"md"} width={"full"} />;

  if (error) return null;

  return (
    <HStack width="full">
      <Grid
        templateColumns={"repeat(3, 1fr)"}
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
            <HStack gap={{ base: 1, md: 4 }}>
              <Box
                p={1}
                borderRadius="full"
                bg="whiteAlpha.950"
                display={{ base: "none", md: "block" }}
              >
                <Box backgroundColor={"primary"} borderRadius={"full"} p={2}>
                  <stat.icon size={20} />
                </Box>
              </Box>
              <VStack alignItems="flex-start" gap={0.5}>
                <Text color="gray.400" fontSize={{ base: "xs", md: "sm" }}>
                  {stat.label}
                </Text>
                <Text fontWeight="bold" fontSize={{ base: "sm", md: "lg" }}>
                  {stat.value}
                </Text>
              </VStack>
            </HStack>
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
