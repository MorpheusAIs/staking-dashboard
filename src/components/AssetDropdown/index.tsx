"use client";
import { Box, HStack, Menu, Text } from "@chakra-ui/react";
import { ContractAddresses } from "staking-dashboard/@types/common";
import { AssetSymbol } from "staking-dashboard/lib/configs/asset";
import { getAssetsForNetwork } from "staking-dashboard/lib/configs/asset";
import { getContractAddress } from "staking-dashboard/lib/networks";
import { useAccount, useBalance, useChainId } from "wagmi";
import { AssetIcon } from "../Icons";
import { IoChevronDown } from "react-icons/io5";
import { AssetData } from "staking-dashboard/@types/useCapitalStaking";
import { formatUnits } from "viem";
import { formatBalanceDisplay } from "staking-dashboard/lib/helpers";
import { depositPoolMapping } from "staking-dashboard/lib/configs/constants";

export type AssetDropdownProps = {
  l1ChainId: number;
  assets: Record<AssetSymbol, AssetData>;
  networkEnv: "mainnet" | "testnet";
  selectedAsset: AssetSymbol;
  onHandleSetSelectedAsset: (asset: AssetSymbol) => void;

  getUserBalanceForAsset: (asset: AssetSymbol) => {
    formatted: string;
    balance: bigint;
  };
  currentAssetBalance: string;
};

/**
 * ===========================
 * MAIN
 * ===========================
 */
export const AssetDropdown: React.FC<AssetDropdownProps> = (props) => {
  const {
    assets,
    onHandleSetSelectedAsset,
    l1ChainId,
    networkEnv,
    selectedAsset,
    getUserBalanceForAsset,
    currentAssetBalance,
  } = props;

  // =============== VARIABLES
  const assetOptions = () => {
    return Object.values(assets)
      .filter((asset) => {
        const contractKey = depositPoolMapping[asset.config.symbol];
        const hasDepositPool =
          contractKey && getContractAddress(l1ChainId, contractKey, networkEnv);
        return hasDepositPool;
      })
      .map((asset) => ({
        value: asset.config.symbol,
        label: asset.config.symbol,
        symbol: asset.config.icon,
      }));
  };

  // =============== RENDER FUNCTIONS
  const renderOptions = () => {
    return assetOptions().map((asset) => (
      <Menu.Item
        key={asset.value}
        py={3}
        value={asset.value}
        onClick={() => onHandleSetSelectedAsset(asset.value)}
        _hover={{ bg: "gray.700" }}
      >
        <HStack
          justifyContent="space-between"
          width="full"
          alignItems={"center"}
        >
          <HStack alignItems="center">
            <AssetIcon symbol={asset.value} className="rounded-lg" size={24} />
            <Text>{asset.label}</Text>
          </HStack>
          <Text fontSize={"xs"}>
            {formatBalanceDisplay(
              getUserBalanceForAsset(asset.value as AssetSymbol).formatted ||
                "0",
              asset.value as AssetSymbol
            )}{" "}
            Available
          </Text>
        </HStack>
      </Menu.Item>
    ));
  };

  // =============== VIEWS
  return (
    <Menu.Root>
      <Menu.Trigger asChild>
        <Box
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          gap={2}
          px={{ base: 5, md: 4 }}
          py={{ base: 1.5, md: 2.5 }}
          border="1px solid"
          borderColor="border"
          borderRadius="sm"
          color="white"
          cursor="pointer"
          width="full"
          _hover={{ bg: "gray.700" }}
        >
          <HStack
            width="full"
            justifyContent="space-between"
            alignItems={"center"}
          >
            <HStack>
              <AssetIcon
                symbol={selectedAsset}
                className="rounded-lg"
                size={24}
              />
              <Text>{selectedAsset}</Text>
            </HStack>
            <HStack alignItems={"center"}>
              <Text fontSize={"xs"}>
                {formatBalanceDisplay(currentAssetBalance, selectedAsset)}{" "}
                Available
              </Text>
              <IoChevronDown size={14} />
            </HStack>
          </HStack>
        </Box>
      </Menu.Trigger>
      <Menu.Positioner width={"full"}>
        <Menu.Content
          border="1px solid"
          borderColor="gray.700"
          bg="gray.800"
          color="white"
          width={"full"}
          borderRadius="sm"
          py={3}
        >
          {renderOptions()}
        </Menu.Content>
      </Menu.Positioner>
    </Menu.Root>
  );
};

/**
 * ===========================
 * EXPORTS
 * ===========================
 */
export default AssetDropdown;
