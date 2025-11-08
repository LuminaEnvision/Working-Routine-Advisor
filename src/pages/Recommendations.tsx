import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { WalletConnect } from "@/components/WalletConnect";
import { useInsightsPayment } from "@/hooks/use-InsightsPayment";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Lightbulb, Calendar, TestTube } from "lucide-react";
import { toast } from "sonner";

interface CheckInData {
  answers: Record<string, string>;
  timestamp: string;
  ipfsHash?: string;
}

const Recommendations = () => {
  const { address, isConnected } = useAccount();
  const { status } = useInsightsPayment();
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

  // Add mock data for testing (only in development)
  const addMockData = () => {
    const mockCheckIns: CheckInData[] = [
      {
        answers: {
          focusSessions: "4-5",
          exercise: "Moderate (30-45 min)",
          meals: "Balanced meals",
          distractions: "Emails",
          energy: "High",
          satisfaction: "4 - Very"
        },
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        answers: {
          focusSessions: "2-3",
          exercise: "Light walk (10-20 min)",
          meals: "Some healthy choices",
          distractions: "Social media",
          energy: "Moderate",
          satisfaction: "3 - Moderately"
        },
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        answers: {
          focusSessions: "6+",
          exercise: "Intense workout (60+ min)",
          meals: "Very nutritious",
          distractions: "None",
          energy: "Very high",
          satisfaction: "5 - Extremely"
        },
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ];
    
    localStorage.setItem('checkIns', JSON.stringify(mockCheckIns));
    setCheckIns(mockCheckIns);
    toast.success('Mock check-in data added! You can now see the insights page.');
  };

  return (
    <div className="space-y-6 py-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
          <Lightbulb className="w-8 h-8 text-accent" />
          Your Insights
        </h1>
        <p className="text-muted-foreground">
          View your check-in history and track your progress
        </p>
      </div>

      {!isConnected && (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle>Connect Wallet</CardTitle>
            <CardDescription>
              Connect your wallet to view your check-in history.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <WalletConnect />
          </CardContent>
        </Card>
      )}

      {isConnected && (
        <div className="space-y-4">
          {/* Test Mode - Only show if no check-ins */}
          {checkIns.length === 0 && import.meta.env.DEV && (
            <Card className="border-dashed border-primary/30 bg-primary/5">
              <CardHeader>
                <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                  <TestTube className="w-5 h-5 text-primary" />
                  Test Mode
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Add mock check-in data to preview the insights page
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={addMockData}
                  variant="outline"
                  className="w-full"
                  size="sm"
                >
                  Add Mock Check-in Data
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Stats Card */}
          <Card className="border border-border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                <Calendar className="w-5 h-5 text-accent" />
                Your Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm text-muted-foreground">Total Check-ins</span>
                <Badge variant="secondary" className="text-xs">
                  {checkIns.length}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm text-muted-foreground">Check-in Count</span>
                <Badge variant="secondary" className="text-xs">
                  {status.checkinCount}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm text-muted-foreground">Next Reward</span>
                <Badge variant="secondary" className="text-xs">
                  {status.checkinsUntilReward} check-ins away
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Check-in History */}
          {checkIns.length > 0 ? (
            <div className="space-y-3">
              <h2 className="text-lg font-semibold">Recent Check-ins</h2>
              {checkIns.slice(-5).reverse().map((checkIn, index) => (
                <Card key={index} className="border border-border shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm sm:text-base">
                      {new Date(checkIn.timestamp).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </CardTitle>
                    <CardDescription className="text-xs">
                      {new Date(checkIn.timestamp).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-xs sm:text-sm">
                      {Object.entries(checkIn.answers).map(([key, value]) => (
                        <div key={key} className="flex justify-between">
                          <span className="text-muted-foreground capitalize">
                            {key.replace(/([A-Z])/g, ' $1').trim()}:
                          </span>
                          <span className="font-medium">{value}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-dashed border-border">
              <CardHeader>
                <CardTitle className="text-sm sm:text-base">No Check-ins Yet</CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Complete your first check-in to start tracking your progress.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link to="/daily-checkin">
                  <Button className="w-full bg-gradient-celo hover:opacity-90" size="lg">
                    Start Daily Check-in
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

export default Recommendations;
