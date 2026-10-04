"use client";

import { createContext, use, useCallback, useState, type ReactNode } from "react";
import Toast from "react-bootstrap/Toast";
import { CheckCircleFill } from "react-bootstrap-icons";

type Notify = (message: string) => void;

const ToastContext = createContext<Notify>(() => {});

let toastSequence = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<{ id: number; message: string }[]>([]);

  const notify = useCallback((message: string) => {
    toastSequence += 1;
    const id = toastSequence;
    setToasts((list) => [...list.slice(-2), { id, message }]);
  }, []);

  const dismiss = (id: number) => setToasts((list) => list.filter((toast) => toast.id !== id));

  return (
    <ToastContext value={notify}>
      {children}
      <div className="toast-stack" aria-live="polite">
        {toasts.map((toast) => (
          <Toast key={toast.id} onClose={() => dismiss(toast.id)} autohide delay={2500} className="app-toast">
            <Toast.Body>
              <CheckCircleFill aria-hidden /> {toast.message}
            </Toast.Body>
          </Toast>
        ))}
      </div>
    </ToastContext>
  );
}

export function useToast(): Notify {
  return use(ToastContext);
}
