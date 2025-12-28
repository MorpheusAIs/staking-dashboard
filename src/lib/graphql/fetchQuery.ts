import { arbitrum, arbitrumSepolia, base, mainnet } from "viem/chains";

export const GRAPHQL_ENDPOINTS: Record<string, string> = {
  // [base.id]:
  //   "https://subgraph.satsuma-prod.com/8675f21b07ed/9iqb9f4qcmhosiruyg763--465704/morpheus-mainnet-base/api",
  // [arbitrum.id]:
  //   "https://api.studio.thegraph.com/query/73688/morpheus-mainnet-arbitrum/version/latest",
  [mainnet.id]:
    "https://api.studio.thegraph.com/query/73688/morpheus-mainnet-v-2/version/latest",
  [base.id]:
    "https://api.goldsky.com/api/public/project_cmgzm6igw009l5np264iw7obk/subgraphs/morpheus-mainnet-base-compatible/v0.0.1/gn",
  [arbitrum.id]:
    "https://api.goldsky.com/api/public/project_cmgzm6igw009l5np264iw7obk/subgraphs/morpheus-mainnet-arbitrum-compatible/v0.0.1/gn",
  [arbitrumSepolia.id]:
    "https://subgraph.satsuma-prod.com/8675f21b07ed/9iqb9f4qcmhosiruyg763--465704/morpheus-arbitrum-sepolia/api",
};

export async function fetchQuery({
  query,
  variables,
  chain,
}: {
  query: string;
  variables?: Record<string, any>;
  chain: number;
}) {
  const response = await fetch(GRAPHQL_ENDPOINTS[chain], {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, variables }),
  });

  const json = await response.json();

  if (json.errors) {
    throw new Error(json.errors.map((e: any) => e.message).join("\n"));
  }

  return json.data;
}

export async function fetchWithCache(key: string, url: string, ttl = 60000) {
  const cached = localStorage.getItem(key);

  if (cached) {
    const parsed = JSON.parse(cached);
    if (Date.now() - parsed.timestamp < ttl) {
      return parsed.data;
    }
  }

  const response = await fetch(url);
  const data = await response.json();

  localStorage.setItem(key, JSON.stringify({ timestamp: Date.now(), data }));

  return data;
}
