/**
 * AI Service for generating insights and handling chatbot queries
 * Uses Google Gemini API only
 */

interface CheckInData {
  answers: Record<string, string>;
  timestamp: string;
  ipfsHash?: string;
  questions?: Question[];
  responses?: Record<string, QuestionResponse>;
  analysis?: AnalysisResponse;
  timeOfDay?: string;
}

interface Question {
  id: number;
  question: string;
  category: string;
  options: QuestionOption[];
  reasoning?: string;
}

interface QuestionOption {
  value: string;
  text: string;
  score: number;
}

interface QuestionResponse {
  questionId: number;
  selectedOption: string;
  score: number;
}

interface AnalysisResponse {
  assessment: string;
  concerns: string[];
  recommendations: Recommendation[];
  mealPlan?: MealPlan;
  quickWins: string[];
  trackingMetrics: string[];
}

interface Recommendation {
  priority: number;
  category: string;
  title: string;
  action: string;
  why: string;
}

interface MealPlan {
  breakfast?: Meal;
  lunch?: Meal;
  dinner?: Meal;
}

interface Meal {
  name: string;
  prepTime: string;
  ingredients: string[];
  steps: string[];
  benefits: string;
}

interface InsightResponse {
  insights: string[];
  summary: string;
  recommendations: string[];
}

// Export types
export type { CheckInData, Question, QuestionOption, QuestionResponse, AnalysisResponse, Recommendation, MealPlan, Meal };

/**
 * Fallback questions if AI fails
 */
const FALLBACK_QUESTIONS: Question[] = [
  {
    id: 1,
    question: 'How many hours did you sleep last night?',
    category: 'sleep',
    options: [
      { value: 'A', text: 'Less than 5 hours', score: 1 },
      { value: 'B', text: '5-6 hours', score: 2 },
      { value: 'C', text: '7-8 hours', score: 3 },
      { value: 'D', text: 'More than 8 hours', score: 4 },
    ],
  },
  {
    id: 2,
    question: 'How would you rate your energy level right now?',
    category: 'energy',
    options: [
      { value: 'A', text: 'Very low', score: 1 },
      { value: 'B', text: 'Low', score: 2 },
      { value: 'C', text: 'Moderate', score: 3 },
      { value: 'D', text: 'High', score: 4 },
    ],
  },
  {
    id: 3,
    question: 'How many meals have you eaten today?',
    category: 'nutrition',
    options: [
      { value: 'A', text: '0-1 meals', score: 1 },
      { value: 'B', text: '2 meals', score: 2 },
      { value: 'C', text: '3 meals', score: 3 },
      { value: 'D', text: '4+ meals', score: 4 },
    ],
  },
  {
    id: 4,
    question: 'Did you exercise or move your body today?',
    category: 'activity',
    options: [
      { value: 'A', text: 'No movement', score: 1 },
      { value: 'B', text: 'Light walk (10-20 min)', score: 2 },
      { value: 'C', text: 'Moderate (30-45 min)', score: 3 },
      { value: 'D', text: 'Intense workout (60+ min)', score: 4 },
    ],
  },
  {
    id: 5,
    question: 'How would you rate your stress level today?',
    category: 'stress',
    options: [
      { value: 'A', text: 'Very high', score: 1 },
      { value: 'B', text: 'High', score: 2 },
      { value: 'C', text: 'Moderate', score: 3 },
      { value: 'D', text: 'Low', score: 4 },
    ],
  },
  {
    id: 6,
    question: 'How many focused work sessions did you complete today?',
    category: 'productivity',
    options: [
      { value: 'A', text: '0-1 sessions', score: 1 },
      { value: 'B', text: '2-3 sessions', score: 2 },
      { value: 'C', text: '4-5 sessions', score: 3 },
      { value: 'D', text: '6+ sessions', score: 4 },
    ],
  },
];

/**
 * Call Gemini API with retry logic
 */
