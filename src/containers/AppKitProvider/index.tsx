"use client";

import { cookieToInitialState, WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { wagmiAdapter } from "staking-dashboard/lib/configs/reownConfig";
import { PropsWithChildren } from "react";

const queryClient = new QueryClient();

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
