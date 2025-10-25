"use client";

import { HStack, VStack, Text, Stack, StackProps } from "@chakra-ui/react";
import map from "lodash/map";
import { SideBarItems } from "staking-dashboard/lib/utils/constants";
import { usePathname, useRouter } from "next/navigation";

type SideBarContentProps = StackProps & {
  onHandleClick?: () => void;
};

/**
 * ===========================
 * MAIN
 * ===========================
 */

export const SideBarContent: React.FC<SideBarContentProps> = (props) => {
  const { onHandleClick, ...restProps } = props;
  // =============== HOOKS
  const pathname = usePathname();
  const navigate = useRouter();

  // =============== EVENTS
  const handleClick = (path: string) => {
    navigate.push(path);
    onHandleClick?.();
  };

  // =============== RENDER FUNCTIONS
  const renderSideBarContent = () => {
    return map(SideBarItems, (item) => {
      const isCurrentPath = pathname === item.path;

      return (
        <HStack
          key={item.id}
          bg={isCurrentPath ? "card" : "transparent"}
          width="full"
          py={2}
          gap={4}
          onClick={() => handleClick(item.path)}
          borderRadius={"md"}
          px={4}
          justifyContent="flex-start"
          alignItems="center"
          transition="all 0.2s ease-in-out"
          border="1px solid"
          borderColor={isCurrentPath ? "border" : "transparent"}
          cursor="pointer"
          _hover={{
            borderColor: "border",
            bg: "card",
            "& .icon-box": {
              bg: "primary",
            },
          }}
        >
          <Stack
            className="icon-box"
            bg={isCurrentPath ? "primary" : "card"}
            p={2}
            transition="all 0.2s ease-in-out"
            borderRadius="md"
            border="1px solid"
            borderColor={isCurrentPath ? "transparent" : "border"}
          >
            {item.icon}
          </Stack>
          <Text fontWeight="medium">{item.title}</Text>
        </HStack>
      );
    });
  };

  // =============== RETURN
  return (
    <VStack pt={8} width="full" px={5} gap={4} {...restProps}>
      {renderSideBarContent()}
    </VStack>
  );
};

export const SideBar = () => {
  // =============== RETURN
  return (
    <VStack
      width="250px"
      position={"fixed"}
      top={85}
      left={0}
      bg="transparent"
      height="100vh"
      display={{ base: "none", lg: "flex" }}
    >
      <SideBarContent />
    </VStack>
  );
};

/*
 * ===========================
 * EXPORTS
 * ===========================
 */
export default SideBar;
