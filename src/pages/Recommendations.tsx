import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { WalletConnect } from "@/components/WalletConnect";
import { useInsightsPayment } from "@/hooks/use-InsightsPayment";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Lightbulb, Calendar, TestTube, Loader2, Sparkles, Utensils, TrendingUp, Target, Lock } from "lucide-react";
import { toast } from "sonner";
import { generateInsights } from "@/lib/ai";
import { useCheckIns } from "@/contexts/CheckInContext";
import type { AnalysisResponse, Meal, CheckInData } from "@/lib/ai";

interface InsightResponse {
  insights: string[];
  summary: string;
  recommendations: string[];
}

const Recommendations = () => {
  const { address, isConnected } = useAccount();
  const { checkIns } = useCheckIns();
  const { status, refetchStatus } = useInsightsPayment(checkIns.length);
  const [insights, setInsights] = useState<InsightResponse | null>(null);
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);
  const [insightsError, setInsightsError] = useState<string | null>(null);
  const [insightsLoaded, setInsightsLoaded] = useState(false);
  const [showCooldownAfterInsights, setShowCooldownAfterInsights] = useState(false);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);

  // Loading messages to cycle through
  const loadingMessages = [
    "Analyzing your check-in responses...",
    "Consulting AI health coach...",
    "Generating personalized recommendations...",
    "Creating your meal plan...",
    "Almost there..."
  ];

  // Debug: Log check-ins to help diagnose issues
  useEffect(() => {
    console.log('Recommendations page - checkIns:', checkIns);
    console.log('Recommendations page - latestCheckIn:', checkIns.length > 0 ? checkIns[checkIns.length - 1] : null);
    console.log('Recommendations page - latestAnalysis:', checkIns.length > 0 ? checkIns[checkIns.length - 1]?.analysis : null);
  }, [checkIns]);

  // Refetch check-in count when check-ins change (after new check-in is saved)
  useEffect(() => {
    if (isConnected && checkIns.length > 0) {
      // Delay to ensure contract state has updated after transaction
      // Also refetch periodically to catch any updates
      const timer1 = setTimeout(() => {
        refetchStatus();
      }, 3000);

      const timer2 = setTimeout(() => {
        refetchStatus();
      }, 5000);

      const timer3 = setTimeout(() => {
        refetchStatus();
      }, 10000);

      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);
      };
    }
  }, [checkIns.length, isConnected, refetchStatus]);

  // Also refetch when component mounts or address changes
  useEffect(() => {
    if (isConnected) {
      refetchStatus();
    }
  }, [isConnected, address, refetchStatus]);

  // Get the latest check-in's analysis
  const latestCheckIn = checkIns.length > 0 ? checkIns[checkIns.length - 1] : null;
  const latestAnalysis = latestCheckIn?.analysis;

  // Cycle through loading messages while insights are being generated
  useEffect(() => {
    if (isLoadingInsights) {
      const interval = setInterval(() => {
        setLoadingMessageIndex((prev) => (prev + 1) % loadingMessages.length);
      }, 2500); // Change message every 2.5 seconds

      return () => clearInterval(interval);
    } else {
      setLoadingMessageIndex(0); // Reset when not loading
    }
  }, [isLoadingInsights, loadingMessages.length]);

  // Generate AI insights when check-ins change (for backward compatibility)
  useEffect(() => {
    if (checkIns.length > 0) {
      setIsLoadingInsights(true);
      setInsightsError(null);
      setInsightsLoaded(false);
      setShowCooldownAfterInsights(false);

      generateInsights(checkIns)
        .then((result) => {
          setInsights(result);
          setIsLoadingInsights(false);
          setInsightsLoaded(true);
          if (result) {
            setInsightsError(null);
          }
          // Show cooldown immediately after insights are loaded (no delay)
          setShowCooldownAfterInsights(true);
        })
        .catch((error) => {
          console.error('❌ Failed to generate insights:', error);
          console.error('Error details:', {
            message: error?.message,
            stack: error?.stack,
            name: error?.name,
          });
          setInsightsError(`Failed to generate insights: ${error?.message || 'Unknown error'}. Please check your API keys in .env file.`);
          setIsLoadingInsights(false);
          setInsightsLoaded(true);
          // Show cooldown immediately after error (no delay)
          setShowCooldownAfterInsights(true);
        });
    } else {
      setInsights(null);
      setInsightsError(null);
      setInsightsLoaded(true);
      setShowCooldownAfterInsights(true);
    }
  }, [checkIns]);

  // Add mock data for testing (only in development)
  const addMockData = () => {
    toast.info('Mock data feature removed. Please complete a real check-in.');
  };

  const renderMeal = (meal: Meal | undefined, mealType: string) => {
    if (!meal) return null;

    // Use wide format images
    const mealImages: Record<string, string> = {
      breakfast: "/images/meal_breakfast_wide.png",
      lunch: "/images/meal_lunch_wide.png",
      dinner: "/images/meal_dinner_wide.png",
    };

    const imageSrc = mealImages[mealType];

    return (
      <Card key={mealType} className="border border-border shadow-sm overflow-hidden group">
        {/* Image Header */}
        <div className="h-32 sm:h-40 w-full overflow-hidden relative">
          <img
            src={imageSrc}
            alt={meal.name}
            className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-700"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
              (e.target as HTMLImageElement).parentElement!.style.display = 'none';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-4">
            <div className="w-full">
              <div className="flex justify-between items-end mb-1">
                <Badge className="bg-white/20 hover:bg-white/30 text-white border-none backdrop-blur-md capitalize">
                  {mealType}
                </Badge>
                <span className="text-xs font-medium text-white/90 bg-black/30 px-2 py-1 rounded-full backdrop-blur-sm flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  {meal.prepTime}
                </span>
              </div>
              <h3 className="text-white font-bold text-lg leading-tight text-shadow-sm line-clamp-1">
                {meal.name}
              </h3>
            </div>
          </div>
        </div>

        <CardContent className="p-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Ingredients */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1">
                <span className="w-1 h-4 bg-primary rounded-full"></span>
                Ingredients
              </h4>
              <ul className="text-xs sm:text-sm space-y-1.5">
                {meal.ingredients.slice(0, 5).map((ingredient, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-muted-foreground">
                    <span className="text-primary mt-1">•</span>
                    <span className="line-clamp-1">{ingredient}</span>
                  </li>
                ))}
                {meal.ingredients.length > 5 && (
                  <li className="text-xs text-muted-foreground italic pl-3">
                    + {meal.ingredients.length - 5} more...
                  </li>
                )}
              </ul>
            </div>

            {/* Steps */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1">
                <span className="w-1 h-4 bg-accent rounded-full"></span>
                Instructions
              </h4>
              <ol className="text-xs sm:text-sm space-y-2">
                {meal.steps.slice(0, 3).map((step, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-muted-foreground">
                    <span className="font-semibold text-foreground min-w-[12px]">{idx + 1}.</span>
                    <span className="line-clamp-2">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          {/* Benefits Footer */}
          <div className="pt-3 border-t border-border/50">
            <div className="flex gap-2 items-start">
              <div className="shrink-0 mt-0.5">
                <div className="w-5 h-5 rounded-full bg-green-500/10 flex items-center justify-center text-green-600">
                  <Utensils className="w-3 h-3" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                <span className="font-semibold text-foreground">Why this helps: </span>
                {meal.benefits}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
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
                <Badge variant="secondary">
                  <span className="text-xs">{status.checkinCount}</span>
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm text-muted-foreground">Next $INSIGHT Reward</span>
                <Badge variant="secondary">
                  <span className="text-xs">{status.checkinsUntilReward} check-ins away</span>
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Loading State - Show when insights are being generated after check-in */}
          {isLoadingInsights && !latestAnalysis && (
            <Card className="border-primary/20 bg-primary/5 animate-pulse-subtle">
              <CardContent className="pt-6 pb-6">
                <div className="flex flex-col items-center justify-center space-y-4 py-8">
                  <div className="relative">
                    <Loader2 className="w-10 h-10 animate-spin text-primary" />
                    <Sparkles className="w-4 h-4 text-accent absolute -top-1 -right-1 animate-pulse" />
                  </div>
                  <div className="text-center space-y-3">
                    <p className="text-sm font-medium text-foreground animate-fade-in">
                      {loadingMessages[loadingMessageIndex]}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      This may take up to 15 seconds...
                    </p>
                    <div className="flex justify-center gap-1 pt-2">
                      <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                      <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                      <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Latest Analysis from AI (New Format) */}
          {latestAnalysis && (
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  Latest Analysis
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Personalized analysis from your most recent check-in
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Assessment */}
                {latestAnalysis.assessment && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold">Overall Assessment</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                      {latestAnalysis.assessment}
                    </p>
                  </div>
                )}

                {/* Concerns */}
                {latestAnalysis.concerns && latestAnalysis.concerns.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold flex items-center gap-2">
                      <Target className="w-4 h-4 text-primary" />
                      Key Areas of Concern
                    </h3>
                    <ul className="space-y-2">
                      {latestAnalysis.concerns.map((concern, index) => (
                        <li key={index} className="text-xs sm:text-sm text-muted-foreground flex items-start gap-2">
                          <span className="text-destructive font-semibold">•</span>
                          <span>{concern}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Recommendations */}
                {latestAnalysis.recommendations && latestAnalysis.recommendations.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-primary" />
                      Actionable Recommendations
                    </h3>
                    <div className="space-y-3">
                      {latestAnalysis.recommendations
                        .sort((a, b) => a.priority - b.priority)
                        .map((rec, index) => {
                          // Map categories to images
                          const categoryImages: Record<string, string> = {
                            sleep: "/images/category_sleep_wide.png",
                            nutrition: "/images/category_nutrition_wide.png",
                            activity: "/images/category_activity_wide.png",
                            stress: "/images/category_stress_wide.png",
                            productivity: "/images/category_productivity_wide.png",
                          };

                          // Normalize category to lowercase for matching
                          const normalizedCategory = rec.category.toLowerCase();
                          // Simple matching logic - can be improved
                          let imageSrc = null;
                          if (normalizedCategory.includes('sleep')) imageSrc = categoryImages.sleep;
                          else if (normalizedCategory.includes('nutrition') || normalizedCategory.includes('food') || normalizedCategory.includes('diet')) imageSrc = categoryImages.nutrition;
                          else if (normalizedCategory.includes('activity') || normalizedCategory.includes('exercise') || normalizedCategory.includes('workout')) imageSrc = categoryImages.activity;
                          else if (normalizedCategory.includes('stress') || normalizedCategory.includes('mental')) imageSrc = categoryImages.stress;
                          else if (normalizedCategory.includes('productiv') || normalizedCategory.includes('work') || normalizedCategory.includes('focus')) imageSrc = categoryImages.productivity;

                          return (
                            <Card key={index} className="border border-border shadow-sm overflow-hidden group">
                              {imageSrc && (
                                <div className="h-32 sm:h-40 w-full overflow-hidden relative">
                                  <img
                                    src={imageSrc}
                                    alt={rec.category}
                                    className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-700"
                                    onError={(e) => {
                                      // Hide image if it fails to load
                                      (e.target as HTMLImageElement).style.display = 'none';
                                      (e.target as HTMLImageElement).parentElement!.style.display = 'none';
                                    }}
                                  />
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-4">
                                    <div className="w-full">
                                      <div className="flex justify-between items-end">
                                        <Badge className="bg-white/20 hover:bg-white/30 text-white border-none backdrop-blur-md mb-1">
                                          {rec.category}
                                        </Badge>
                                        <Badge variant={rec.priority === 1 ? "destructive" : "secondary"} className="shadow-sm">
                                          Priority {rec.priority}
                                        </Badge>
                                      </div>
                                      <h4 className="text-white font-bold text-lg leading-tight mt-1 text-shadow-sm">
                                        {rec.title}
                                      </h4>
                                    </div>
                                  </div>
                                </div>
                              )}
                              <CardContent className={imageSrc ? "pt-4 pb-4" : "pt-4 pb-4"}>
                                {!imageSrc && (
                                  <div className="flex items-center justify-between mb-2">
                                    <CardTitle className="text-sm sm:text-base font-semibold">
                                      {rec.title}
                                    </CardTitle>
                                    <div className="flex gap-2">
                                      <Badge variant="outline">
                                        {rec.category}
                                      </Badge>
                                      <Badge variant={rec.priority === 1 ? "destructive" : "secondary"}>
                                        Priority {rec.priority}
                                      </Badge>
                                    </div>
                                  </div>
                                )}
                                <div className="space-y-3">
                                  <div className="flex gap-3">
                                    <div className="shrink-0 mt-0.5">
                                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                        <TrendingUp className="w-3.5 h-3.5" />
                                      </div>
                                    </div>
                                    <div>
                                      <span className="text-xs font-semibold text-foreground uppercase tracking-wide">Action</span>
                                      <p className="text-sm text-muted-foreground mt-0.5">
                                        {rec.action}
                                      </p>
                                    </div>
                                  </div>

                                  <div className="flex gap-3">
                                    <div className="shrink-0 mt-0.5">
                                      <div className="w-6 h-6 rounded-full bg-accent/10 flex items-center justify-center text-accent">
                                        <Lightbulb className="w-3.5 h-3.5" />
                                      </div>
                                    </div>
                                    <div>
                                      <span className="text-xs font-semibold text-foreground uppercase tracking-wide">Why it helps</span>
                                      <p className="text-sm text-muted-foreground mt-0.5">
                                        {rec.why}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                    </div>
                  </div>
                )}

                {/* Meal Plan */}
                {latestAnalysis.mealPlan && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold flex items-center gap-2">
                      <Utensils className="w-4 h-4 text-primary" />
                      Personalized Meal Plan
                    </h3>
                    <div className="space-y-4">
                      {renderMeal(latestAnalysis.mealPlan.breakfast, 'breakfast')}
                      {renderMeal(latestAnalysis.mealPlan.lunch, 'lunch')}
                      {renderMeal(latestAnalysis.mealPlan.dinner, 'dinner')}
                    </div>
                  </div>
                )}

                {/* Quick Wins */}
                {latestAnalysis.quickWins && latestAnalysis.quickWins.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold">Quick Wins (Do Today)</h3>
                    <ul className="space-y-2">
                      {latestAnalysis.quickWins.map((win, index) => (
                        <li key={index} className="text-xs sm:text-sm text-muted-foreground flex items-start gap-2">
                          <span className="text-primary font-semibold">✓</span>
                          <span>{win}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Tracking Metrics */}
                {latestAnalysis.trackingMetrics && latestAnalysis.trackingMetrics.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold">Metrics to Track</h3>
                    <div className="flex flex-wrap gap-2">
                      {latestAnalysis.trackingMetrics.map((metric, index) => (
                        <Badge key={index} variant="secondary">
                          {metric}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Cooldown Message - Only show after insights are loaded */}
          {showCooldownAfterInsights && insightsLoaded && (status.isInCooldown || status.remainingCheckinsToday < 2) && (
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                  <Lock className="w-5 h-5 text-primary" />
                  Next Check-in Available
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Your cooldown period starts now
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {status.isInCooldown ? (
                  <div className="space-y-2">
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      {(() => {
                        const seconds = status.cooldownRemainingSeconds || 0;
                        const hours = Math.floor(seconds / 3600);
                        const minutes = Math.floor((seconds % 3600) / 60);
                        if (hours > 0 && minutes > 0) {
                          return <>You can check in again in <strong className="text-foreground">{hours}h {minutes}m</strong>.</>;
                        } else if (hours > 0) {
                          return <>You can check in again in <strong className="text-foreground">{hours} hour{hours !== 1 ? 's' : ''}</strong>.</>;
                        } else if (minutes > 0) {
                          return <>You can check in again in <strong className="text-foreground">{minutes} minute{minutes !== 1 ? 's' : ''}</strong>.</>;
                        } else {
                          return <>You can check in again in <strong className="text-foreground">{status.hoursUntilNextCheckin} hour{status.hoursUntilNextCheckin !== 1 ? 's' : ''}</strong>.</>;
                        }
                      })()}
                    </p>
                  </div>
                ) : status.remainingCheckinsToday === 0 ? (
                  <div className="space-y-2">
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      You've used all <strong className="text-foreground">2 check-ins</strong> available today.
                    </p>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      You can check in again <strong className="text-foreground">tomorrow</strong>.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      You have <strong className="text-foreground">{status.remainingCheckinsToday} check-in{status.remainingCheckinsToday !== 1 ? 's' : ''}</strong> remaining today.
                    </p>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Minimum <strong className="text-foreground">5 hours</strong> between check-ins.
                    </p>
                  </div>
                )}
                <div className="pt-2 border-t border-border/50">
                  <p className="text-xs text-muted-foreground">
                    📅 <strong>2 check-ins available daily</strong> • Minimum 5 hours between check-ins
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Error Message - Show if insights failed to load */}
          {insightsError && insightsLoaded && (
            <Card className="border-destructive/20 bg-destructive/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm sm:text-base flex items-center gap-2 text-destructive">
                  <Sparkles className="w-5 h-5" />
                  Insights Error
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Failed to generate AI insights
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {insightsError}
                </p>
                <p className="text-xs text-muted-foreground">
                  Please check that VITE_GEMINI_API_KEY is set in your .env file and that your Gemini API quota hasn't been exceeded.
                </p>
                <Button
                  onClick={() => {
                    setInsightsError(null);
                    setIsLoadingInsights(true);
                    generateInsights(checkIns)
                      .then((result) => {
                        setInsights(result);
                        setIsLoadingInsights(false);
                        setInsightsError(null);
                      })
                      .catch((error) => {
                        console.error('Retry failed:', error);
                        setInsightsError(`Failed: ${error?.message || 'Unknown error'}`);
                        setIsLoadingInsights(false);
                      });
                  }}
                  variant="outline"
                  size="sm"
                >
                  Retry
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Legacy AI Insights Card (for backward compatibility) */}
          {checkIns.length > 0 && !latestAnalysis && !isLoadingInsights && !insightsError && (
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  AI-Powered Insights
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Personalized analysis of your check-in patterns
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {insights ? (
                  <>
                    {insights.summary && (
                      <div className="space-y-2">
                        <h3 className="text-sm font-semibold">Summary</h3>
                        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                          {insights.summary}
                        </p>
                      </div>
                    )}

                    {insights.insights && insights.insights.length > 0 && (
                      <div className="space-y-2">
                        <h3 className="text-sm font-semibold">Key Insights</h3>
                        <ul className="space-y-2">
                          {insights.insights.map((insight, index) => (
                            <li key={index} className="text-xs sm:text-sm text-muted-foreground flex items-start gap-2">
                              <Lightbulb className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                              <span>{insight}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {insights.recommendations && insights.recommendations.length > 0 && (
                      <div className="space-y-2">
                        <h3 className="text-sm font-semibold">Recommendations</h3>
                        <ul className="space-y-2">
                          {insights.recommendations.map((recommendation, index) => (
                            <li key={index} className="text-xs sm:text-sm text-muted-foreground flex items-start gap-2">
                              <span className="text-primary font-semibold">•</span>
                              <span>{recommendation}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </>
                ) : null}
              </CardContent>
            </Card>
          )}

          {/* Check-in History */}
          {checkIns.length > 0 ? (
            <div className="space-y-3">
              <h2 className="text-lg font-semibold">Recent Check-ins</h2>
              {checkIns.slice(-4).reverse().map((checkIn, index) => (
                <Card key={index} className="border border-border shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm sm:text-base" suppressHydrationWarning>
                      {new Date(checkIn.timestamp).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </CardTitle>
                    <CardDescription className="text-xs" suppressHydrationWarning>
                      {new Date(checkIn.timestamp).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                      {checkIn.timeOfDay && ` • ${checkIn.timeOfDay}`}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-xs sm:text-sm">
                      {Object.entries(checkIn.answers).map(([key, value]) => (
                        <div key={key} className="flex justify-between">
                          <span className="text-muted-foreground capitalize">
                            {key.replace(/([A-Z])/g, ' $1').trim()}:
                          </span>
                          <span className="font-medium">{String(value)}</span>
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
                  Complete your first check-in to start tracking your progress. Once you have check-ins, you'll see personalized recommendations and insights here.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link to="/daily-checkin">
                  <Button className="w-full bg-gradient-celo hover:opacity-90" size="lg">
                    Start Daily Check-in
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-xs text-muted-foreground"
                  onClick={() => {
                    refetchStatus();
                    toast.success('Data refreshed');
                  }}
                >
                  Refresh Data
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

export default Recommendations;
