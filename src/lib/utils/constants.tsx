import { BsStack } from "react-icons/bs";
import { FaArrowTrendUp } from "react-icons/fa6";
import { FaTelegramPlane } from "react-icons/fa";
import { CiMail } from "react-icons/ci";
import { FaXTwitter } from "react-icons/fa6";
import { arbitrum, arbitrumSepolia, base, sepolia } from "wagmi/chains";

export const SideBarItems = [
  {
    id: 1,
    title: "Subnet",
    icon: <BsStack size={18} />,
    path: "/subnet",
  },
  {
    id: 2,
    title: "Capital",
    icon: <FaArrowTrendUp size={18} />,
    path: "/capital",
  },
];

export const SocialMediaLinks = [
  {
    id: 1,
    title: "Telegram",
    url: "",
    icon: <FaTelegramPlane size={22} />,
  },
  {
    id: 2,
    title: "Twitter",
    url: "",
    icon: <FaXTwitter size={22} />,
  },
  {
    id: 3,
    title: "Email",
    url: "",
    icon: <CiMail size={22} />,
  },
];

export const MOR_ABI = [
  {
    inputs: [{ internalType: "address", name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "from", type: "address" },
      { indexed: true, internalType: "address", name: "to", type: "address" },
      {
        indexed: false,
        internalType: "uint256",
        name: "value",
        type: "uint256",
      },
    ],
    name: "Transfer",
    type: "event",
  },
];

export const CHAIN_ID: Record<string, number> = {
  ARBITRUM: arbitrum.id,
  BASE: base.id,
  ARBITRUM_SEPOLIA: arbitrumSepolia.id,
  SEPOLIA: sepolia.id,
};

export const mainnetRpcUrls = [
  process.env.NEXT_PUBLIC_ALCHEMY_MAINNET_RPC_URL || "",
];

export const addresses = {
  BASE_BUILDERS: "0x42bb446eae6dca7723a9ebdb81ea88afe77ef4b9",
  BASE_MOR: "0x7431ada8a591c955a994a21710752ef9b882b8e3",
};

export const stakingErrorMap: {
  stakeError: { title: string; description: string };
  approveError: { title: string; description: string };
} = {
  stakeError: {
    title: "Contract reverted:",
    description:
      "Transaction would exceed gas limits. The contract function may be failing.",
  },
  approveError: {
    title: "Token approval reverted:",
    description:
      "Approval would exceed gas limits. The token contract may be non-standard.",
  },
};
