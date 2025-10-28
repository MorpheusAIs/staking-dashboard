import {
  arbitrum,
  mainnet,
  base,
  arbitrumSepolia,
  sepolia,
} from "@reown/appkit/networks";

import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { CreateAppKit, createAppKit } from "@reown/appkit/react";
import { cookieStorage, createStorage } from "wagmi";

export const projectId = process.env.NEXT_PUBLIC_PROJECT_ID || "";

const metadata = {
  name: "Morpheus Dashboard",
  description: "Morpheus Dashboard",
  url: "https://morpheus.reown.com",
  icons: ["https://morpheus.reown.com/favicon.ico"],
};

const networks: CreateAppKit["networks"] = [
  mainnet,
  arbitrum,
  base,
  arbitrumSepolia,
  sepolia,
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
