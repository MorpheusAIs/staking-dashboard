"use client";

import { cookieToInitialState, WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { wagmiAdapter } from "staking-dashboard/lib/configs/reownConfig";
import { PropsWithChildren } from "react";

// Optimized QueryClient configuration to reduce unnecessary RPC calls
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache data for 5 minutes before considering it stale
      staleTime: 5 * 60 * 1000,
      // Keep unused data in cache for 10 minutes
      gcTime: 10 * 60 * 1000,
      // Disable aggressive refetching that causes performance issues
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
      // Disable automatic background refetching
      refetchInterval: false,
      // Only retry failed requests once to avoid hammering RPC
      retry: 1,
      retryDelay: 1000,
    },
  },
});

export type AppKitProviderProps = PropsWithChildren;

/**
 * ===========================
 * MAIN
 * ===========================
 */
export const AppKitProvider: React.FC<AppKitProviderProps> = (props) => {
  const { children } = props;

  // =============== VARIABLES
  const initialState = cookieToInitialState(wagmiAdapter.wagmiConfig);

  // =============== VIEWS
  return (
    <WagmiProvider
      config={wagmiAdapter.wagmiConfig}
      initialState={initialState}
    >
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
};

/**
 * ===========================
 * EXPORTS
 * ===========================
 */
export default AppKitProvider;
