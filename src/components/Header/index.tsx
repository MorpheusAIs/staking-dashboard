"use client";
import { Stack, useBreakpoint, Drawer, HStack } from "@chakra-ui/react";
import Image from "next/image";
import LogoSrc from "../../../public/logo.png";
import { RxHamburgerMenu } from "react-icons/rx";
import { useState } from "react";
import { SideBarContent } from "../SideBar";
import WalletConnectButton from "../WalletConnectButton";
import TokenBalance from "../TokenBalance";
import { useChainId } from "wagmi";
import { arbitrumSepolia } from "viem/chains";

/**
 * ===========================
 * MAIN
 * ===========================
 */
export const Header = () => {
  // =============== STATE
  const [open, setOpen] = useState(false);

  // =============== HOOKS
  const isDesktop = useBreakpoint({ breakpoints: ["lg"] });
  const chainId = useChainId();

  // =============== EVENTS
  const handleToggle = () => {
    setOpen(!open);
  };

  // =============== VARIABLES
  const isTestnet = chainId === arbitrumSepolia.id;

  // =============== RENDER
  const renderIcon = () => {
    if (isDesktop === "lg") {
      return <Image src={LogoSrc.src} width={60} height={60} alt="Logo" />;
    }
    return <RxHamburgerMenu size={30} onClick={handleToggle} />;
  };

  // =============== VIEWS
  return (
    <>
      <Drawer.Root
        open={open}
        onOpenChange={(e) => setOpen(e.open)}
        placement={"start"}
      >
        <Drawer.Backdrop />
        <Drawer.Positioner>
          <Drawer.Content>
            <Drawer.CloseTrigger />
            <Drawer.Body bg="secondary">
              <HStack
                width="full"
                justifyContent="center"
                mt={3}
                alignItems="center"
              >
                <Image src={LogoSrc.src} width={60} height={60} alt="Logo" />
              </HStack>
              <SideBarContent px={2} onHandleClick={handleToggle} />
            </Drawer.Body>
          </Drawer.Content>
        </Drawer.Positioner>
      </Drawer.Root>
      <Stack
        top={0}
        zIndex={10}
        width="full"
        paddingY={{ base: 3, md: 5, lg: 3 }}
        direction="row"
        borderBottom="sm"
        position="sticky"
        alignItems="center"
        borderBottomColor="border"
        backgroundColor="secondary"
        paddingX={{ base: 4, lg: 10 }}
        justifyContent="space-between"
      >
        {renderIcon()}
        <HStack gap={5}>
          <TokenBalance />
          <WalletConnectButton />
        </HStack>
      </Stack>
      {isTestnet && (
        <HStack
          justifyContent="center"
          bg="yellow.200"
          borderRadius={"md"}
          color="black"
          zIndex={2}
          py={2}
          px={3}
          my={3}
        >
          Connected to Testnet
        </HStack>
      )}
    </>
  );
};

/**
 * ===========================
 * EXPORTS
 * ===========================
 */
export default Header;
