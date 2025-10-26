import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import { Brain, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface CheckInQuestion {
  id: string;
  question: string;
  options: string[];
}

const checkInQuestions: CheckInQuestion[] = [
  {
    id: "focusSessions",
    question: "How many focused work sessions did you complete today?",
    options: ["0-1", "2-3", "4-5", "6+"],
  },
  {
    id: "firstBreak",
    question: "When did you take your first break?",
    options: ["Before 10am", "10am-12pm", "12pm-2pm", "After 2pm", "No breaks yet"],
  },
  {
    id: "distractions",
    question: "What were your top distractions today?",
    options: ["Social media", "Emails", "Meetings", "Phone calls", "None"],
  },
  {
    id: "energy",
    question: "How's your energy level right now?",
    options: ["Very low", "Low", "Moderate", "High", "Very high"],
  },
  {
    id: "satisfaction",
    question: "How satisfied are you with today's productivity?",
    options: ["1 - Not at all", "2 - Slightly", "3 - Moderately", "4 - Very", "5 - Extremely"],
  },
];

const DailyCheckIn = () => {
  const navigate = useNavigate();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const question = checkInQuestions[currentQuestion];
  const progress = ((currentQuestion + 1) / checkInQuestions.length) * 100;
  const isLastQuestion = currentQuestion === checkInQuestions.length - 1;

  const handleNext = () => {
    if (!answers[question.id]) {
      toast.error("Please select an answer");
      return;
    }

    if (isLastQuestion) {
      // Save check-in
      const checkIns = JSON.parse(localStorage.getItem("checkIns") || "[]");
      checkIns.push({
        date: new Date().toISOString(),
        answers,
      });
      localStorage.setItem("checkIns", JSON.stringify(checkIns));
      
      toast.success("Check-in complete! Keep up the great work.");
      navigate("/");
    } else {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  return (
    <div className="space-y-6 py-4 animate-fade-in">
      {/* AI Greeting */}
      <Card className="border-accent/20 bg-accent/5">
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-accent flex items-center justify-center flex-shrink-0">
              <Brain className="w-6 h-6 text-accent-foreground" />
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-accent">Your AI Advisor</p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Great to see you! Let's check in on your day. Based on your previous patterns, 
                I'll help you identify what's working and what could improve.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Question {currentQuestion + 1} of {checkInQuestions.length}</span>
          <span className="font-semibold text-primary">{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Question Card */}
      <Card className="shadow-lg animate-slide-up">
        <CardHeader>
          <CardTitle className="text-xl md:text-2xl">{question.question}</CardTitle>
          <CardDescription>Select the option that best describes your situation</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <RadioGroup
            value={answers[question.id] || ""}
            onValueChange={(value) => 
              setAnswers({ ...answers, [question.id]: value })
            }
            className="space-y-3"
          >
            {question.options.map((option) => (
              <div 
                key={option} 
                className="flex items-center space-x-3 p-4 rounded-lg border hover:border-primary/50 transition-colors"
              >
                <RadioGroupItem value={option} id={option} />
                <Label 
                  htmlFor={option} 
                  className="flex-1 cursor-pointer text-base"
                >
                  {option}
                </Label>
              </div>
            ))}
          </RadioGroup>

          <Button
            onClick={handleNext}
            className="w-full mt-6 bg-gradient-primary h-12"
            size="lg"
            disabled={!answers[question.id]}
          >
            {isLastQuestion ? "Complete Check-in" : "Next Question"}
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default DailyCheckIn;
