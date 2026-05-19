'use client';

import { Dialog } from '@base-ui/react/dialog';

export type ModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  closeAriaLabel: string;
  size?: 'md' | 'lg';
  initialFocus?: React.RefObject<HTMLElement | null>;
  footer?: React.ReactNode;
  children: React.ReactNode;
};

// Agnostic, branded, responsive modal shell (bottom-sheet < md,
// centered ≥ md). Controlled via open/onOpenChange; the base-ui
// primitive owns focus-trap, scroll-lock, finalFocus and the
// Esc/backdrop dismiss path (all routed through onOpenChange).
// Same responsive pattern as the shipped location-modal-gate.
export function Modal({
  open,
  onOpenChange,
  title,
  description,
  closeAriaLabel,
  size = 'md',
  initialFocus,
  footer,
  children,
}: ModalProps) {
  const maxWidth = size === 'lg' ? 'md:max-w-2xl' : 'md:max-w-md';

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-[100] bg-black/50 transition-opacity duration-150 data-ending-style:opacity-0 data-starting-style:opacity-0 supports-backdrop-filter:backdrop-blur-xs" />
        <Dialog.Popup
          aria-modal="true"
          aria-label={title}
          initialFocus={initialFocus}
          className="group fixed inset-0 z-[100] flex items-end justify-center p-0 transition-opacity duration-200 data-ending-style:opacity-0 data-starting-style:opacity-0 md:items-center md:p-4"
        >
          <div
            className={`flex max-h-[90vh] w-full flex-col overflow-y-auto rounded-t-2xl bg-white p-6 shadow-xl transition-transform duration-200 group-data-[ending-style]:translate-y-full group-data-[starting-style]:translate-y-full md:rounded-2xl md:transition-none md:group-data-[ending-style]:translate-y-0 md:group-data-[starting-style]:translate-y-0 ${maxWidth}`}
          >
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              aria-label={closeAriaLabel}
              className="absolute right-3 top-3 text-2xl leading-none text-brand-text/60 transition-colors hover:text-brand-text"
            >
              ×
            </button>

            <h2 className="mb-1 pr-6 text-xl font-bold text-brand-text">
              {title}
            </h2>
            {description && (
              <p className="mb-5 text-sm text-brand-text/70">
                {description}
              </p>
            )}

            <div className="flex-1">{children}</div>

            {footer && <div className="mt-6">{footer}</div>}
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
