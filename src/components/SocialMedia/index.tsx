"use client";

import { VStack, Stack, HStack } from "@chakra-ui/react";
import { SocialMediaLinks } from "staking-dashboard/utils/constants";
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
    <VStack position={"fixed"} top={85} right={5}>
      <HStack pt={8} width="full" px={5} gap={4}>
        {renderSocialMedia()}
      </HStack>
    </VStack>
  );
};

/**
 * ===========================
 * EXPORTS
 * ===========================
 */
export default SocialMedia;
