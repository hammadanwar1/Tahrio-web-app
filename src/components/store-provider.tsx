'use client';

import { createContext, useCallback, useContext, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';

import { store, type StoreState } from '@/lib/store';

interface Toast {
  id: number;
  message: string;
  tone: 'info' | 'success' | 'danger';
  action?: { label: string; href: string };
}

const ToastContext = createContext<(t: Omit<Toast, 'id'>) => void>(() => {});

export function useStore(): StoreState {
  return useSyncExternalStore(store.subscribe, store.get, store.getServer);
}

export const useToast = () => useContext(ToastContext);

/** Global toast (Figma T1/T2 pill), 1.6s, bottom-centre. */
export function StoreProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<Toast | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const show = useCallback((t: Omit<Toast, 'id'>) => {
    clearTimeout(timer.current);
    setToast({ ...t, id: Date.now() });
    timer.current = setTimeout(() => setToast(null), 1600);
  }, []);

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4">
        {toast && (
          <div
            key={toast.id}
            className="pointer-events-auto flex items-center gap-2.5 rounded-[26px] bg-surface px-[18px] py-3 text-sm font-medium shadow-toast"
          >
            <span
              aria-hidden
              className={
                toast.tone === 'danger' ? 'text-danger' : toast.tone === 'success' ? 'text-success' : 'text-primary'
              }
            >
              ●
            </span>
            <span>{toast.message}</span>
            {toast.action && (
              <>
                <span aria-hidden className="h-4 w-px bg-muted/40" />
                <a href={toast.action.href} className="font-semibold text-primary">
                  {toast.action.label}
                </a>
              </>
            )}
          </div>
        )}
      </div>
    </ToastContext.Provider>
  );
}
