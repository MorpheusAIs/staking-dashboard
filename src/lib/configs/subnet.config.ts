import { CHAIN_ID } from "./constants";

// @TODO uncomment
export const SUBNET_CONFIG = {
  subnetID:
    // Morpheus asia Subnet ID
    "0x2e1f02e96a22a2c1236ac84d59f9a1b7e33fc4971ed7b32a25b54980bbc0b311" as `0x${string}`,
  // Testnet MOR Subnet ID
  // "0xf3d24210a53e1859e496dd5650f88bc2f9350365c36cd1134da30bd613f6d873" as `0x${string}`,
  lockPeriodInSeconds: 30 * 24 * 60 * 60, // 30 days
  // lockPeriodInSeconds: 5 * 60, // 5 minutes
  minDeposit: 0.1,
  supportedNetwork: [
    // CHAIN_ID.ARBITRUM_SEPOLIA,
    CHAIN_ID.SEPOLIA,
    CHAIN_ID.ARBITRUM,
  ],
  referralAddress:
    "0xf3199e9E17c703fC8f6b226d5a3Ad25c5588a370" as `0x${string}`,
};
