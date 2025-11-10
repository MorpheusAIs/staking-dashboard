"use client";
import { Box, Table, Text, VStack, HStack, Button } from "@chakra-ui/react";
import { useAccount } from "wagmi";
import WalletConnectButton from "staking-dashboard/components/WalletConnectButton";

export type StakingPositionProps = {
  selectedToken: string;
  stakedAmount: string;
  claimLockEnd: string;
  lastStake: string;
  pendingRewards: string;
  isLoadingData: boolean;
  onClaimRewards?: () => void;
  isClaimingRewards?: boolean;
};

/**
 * ===========================
 * MAIN
 * ===========================
 */
export const StakingPosition: React.FC<StakingPositionProps> = (props) => {
  const {
    selectedToken,
    stakedAmount,
    claimLockEnd,
    lastStake,
    pendingRewards,
    isLoadingData,
    onClaimRewards,
    isClaimingRewards = false,
  } = props;

  // =============== HOOKS
  const { isConnected } = useAccount();

  // =============== VARIABLES
  const hasStakedPosition =
    stakedAmount && parseFloat(stakedAmount) > 0;
  const hasPendingRewards =
    pendingRewards && parseFloat(pendingRewards) > 0;

  const userData = [
    {
      label: "Staked Amount",
      value: `${stakedAmount || "0"} ${selectedToken}`,
    },
    { label: "Last Stake", value: lastStake || "N/A" },
    { label: "Lock End Date", value: claimLockEnd || "N/A" },
    { label: "Pending Rewards", value: `${pendingRewards || "0"} MOR` },
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
        <Text color="text.secondary">
          Connect your wallet to view your staking position
        </Text>
        <WalletConnectButton enableAddress={false} />
      </VStack>
    );
  }

  if (isLoadingData) {
    return (
      <VStack
        width={"full"}
        py={8}
        justifyContent="center"
        alignItems={"center"}
      >
        <Text color="text.secondary">Loading your position...</Text>
      </VStack>
    );
  }

  if (!hasStakedPosition) {
    return (
      <VStack
        width={"full"}
        py={4}
        justifyContent="center"
        alignItems={"center"}
        gap={2}
      >
        <Text color="text.secondary">
          You do not have an active staking position for {selectedToken}.
        </Text>
      </VStack>
    );
  }

  return (
    <VStack width="full" gap={4}>
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

      {/* Claim Rewards Button */}
      {hasPendingRewards && onClaimRewards && (
        <HStack width="full" justifyContent="flex-end">
          <Button
            size="sm"
            colorScheme="green"
            onClick={onClaimRewards}
            loading={isClaimingRewards}
            disabled={isClaimingRewards}
          >
            Claim Rewards
          </Button>
        </HStack>
      )}
    </VStack>
  );
};

/**
 * ===========================
 * EXPORTS
 * ===========================
 */
export default StakingPosition;

