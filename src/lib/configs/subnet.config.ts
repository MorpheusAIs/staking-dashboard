import { arbitrum, arbitrumSepolia } from "viem/chains";
import { CreateAppKit } from "@reown/appkit";

export type SubnetConfig = {
  name: string;
  subnetID: `0x${string}`;
  lockPeriodInSeconds: number;
  minDeposit: number;
  supportedNetwork: CreateAppKit["networks"];
  referralAddress: `0x${string}`;
  description: string;
  socialMediaLinks?: Record<string, string>;
  url: string;
};

export const SUBNET_CONFIG: SubnetConfig = {
  name: "Morpheus Asia",
  subnetID:
    "0x2e1f02e96a22a2c1236ac84d59f9a1b7e33fc4971ed7b32a25b54980bbc0b311",
  lockPeriodInSeconds: 30 * 24 * 60 * 60,
  minDeposit: 0.1,
  supportedNetwork: [arbitrum],
  referralAddress: "0xf3199e9E17c703fC8f6b226d5a3Ad25c5588a370",
  description: "Morpheus community events and tools for Asia",
  socialMediaLinks: {
    telegram: "",
    x: "",
    email: "",
  },
  url: "",
};

export const TEST_SUBNET_CONFIG: SubnetConfig = {
  name: "Test Subnet",
  description: "A subnet for testing purposes",
  subnetID:
    "0xf3d24210a53e1859e496dd5650f88bc2f9350365c36cd1134da30bd613f6d873",
  lockPeriodInSeconds: 5 * 60,
  minDeposit: 0.1,
  supportedNetwork: [arbitrumSepolia],
  referralAddress: "0xf3199e9E17c703fC8f6b226d5a3Ad25c5588a370",
  url: "",
};
