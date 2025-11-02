import {
  Box,
  Grid,
  GridItem,
  HStack,
  Table,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useEffect } from "react";
import { toaster } from "staking-dashboard/components/ui/toaster";
import { wagmiAdapter } from "staking-dashboard/lib/configs/reownConfig";
import { SUBNET_CONFIG } from "staking-dashboard/lib/configs/subnet.config";
import Builders from "staking-dashboard/lib/abi/Builders.json";
import { formatStakerData } from "staking-dashboard/lib/helpers";
import {
  createPublicClient,
  encodeEventTopics,
  formatEther,
  http,
  parseAbiItem,
} from "viem";
import { arbitrum } from "viem/chains";
import {
  useAccount,
  useChainId,
  usePublicClient,
  useReadContract,
} from "wagmi";
import WalletConnectButton from "staking-dashboard/components/WalletConnectButton";

export type StakingPositionProps = {
  getAbi: () => unknown;
  subnetId: `0x${string}`;
  stakerData: unknown;
  isTestnet?: boolean;
  tokenSymbol: string;
  contractAddress?: `0x${string}`;
};

/**
 * ===========================
 * MAIN
 * ===========================
 */
export const StakingPosition: React.FC<StakingPositionProps> = (props) => {
  const { subnetId, isTestnet, stakerData, tokenSymbol, contractAddress } =
    props;

  console.log("stakerData", stakerData);

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
  const { isConnected } = useAccount();

  // =============== API

  // =============== EFFECTS

  // =============== VARIABLES
  const userData = [
    {
      label: "Staked Amount",
      value: `${stakedFormattedForUI || "0"} ${tokenSymbol}`,
    },
    { label: "Last Stake", value: lastStake || "N/A" },
    { label: "Claim Lock End", value: claimLockEnd || "N/A" },
  ];

  // =============== RENDER FUNCTIONS

  // =============== VIEWS
  if (!isConnected) {
    return (
      <HStack
        width={"full"}
        py={4}
        justifyContent="center"
        alignItems={"center"}
      >
        <WalletConnectButton enableAddress={false} />
      </HStack>
    );
  }
  return (
    <Box
      w="full"
      borderRadius="sm"
      border="1px solid"
      borderColor="border"
      bg="card"
      overflowX="auto"
    >
      <Table.Root size="md" variant="outline" minW={"600px"}>
        <Table.Header bg="card">
          <Table.Row>
            {userData.map((item) => (
              <Table.ColumnHeader key={item.label}>
                {item.label}
              </Table.ColumnHeader>
            ))}
          </Table.Row>
        </Table.Header>

        <Table.Body>
          <Table.Row>
            {userData.map((item) => (
              <Table.Cell key={item.label}>
                <Text fontWeight="semibold">{item.value}</Text>
              </Table.Cell>
            ))}
          </Table.Row>
        </Table.Body>
      </Table.Root>
    </Box>
  );
};

/**
 * ===========================
 * EXPORTS
 * ===========================
 */
export default StakingPosition;
