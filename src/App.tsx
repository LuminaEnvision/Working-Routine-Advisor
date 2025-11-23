import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Suspense, lazy, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiConfig } from "wagmi";
import { wagmiConfig } from "@/lib/wagmi-config";
import { FarcasterProvider } from "@/providers/FarcasterProvider";
import { CheckInProvider } from "@/contexts/CheckInContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { signalAppReady } from "@/lib/farcaster-miniapp";

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

const App = () => {
  // Signal to Farcaster that the app is ready to display
  // This must be called AFTER the app is fully loaded and mounted
  useEffect(() => {
    // Multiple attempts to call ready() - Base Build needs this
    const attemptReady = async (attempt: number) => {
      console.log(`🔄 Attempting ready() call (attempt ${attempt})...`);
      
      // First, try window.farcaster.sdk directly (Base Build)
      if (typeof window !== 'undefined' && window.farcaster?.sdk) {
        const sdk = window.farcaster.sdk;
        try {
          if (sdk.actions?.ready) {
            await sdk.actions.ready();
            console.log(`✅ ready() succeeded on attempt ${attempt} via sdk.actions.ready()`);
            return true;
          }
          if (sdk.ready) {
            await sdk.ready();
            console.log(`✅ ready() succeeded on attempt ${attempt} via sdk.ready()`);
            return true;
          }
        } catch (error) {
          console.error(`❌ ready() failed on attempt ${attempt}:`, error);
        }
      }

      // Fallback: use signalAppReady
      const success = await signalAppReady();
      if (success) {
        console.log(`✅ ready() succeeded on attempt ${attempt} via signalAppReady()`);
        return true;
      }
      
      return false;
    };

    // Try immediately
    attemptReady(1).then((success) => {
      if (!success) {
        // Retry after 200ms
        setTimeout(() => attemptReady(2), 200);
      }
    });

    // Also try after 500ms as final backup
    const finalTimer = setTimeout(() => {
      attemptReady(3);
    }, 500);

    return () => clearTimeout(finalTimer);
  }, []);

  return (
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
};

export default App;

