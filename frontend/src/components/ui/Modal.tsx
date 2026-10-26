import { ReactNode, useEffect } from 'react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

export function Modal({ open, onClose, title, children }: ModalProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      const onEsc = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
      window.addEventListener('keydown', onEsc);
      return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', onEsc); };
    }
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div role="dialog" aria-modal="true" aria-labelledby={title ? 'modal-title' : undefined} className="relative bg-white w-full sm:max-w-lg max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl p-5 sm:p-6 shadow-xl animate-in">
        <div className="flex items-center justify-between mb-4">
          {title && <h2 id="modal-title" className="text-lg font-bold text-gray-900">{title}</h2>}
          <button onClick={onClose} aria-label="Fechar" className="text-gray-400 hover:text-gray-600 text-2xl leading-none p-1">×</button>
        </div>
        {children}
      </div>
    </div>
  );
}