async function callGeminiAPI(prompt: string, maxRetries: number = 3): Promise<string> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error('VITE_GEMINI_API_KEY not configured');
  }

  const models = [
    { name: 'gemini-1.5-flash', version: 'v1beta' },
    { name: 'gemini-1.5-pro', version: 'v1beta' },
    { name: 'gemini-2.0-flash-exp', version: 'v1beta' },
  ];

  let lastError: Error | null = null;

  for (const model of models) {
    const url = `https://generativelanguage.googleapis.com/${model.version}/models/${model.name}:generateContent?key=${apiKey}`;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        console.log(`🔄 Trying Gemini model: ${model.name} (attempt ${attempt + 1}/${maxRetries})`);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

        try {
          const response = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              contents: [{
                parts: [{
                  text: prompt
                }]
              }],
              generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 2000,
              },
            }),
            signal: controller.signal,
          });
          clearTimeout(timeoutId);

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
          }

          const data = await response.json();
          const content = data.candidates?.[0]?.content?.parts?.[0]?.text;

          if (!content) {
            throw new Error('No content from Gemini API');
          }

          console.log(`✅ Successfully using Gemini model: ${model.name}`);
          return content;

        } catch (error: any) {
          clearTimeout(timeoutId);
          throw error;
        }



      } catch (error: any) {
        lastError = error;
        console.error(`❌ ${model.name} attempt ${attempt + 1} failed:`, error.message);

        if (attempt < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
        }
      }
    }
  }

  throw lastError || new Error('All Gemini models failed');
}

/**
 * Generate daily questions using Gemini AI
 */
export async function generateDailyQuestions(
  userId: string,
  currentTime: Date,
  previousCheckIn?: CheckInData
): Promise<{ questions: Question[] }> {
  const hour = currentTime.getHours();
  const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';

  const previousResponses = previousCheckIn?.responses
    ? Object.values(previousCheckIn.responses).map(r => ({
      questionId: r.questionId,
      selectedOption: r.selectedOption,
      score: r.score
    }))
    : [];

  const previousAnswers = previousCheckIn?.answers || {};
  const previousCategories = previousCheckIn?.questions?.map(q => q.category) || [];

  const prompt = `You are a health and productivity coach. Generate exactly 6 multiple-choice questions for a ${timeOfDay} check-in.

CONTEXT:
- Current time: ${timeOfDay}
- Previous check-in data: ${previousCheckIn ? JSON.stringify({
    answers: previousAnswers,
    categories: previousCategories,
    responses: previousResponses,
    previousAnalysis: previousCheckIn.analysis // Include previous analysis for context
  }) : 'No previous data'}

REQUIREMENTS:
1. Questions must be relevant to ${timeOfDay} (e.g., morning: sleep quality, breakfast; evening: stress levels, dinner)
2. At least ONE question must be different from the previous check-in
3. If previous data shows issues, create follow-up questions
4. Cover these key areas across the 6 questions:
   - Sleep/Energy levels
   - Nutrition/Meals
   - Physical activity
   - Mental well-being/Stress
   - Hydration
   - Work productivity/Focus
5. Each question must have 4 answer options
6. Options should range from poor to excellent habits

FORMAT YOUR RESPONSE AS JSON ONLY (no markdown, no code blocks):
{
  "questions": [
    {
      "id": 1,
      "question": "How many hours did you sleep last night?",
      "category": "sleep",
      "options": [
        {"value": "A", "text": "Less than 5 hours", "score": 1},
        {"value": "B", "text": "5-6 hours", "score": 2},
        {"value": "C", "text": "7-8 hours", "score": 3},
        {"value": "D", "text": "More than 8 hours", "score": 4}
      ],
      "reasoning": "Following up on previous poor sleep report"
    }
  ]
}`;

  try {
    const content = await callGeminiAPI(prompt);
    const cleanedContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleanedContent);

    if (!parsed.questions || !Array.isArray(parsed.questions) || parsed.questions.length !== 6) {
      throw new Error('Invalid question structure from API');
    }

    return parsed;
  } catch (error: any) {
    // If API key is missing, throw error so UI can show it
    if (error.message?.includes('VITE_GEMINI_API_KEY')) {
      throw error;
    }
    console.warn('Gemini API failed, using fallback questions:', error);
    return { questions: FALLBACK_QUESTIONS };
  }
}

