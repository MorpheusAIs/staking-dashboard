import { arbitrum } from "@reown/appkit/networks";
import { mainnet } from "viem/chains";

import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { CreateAppKit, createAppKit } from "@reown/appkit/react";
import { cookieStorage, createStorage } from "wagmi";
import { SUBNET_CONFIG } from "./subnet.config";

export const projectId = process.env.NEXT_PUBLIC_PROJECT_ID || "";

const metadata = {
  name: "Morpheus Dashboard",
  description: "Morpheus Dashboard",
  url: SUBNET_CONFIG.url,
  icons: [`${SUBNET_CONFIG.url}/favicon.ico`],
};

const networks: CreateAppKit["networks"] = [
  ...SUBNET_CONFIG.supportedNetwork,
  mainnet,
];

const wagmiAdapter = new WagmiAdapter({
  storage: createStorage({ storage: cookieStorage }),
  networks,
  projectId,
  ssr: true,
});

const modal = createAppKit({
  adapters: [wagmiAdapter],
  networks,
  projectId,
  metadata,
  defaultNetwork: arbitrum,
  enableWalletConnect: true,
  enableInjected: true,
  enableEIP6963: true,
  enableCoinbase: true,
  features: {
    analytics: false,
    email: false,
    socials: [],
    emailShowWallets: false,
  },
});

export { wagmiAdapter, networks, metadata, modal };
