"use client";
import { Button } from "@chakra-ui/react";
import { useAppKit } from "@reown/appkit/react";
import { MdOutlineWallet } from "react-icons/md";
import { useAccount } from "wagmi";

export type WalletConnectButtonProps = {
  enableAddress?: boolean;
};

/**
 * ===========================
 * MAIN
 * ===========================
 */
export const WalletConnectButton: React.FC<WalletConnectButtonProps> = (
  props
) => {
  const { enableAddress = true } = props;
  // =============== HOOKS
  const { open } = useAppKit();
  const { isConnected } = useAccount();

  console.log("isConnected", isConnected);

  // =============== STATE

  // =============== API

  // =============== EVENTS

  // =============== VARIABLES

  // =============== RENDER FUNCTIONS
  const renderButton = () => {
    if (!isConnected)
      return (
        <Button
          variant="solid"
          bgColor="primary"
          color="white"
          onClick={() => open()}
        >
          <MdOutlineWallet />
          Connect Wallet
        </Button>
      );
    if (isConnected && enableAddress) {
      return <appkit-account-button />;
    }

    return null;
  };

  // =============== VIEWS
  return renderButton();
};

/**
 * ===========================
 * EXPORTS
 * ===========================
 */
export default WalletConnectButton;