/**
 * Analyze responses and generate recommendations using Gemini AI
 */
export async function analyzeAndRecommend(
  userResponses: Record<string, QuestionResponse>,
  historicalData: CheckInData[]
): Promise<AnalysisResponse> {
  const prompt = `You are a holistic health and lifestyle coach. Analyze this user's check-in responses and provide comprehensive recommendations.

USER RESPONSES TODAY:
${JSON.stringify(userResponses, null, 2)}

HISTORICAL PATTERNS (last 7 days):
${JSON.stringify(historicalData.slice(-7), null, 2)}

PROVIDE DETAILED ANALYSIS AND RECOMMENDATIONS:

1. **Overall Assessment**: Brief summary of their current lifestyle patterns (2-3 sentences)

2. **Key Areas of Concern**: Identify 2-3 specific issues that need attention

3. **Actionable Recommendations**: Provide 5-7 specific, prioritized recommendations covering:
   - Sleep optimization
   - Nutrition improvements
   - Physical activity
   - Stress management
   - Productivity enhancements

4. **Meal Plan**: If nutrition is an issue, provide:
   - 3 specific meal recipes (breakfast, lunch, dinner) with:
     * Ingredients list
     * Simple preparation steps (5 steps max)
     * Nutritional benefits
     * Prep time
   - Focus on simple, healthy meals that address their specific deficiencies

5. **Quick Wins**: 3 things they can do TODAY to improve

6. **Progress Tracking**: Specific metrics they should monitor

FORMAT AS JSON ONLY (no markdown, no code blocks):
{
  "assessment": "string",
  "concerns": ["concern1", "concern2"],
  "recommendations": [
    {
      "priority": 1,
      "category": "sleep",
      "title": "string",
      "action": "string",
      "why": "string"
    }
  ],
  "mealPlan": {
    "breakfast": {
      "name": "string",
      "prepTime": "15 min",
      "ingredients": ["item1", "item2"],
      "steps": ["step1", "step2"],
      "benefits": "string"
    },
    "lunch": {...},
    "dinner": {...}
  },
  "quickWins": ["win1", "win2", "win3"],
  "trackingMetrics": ["metric1", "metric2"]
}`;

  try {
    const content = await callGeminiAPI(prompt);
    const cleanedContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleanedContent);

    if (!parsed.assessment || !parsed.recommendations || !Array.isArray(parsed.recommendations)) {
      throw new Error('Invalid analysis structure from API');
    }

    return parsed as AnalysisResponse;
  } catch (error: any) {
    // If API key is missing, throw error so UI can show it
    if (error.message?.includes('VITE_GEMINI_API_KEY')) {
      throw error;
    }
    console.warn('Gemini analysis failed, using fallback:', error);
    return {
      assessment: 'Based on your check-in, continue tracking your daily habits to identify patterns and areas for improvement.',
      concerns: ['Consistency in tracking', 'Building sustainable habits'],
      recommendations: [
        {
          priority: 1,
          category: 'general',
          title: 'Maintain Consistency',
          action: 'Try to check in at the same time each day',
          why: 'Consistency helps build awareness and track progress over time',
        },
      ],
      quickWins: [
        'Drink a glass of water right now',
        'Take 5 deep breaths to reduce stress',
        'Go for a 10-minute walk',
      ],
      trackingMetrics: ['Daily check-in completion', 'Energy levels', 'Sleep quality'],
    };
  }
}

/**
 * Generate insights from check-in history using Gemini AI
 */
