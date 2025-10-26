import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { toast } from "sonner";

interface Question {
  id: string;
  question: string;
  type: "radio" | "text";
  options?: string[];
}

const questions: Question[] = [
  {
    id: "workType",
    question: "What is your primary work type?",
    type: "radio",
    options: ["Coding", "Writing", "Design", "Management", "Other"],
  },
  {
    id: "workTime",
    question: "What time do you prefer working?",
    type: "radio",
    options: ["Early morning", "Mid-morning", "Afternoon", "Evening", "Flexible"],
  },
  {
    id: "challenges",
    question: "What are your biggest productivity challenges?",
    type: "radio",
    options: ["Distractions", "Procrastination", "Context switching", "Burnout", "Time management"],
  },
  {
    id: "workspace",
    question: "Describe your current workspace",
    type: "text",
  },
  {
    id: "goal",
    question: "What's your main goal for the next 30 days?",
    type: "text",
  },
];

const Onboarding = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const currentQuestion = questions[currentStep];
  const progress = ((currentStep + 1) / questions.length) * 100;

  const handleNext = () => {
    if (!answers[currentQuestion.id]) {
      toast.error("Please answer the question before continuing");
      return;
    }

    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Save answers and navigate
      localStorage.setItem("onboardingComplete", "true");
      localStorage.setItem("onboardingAnswers", JSON.stringify(answers));
      toast.success("Setup complete! Let's get started.");
      navigate("/");
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="space-y-6 py-8 animate-fade-in">
      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Question {currentStep + 1} of {questions.length}</span>
          <span className="font-semibold text-primary">{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Question Card */}
      <Card className="shadow-lg border-primary/10 animate-slide-up">
        <CardHeader>
          <CardTitle className="text-2xl">{currentQuestion.question}</CardTitle>
          <CardDescription>
            {currentQuestion.type === "text" 
              ? "Take your time and be specific" 
              : "Choose the option that best describes you"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {currentQuestion.type === "radio" && currentQuestion.options ? (
            <RadioGroup
              value={answers[currentQuestion.id] || ""}
              onValueChange={(value) => 
                setAnswers({ ...answers, [currentQuestion.id]: value })
              }
              className="space-y-3"
            >
              {currentQuestion.options.map((option) => (
                <div key={option} className="flex items-center space-x-3 p-4 rounded-lg border hover:border-primary/50 transition-colors">
                  <RadioGroupItem value={option} id={option} />
                  <Label 
                    htmlFor={option} 
                    className="flex-1 cursor-pointer text-base font-medium"
                  >
                    {option}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          ) : (
            <Textarea
              value={answers[currentQuestion.id] || ""}
              onChange={(e) => 
                setAnswers({ ...answers, [currentQuestion.id]: e.target.value })
              }
              placeholder="Share your thoughts..."
              className="min-h-[150px] text-base resize-none"
            />
          )}

          {/* Navigation */}
          <div className="flex gap-3 pt-4">
            {currentStep > 0 && (
              <Button
                variant="outline"
                onClick={handleBack}
                className="flex-1"
                size="lg"
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            )}
            <Button
              onClick={handleNext}
              className="flex-1 bg-gradient-primary"
              size="lg"
              disabled={!answers[currentQuestion.id]}
            >
              {currentStep === questions.length - 1 ? "Complete Setup" : "Next"}
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Onboarding;
