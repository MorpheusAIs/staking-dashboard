import { Image } from "@chakra-ui/react";

export type EthereumIconProps = {
  size?: number;
};

/**
 * ===========================
 * MAIN
 * ===========================
 */
export const EthereumIcon: React.FC<EthereumIconProps> = ({ size = 24 }) => {
  return (
    <Image
      src="/icons/ethereum-eth-logo.svg"
      alt="Ethereum"
      height={`${size}px`}
    />
  );
};

/**
 * ===========================
 * EXPORTS
 * ===========================
 */
export default EthereumIcon;

