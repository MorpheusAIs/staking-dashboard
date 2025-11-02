import { Box, HStack, Stack, Text, VStack } from "@chakra-ui/react";
import { ReactNode } from "react";
import Header from "staking-dashboard/components/Header";
import SideBar from "staking-dashboard/components/SideBar";
import BackgroundImage from "../../../public/background-logo.svg";
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
      // This can be removed if you don't want the background image
      _before={{
        content: `""`,
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        w: { base: 0, md: 0, lg: 950 },
        h: { base: 0, lg: "100%" },
        bgImage: `url(${BackgroundImage.src})`,
        bgRepeat: "no-repeat",
        backgroundPosition: "center",
        bgSize: "contain",
        zIndex: 0,
      }}
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
        color="textSecondary"
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
