import { Stack, Text, VStack } from "@chakra-ui/react";
import { ReactNode } from "react";
import Header from "staking-dashboard/components/Header";
import SideBar from "staking-dashboard/components/SideBar";
import SocialMedia from "staking-dashboard/components/SocialMedia";
import { Toaster } from "staking-dashboard/components/ui/toaster";

export type LayoutsProps = {
  children: ReactNode;
};

/**
 * ===========================
 * MAIN
 * ===========================
 */
export const Layouts: React.FC<LayoutsProps> = (props) => {
  const { children } = props;

  // =============== VIEWS
  return (
    <VStack
      position="relative"
      height={{ md: "100%" }}
      justifyContent="space-between"
    >
      <Header />
      <Stack
        direction={{ base: "column", lg: "row" }}
        h="100%"
        width="full"
        justifyContent={"space-between"}
        gap={4}
      >
        <SideBar />
        <Toaster />
        {children}
        <SocialMedia />
      </Stack>
      <Text
        fontSize="sm"
        color="secondaryText"
        textAlign="center"
        py={4}
        zIndex={1}
      >
        © {new Date().getFullYear()} We are Morpheus. All rights reserved.
      </Text>
    </VStack>
  );
};

/**
 * ===========================
 * EXPORTS
 * ===========================
 */
export default Layouts;
