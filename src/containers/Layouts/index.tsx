import { Box, HStack, Stack, Text, VStack } from "@chakra-ui/react";
import Image from "next/image";
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
      h="100vh"
      position="relative"
      overflow="hidden"
      justifyContent="space-between"
      _before={{
        content: `""`,
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        w: { base: 350, md: 500 },
        h: { base: 350, md: 500 },
        bgImage: `url(${BackgroundImage.src})`,
        bgRepeat: "no-repeat",
        backgroundPosition: "center",
        bgSize: "contain",
        zIndex: 0,
      }}
    >
      <Header />
      <HStack h="100%" width="full" justifyContent={"center"}>
        <SideBar />
        <Toaster />
        {children}
        <SocialMedia />
      </HStack>
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
