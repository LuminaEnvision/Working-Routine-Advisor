import { useAccount } from "wagmi";
import { Card, CardContent, CardHeader, CardDescription, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { WalletConnect } from "@/components/WalletConnect";
import { useInsightsPayment } from "@/hooks/use-InsightsPayment";

const Profile = () => {
  const { address, isConnected } = useAccount();
  const { status } = useInsightsPayment();

  return (
    <div className="space-y-6 py-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Profile</h1>
        <p className="text-muted-foreground">
          View your wallet and check-in statistics
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Wallet & Stats</CardTitle>
            <CardDescription>
              Your wallet connection and check-in statistics
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Connected wallet</p>
              <p className="font-mono text-sm break-all">
                {isConnected && address ? address : "Not connected"}
              </p>
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">
                  Total Check-ins
                </span>
                <Badge variant="secondary">
                  {status.checkinCount}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">
                  Next Reward
                </span>
                <Badge variant="secondary">
                  {status.checkinsUntilReward} check-ins away
                </Badge>
              </div>
            </div>

            <Separator />

            <WalletConnect />
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Rewards</CardTitle>
            <CardDescription>
              Track your $INSIGHT token rewards
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">
                  Check-in Count
                </span>
                <Badge variant="secondary">
                  {status.checkinCount}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">
                  Progress to Next Reward
                </span>
                <Badge variant="secondary">
                  {status.checkinCount % 5} / 5
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Earn 50 $INSIGHT tokens every 5 check-ins
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profile;
