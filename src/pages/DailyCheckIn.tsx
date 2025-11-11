import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Brain, ChevronRight, Loader2, Info, Lock } from "lucide-react";
import { toast } from "sonner";
import { useAccount } from "wagmi";
import { useInsightsPayment } from "@/hooks/use-InsightsPayment";
import { PaymentGate } from "@/components/PaymentGate";
import { Link, useNavigate } from "react-router-dom";
import { generateDailyQuestions, analyzeAndRecommend, type Question, type QuestionResponse, type CheckInData } from "@/lib/ai";
import { useCheckIns } from "@/contexts/CheckInContext";

const DailyCheckIn = () => {
  const { address, isConnected } = useAccount();
  const { checkIns, addCheckIn, getPreviousCheckIn, getHistoricalData } = useCheckIns();
  const { status, isLoading, checkCooldown } = useInsightsPayment(checkIns.length);
  const navigate = useNavigate();
  
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [responses, setResponses] = useState<Record<string, QuestionResponse>>({});
  const [showPaymentGate, setShowPaymentGate] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [canCheckIn, setCanCheckIn] = useState<boolean | null>(null);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(true);

  // Check if user can check in BEFORE loading questions
  useEffect(() => {
    const verifyCanCheckIn = async () => {
      if (!isConnected || !address || isLoading) {
        setIsCheckingAvailability(false);
        return;
      }

      setIsCheckingAvailability(true);
      try {
        const canCheck = await checkCooldown();
        console.log('Check-in availability check:', {
          canCheck,
          isInCooldown: status.isInCooldown,
          remainingCheckinsToday: status.remainingCheckinsToday,
          hoursUntilNextCheckin: status.hoursUntilNextCheckin
        });
        
        // If contract check says no, but status says yes, trust status (might be contract not deployed)
        // The contract will enforce the actual rules when submitting
        const canCheckBasedOnStatus = !status.isInCooldown && status.remainingCheckinsToday > 0;
        const finalCanCheck = canCheck || canCheckBasedOnStatus;
        
        console.log('Final check-in decision:', {
          contractCheck: canCheck,
          statusCheck: canCheckBasedOnStatus,
          finalDecision: finalCanCheck
        });
        
        setCanCheckIn(finalCanCheck);
        
        // Only load questions if user can check in
        if (finalCanCheck && questions.length === 0 && !isLoadingQuestions) {
          loadQuestions();
        }
      } catch (error) {
        console.error('Failed to check cooldown:', error);
        // On error, check status to make decision
        // If status shows they can check in, allow it (contract will enforce)
        const canCheckBasedOnStatus = !status.isInCooldown && status.remainingCheckinsToday > 0;
        console.log('Error checking cooldown, using status:', {
          canCheckBasedOnStatus,
          isInCooldown: status.isInCooldown,
          remainingCheckinsToday: status.remainingCheckinsToday
        });
        setCanCheckIn(canCheckBasedOnStatus);
        if (canCheckBasedOnStatus && questions.length === 0 && !isLoadingQuestions) {
          loadQuestions();
        }
      } finally {
        setIsCheckingAvailability(false);
      }
    };

    verifyCanCheckIn();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected, address, isLoading, checkCooldown]);

  const loadQuestions = async () => {
    setIsLoadingQuestions(true);
    try {
      const previousCheckIn = getPreviousCheckIn();
      const currentTime = new Date();
      const result = await generateDailyQuestions(address || 'user', currentTime, previousCheckIn);
      setQuestions(result.questions);
    } catch (error) {
      console.error('Failed to generate questions:', error);
      toast.error('Failed to load questions. Please try again.');
    } finally {
      setIsLoadingQuestions(false);
    }
  };

  const question = questions[currentQuestion];
  const progress = questions.length > 0 ? ((currentQuestion + 1) / questions.length) * 100 : 0;
  const isLastQuestion = currentQuestion === questions.length - 1;

  const handleAnswer = (optionValue: string) => {
    if (!question) return;
    
    const selectedOption = question.options.find(opt => opt.value === optionValue);
    if (!selectedOption) return;

    const response: QuestionResponse = {
      questionId: question.id,
      selectedOption: optionValue,
      score: selectedOption.score,
    };

    setResponses((prev) => ({
      ...prev,
      [question.id.toString()]: response,
    }));
  };

  const handleNext = async () => {
    if (!question) return;

    // Check if answer is selected
    if (!responses[question.id.toString()]) {
      toast.error("Please select an answer");
      return;
    }

    if (!isConnected || !address) {
      toast.error("Connect your wallet to submit the check-in");
      return;
    }

    if (isLastQuestion) {
      // Show payment gate instead of submitting immediately
      setShowPaymentGate(true);
    } else {
      setCurrentQuestion((q) => q + 1);
    }
  };

  const handlePaymentComplete = async () => {
    // After payment, analyze responses and save check-in
    setIsAnalyzing(true);
    setShowPaymentGate(false); // Hide payment gate to show analyzing state
    
    try {
      console.log('Starting analysis with responses:', responses);
      const historicalData = getHistoricalData(7);
      console.log('Historical data:', historicalData);
      
      const analysis = await analyzeAndRecommend(responses, historicalData);
      console.log('Analysis completed:', analysis);
      
      const currentTime = new Date();
      const hour = currentTime.getHours();
      const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';

      const checkInData: CheckInData = {
        answers: Object.fromEntries(
          Object.entries(responses).map(([key, response]: [string, QuestionResponse]) => [
            key,
            questions.find(q => q.id === response.questionId)?.options.find(opt => opt.value === response.selectedOption)?.text || response.selectedOption,
          ])
        ),
        timestamp: currentTime.toISOString(),
        questions,
        responses,
        analysis,
        timeOfDay,
      };

      console.log('Saving check-in data:', checkInData);
      addCheckIn(checkInData);
      console.log('Check-in saved successfully');
      
      // Reset state
      setCurrentQuestion(0);
      setResponses({});
      setQuestions([]);
      
      // Navigate to recommendations to see the analysis
      setTimeout(() => {
        navigate('/recommendations');
        toast.success('Check-in completed! View your personalized recommendations.');
      }, 500); // Small delay to ensure state is saved
    } catch (error) {
      console.error('Failed to analyze check-in:', error);
      toast.error('Check-in saved, but analysis failed. Please try again later.');
      setIsAnalyzing(false);
      
      // Still save the check-in without analysis
      const currentTime = new Date();
      const hour = currentTime.getHours();
      const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';

      const checkInData: CheckInData = {
        answers: Object.fromEntries(
          Object.entries(responses).map(([key, response]: [string, QuestionResponse]) => [
            key,
            questions.find(q => q.id === response.questionId)?.options.find(opt => opt.value === response.selectedOption)?.text || response.selectedOption,
          ])
        ),
        timestamp: currentTime.toISOString(),
        questions,
        responses,
        timeOfDay,
      };

      addCheckIn(checkInData);
      navigate('/recommendations');
    }
  };

  // Show payment gate if user completed questions
  if (showPaymentGate) {
    return (
      <PaymentGate
        checkInData={{
          answers: Object.fromEntries(
            Object.entries(responses).map(([key, response]: [string, QuestionResponse]) => [
              key,
              questions.find(q => q.id === response.questionId)?.options.find(opt => opt.value === response.selectedOption)?.text || response.selectedOption,
            ])
          ),
          timestamp: new Date().toISOString(),
        }}
        onPaymentComplete={handlePaymentComplete}
      />
    );
  }

  // If not connected, redirect to home to connect wallet
  if (!isConnected) {
    return (
      <div className="space-y-4 sm:space-y-6 py-4 animate-fade-in">
        <Card className="border border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">Wallet Not Connected</CardTitle>
            <CardDescription>
              Please connect your wallet to continue with the check-in.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link to="/">
              <Button className="w-full bg-gradient-celo hover:opacity-90">
                Go to Connect Wallet
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check if user can check in - show blocking message BEFORE questions
  if (isCheckingAvailability || isLoading) {
    return (
      <div className="space-y-4 sm:space-y-6 py-4 animate-fade-in">
        <Card className="border border-border shadow-sm">
          <CardContent className="pt-6 pb-6">
            <div className="flex flex-col items-center justify-center space-y-4 py-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">
                Checking check-in availability...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show blocking message if user can't check in
  // Prioritize canCheckIn from contract check, use status only for display
  if (canCheckIn === false) {
    // Determine which blocking message to show based on status
    const isInCooldown = status.isInCooldown;
    const noRemaining = status.remainingCheckinsToday === 0;
    
    return (
      <div className="space-y-4 sm:space-y-6 py-4 animate-fade-in">
        {isInCooldown ? (
          <Card className="border-warning shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Lock className="w-5 h-5 text-warning" />
                Check-in Cooldown
              </CardTitle>
              <CardDescription>
                Please wait before checking in again. Minimum 5 hours between check-ins.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertDescription>
                  {(() => {
                    const seconds = status.cooldownRemainingSeconds || 0;
                    const hours = Math.floor(seconds / 3600);
                    const minutes = Math.floor((seconds % 3600) / 60);
                    if (hours > 0 && minutes > 0) {
                      return <>You can check in again in <strong>{hours}h {minutes}m</strong>.</>;
                    } else if (hours > 0) {
                      return <>You can check in again in <strong>{hours} hour{hours !== 1 ? 's' : ''}</strong>.</>;
                    } else if (minutes > 0) {
                      return <>You can check in again in <strong>{minutes} minute{minutes !== 1 ? 's' : ''}</strong>.</>;
                    } else {
                      return <>You can check in again in <strong>{status.hoursUntilNextCheckin} hour{status.hoursUntilNextCheckin !== 1 ? 's' : ''}</strong>.</>;
                    }
                  })()}
                </AlertDescription>
              </Alert>
              <div className="text-sm text-muted-foreground">
                <p className="mb-2">📅 <strong>2 check-ins available daily</strong></p>
                <p>Remaining today: <strong>{status.remainingCheckinsToday} of 2</strong></p>
              </div>
              <Button
                onClick={() => navigate('/recommendations')}
                className="w-full"
                variant="outline"
              >
                View Previous Insights
              </Button>
            </CardContent>
          </Card>
        ) : noRemaining ? (
          <Card className="border-warning shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Lock className="w-5 h-5 text-warning" />
                Daily Limit Reached
              </CardTitle>
              <CardDescription>
                You've used all 2 check-ins available today.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertDescription>
                  You can check in again tomorrow. <strong>2 check-ins are available daily</strong>.
                </AlertDescription>
              </Alert>
              <Button
                onClick={() => navigate('/recommendations')}
                className="w-full"
                variant="outline"
              >
                View Previous Insights
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-warning shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Lock className="w-5 h-5 text-warning" />
                Cannot Check In
              </CardTitle>
              <CardDescription>
                You cannot check in at this time.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => navigate('/recommendations')}
                className="w-full"
                variant="outline"
              >
                View Previous Insights
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // Loading questions
  if (isLoadingQuestions || questions.length === 0) {
    return (
      <div className="space-y-4 sm:space-y-6 py-4 animate-fade-in">
        <Card className="border border-border shadow-sm">
          <CardContent className="pt-6 pb-6">
            <div className="flex flex-col items-center justify-center space-y-4 py-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">
                Generating personalized questions for you...
              </p>
            </div>
          </CardContent>
        </Card>
        <Alert className="border-primary/20 bg-primary/5">
          <Info className="h-4 w-4 text-primary" />
          <AlertDescription className="text-xs sm:text-sm">
            This may take a moment - don't go too far while we create your check-in questions! We promise to improve in the future.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Analyzing responses
  if (isAnalyzing) {
    return (
      <div className="space-y-4 sm:space-y-6 py-4 animate-fade-in">
        <Card className="border border-border shadow-sm">
          <CardContent className="pt-6 pb-6">
            <div className="flex flex-col items-center justify-center space-y-4 py-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">
                Analyzing your responses and generating recommendations...
              </p>
            </div>
          </CardContent>
        </Card>
        <Alert className="border-primary/20 bg-primary/5">
          <Info className="h-4 w-4 text-primary" />
          <AlertDescription className="text-xs sm:text-sm">
            This may take a moment - don't go too far while we analyze your answers! We promise to improve in the future.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 py-4 animate-fade-in">
      {/* Payment Info */}
      <Card className="border border-dashed border-muted bg-muted/30">
        <CardContent className="pt-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Check-in Fee</p>
                <p className="text-xs text-muted-foreground">
                  0.1 CELO per check-in
                </p>
              </div>
            </div>
            <Alert className="border-primary/20 bg-primary/5 py-2">
              <Info className="h-4 w-4 text-primary" />
              <AlertDescription className="text-xs">
                <strong>2 check-ins available daily</strong> • {status.remainingCheckinsToday} remaining today • Minimum 5 hours between check-ins
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>

      {/* Question Card */}
      <Card className="border border-border shadow-sm bg-card relative overflow-hidden">
        <div className="absolute top-0 right-0 w-16 h-16 bg-primary/3 rounded-bl-full" />
        <CardContent className="pt-4 sm:pt-6 relative z-10">
          <div className="flex gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gradient-celo flex items-center justify-center flex-shrink-0 shadow-sm">
              <Brain className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </div>
            <div className="flex-1 space-y-3">
              <CardTitle className="text-sm sm:text-base font-medium leading-tight">
                {question?.question}
              </CardTitle>
              {question && (
                <RadioGroup
                  value={responses[question.id.toString()]?.selectedOption || ""}
                  onValueChange={handleAnswer}
                  className="grid grid-cols-1 sm:grid-cols-2 gap-2"
                >
                  {question.options.map((opt) => (
                    <div
                      key={opt.value}
                      className="flex items-center space-x-2 p-2 rounded-md hover:bg-muted/50 transition-colors"
                    >
                      <RadioGroupItem value={opt.value} id={opt.value} />
                      <Label htmlFor={opt.value} className="text-xs sm:text-sm cursor-pointer flex-1">
                        {opt.text}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              )}
              <Progress value={progress} className="h-1.5 mt-2 bg-muted" />
              <p className="text-xs text-muted-foreground">
                Question {currentQuestion + 1} of {questions.length}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button
          onClick={handleNext}
          className="bg-gradient-celo hover:opacity-90 shadow-md flex items-center gap-2 min-w-[120px]"
          disabled={isLoading || !responses[question?.id.toString() || '']}
          size="lg"
        >
          {isLastQuestion ? "Complete Check-in" : "Next"}
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default DailyCheckIn;
