import { useState } from "react";
import { Zap as Lightning } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { useAccount } from "wagmi";
import { ChooseWalletDialog } from "@/components/ChooseWalletDialog";
import { Logo } from "@/components/Logo";

const Index = () => {
  const { isConnected } = useAccount();
  const navigate = useNavigate();
  const [walletDialogOpen, setWalletDialogOpen] = useState(false);

  const handleConnectWallet = () => {
    if (isConnected) {
      // Already connected, go to check-in
      navigate("/daily-checkin");
    } else {
      // Show wallet selection dialog
      setWalletDialogOpen(true);
    }
  };

  const handleWalletSelected = () => {
    // After wallet is connected, navigate to check-in
    navigate("/daily-checkin");
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Hero Section - Mobile First, Clean Design */}
      <div className="text-center space-y-2 py-4 sm:py-6 relative">
        {/* Geometric Decorative Elements */}
        <div className="absolute top-0 left-4 w-2 h-2 bg-primary/20 rounded-sm rotate-45" />
        <div className="absolute top-8 right-8 w-3 h-3 bg-accent/20 rounded-sm" />
        <div className="absolute bottom-0 left-1/2 w-1 h-1 bg-primary/30 rounded-full" />
        
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
          Working Routine Advisor
        </h1>
        <p className="text-muted-foreground text-xs sm:text-sm max-w-xs mx-auto">
          Track your daily habits and get AI-powered insights
        </p>
      </div>

      {/* Connect Wallet Hero - Like Degen Counter */}
      <Card className="border-2 border-primary/30 bg-card shadow-lg animate-slide-up overflow-hidden relative min-h-[400px] flex flex-col">
        {/* Geometric Decorative Elements */}
        <div className="absolute top-2 right-2 w-8 h-8 border-2 border-primary/20 rounded-sm rotate-45" />
        <div className="absolute bottom-2 left-2 w-4 h-4 bg-accent/10 rounded-sm" />
        
        <CardContent className="flex-1 flex flex-col items-center justify-center p-6 sm:p-8 relative z-10">
          {!isConnected ? (
            <>
              {/* Hero Content */}
              <div className="text-center space-y-4 mb-8">
                <div className="flex justify-center">
                  <Logo size="lg" />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold">Get Started</h2>
                <p className="text-sm sm:text-base text-muted-foreground max-w-sm">
                  Connect your wallet to start tracking your daily routine and receive personalized insights
                </p>
              </div>

              {/* Connect Wallet Button - Large and Prominent */}
              <Button
                onClick={handleConnectWallet}
                size="lg"
                className="w-full sm:w-auto min-w-[200px] bg-gradient-celo hover:opacity-90 shadow-lg h-14 sm:h-16 text-base sm:text-lg font-semibold transition-all flex items-center gap-2"
              >
                <Lightning className="w-5 h-5 sm:w-6 sm:h-6" />
                Connect Wallet
                <Lightning className="w-5 h-5 sm:w-6 sm:h-6" />
              </Button>
            </>
          ) : (
            <>
              {/* Connected State - Show Check-in Button */}
              <div className="text-center space-y-4 mb-8">
                <div className="flex justify-center">
                  <Logo size="lg" />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold">Ready to Check In</h2>
                <p className="text-sm sm:text-base text-muted-foreground max-w-sm">
                  Answer a few questions about your day to get personalized insights
                </p>
              </div>

              <Button
                onClick={() => navigate("/daily-checkin")}
                size="lg"
                className="w-full sm:w-auto min-w-[200px] bg-gradient-celo hover:opacity-90 shadow-lg h-14 sm:h-16 text-base sm:text-lg font-semibold transition-all"
              >
                Start Check-in
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Choose Wallet Dialog */}
      <ChooseWalletDialog
        open={walletDialogOpen}
        onOpenChange={setWalletDialogOpen}
        onWalletSelected={handleWalletSelected}
      />
    </div>
  );
};

export default Index;
