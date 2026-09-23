"use client";

import { ToastProvider } from "@/components/ui/toast";
import { store } from "@/store";
import type { ReactNode } from "react";
import { Provider } from "react-redux";

export function StoreProvider({ children }: { children: ReactNode }) {
  return (
    <Provider store={store}>
      <ToastProvider>{children}</ToastProvider>
    </Provider>
  );
}