export async function generateInsights(checkIns: CheckInData[]): Promise<InsightResponse> {
  const historyText = checkIns
    .slice(-7)
    .map((checkIn, idx) => {
      const date = new Date(checkIn.timestamp).toLocaleDateString();
      const answers = Object.entries(checkIn.answers)
        .map(([key, value]) => `${key}: ${value}`)
        .join(', ');
      return `Check-in ${idx + 1} (${date}): ${answers}`;
    })
    .join('\n');

  const prompt = `You are a health and productivity coach analyzing daily check-in data.

Analyze this person's daily habits and provide recommendations:

${historyText}

The check-in questions cover:
- focusSessions: How many focused work sessions completed
- exercise: Physical activity level
- meals: Meal quality
- distractions: Top distractions
- energy: Current energy level
- satisfaction: Productivity satisfaction

IMPORTANT: Provide SPECIFIC, ACTIONABLE recommendations based on their actual answers.

Format your response as JSON only (no markdown, no code blocks):
{
  "insights": ["insight 1", "insight 2", "insight 3"],
  "summary": "brief summary text (2-3 sentences)",
  "recommendations": ["specific recommendation 1", "specific recommendation 2", "specific recommendation 3"]
}`;

  try {
    const content = await callGeminiAPI(prompt);
    const cleanedContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleanedContent);

    return {
      insights: parsed.insights || [],
      summary: parsed.summary || '',
      recommendations: parsed.recommendations || [],
    };
  } catch (error) {
    console.warn('Gemini insights failed, using fallback:', error);
    return getMockInsights(checkIns);
  }
}

/**
 * Mock insights for fallback
 */
function getMockInsights(checkIns: CheckInData[]): InsightResponse {
  const recentCheckIn = checkIns[checkIns.length - 1];
  const answers = recentCheckIn?.answers || {};

  const insights: string[] = [];
  const recommendations: string[] = [];

  // Analyze patterns
  if (answers.energy === 'Very low' || answers.energy === 'Low') {
    insights.push('Your energy levels have been consistently low');
    recommendations.push('Try getting 7-8 hours of sleep and eating balanced meals');
  }

  if (answers.exercise === 'No movement') {
    insights.push('You haven\'t been getting much physical activity');
    recommendations.push('Start with a 10-minute walk each day and gradually increase');
  }

  if (answers.meals === 'Mostly processed/fast food') {
    insights.push('Your nutrition could use improvement');
    recommendations.push('Prepare simple, healthy meals like oatmeal for breakfast and salads for lunch');
  }

  if (insights.length === 0) {
    insights.push('Keep up the good work with your daily check-ins!');
    recommendations.push('Continue tracking your habits to maintain awareness');
  }

  return {
    insights,
    summary: `Based on ${checkIns.length} check-in${checkIns.length !== 1 ? 's' : ''}, here are some patterns we've noticed.`,
    recommendations,
  };
}

/**
 * Handle chatbot queries using Gemini AI
 */
export async function handleChatbotQuery(
  query: string,
  checkInHistory: CheckInData[]
): Promise<string> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  if (!apiKey) {
    return "I'm here to help! To enable AI chat, please set VITE_GEMINI_API_KEY in your environment variables.";
  }

  const historyContext = checkInHistory.slice(-3).map(checkIn => {
    const date = new Date(checkIn.timestamp).toLocaleDateString();
    return `${date}: 
    Answers: ${JSON.stringify(checkIn.answers)}
    Analysis: ${JSON.stringify(checkIn.analysis || 'No analysis available')}`;
  }).join('\n\n');

  const prompt = `You are a helpful health and productivity coach assistant. Answer the user's question based on their check-in history.

USER CHECK-IN HISTORY:
${historyContext}

USER QUESTION: ${query}

Provide a helpful, concise response (2-3 sentences max). Be supportive and actionable.`;

  try {
    const content = await callGeminiAPI(prompt);
    return content.trim();
  } catch (error) {
    console.error('Chatbot query failed:', error);
    return "I'm having trouble connecting right now. Please try again in a moment.";
  }
}
