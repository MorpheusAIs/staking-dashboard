import {
  Badge,
  HStack,
  IconButton,
  Portal,
  Stack,
  Text,
} from "@chakra-ui/react";
import { useMemo } from "react";
import DataTable, { ColumnsType } from "staking-dashboard/components/DataTable";
import { AssetIcon } from "staking-dashboard/components/Icons";
import {
  formatAssetAmount,
  formatNumber,
  formatStakedAmount,
} from "../../helper";
import { UserAsset } from "../../type";
import { GoLock } from "react-icons/go";
import { Menu } from "@chakra-ui/react";
import { GoUnlock } from "react-icons/go";
import { HiDotsHorizontal } from "react-icons/hi";
import {
  LuArrowDownToLine,
  LuTrendingUp,
  LuLock,
  LuHandCoins,
} from "react-icons/lu";
import { AssetSymbol } from "staking-dashboard/lib/configs/asset";
import { ActiveModal } from "../../../ModalProvider/type";
import { useModalActions } from "../../../ModalProvider";
import { useSelectedAsset } from "../../../SelectedAssetProvider";

export type StakingTableProps = {
  userAsset: UserAsset[];
  isLoading: boolean;
  isAnyActionProcessing?: boolean;
};

/**
 * ===========================
 * MAIN
 * ===========================
 */
