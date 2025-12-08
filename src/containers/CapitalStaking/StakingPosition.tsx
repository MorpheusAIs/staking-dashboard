import { Text, VStack } from "@chakra-ui/react";
import MetricsData from "./MetricsData";
import { useCapitalStaking } from "staking-dashboard/hooks/useCapitalStaking";

export type StakingPositionProps = {};

/**
 * ===========================
 * MAIN
 * ===========================
 */
export const StakingPosition: React.FC<StakingPositionProps> = () => {
  // =============== HOOKS

  // =============== STATE

  // =============== API

  // =============== EVENTS

  // =============== VARIABLES

  // =============== RENDER FUNCTIONS

  // =============== VIEWS
  return (
    <VStack pt={4} width="full">
      <MetricsData />
    </VStack>
  );
};

/**
 * ===========================
 * EXPORTS
 * ===========================
 */
export default StakingPosition;
