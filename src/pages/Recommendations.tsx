import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { WalletConnect } from "@/components/WalletConnect";
import { useInsightsPayment } from "@/hooks/use-InsightsPayment";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Lightbulb, Calendar, TestTube, Loader2, Sparkles, Utensils, TrendingUp, Target } from "lucide-react";
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

  // Generate AI insights when check-ins change (for backward compatibility)
  useEffect(() => {
    if (checkIns.length > 0) {
      setIsLoadingInsights(true);
      setInsightsError(null);
      
      generateInsights(checkIns)
        .then((result) => {
          setInsights(result);
          setIsLoadingInsights(false);
          if (result) {
            setInsightsError(null);
          }
        })
        .catch((error) => {
          console.error('Failed to generate insights:', error);
          setInsightsError('Failed to generate insights. Please try again later.');
          setIsLoadingInsights(false);
        });
    } else {
      setInsights(null);
      setInsightsError(null);
    }
  }, [checkIns]);

  // Add mock data for testing (only in development)
  const addMockData = () => {
    toast.info('Mock data feature removed. Please complete a real check-in.');
  };

  const renderMeal = (meal: Meal | undefined, mealType: string) => {
    if (!meal) return null;

    return (
      <Card key={mealType} className="border border-border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm sm:text-base flex items-center gap-2">
            <Utensils className="w-5 h-5 text-primary" />
            {mealType.charAt(0).toUpperCase() + mealType.slice(1)}: {meal.name}
          </CardTitle>
          <CardDescription className="text-xs">
            Prep time: {meal.prepTime}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <h4 className="text-xs font-semibold mb-2">Ingredients:</h4>
            <ul className="text-xs sm:text-sm text-muted-foreground space-y-1">
              {meal.ingredients.map((ingredient, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>{ingredient}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-semibold mb-2">Steps:</h4>
            <ol className="text-xs sm:text-sm text-muted-foreground space-y-1">
              {meal.steps.map((step, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-primary font-semibold">{idx + 1}.</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>
          <div>
            <h4 className="text-xs font-semibold mb-2">Benefits:</h4>
            <p className="text-xs sm:text-sm text-muted-foreground">{meal.benefits}</p>
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
                        .map((rec, index) => (
                          <Card key={index} className="border border-border shadow-sm">
                            <CardHeader className="pb-2">
                              <div className="flex items-center justify-between">
                                <CardTitle className="text-xs sm:text-sm font-semibold">
                                  {rec.title}
                                </CardTitle>
                                <Badge variant="outline" className="text-xs">
                                  Priority {rec.priority}
                                </Badge>
                              </div>
                              <CardDescription className="text-xs capitalize">
                                {rec.category}
                              </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-2">
                              <p className="text-xs sm:text-sm text-muted-foreground">
                                <span className="font-semibold">Action: </span>
                                {rec.action}
                              </p>
                              <p className="text-xs sm:text-sm text-muted-foreground">
                                <span className="font-semibold">Why: </span>
                                {rec.why}
                              </p>
                            </CardContent>
                          </Card>
                        ))}
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
                    <div className="space-y-3">
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
                        <Badge key={index} variant="secondary" className="text-xs">
                          {metric}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Legacy AI Insights Card (for backward compatibility) */}
          {checkIns.length > 0 && !latestAnalysis && (
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
                {isLoadingInsights ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-primary mr-2" />
                    <span className="text-sm text-muted-foreground">Generating insights...</span>
                  </div>
                ) : insightsError ? (
                  <div className="text-sm text-muted-foreground text-center py-4">
                    {insightsError}
                  </div>
                ) : insights ? (
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
