import {
  arbitrum,
  base,
  mainnet,
  arbitrumSepolia,
  sepolia,
} from "wagmi/chains";
import {
  ChainConfig,
  NetworkEnvironment,
} from "staking-dashboard/@types/common";
import { mainnetRpcUrls } from "./configs/constants";
import { ensureStringArray, toContract } from "./helpers";

// Mainnets Configuration
export const mainnetChains: Record<string, ChainConfig> = {
  mainnet: {
    ...mainnet,
    rpcUrls: {
      default: {
        http: mainnetRpcUrls,
      },
      public: {
        http: mainnetRpcUrls,
      },
    },
    contracts: {
      // Legacy V1 contracts
      erc1967Proxy: toContract("0x47176B2Af9885dC6C4575d4eFd63895f7Aaa4790"),
      stETH: toContract("0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84"),
      layerZeroEndpoint: toContract(
        "0x66A71Dcef29A0fFBDBE3c6a460a3B5BC225Cd675"
      ),
      l1Factory: toContract("0x969C0F87623dc33010b4069Fea48316Ba2e45382"),

      // V2 Contracts (Newly Deployed)
      stETHDepositPool: toContract(
        "0x47176B2Af9885dC6C4575d4eFd63895f7Aaa4790"
      ),
      // V2 Mainnet Deposit Pools
      usdcDepositPool: toContract("0x6cCE082851Add4c535352f596662521B4De4750E"),
      usdtDepositPool: toContract("0x3B51989212BEdaB926794D6bf8e9E991218cf116"),
      wbtcDepositPool: toContract("0xdE283F8309Fd1AA46c95d299f6B8310716277A42"),
      wethDepositPool: toContract("0x9380d72aBbD6e0Cc45095A2Ef8c2CA87d77Cb384"),
      distributorV2: toContract("0xDf1AC1AC255d91F5f4B1E3B4Aef57c5350F64C7A"),
      rewardPoolV2: toContract("0xb7994dE339AEe515C9b2792831CD83f3C9D8df87"),
      l1SenderV2: toContract("0x2Efd4430489e1a05A89c2f51811aC661B7E5FF84"),
      lockMultiplierMath: toContract(
        "0x345b8b23c38f70f1d77560c60493bb583f012cb0"
      ),
    },
    isL1: true,
    layerZeroEndpointId: 101,
  },
  arbitrum: {
    ...arbitrum,
    rpcUrls: {
      default: {
        http: ["https://arbitrum-one.publicnode.com"],
      },
      public: {
        http: ["https://arbitrum-one.publicnode.com"],
      },
    },
    contracts: {
      morToken: toContract("0x092baadb7def4c3981454dd9c0a0d7ff07bcfc86"),
      l2Factory: toContract("0x890bfa255e6ee8db5c67ab32dc600b14ebc4546c"),
      subnetFactory: toContract("0x37b94bd80b6012fb214bb6790b31a5c40d6eb7a5"),
      builders: toContract("0xc0ed68f163d44b6e9985f0041fdf6f67c6bcff3f"),
    },
    isL2: true,
    layerZeroEndpointId: 110,
  },
  base: {
    ...base,
    rpcUrls: {
      default: {
        http: ensureStringArray(base.rpcUrls.default.http),
      },
      public: {
        http: ensureStringArray(base.rpcUrls.default.http),
      },
    },
    contracts: {
      morToken: toContract("0x7431ada8a591c955a994a21710752ef9b882b8e3"),
      builders: toContract("0x42bb446eae6dca7723a9ebdb81ea88afe77ef4b9"),
    },
  },
};

// Testnets Configuration
export const testnetChains: Record<string, ChainConfig> = {
  sepolia: {
    ...sepolia,
    rpcUrls: {
      default: {
        http: ensureStringArray(sepolia.rpcUrls.default.http),
      },
      public: {
        http: ensureStringArray(sepolia.rpcUrls.default.http),
      },
    },
    contracts: {
      // Existing V1 contracts
      erc1967Proxy: toContract("0x7c46d6bebf3dcd902eb431054e59908a02aba524"),
      stETH: toContract("0xa878ad6ff38d6fae81fbb048384ce91979d448da"), // Lowercase to avoid checksum validation issues
      layerZeroEndpoint: toContract(
        "0xae92d5aD7583AD66E49A0c67BAd18F6ba52dDDc1"
      ),
      l1Factory: toContract("0xB791b1B02A8f7A32f370200c05EeeE12B9Bba10A"),

      // V2 Contracts (Proxies)
      stETHDepositPool: toContract(
        "0xFea33A23F97d785236F22693eDca564782ae98d0"
      ),
      linkDepositPool: toContract("0x7f4f17be21219D7DA4C8E0d0B9be6a778354E5A5"),
      distributorV2: toContract("0x65b8676392432B1cBac1BE4792a5867A8CA2f375"),
      rewardPoolV2: toContract("0xbFDbe9c7E6c8bBda228c6314E24E9043faeEfB32"),
      l1SenderV2: toContract("0x85e398705d7D77F1703b61DD422869A67B3B409d"),
      linkToken: toContract("0xf8Fb3713D459D7C1018BD0A49D19b4C44290EBE5"),
      lockMultiplierMath: toContract(
        "0x345b8b23c38f70f1d77560c60493bb583f012cb0"
      ),
    },
    isL1: true,
    layerZeroEndpointId: 10161,
  },
  arbitrumSepolia: {
    ...arbitrumSepolia,
    rpcUrls: {
      default: {
        http: ["https://sepolia-rollup.arbitrum.io/rpc"],
      },
      public: {
        http: ["https://sepolia-rollup.arbitrum.io/rpc"],
      },
    },
    contracts: {
      morToken: toContract("0x34a285A1B1C166420Df5b6630132542923B5b27E"),
      l2Factory: toContract("0x3199555a4552848D522cf3D04bb1fE4C512a5d3B"),
      subnetFactory: toContract("0xa41178368f393a224b990779baa9b5855759d45d"),
      builders: toContract("0x5271b2fe76303ca7ddcb8fb6fa77906e2b4f03c7"),
    },
    isL2: true,
    layerZeroEndpointId: 10231,
  },
};

// Get a specific chain by id
export const getChainById = (
  chainId: number,
  environment: NetworkEnvironment
) => {
  const chains = environment === "mainnet" ? mainnetChains : testnetChains;
  return Object.values(chains).find((chain) => chain.id === chainId);
};

// Get all chains for an environment
export const getChains = (environment: NetworkEnvironment) => {
  return environment === "mainnet"
    ? Object.values(mainnetChains)
    : Object.values(testnetChains);
};

// Get all L1 chains
export const getL1Chains = (environment: NetworkEnvironment) => {
  const chains = environment === "mainnet" ? mainnetChains : testnetChains;
  return Object.values(chains).filter((chain) => chain.isL1);
};

// Get all L2 chains
export const getL2Chains = (environment: NetworkEnvironment) => {
  const chains = environment === "mainnet" ? mainnetChains : testnetChains;
  return Object.values(chains).filter((chain) => chain.isL2);
};
