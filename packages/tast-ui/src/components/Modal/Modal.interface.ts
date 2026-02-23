import { ReactNode } from 'react';

export interface ModalProps {
  /** Whether the dialog is visible */
  open: boolean;
  /** Callback invoked when the user requests closure */
  onClose: () => void;
  /** Optional title rendered in the dialog header */
  title?: string | undefined;
  children: ReactNode;
  className?: string | undefined;
}
