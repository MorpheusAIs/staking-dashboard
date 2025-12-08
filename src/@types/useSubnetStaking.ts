import { UseReadContractParameters } from "wagmi";

export type UseStakingProps = {
  subnetId?: `0x${string}`;
  networkChainId: number;
  onTxSuccess?: () => void;
  lockPeriodInSeconds?: number;
};

export type ConstructReadContractArgs = {
  address?: `0x${string}`;
  abi: any;
  functionName: string;
  enabled: boolean;
  retry?: number;
  args?: UseReadContractParameters["args"];
  staleTime?: number;
};
