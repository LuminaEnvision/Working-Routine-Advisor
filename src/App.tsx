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
    // Call ready() as soon as possible, but after React has rendered
    // Use requestAnimationFrame to ensure DOM is ready
    const callReady = () => {
      signalAppReady().then((success) => {
        if (success) {
          console.log("✅ Farcaster Mini App is ready and splash screen dismissed");
        } else {
          console.warn("⚠️ Failed to signal Farcaster app ready - will retry...");
          // Retry after a short delay if first attempt failed
          setTimeout(() => {
            signalAppReady().then((retrySuccess) => {
              if (retrySuccess) {
                console.log("✅ Farcaster Mini App ready on retry");
              } else {
                console.error("❌ Failed to signal Farcaster app ready after retry");
              }
            });
          }, 500);
        }
      });
    };

    // Try immediately (React should be ready)
    callReady();
    
    // Also try after a small delay as backup
    const timer = setTimeout(callReady, 50);

    return () => clearTimeout(timer);
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

