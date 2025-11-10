"use client";

import { ChakraProvider } from "@chakra-ui/react";
import { ColorModeProvider } from "./color-mode";
import { system } from "staking-dashboard/lib/configs/theme";
import type { ThemeProviderProps } from "next-themes";

export function Provider(props: ThemeProviderProps) {
  return (
    <ChakraProvider value={system}>
      <ColorModeProvider 
        forcedTheme="dark" 
        defaultTheme="dark"
        enableSystem={false}
        {...props} 
      />
    </ChakraProvider>
  );
}
