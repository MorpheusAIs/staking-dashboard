import { PropsWithChildren } from "react";

export type ActiveModal =
  | "deposit"
  | "withdraw"
  | "stakeMorRewards"
  | "lockMorRewards"
  | "claimMorRewards"
  | null;

export type ModalProviderProps = PropsWithChildren;

export type ModalState = {
  activeModal: ActiveModal;
};

export type ModalActions = {
  onHandleSetModal: (modal: ActiveModal) => void;
};
