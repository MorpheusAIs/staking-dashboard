export type ExtractChainConfigArgs = {
  networkChainId: number;
  isTestnet: boolean;
  onError: (message: string) => void;
  onWarning: (message: string) => void;
};

export type ExtractChainConfigReturn = {
  builders: `0x${string}`;
  token: `0x${string}`;
};
