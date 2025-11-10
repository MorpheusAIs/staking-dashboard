"use client";

import { Menu } from "@chakra-ui/react";
import { useChainId, useSwitchChain } from "wagmi";
import { arbitrum, base } from "viem/chains";
import { HStack, Text, Image, Box } from "@chakra-ui/react";
import { IoChevronDown } from "react-icons/io5";
import { CiGlobe } from "react-icons/ci";
import { networks } from "staking-dashboard/lib/configs/reownConfig";
import { AppKitNetwork } from "@reown/appkit/networks";
import { useRouteNetwork } from "staking-dashboard/hooks/useRouteNetwork";

export const NetworkDropdown = () => {
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const { allowedNetworks, isCapitalRoute } = useRouteNetwork();

  // Hide dropdown on capital route (only one network available)
  if (isCapitalRoute) {
    return null;
  }

  const current = networks.find((n) => n.id === chainId) || arbitrum;

  // Filter networks to only show allowed ones
  const filteredNetworks = networks.filter((n) =>
    allowedNetworks.some((allowed) => allowed.id === n.id)
  );

  const iconMap: Record<AppKitNetwork["id"], string> = {
    [arbitrum.id]: "/icons/arbitrum-arb-logo.svg",
    [base.id]: "/icons/base-logo.svg",
  };

  const icon = iconMap?.[chainId];

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
          borderRadius="md"
          bg="card"
          color="white"
          cursor="pointer"
          minW={{ md: "150px" }}
          _hover={{ bg: "gray.700" }}
        >
          <HStack gap={2}>
            {icon ? (
              <Image
                src={icon}
                alt={current.name}
                boxSize="25px"
                borderRadius="full"
              />
            ) : (
              <CiGlobe size={18} />
            )}
            <Text
              fontWeight="medium"
              fontSize="sm"
              display={{ base: "none", md: "block" }}
            >
              {current.name}
            </Text>
          </HStack>
          <IoChevronDown size={14} />
        </Box>
      </Menu.Trigger>

      <Menu.Positioner>
        <Menu.Content
          border="1px solid"
          borderColor="border"
          bg="menu.bg"
          color="menu.text"
          borderRadius="md"
          py={3}
          minW="160px"
        >
          {filteredNetworks.map((chain: AppKitNetwork) => {
            const icon = iconMap?.[chain.id];
            return (
              <Menu.Item
                key={chain.id}
                py={2}
                value={chain.id.toString()}
                onClick={() => switchChain({ chainId: Number(chain.id) })}
                cursor="pointer"
                color="menu.text"
                _hover={{ bg: "menu.hover" }}
              >
                <HStack gap={3} color="menu.text">
                  {icon ? (
                    <Image
                      src={icon}
                      alt={chain.name}
                      boxSize="18px"
                      borderRadius="full"
                    />
                  ) : (
                    <Box as="span" color="menu.text">
                      <CiGlobe size={18} />
                    </Box>
                  )}
                  <Text>{chain.name}</Text>
                </HStack>
              </Menu.Item>
            );
          })}
        </Menu.Content>
      </Menu.Positioner>
    </Menu.Root>
  );
};
