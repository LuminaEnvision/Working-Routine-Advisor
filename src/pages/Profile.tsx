import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Lock, Sparkles, User, Zap } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const Profile = () => {
  const [isPremium, setIsPremium] = useState(false);
  const checkIns = JSON.parse(localStorage.getItem("checkIns") || "[]");
  const currentStreak = 5;

  return (
    <div className="space-y-6 py-4 animate-fade-in">
      {/* Profile Header */}
      <div className="text-center space-y-4">
        <div className="w-20 h-20 rounded-full bg-gradient-primary mx-auto flex items-center justify-center">
          <User className="w-10 h-10 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Your Profile</h1>
          <p className="text-muted-foreground">Track your progress and manage your account</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-muted-foreground">Total Check-ins</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{checkIns.length}</div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-muted-foreground">Current Streak</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-accent">{currentStreak}</div>
            <p className="text-xs text-muted-foreground mt-1">days in a row 🔥</p>
          </CardContent>
        </Card>
      </div>

      {/* Premium Section */}
      <Card className={isPremium ? "border-accent/50 bg-accent/5" : "border-primary/20"}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                {isPremium ? (
                  <>
                    <Sparkles className="w-5 h-5 text-accent" />
                    Premium Member
                  </>
                ) : (
                  <>
                    <Lock className="w-5 h-5" />
                    Upgrade to Premium
                  </>
                )}
              </CardTitle>
              <CardDescription>
                {isPremium 
                  ? "Unlimited access to all features"
                  : "Unlock unlimited check-ins and advanced insights"}
              </CardDescription>
            </div>
            {isPremium && (
              <Badge className="bg-gradient-accent text-accent-foreground">
                Active
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isPremium ? (
            <>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-accent" />
                  <span>Unlimited daily check-ins</span>
                </li>
                <li className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-accent" />
                  <span>Advanced AI recommendations</span>
                </li>
                <li className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-accent" />
                  <span>Detailed productivity reports</span>
                </li>
                <li className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-accent" />
                  <span>Priority support</span>
                </li>
              </ul>

              <Dialog>
                <DialogTrigger asChild>
                  <Button className="w-full bg-gradient-accent h-12" size="lg">
                    Upgrade Now - Pay with CELO
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Premium Subscription</DialogTitle>
                    <DialogDescription>
                      Choose your payment option to unlock premium features
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <Card className="p-4 border-primary/20 hover:border-primary/50 transition-colors cursor-pointer">
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="font-semibold">Monthly</h4>
                          <p className="text-sm text-muted-foreground">Cancel anytime</p>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold">$9.99</div>
                          <div className="text-xs text-muted-foreground">per month</div>
                        </div>
                      </div>
                    </Card>

                    <Card className="p-4 border-accent/50 bg-accent/5 hover:border-accent transition-colors cursor-pointer">
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="font-semibold flex items-center gap-2">
                            Yearly
                            <Badge className="bg-gradient-accent text-accent-foreground">Save 20%</Badge>
                          </h4>
                          <p className="text-sm text-muted-foreground">Best value</p>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold">$95.88</div>
                          <div className="text-xs text-muted-foreground">per year</div>
                        </div>
                      </div>
                    </Card>

                    <Button 
                      className="w-full bg-gradient-primary h-12" 
                      size="lg"
                      onClick={() => setIsPremium(true)}
                    >
                      Connect Wallet & Pay
                    </Button>

                    <p className="text-xs text-center text-muted-foreground">
                      Payments processed securely via CELO blockchain
                    </p>
                  </div>
                </DialogContent>
              </Dialog>
            </>
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground">
                Your premium subscription is active. Thank you for your support!
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Account Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Account Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button variant="outline" className="w-full justify-start" size="lg">
            Connected via Farcaster
          </Button>
          <Button variant="outline" className="w-full justify-start" size="lg">
            Notification Preferences
          </Button>
          <Button variant="outline" className="w-full justify-start text-destructive hover:text-destructive" size="lg">
            Sign Out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Profile;
