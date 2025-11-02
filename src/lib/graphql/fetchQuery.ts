import { arbitrum, arbitrumSepolia, base, mainnet } from "viem/chains";

export const GRAPHQL_ENDPOINTS: Record<string, string> = {
  [base.id]:
    "https://subgraph.satsuma-prod.com/8675f21b07ed/9iqb9f4qcmhosiruyg763--465704/morpheus-mainnet-base/api",
  [arbitrum.id]:
    "https://api.studio.thegraph.com/query/73688/morpheus-mainnet-arbitrum/version/latest",
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
  console.log("chain", chain);
  console.log("GRAPHQL_ENDPOINTS[chain]------->", GRAPHQL_ENDPOINTS[chain]);
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
