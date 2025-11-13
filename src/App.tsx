import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Suspense, lazy } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiConfig } from "wagmi";
import { wagmiConfig } from "@/lib/wagmi-config";
import { FarcasterProvider } from "@/providers/FarcasterProvider";
import { CheckInProvider } from "@/contexts/CheckInContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

import Layout from "@/components/Layout";

const Index = lazy(() => import("@/pages/Index"));
const Onboarding = lazy(() => import("@/pages/Onboarding"));
const DailyCheckIn = lazy(() => import("@/pages/DailyCheckIn"));
const Recommendations = lazy(() => import("@/pages/Recommendations"));
const Profile = lazy(() => import("@/pages/Profile"));
const NotFound = lazy(() => import("@/pages/NotFound"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <ErrorBoundary>
    <WagmiConfig config={wagmiConfig}>
      <FarcasterProvider>
        <QueryClientProvider client={queryClient}>
          <CheckInProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter
                future={{
                  v7_startTransition: true,
                  v7_relativeSplatPath: true,
                }}
              >
                <Layout>
                  <Suspense
                    fallback={
                      <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
                        Loading…
                      </div>
                    }
                  >
                    <Routes>
                      <Route path="/" element={<Index />} />
                      <Route path="/onboarding" element={<Onboarding />} />
                      <Route path="/daily-checkin" element={<DailyCheckIn />} />
                      <Route path="/recommendations" element={<Recommendations />} />
                      <Route path="/profile" element={<Profile />} />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </Suspense>
                </Layout>
              </BrowserRouter>
            </TooltipProvider>
          </CheckInProvider>
        </QueryClientProvider>
      </FarcasterProvider>
    </WagmiConfig>
  </ErrorBoundary>
);

export default App;

