import { useState, useEffect, useMemo } from "react";
import { Calendar, CheckCircle2, TrendingUp, Zap, Gift, Wallet, Zap as Lightning, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Link, useNavigate } from "react-router-dom";
import { useInsightsPayment } from "@/hooks/use-InsightsPayment";
import { useAccount } from "wagmi";
import { ChooseWalletDialog } from "@/components/ChooseWalletDialog";

interface CheckInData {
  answers: Record<string, string>;
  timestamp: string;
  ipfsHash?: string;
}

const Index = () => {
  const { isConnected } = useAccount();
  const { status } = useInsightsPayment();
  const navigate = useNavigate();
  const [walletDialogOpen, setWalletDialogOpen] = useState(false);
  const [checkIns, setCheckIns] = useState<CheckInData[]>([]);

  // Load check-in history from localStorage
  useEffect(() => {
    if (isConnected) {
      try {
        const stored = localStorage.getItem('checkIns');
        if (stored) {
          const parsed = JSON.parse(stored);
          setCheckIns(parsed);
        }
      } catch (error) {
        console.error('Failed to load check-ins:', error);
      }
    }
  }, [isConnected]);

  // Calculate stats from actual check-in data
  const stats = useMemo(() => {
    if (checkIns.length === 0) {
      return {
        streak: 0,
        totalCheckIns: 0,
        weeklyProgress: 0,
      };
    }

    // Calculate streak (consecutive days with check-ins)
    let streak = 0;
    const sortedCheckIns = [...checkIns].sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let currentDate = new Date(today);
    for (const checkIn of sortedCheckIns) {
      const checkInDate = new Date(checkIn.timestamp);
      checkInDate.setHours(0, 0, 0, 0);
      
      const daysDiff = Math.floor((currentDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff === streak) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else if (daysDiff > streak) {
        break;
      }
    }

    // Calculate weekly progress (check-ins in last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);
    
    const weeklyCheckIns = checkIns.filter(checkIn => {
      const checkInDate = new Date(checkIn.timestamp);
      return checkInDate >= sevenDaysAgo;
    });
    
    const weeklyProgress = Math.min(100, Math.round((weeklyCheckIns.length / 7) * 100));

    return {
      streak,
      totalCheckIns: checkIns.length,
      weeklyProgress,
    };
  }, [checkIns]);

  const currentStreak = stats.streak;
  const weeklyProgress = stats.weeklyProgress;

  // Calculate reward progress (0-100%)
  const rewardProgress = status.checkinCount > 0 
    ? ((status.checkinCount % 5) / 5) * 100 
    : 0;

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
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-celo flex items-center justify-center mx-auto shadow-lg">
                  <Brain className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
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
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-celo flex items-center justify-center mx-auto shadow-lg">
                  <CheckCircle2 className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
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

      {/* Reward Progress - Show for all connected users */}
      {isConnected && (
        <Card className="shadow-sm border border-border bg-card relative overflow-hidden">
          {/* Geometric accent */}
          <div className="absolute top-0 right-0 w-16 h-16 bg-accent/5 rounded-bl-full" />
          <CardHeader className="pb-2 relative z-10">
            <CardTitle className="text-sm sm:text-base flex items-center gap-2">
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-gradient-accent flex items-center justify-center">
                <Gift className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-accent-foreground" />
              </div>
              Reward Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 relative z-10">
            <div className="flex justify-between items-center text-xs sm:text-sm">
              <span className="text-muted-foreground">
                {status.checkinsUntilReward} check-in{status.checkinsUntilReward !== 1 ? 's' : ''} until 50 $INSIGHT
              </span>
              <Badge variant="secondary" className="text-xs">
                {status.checkinCount} total
              </Badge>
            </div>
            <Progress value={rewardProgress} className="h-2 bg-muted" />
            <p className="text-xs text-muted-foreground">
              Earn 50 $INSIGHT every 5 check-ins
            </p>
          </CardContent>
        </Card>
      )}

      {/* Stats Grid - Clean Minimal Design */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <Card className="shadow-sm hover:shadow-md transition-all border border-border bg-card relative overflow-hidden">
          {/* Geometric accent */}
          <div className="absolute top-0 right-0 w-6 h-6 bg-primary/5 rounded-bl-full" />
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-celo flex items-center justify-center">
                <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <span className="text-2xl sm:text-3xl font-bold text-primary">{currentStreak}</span>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-xs sm:text-sm text-muted-foreground">Streak</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm hover:shadow-md transition-all border border-border bg-card relative overflow-hidden">
          {/* Geometric accent */}
          <div className="absolute top-0 right-0 w-6 h-6 bg-accent/5 rounded-bl-full" />
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-accent flex items-center justify-center">
                <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-accent-foreground" />
              </div>
              <span className="text-2xl sm:text-3xl font-bold text-accent">{stats.totalCheckIns}</span>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-xs sm:text-sm text-muted-foreground">Check-ins</p>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Progress - Clean Minimal */}
      <Card className="shadow-sm border border-border bg-card relative overflow-hidden">
        {/* Geometric grid pattern */}
        <div className="absolute inset-0 opacity-[0.02] bg-[linear-gradient(90deg,transparent_0%,currentColor_50%,transparent_100%),linear-gradient(0deg,transparent_0%,currentColor_50%,transparent_100%)] bg-[length:20px_20px]" />
        <CardHeader className="pb-2 relative z-10">
          <CardTitle className="text-sm sm:text-base flex items-center gap-2">
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-gradient-celo flex items-center justify-center">
              <TrendingUp className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white" />
            </div>
            This Week
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 relative z-10">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-bold text-primary">{weeklyProgress}%</span>
          </div>
          <Progress value={weeklyProgress} className="h-2 bg-muted" />
        </CardContent>
      </Card>

      {/* Quick Actions - Clean Minimal */}
      <Link to="/recommendations">
        <Card className="p-3 sm:p-4 hover:shadow-md transition-all cursor-pointer border border-border bg-card relative overflow-hidden group">
          {/* Geometric accent on hover */}
          <div className="absolute top-0 right-0 w-12 h-12 bg-primary/0 group-hover:bg-primary/5 rounded-bl-full transition-colors" />
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gradient-celo flex items-center justify-center shadow-sm">
              <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-sm sm:text-base">View Insights</h4>
            </div>
          </div>
        </Card>
      </Link>
    </div>
  );
};

export default Index;
