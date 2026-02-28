"use client";

import { SessionProvider } from "next-auth/react";
import { AppSettingsProvider } from "@/lib/app-settings-context";
import type { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <AppSettingsProvider>{children}</AppSettingsProvider>
    </SessionProvider>
  );
}
