import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/hooks/use-auth";
import { SubscriptionProvider } from "@/hooks/use-subscription";
import { SubscriptionStatusProvider } from "@/hooks/use-subscription-status";
import { DietaryPreferencesProvider } from "@/hooks/use-dietary-preferences";
import { ThemeProvider } from "next-themes";
import App from "./App";
import "./index.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

const container = document.getElementById("root");
if (!container) {
  throw new Error("Root element not found");
}

const root = createRoot(container);
root.render(
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <AuthProvider>
        <SubscriptionProvider>
          <SubscriptionStatusProvider>
            <DietaryPreferencesProvider>
              <App />
              <Toaster />
            </DietaryPreferencesProvider>
          </SubscriptionStatusProvider>
        </SubscriptionProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);