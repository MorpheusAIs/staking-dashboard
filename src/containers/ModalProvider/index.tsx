"use client";
import { useState, createContext, useContext, useMemo } from "react";
import {
  ActiveModal,
  ModalActions,
  ModalProviderProps,
  ModalState,
} from "./type";

const ModalStateContext = createContext<ModalState | null>(null);
const ModalActionsContext = createContext<ModalActions | null>(null);

/**
 * ===========================
 * MAIN
 * ===========================
 */
export const ModalProvider: React.FC<ModalProviderProps> = (props) => {
  const { children } = props;

  // =============== HOOKS
  const [activeModal, setActiveModal] = useState<ActiveModal>(null);

  // =============== VARIABLES
  const actions = useMemo(() => {
    return {
      onHandleSetModal: (modal: ActiveModal) => {
        setActiveModal(modal);
      },
    };
  }, []);

  // =============== VIEWS
  return (
    <ModalStateContext.Provider value={{ activeModal }}>
      <ModalActionsContext.Provider value={actions}>
        {children}
      </ModalActionsContext.Provider>
    </ModalStateContext.Provider>
  );
};

export function useModalState() {
  const ctx = useContext(ModalStateContext);
  if (!ctx) throw new Error("useModalState must be used inside ModalProvider");
  return ctx;
}

export function useModalActions() {
  const ctx = useContext(ModalActionsContext);
  if (!ctx)
    throw new Error("useModalActions must be used inside ModalProvider");
  return ctx;
}

/**
 * ===========================
 * EXPORTS
 * ===========================
 */
export default ModalProvider;
