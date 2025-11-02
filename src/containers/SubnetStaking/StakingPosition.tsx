import { Box, Table, Text, VStack } from "@chakra-ui/react";
import { formatStakerData } from "staking-dashboard/lib/helpers";

import { useAccount } from "wagmi";
import WalletConnectButton from "staking-dashboard/components/WalletConnectButton";

export type StakingPositionProps = {
  getAbi: () => unknown;
  subnetId: `0x${string}`;
  stakerData: unknown[];
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
  const { isTestnet, stakerData, tokenSymbol } = props;

  const { stakedFormattedForUI, claimLockEnd, lastStake } =
    formatStakerData(stakerData, isTestnet) || {};

  // =============== HOOKS
  const { isConnected } = useAccount();

  // =============== VARIABLES
  const isEmptyPosition = stakerData?.every((v) => v === 0n || v === null);
  const userData = [
    {
      label: "Staked Amount",
      value: `${stakedFormattedForUI || "0"} ${tokenSymbol}`,
    },
    { label: "Last Stake", value: lastStake || "N/A" },
    { label: "Claim Lock End", value: claimLockEnd || "N/A" },
  ];

  // =============== VIEWS
  if (!isConnected) {
    return (
      <VStack
        width={"full"}
        py={4}
        justifyContent="center"
        alignItems={"center"}
        gap={8}
      >
        <Text color="textSecondary">
          Connect your wallet to vew your staking position
        </Text>
        <WalletConnectButton enableAddress={false} />
      </VStack>
    );
  }

  if (isEmptyPosition || stakedFormattedForUI === "0.00") {
    return (
      <VStack
        width={"full"}
        py={4}
        justifyContent="center"
        alignItems={"center"}
        gap={2}
      >
        <Text color="textSecondary">
          You do not have an active staking position.
        </Text>
      </VStack>
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
