import { useAccount } from "wagmi";
import { Card, CardContent, CardHeader, CardDescription, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { WalletConnect } from "@/components/WalletConnect";
import { useInsightsPayment } from "@/hooks/use-InsightsPayment";
import { useChainManager } from "@/hooks/useChainManager";
import { useCheckIns } from "@/contexts/CheckInContext";
import { celo } from "wagmi/chains";

const Profile = () => {
  const { address, isConnected, chainId } = useAccount();
  const { checkIns } = useCheckIns();
  const { status, refetchStatus } = useInsightsPayment(checkIns.length);
  const { isOnCorrectChain, chainId: detectedChainId, ensureCorrectChain } = useChainManager();
  
  // Refetch check-in count when component mounts or address changes
  useEffect(() => {
    if (isConnected && address) {
      refetchStatus();
    }
  }, [isConnected, address, refetchStatus]);

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
              {isConnected && (
                <div className="mt-2 space-y-1">
                  <p className="text-xs text-muted-foreground">Network</p>
                  <div className="flex items-center gap-2">
                    <Badge variant={isOnCorrectChain ? "default" : "destructive"}>
                      {chainId || detectedChainId 
                        ? `Chain ID: ${chainId || detectedChainId}` 
                        : "Chain not detected"}
                    </Badge>
                    {isOnCorrectChain && (
                      <Badge variant="outline" className="text-xs">
                        {celo.name}
                      </Badge>
                    )}
                    {!isOnCorrectChain && chainId && (
                      <Badge variant="destructive" className="text-xs">
                        Wrong Network
                      </Badge>
                    )}
                  </div>
                  {!isOnCorrectChain && chainId && (
                    <Button
                      onClick={ensureCorrectChain}
                      size="sm"
                      variant="default"
                      className="mt-2 w-full"
                    >
                      Switch to Celo
                    </Button>
                  )}
                </div>
              )}
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
