import { Calendar, CheckCircle2, TrendingUp, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Link } from "react-router-dom";

const Index = () => {
  const currentStreak = 5;
  const weeklyProgress = 71;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Hero Section */}
      <div className="text-center space-y-4 py-8">
        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-primary bg-clip-text text-transparent">
          Good morning! 👋
        </h1>
        <p className="text-muted-foreground text-lg max-w-md mx-auto">
          Ready to make today productive? Let's check in and see how you're doing.
        </p>
      </div>

      {/* Daily Check-in CTA */}
      <Card className="border-primary/20 bg-gradient-primary shadow-lg animate-slide-up">
        <CardHeader className="pb-4">
          <CardTitle className="text-primary-foreground flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" />
            Today's Check-in
          </CardTitle>
          <CardDescription className="text-primary-foreground/80">
            3 minutes to track your progress
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link to="/daily-checkin">
            <Button 
              size="lg" 
              className="w-full bg-white text-primary hover:bg-white/90 shadow-md h-14 text-lg font-semibold"
            >
              Start Check-in
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <Zap className="w-5 h-5 text-accent" />
              <span className="text-2xl font-bold text-primary">{currentStreak}</span>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Day Streak</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <Calendar className="w-5 h-5 text-accent" />
              <span className="text-2xl font-bold text-primary">12</span>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Total Check-ins</p>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Progress */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-accent" />
            This Week
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Weekly Goal</span>
            <span className="font-semibold text-primary">{weeklyProgress}%</span>
          </div>
          <Progress value={weeklyProgress} className="h-3" />
          <p className="text-xs text-muted-foreground">
            5 out of 7 check-ins completed
          </p>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Quick Actions
        </h3>
        <div className="space-y-2">
          <Link to="/recommendations">
            <Card className="p-4 hover:border-primary/30 transition-colors cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-accent" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold">View Insights</h4>
                  <p className="text-sm text-muted-foreground">
                    Get personalized recommendations
                  </p>
                </div>
              </div>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Index;
