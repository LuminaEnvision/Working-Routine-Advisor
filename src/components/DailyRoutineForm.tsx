import { useState } from "react";

interface Question {
  id: number;
  question: string;
  options: string[];
}

interface Props {
  onSubmit: (answers: Record<number, string>) => void;
}

const questions: Question[] = [
  {
    id: 1,
    question: "How many hours did you sleep last night?",
    options: ["<5", "5-7", "7-9", ">9"],
  },
  {
    id: 2,
    question: "How many hours did you work today?",
    options: ["<4", "4-6", "6-8", ">8"],
  },
  {
    id: 3,
    question: "Did you exercise today?",
    options: ["No", "Yes - light", "Yes - moderate", "Yes - intense"],
  },
  {
    id: 4,
    question: "How many meals did you eat today?",
    options: ["1", "2", "3", "4+"],
  },
  {
    id: 5,
    question: "How focused were you during work?",
    options: ["Not at all", "Somewhat", "Mostly", "Completely"],
  },
];

export default function DailyRoutineForm({ onSubmit }: Props) {
  const [answers, setAnswers] = useState<Record<number, string>>({});

  const handleChange = (id: number, value: string) => {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (Object.keys(answers).length !== questions.length) {
      alert("Please answer all questions!");
      return;
    }
    onSubmit(answers);
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: "600px", margin: "0 auto" }}>
      {questions.map((q) => (
        <div key={q.id} style={{ marginBottom: "1.5rem" }}>
          <p>{q.question}</p>
          {q.options.map((opt) => (
            <label key={opt} style={{ display: "block", marginTop: "0.25rem" }}>
              <input
                type="radio"
                name={`question-${q.id}`}
                value={opt}
                checked={answers[q.id] === opt}
                onChange={() => handleChange(q.id, opt)}
              />{" "}
              {opt}
            </label>
          ))}
        </div>
      ))}
      <button type="submit">Submit Check-in</button>
    </form>
  );
}
