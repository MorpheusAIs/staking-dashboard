"use client";

import { VStack, Stack, HStack, Box } from "@chakra-ui/react";
import {
  SIDEBAR_WIDTH,
  SocialMediaLinks,
} from "staking-dashboard/lib/configs/constants";
import map from "lodash/map";

/**
 * ===========================
 * MAIN
 * ===========================
 */
export const SocialMedia = () => {
  // =============== RENDER FUNCTIONS
  const renderSocialMedia = () => {
    return map(SocialMediaLinks, (item) => {
      return (
        <Stack
          onClick={() => window.open(item.url, "_blank")}
          cursor="pointer"
          key={item.id}
        >
          {item.icon}
        </Stack>
      );
    });
  };

  // =============== VIEWS
  return (
    <Box display={"block"} width={{ base: "full", lg: SIDEBAR_WIDTH }}>
      <VStack position={{ base: "static", lg: "fixed" }} top={85} right={5}>
        <HStack pt={8} width="full" px={5} gap={4} justifyContent="center">
          {renderSocialMedia()}
        </HStack>
      </VStack>
    </Box>
  );
};

/**
 * ===========================
 * EXPORTS
 * ===========================
 */
export default SocialMedia;
