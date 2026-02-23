import { useRef, useEffect, type ReactElement } from 'react';
import { LuX } from 'react-icons/lu';
import clsx from 'clsx';

import type { ModalProps } from './Modal.interface';
import styles from './Modal.module.scss';

/**
 * Modal
 *
 * A native `<dialog>` modal dialog with backdrop.
 * Controlled via the `open` prop; fires `onClose` when the
 * user clicks outside or presses the close button.
 *
 * @example
 * <Modal open={isOpen} onClose={() => setIsOpen(false)} title="Confirm">
 *   <p>Are you sure?</p>
 * </Modal>
 */
export function Modal({
  open,
  onClose,
  title,
  children,
  className,
}: ModalProps): ReactElement {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open) {
      if (!dialog.open) dialog.showModal();
    } else {
      if (dialog.open) dialog.close();
    }
  }, [open]);

  // Close when the backdrop (the <dialog> element itself) is clicked
  function handleDialogClick(e: React.MouseEvent<HTMLDialogElement>) {
    if (e.target === e.currentTarget) onClose();
  }

  // Also sync with the native 'cancel' event triggered by Escape key
  function handleCancel(e: React.SyntheticEvent<HTMLDialogElement>) {
    e.preventDefault();
    onClose();
  }

  return (
    <dialog
      ref={dialogRef}
      className={clsx(styles.dialog, className)}
      onClick={handleDialogClick}
      onCancel={handleCancel}
      aria-modal="true"
      aria-label={title}
    >
      <div className={styles.panel}>
        {title && (
          <div className={styles.header}>
            <h2 className={styles.title}>{title}</h2>
            <button
              type="button"
              className={styles.closeBtn}
              aria-label="Close dialog"
              onClick={onClose}
            >
              <LuX aria-hidden="true" />
            </button>
          </div>
        )}
        <div className={styles.body}>{children}</div>
      </div>
    </dialog>
  );
}

Modal.displayName = 'Modal';
