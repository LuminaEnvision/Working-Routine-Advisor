import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Coffee, Lightbulb, Target, TrendingUp, Zap } from "lucide-react";

const Recommendations = () => {
  const checkIns = JSON.parse(localStorage.getItem("checkIns") || "[]");
  const hasEnoughData = checkIns.length >= 3;

  const recommendations = [
    {
      id: 1,
      title: "Optimize Your Morning Routine",
      description: "Based on your energy patterns, you're most productive between 9-11am. Schedule your most important tasks during this window.",
      category: "Schedule",
      icon: Clock,
      priority: "high",
    },
    {
      id: 2,
      title: "Take Regular Breaks",
      description: "You tend to work for 3+ hours without breaks. Try the Pomodoro technique: 25 minutes work, 5 minutes break.",
      category: "Wellness",
      icon: Coffee,
      priority: "medium",
    },
    {
      id: 3,
      title: "Reduce Context Switching",
      description: "Your productivity drops when checking emails frequently. Block specific times for email (e.g., 11am and 3pm only).",
      category: "Focus",
      icon: Target,
      priority: "high",
    },
    {
      id: 4,
      title: "Environment Enhancement",
      description: "Consider adding better lighting to your workspace. Natural light or a quality desk lamp can boost focus by 15%.",
      category: "Workspace",
      icon: Lightbulb,
      priority: "low",
    },
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-destructive/10 text-destructive border-destructive/20";
      case "medium":
        return "bg-accent/10 text-accent border-accent/20";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  if (!hasEnoughData) {
    return (
      <div className="space-y-6 py-8 animate-fade-in">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 rounded-full bg-gradient-primary mx-auto flex items-center justify-center">
            <TrendingUp className="w-10 h-10 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold">Building Your Profile</h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            Complete {3 - checkIns.length} more check-in{3 - checkIns.length !== 1 ? 's' : ''} to unlock 
            personalized recommendations based on your habits and patterns.
          </p>
        </div>

        <Card className="border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center">
                <Zap className="w-6 h-6 text-accent" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">Keep checking in daily</h3>
                <p className="text-sm text-muted-foreground">
                  The more data you provide, the better your insights will be
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 py-4 animate-fade-in">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Your Insights</h1>
        <p className="text-muted-foreground">
          Personalized recommendations based on {checkIns.length} check-ins
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-gradient-primary text-primary-foreground">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium opacity-90">Avg Productivity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">4.2/5</div>
            <p className="text-xs opacity-80 mt-1">↑ 12% this week</p>
          </CardContent>
        </Card>

        <Card className="bg-accent text-accent-foreground">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium opacity-90">Focus Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">5.8h</div>
            <p className="text-xs opacity-80 mt-1">Daily average</p>
          </CardContent>
        </Card>
      </div>

      {/* Recommendations List */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-accent" />
          Recommended Actions
        </h2>

        {recommendations.map((rec, index) => {
          const Icon = rec.icon;
          return (
            <Card 
              key={rec.id} 
              className="hover:border-primary/30 transition-colors shadow-sm animate-slide-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex gap-3 flex-1">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <CardTitle className="text-lg">{rec.title}</CardTitle>
                      <div className="flex gap-2">
                        <Badge variant="outline" className="text-xs">
                          {rec.category}
                        </Badge>
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${getPriorityColor(rec.priority)}`}
                        >
                          {rec.priority}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base leading-relaxed">
                  {rec.description}
                </CardDescription>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default Recommendations;
