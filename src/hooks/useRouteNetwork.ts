"use client";
import { usePathname } from "next/navigation";
import { mainnet, arbitrum, base, arbitrumSepolia } from "wagmi/chains";
import type { Chain } from "wagmi/chains";

export const useRouteNetwork = () => {
  const pathname = usePathname();
  
  const isCapitalRoute = pathname === "/capital";
  const isSubnetRoute = pathname === "/subnet";
  
  // Define which networks are allowed per route
  const allowedNetworks: Chain[] = isCapitalRoute 
    ? [mainnet]  // Only mainnet for capital
    : [arbitrum, base, arbitrumSepolia];  // ARB, BASE, and Testnet for subnet
  
  const requiredChainId = isCapitalRoute 
    ? mainnet.id 
    : undefined;  // No required chain for subnet
    
  return {
    isCapitalRoute,
    isSubnetRoute,
    allowedNetworks,
    requiredChainId,
    shouldAutoSwitch: isCapitalRoute,
  };
};

