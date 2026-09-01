import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { ReactNode, useState } from "react";

function makeConvexClient() {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) return null;
  return new ConvexReactClient(url);
}

export function AppProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: { staleTime: 60 * 1000, retry: 1 },
    }
  }));
  const [convex] = useState(() => makeConvexClient());

  const content = (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  if (!convex) return content;
  return <ConvexProvider client={convex}>{content}</ConvexProvider>;
}
