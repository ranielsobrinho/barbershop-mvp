import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

export type ToastType = "success" | "warning" | "error";

interface ToastMessage {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const styles: Record<ToastType, { icon: string; classes: string }> = {
  success: {
    icon: "✓",
    classes: "border-green-200 bg-green-50 text-green-900",
  },
  warning: {
    icon: "!",
    classes: "border-amber-200 bg-amber-50 text-amber-950",
  },
  error: { icon: "×", classes: "border-red-200 bg-red-50 text-red-900" },
};

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: ToastMessage;
  onDismiss: (id: number) => void;
}) {
  useEffect(() => {
    const timeout = window.setTimeout(() => onDismiss(toast.id), 6000);
    return () => window.clearTimeout(timeout);
  }, [onDismiss, toast.id]);

  const appearance = styles[toast.type];

  return (
    <div
      role={toast.type === "error" ? "alert" : "status"}
      className={`flex max-w-sm items-start gap-3 rounded-xl border px-4 py-3 shadow-lg ${appearance.classes}`}
    >
      <span
        aria-hidden="true"
        className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-current text-xs font-bold"
      >
        {appearance.icon}
      </span>
      <p className="flex-1 text-sm font-medium">{toast.message}</p>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        aria-label="Fechar notificação"
        className="-mr-1 -mt-1 rounded p-1 text-lg leading-none opacity-70 hover:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        ×
      </button>
    </div>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const nextId = useRef(0);

  const showToast = useCallback(
    (message: string, type: ToastType = "success") => {
      const id = ++nextId.current;
      setToasts((current) => [...current, { id, message, type }]);
    },
    [],
  );

  const dismissToast = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 top-4 z-[100] flex flex-col items-end gap-2 px-4 sm:left-auto sm:w-full sm:max-w-md"
        aria-live="polite"
        aria-relevant="additions"
      >
        {toasts.map((toast) => (
          <div className="pointer-events-auto w-full" key={toast.id}>
            <ToastItem toast={toast} onDismiss={dismissToast} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context)
    throw new Error("useToast deve ser usado dentro de ToastProvider");
  return context;
}
