import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User, Zap } from "lucide-react";
import { WalletConnect } from "@/components/WalletConnect";

const Profile = () => {
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

      {/* Wallet Connection */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle>CELO Wallet</CardTitle>
          <CardDescription>
            Connect your wallet to unlock insights with a small transaction fee
          </CardDescription>
        </CardHeader>
        <CardContent>
          <WalletConnect />
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
