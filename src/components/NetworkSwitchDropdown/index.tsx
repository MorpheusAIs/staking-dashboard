"use client";

import { BoxProps, Menu } from "@chakra-ui/react";
import { useChainId, useSwitchChain } from "wagmi";
import { arbitrum, base } from "viem/chains";
import { HStack, Text, Image, Box } from "@chakra-ui/react";
import { IoChevronDown } from "react-icons/io5";
import { CiGlobe } from "react-icons/ci";
import { networks } from "staking-dashboard/lib/configs/reownConfig";
import { AppKitNetwork } from "@reown/appkit/networks";

const Wrapper: React.FC<BoxProps> = (props) => {
  const { children, ...restProps } = props;
  return (
    <Box
      display="flex"
      alignItems="center"
      gap={2}
      px={{ base: 5, md: 4 }}
      py={{ base: 1.5, md: 2.5 }}
      border="1px solid"
      borderColor="border"
      borderRadius="md"
      bg="card"
      color="white"
      minW={{ md: "150px" }}
      {...restProps}
    >
      {children}
    </Box>
  );
};

export const NetworkDropdown = () => {
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();

  const current = networks.find((n) => n.id === chainId) || arbitrum;
  const filterMainnet = networks.filter((n) => n.id !== 1);
  const hasMultiple = filterMainnet.length > 1;

  const iconMap: Record<AppKitNetwork["id"], string> = {
    [arbitrum.id]: "/icons/arbitrum-arb-logo.svg",
    [base.id]: "/icons/base-logo.svg",
  };

  const icon = iconMap?.[chainId];

  if (!hasMultiple) {
    return (
      <Wrapper>
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
      </Wrapper>
    );
  }

  return (
    <Menu.Root>
      <Menu.Trigger asChild>
        <Wrapper _hover={{ bg: "gray.700" }}>
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
        </Wrapper>
      </Menu.Trigger>

      <Menu.Positioner>
        <Menu.Content
          border="1px solid"
          borderColor="gray.700"
          bg="gray.800"
          color="white"
          borderRadius="md"
          py={3}
          minW="160px"
        >
          {filterMainnet.map((chain: AppKitNetwork) => {
            const icon = iconMap?.[chain.id];
            return (
              <Menu.Item
                key={chain.id}
                py={2}
                value={chain.id.toString()}
                onClick={() => switchChain({ chainId: Number(chain.id) })}
                cursor="pointer"
                _hover={{ bg: "gray.700" }}
              >
                <HStack gap={3}>
                  {icon ? (
                    <Image
                      src={icon}
                      alt={chain.name}
                      boxSize="18px"
                      borderRadius="full"
                    />
                  ) : (
                    <CiGlobe size={18} />
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