export const StakingTable: React.FC<StakingTableProps> = (props) => {
  const { userAsset, isLoading, isAnyActionProcessing } = props;

  // =============== HOOKS
  const { onHandleSetModal } = useModalActions();
  const { onHandleSetSelectedAsset } = useSelectedAsset();

  // =============== EVENTS
  const onHandleOpenModal = (
    modalType: ActiveModal,
    assetSymbol?: AssetSymbol
  ) => {
    // Prevent action if another action is processing (but allow withdraw even during claim processing)
    if (isAnyActionProcessing && modalType !== "withdraw") {
      return;
    }

    if (assetSymbol) {
      onHandleSetSelectedAsset(assetSymbol);
    }
    onHandleSetModal(modalType);
  };

  // =============== VARIABLES
  const columns: ColumnsType[] = useMemo(
    () => [
      {
        id: "asset",
        header: "Asset",
        renderCell: (asset) => (
          <HStack gap={2} alignItems="center">
            <AssetIcon
              symbol={asset.assetSymbol}
              className="rounded-lg"
              size="24"
            />
            <Text>{asset.symbol}</Text>
          </HStack>
        ),
      },
      {
        id: "amountDeposited",
        header: "Amount Deposited",
        renderCell: (asset) => {
          const canWithdraw = asset.canWithdraw;
          return (
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="center"
              width={"full"}
              gap={2}
            >
              <Text>
                {formatStakedAmount(asset.amountStaked, asset.assetSymbol)}
              </Text>
              {asset.amountStaked > 0 && (
                <Badge
                  bg={canWithdraw ? "green.400" : "yellow.600"}
                  color={canWithdraw ? "black" : "white"}
                  border={"1px sold"}
                  borderColor={canWithdraw ? "green.400" : "yellow.600"}
                >
                  {canWithdraw ? <GoUnlock /> : <GoLock />}
                </Badge>
              )}
            </Stack>
          );
        },
      },
      {
        id: "depositUnlockDate",
        header: "Deposit Unlock Date",
        renderCell: (asset) => <Text>{asset.withdrawUnlockDate || "N/A"}</Text>,
      },
      {
        id: "available",
        header: "Available to Deposit",
        renderCell: (asset) => (
          <Text>{formatAssetAmount(asset.available, asset.assetSymbol)}</Text>
        ),
      },
      {
        id: "dailyEmissions",
        header: "Daily Emissions",
        renderCell: (asset) => {
          const formattedValue =
            asset.dailyEmissions < 1 && asset.dailyEmissions >= 0
              ? asset.dailyEmissions.toLocaleString("en-US", {
                  maximumFractionDigits: 4,
                  minimumFractionDigits: 3,
                })
              : formatNumber(asset.dailyEmissions);

          return <Text>{formattedValue} MOR</Text>;
        },
      },
      {
        id: "powerFactor",
        header: "Power Factor",
        renderCell: (asset) => <Text>{asset.powerFactor}</Text>,
      },
      {
        id: "unlockDate",
        header: "MOR Unlock Date",
        renderCell: (asset) => <Text>{asset.unlockDate || "N/A"}</Text>,
      },
      {
        id: "availableToClaim",
        header: "Available to Claim",
        renderCell: (asset) => {
          const canClaim = asset.canClaim;
          return (
            <Stack
              direction="row"
              alignItems="center"
              gap={2}
              justifyContent="center"
              width={"full"}
            >
              <Text>{formatNumber(asset.availableToClaim)} MOR</Text>
              {asset.amountStaked > 0 && (
                <Badge
                  bg={canClaim ? "green.400" : "yellow.600"}
                  color={canClaim ? "black" : "white"}
                  border={"1px sold"}
                  borderColor={canClaim ? "green.400" : "yellow.600"}
                >
                  {canClaim ? <GoUnlock /> : <GoLock />}
                </Badge>
              )}
            </Stack>
          );
        },
      },
      {
        id: "actions",
        header: "Actions",
        renderCell: (asset) => {
          const canClaim = asset.canClaim;
          const canWithdraw = asset.canWithdraw;
          const notAvailableToClaim = asset.availableToClaim <= 0;
          return (
            <Menu.Root positioning={{ placement: "bottom" }}>
              <Menu.Trigger
                asChild
                justifyContent={"center"}
                alignItems={"center"}
                width={"full"}
                disabled={isAnyActionProcessing}
              >
                <IconButton variant={"plain"} size={"xs"}>
                  <HiDotsHorizontal />
                </IconButton>
              </Menu.Trigger>
              <Portal>
                <Menu.Positioner>
                  <Menu.Content>
                    <Menu.Item
                      value="stake"
                      disabled={!canClaim || isAnyActionProcessing}
                      cursor={!canClaim ? "not-allowed" : "pointer"}
                      onClick={() => {
                        if (!canClaim || isAnyActionProcessing) return;
                        onHandleOpenModal("stakeMorRewards", asset.assetSymbol);
                      }}
                    >
                      <HStack
                        gap={4}
                        justifyContent={"center"}
                        alignItems={"center"}
                        py={1}
                      >
                        <LuTrendingUp size={18} />
                        <Text>Stake Rewards</Text>
                      </HStack>
                    </Menu.Item>
                    <Menu.Item
                      value="withdraw"
                      disabled={!canWithdraw || isAnyActionProcessing}
                      cursor={!canWithdraw ? "not-allowed" : "pointer"}
                      onClick={() => {
                        if (!canWithdraw || isAnyActionProcessing) return;
                        onHandleOpenModal("withdraw", asset.assetSymbol);
                      }}
                    >
                      <HStack
                        gap={4}
                        justifyContent={"center"}
                        alignItems={"center"}
                        py={1}
                      >
                        <LuArrowDownToLine size={18} />
                        <Text>Withdraw</Text>
                      </HStack>
                    </Menu.Item>
                    <Menu.Item
                      value="lock"
                      disabled={notAvailableToClaim || isAnyActionProcessing}
                      cursor={notAvailableToClaim ? "not-allowed" : "pointer"}
                      onClick={() => {
                        if (notAvailableToClaim || isAnyActionProcessing)
                          return;
                        onHandleOpenModal("lockMorRewards", asset.assetSymbol);
                      }}
                    >
                      <HStack
                        gap={4}
                        justifyContent={"center"}
                        alignItems={"center"}
                        py={1}
                      >
                        <LuLock size={18} />
                        <Text>Lock Rewards</Text>
                      </HStack>
                    </Menu.Item>
                    <Menu.Item
                      value="claim"
                      disabled={!canClaim || isAnyActionProcessing}
                      cursor={!canClaim ? "not-allowed" : "pointer"}
                      onClick={() => {
                        if (!canClaim || isAnyActionProcessing) return;
                        onHandleOpenModal("claimMorRewards", asset.assetSymbol);
                      }}
                    >
                      <HStack
                        gap={4}
                        justifyContent={"center"}
                        alignItems={"center"}
                        py={1}
                      >
                        <LuHandCoins size={18} />
                        <Text>Claim Rewards</Text>
                      </HStack>
                    </Menu.Item>
                  </Menu.Content>
                </Menu.Positioner>
              </Portal>
            </Menu.Root>
          );
        },
      },
    ],
    [userAsset]
  );

  // =============== VIEWS
  return <DataTable data={userAsset} columns={columns} isLoading={isLoading} />;
};

/**
 * ===========================
 * EXPORTS
 * ===========================
 */
export default StakingTable;
