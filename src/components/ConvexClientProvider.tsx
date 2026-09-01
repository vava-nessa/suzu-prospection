"use client";

import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ConvexReactClient } from "convex/react";
import { ReactNode, useMemo } from "react";

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  const client = useMemo(() => {
    const url = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!url) return null as unknown as ConvexReactClient;
    return new ConvexReactClient(url);
  }, []);
  if (!client) return <>{children}</>;
  return <ConvexAuthProvider client={client}>{children}</ConvexAuthProvider>;
}
