"use client";
import { useEffect, useState } from "react";
import {
  ClaimEventData,
  UserClaimEventsData,
  UseTotalMorEarnedArgs,
  UseTotalMorEarnedReturn,
} from "staking-dashboard/@types/useTotalMorEarned";
import { processLifetimeEarnings } from "./helpers";
import { fetchQuery } from "staking-dashboard/lib/graphql/fetchQuery";
import { GET_USER_ALL_CLAIM_EVENTS } from "staking-dashboard/lib/graphql/capital";
import { mainnet } from "viem/chains";

export const useTotalMorEarned = (
  args: UseTotalMorEarnedArgs
): UseTotalMorEarnedReturn => {
  const { userAddress } = args;

  const [data, setData] = useState<{
    totalEarnedMOR: number;
    // Leaving this as object for potential future expansion
  }>({
    totalEarnedMOR: 0,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ================ EFFECTS
  useEffect(() => {
    setIsLoading(true);
    const fetchPoolInteractions = async () => {
      if (!userAddress) {
        setIsLoading(false);
        setError("User address is undefined");
        return;
      }

      try {
        // Test with known working address if current user has no data
        const testAddress = userAddress.toLowerCase();
        const knownWorkingAddress =
          "0x81039d59cd0fccd972262682c3711ddb5c69f907";

        // @TODO remove this in final clean up
        // TEMPORARY: Set to true to test with known address that has data to test out logic
        const USE_TEST_ADDRESS = true;
        const finalAddress = USE_TEST_ADDRESS
          ? knownWorkingAddress
          : testAddress;

        const result = await fetchQuery({
          query: GET_USER_ALL_CLAIM_EVENTS,
          variables: { userAddress: finalAddress },
          chain: mainnet.id,
        });

        // Process the single response with all claim events
        const allClaimEvents = result.poolInteractions || [];

        // Initialize with empty arrays for all known pools
        const poolAddresses = [
          "0x47176B2Af9885dC6C4575d4eFd63895f7Aaa4790", // stETH
          "0xdE283F8309Fd1AA46c95d299f6B8310716277A42", // wBTC
          "0x9380d72aBbD6e0Cc45095A2Ef8c2CA87d77Cb384", // wETH
          "0x6cCE082851Add4c535352f596662521B4De4750E", // USDC
          "0x3B51989212BEdaB926794D6bf8e9E991218cf116", // USDT
        ];

        // Categorize events by depositPool
        const userClaimEventsData = poolAddresses.reduce((acc, poolAddress) => {
          acc[poolAddress] = allClaimEvents.filter(
            (event: ClaimEventData) =>
              event.depositPool.toLowerCase() === poolAddress.toLowerCase()
          );
          return acc;
        }, {} as UserClaimEventsData);

        const earnings = processLifetimeEarnings(userClaimEventsData);

        setData({
          totalEarnedMOR: earnings.totalEarned,
        });
      } catch (error) {
        setError((error as Error).message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPoolInteractions();
  }, [userAddress]);

  return {
    error,
    isLoading,
    totalEarnedMOR: data.totalEarnedMOR,
  };
};
