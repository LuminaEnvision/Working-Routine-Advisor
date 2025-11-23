import { useEffect, useMemo, useState } from "react";
import { useAccount } from "wagmi";
import { Card, CardContent, CardHeader, CardDescription, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useInsightsPayment } from "@/hooks/use-InsightsPayment";
import { useCheckIns } from "@/contexts/CheckInContext";
import { Calendar, TrendingUp, Gift, Zap, Coins } from "lucide-react";
import { INSIGHT_TOKEN_ADDRESS } from "@/lib/contractConfig";
import { formatUnits, erc20Abi } from "viem";
import { publicClient } from "@/lib/contract";

const Profile = () => {
  const { address, isConnected } = useAccount();
  const { checkIns } = useCheckIns();
  const { status, refetchStatus } = useInsightsPayment(checkIns.length);
  const [insightBalanceRaw, setInsightBalanceRaw] = useState<bigint | null>(null);
  const [isBalanceLoading, setIsBalanceLoading] = useState(false);
  
  // Refetch check-in count when component mounts or address changes
  useEffect(() => {
    if (isConnected && address) {
      refetchStatus();
    }
  }, [isConnected, address, refetchStatus]);

  // Calculate reward progress (0-100%)
  const rewardProgress = status.checkinCount > 0 
    ? ((status.checkinCount % 5) / 5) * 100 
    : 0;

  // Calculate streak (consecutive days with check-ins)
  const calculateStreak = () => {
    if (checkIns.length === 0) return 0;
    
    // Get unique days with check-ins
    const checkInDays = new Set<string>();
    checkIns.forEach(checkIn => {
      const date = new Date(checkIn.timestamp);
      date.setHours(0, 0, 0, 0);
      checkInDays.add(date.toISOString());
    });
    
    // Convert to sorted array of dates
    const sortedDays = Array.from(checkInDays)
      .map(iso => new Date(iso))
      .sort((a, b) => b.getTime() - a.getTime()); // Most recent first
    
    if (sortedDays.length === 0) return 0;
    
    // Start from today and count backwards
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let streak = 0;
    let currentDate = new Date(today);
    
    // Check if there's a check-in today
    const todayISO = currentDate.toISOString();
    if (sortedDays.some(day => day.toISOString() === todayISO)) {
      streak = 1;
      currentDate.setDate(currentDate.getDate() - 1);
    } else {
      // If no check-in today, check if there's one yesterday
      currentDate.setDate(currentDate.getDate() - 1);
      const yesterdayISO = currentDate.toISOString();
      if (sortedDays.some(day => day.toISOString() === yesterdayISO)) {
        streak = 1;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        // No check-in today or yesterday, streak is broken
        return 0;
      }
    }
    
    // Continue counting backwards for consecutive days
    while (true) {
      const dayISO = currentDate.toISOString();
      const hasCheckIn = sortedDays.some(day => day.toISOString() === dayISO);
      
      if (hasCheckIn) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break; // Streak broken
      }
    }
    
    return streak;
  };

  const streak = calculateStreak();

  // Calculate weekly progress (check-ins in last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  sevenDaysAgo.setHours(0, 0, 0, 0);
  
  const weeklyCheckIns = checkIns.filter(checkIn => {
    if (!checkIn || !checkIn.timestamp) return false;
    const checkInDate = new Date(checkIn.timestamp);
    checkInDate.setHours(0, 0, 0, 0); // Normalize to start of day for comparison
    return checkInDate >= sevenDaysAgo;
  });
  
  const weeklyProgress = Math.min(100, Math.round((weeklyCheckIns.length / 7) * 100));

  const formattedInsightBalance = useMemo(() => {
    if (!insightBalanceRaw) return "0";
    try {
      const value = Number(formatUnits(insightBalanceRaw, 18));
      if (Number.isNaN(value)) return "0";
      if (value >= 1) {
        return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
      }
      return value.toLocaleString(undefined, { maximumFractionDigits: 4 });
    } catch {
      return "0";
    }
  }, [insightBalanceRaw]);
  useEffect(() => {
    if (!isConnected || !address) {
      setInsightBalanceRaw(null);
      return;
    }

    let cancelled = false;
    const fetchBalance = async () => {
      setIsBalanceLoading(true);
      try {
        const balance = await publicClient.readContract({
          address: INSIGHT_TOKEN_ADDRESS,
          abi: erc20Abi,
          functionName: "balanceOf",
          args: [address],
        });
        if (!cancelled) {
          setInsightBalanceRaw(balance);
        }
      } catch (error) {
        console.error("Failed to fetch $INSIGHT balance:", error);
        if (!cancelled) {
          setInsightBalanceRaw(null);
        }
    } finally {
        if (!cancelled) {
          setIsBalanceLoading(false);
        }
      }
    };

    fetchBalance();
    const interval = setInterval(fetchBalance, 15000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [isConnected, address]);

  return (
    <div className="space-y-6 py-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Your Stats</h1>
        <p className="text-muted-foreground">
          Track your progress and achievements
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="shadow-sm hover:shadow-md transition-all border border-border bg-card relative overflow-hidden">
          <div className="absolute top-0 right-0 w-6 h-6 bg-primary/5 rounded-bl-full" />
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-celo flex items-center justify-center">
                <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <span className="text-2xl sm:text-3xl font-bold text-primary">{streak}</span>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-xs sm:text-sm text-muted-foreground">Day Streak</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm hover:shadow-md transition-all border border-border bg-card relative overflow-hidden">
          <div className="absolute top-0 right-0 w-6 h-6 bg-accent/5 rounded-bl-full" />
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-accent flex items-center justify-center">
                <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-accent-foreground" />
              </div>
              <span className="text-2xl sm:text-3xl font-bold text-accent">{status.checkinCount}</span>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-xs sm:text-sm text-muted-foreground">Total Check-ins</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm hover:shadow-md transition-all border border-border bg-card relative overflow-hidden">
          <div className="absolute top-0 right-0 w-6 h-6 bg-primary/5 rounded-bl-full" />
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-primary flex items-center justify-center">
                <Coins className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <span className="text-xl sm:text-2xl font-bold text-primary">
                {isBalanceLoading ? "…" : `${formattedInsightBalance}`}
              </span>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-xs sm:text-sm text-muted-foreground">My $INSIGHT Balance</p>
          </CardContent>
        </Card>
      </div>

      {/* Reward Progress */}
      <Card className="shadow-sm border border-border bg-card relative overflow-hidden">
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
            Earn 50 $INSIGHT tokens every 5 check-ins
          </p>
        </CardContent>
      </Card>

      {/* Weekly Progress */}
      <Card className="shadow-sm border border-border bg-card relative overflow-hidden">
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
          <p className="text-xs text-muted-foreground">
            {weeklyCheckIns.length} check-in{weeklyCheckIns.length !== 1 ? 's' : ''} in the last 7 days
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Profile;
