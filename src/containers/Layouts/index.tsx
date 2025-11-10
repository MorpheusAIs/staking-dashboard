"use client";
import { Box, Stack, Text, VStack } from "@chakra-ui/react";
import { ReactNode } from "react";
import Header from "staking-dashboard/components/Header";
import SideBar from "staking-dashboard/components/SideBar";
import SocialMedia from "staking-dashboard/components/SocialMedia";
import { Toaster } from "staking-dashboard/components/ui/toaster";
import BackgroundImage from "../../../public/background-logo.svg";

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
      suppressHydrationWarning
    >
      {/* Background logo */}
      <Box
        position="fixed"
        top="50%"
        left="50%"
        transform="translate(-50%, -50%)"
        w={{ base: 0, md: 0, lg: 950 }}
        h={{ base: 0, lg: "100%" }}
        bgImage={`url(${BackgroundImage.src})`}
        bgRepeat="no-repeat"
        backgroundPosition="center"
        bgSize="contain"
        zIndex={0}
        pointerEvents="none"
      />
      <Header />
      <Stack
        direction={{ base: "column", lg: "row" }}
        h="100%"
        width="full"
        justifyContent={"space-between"}
        gap={4}
        suppressHydrationWarning
      >
        <SideBar />
        <Toaster />
        {children}
        <SocialMedia />
      </Stack>
      <Text
        fontSize="sm"
        color="text.secondary"
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
