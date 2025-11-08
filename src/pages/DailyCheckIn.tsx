import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Brain, ChevronRight, Clock } from "lucide-react";
import { toast } from "sonner";
import { useAccount } from "wagmi";
import { useInsightsPayment } from "@/hooks/use-InsightsPayment";
import { PaymentGate } from "@/components/PaymentGate";
import { Link } from "react-router-dom";

interface CheckInQuestion {
  id: string;
  question: string;
  options: string[];
}

const checkInQuestions: CheckInQuestion[] = [
  { id: "focusSessions", question: "How many focused work sessions did you complete today?", options: ["0-1", "2-3", "4-5", "6+"] },
  { id: "exercise", question: "Did you exercise or move your body today?", options: ["No movement", "Light walk (10-20 min)", "Moderate (30-45 min)", "Intense workout (60+ min)", "Multiple sessions"] },
  { id: "meals", question: "How would you rate your meals today?", options: ["Mostly processed/fast food", "Some healthy choices", "Balanced meals", "Very nutritious", "Perfectly planned"] },
  { id: "distractions", question: "What were your top distractions today?", options: ["Social media", "Emails", "Meetings", "Phone calls", "None"] },
  { id: "energy", question: "How's your energy level right now?", options: ["Very low", "Low", "Moderate", "High", "Very high"] },
  { id: "satisfaction", question: "How satisfied are you with today's productivity?", options: ["1 - Not at all", "2 - Slightly", "3 - Moderately", "4 - Very", "5 - Extremely"] },
];

const DailyCheckIn = () => {
  const { address, isConnected } = useAccount();
  const { status, isLoading } = useInsightsPayment();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showPaymentGate, setShowPaymentGate] = useState(false);

  const question = checkInQuestions[currentQuestion];
  const progress = ((currentQuestion + 1) / checkInQuestions.length) * 100;
  const isLastQuestion = currentQuestion === checkInQuestions.length - 1;

  const handleCheckIn = async () => {
    if (!answers[question.id]) {
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

  // Show payment gate if user completed questions
  if (showPaymentGate) {
    return (
      <PaymentGate
        checkInData={{
          answers,
          timestamp: new Date().toISOString(),
        }}
        onPaymentComplete={() => {
          // Reset state when payment completes (but navigation will happen first)
          setShowPaymentGate(false);
          setCurrentQuestion(0);
          setAnswers({});
        }}
      />
    );
  }

  // Show cooldown message if in cooldown
  if (!isLoading && status.isInCooldown) {
    return (
      <div className="space-y-6 py-4">
        <Card className="border-warning">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-warning" />
              Check-in Cooldown
            </CardTitle>
            <CardDescription>
              You already checked in today. Please wait before checking in again.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertDescription>
                You can check in again in <strong>{status.hoursUntilNextCheckin} hours</strong>.
              </AlertDescription>
            </Alert>
            <Link to="/recommendations">
              <Button className="w-full" variant="outline">
                View Previous Insights
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
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

  return (
    <div className="space-y-4 sm:space-y-6 py-4 animate-fade-in">
      {/* Payment Info */}
      <Card className="border border-dashed border-muted bg-muted/30">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Check-in Fee</p>
              <p className="text-xs text-muted-foreground">
                0.1 CELO per check-in
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Question Card - Clean Design with Geometric Accents */}
      <Card className="border border-border shadow-sm bg-card relative overflow-hidden">
        {/* Subtle geometric pattern */}
        <div className="absolute top-0 right-0 w-16 h-16 bg-primary/3 rounded-bl-full" />
        <CardContent className="pt-4 sm:pt-6 relative z-10">
          <div className="flex gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gradient-celo flex items-center justify-center flex-shrink-0 shadow-sm">
              <Brain className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </div>
            <div className="flex-1 space-y-3">
              <CardTitle className="text-sm sm:text-base font-medium leading-tight">{question.question}</CardTitle>
              <RadioGroup
                value={answers[question.id]}
                onValueChange={(val) => setAnswers({ ...answers, [question.id]: val })}
                className="grid grid-cols-1 sm:grid-cols-2 gap-2"
              >
                {question.options.map((opt) => (
                  <div key={opt} className="flex items-center space-x-2 p-2 rounded-md hover:bg-muted/50 transition-colors">
                    <RadioGroupItem value={opt} id={opt} />
                    <Label htmlFor={opt} className="text-xs sm:text-sm cursor-pointer flex-1">{opt}</Label>
                  </div>
                ))}
              </RadioGroup>
              <Progress value={progress} className="h-1.5 mt-2 bg-muted" />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button
          onClick={handleCheckIn}
          className="bg-gradient-celo hover:opacity-90 shadow-md flex items-center gap-2 min-w-[120px]"
          disabled={isLoading}
          size="lg"
        >
          {isLastQuestion ? "See Insights" : "Next"}
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default DailyCheckIn;
