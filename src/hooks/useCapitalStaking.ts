"use client";
import { useContext } from "react";
import { CapitalStakingContext } from "staking-dashboard/containers/CapitalStakingProvider";

export const useCapitalStaking = () => {
  const ctx = useContext(CapitalStakingContext);
  if (!ctx) {
    throw new Error("useStaking must be used within a <StakingProvider>");
  }
  return ctx;
};
