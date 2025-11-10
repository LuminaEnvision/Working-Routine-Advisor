/**
 * AI Service for generating insights and handling chatbot queries
 * Uses OpenRouter AI, Hugging Face API (Mistral-7B-Instruct), or Google Gemini API
 */

// OpenRouter Configuration
const getOpenRouterConfig = () => {
  const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY || '';
  const baseURL = 'https://openrouter.ai/api/v1/chat/completions';
  const model = import.meta.env.VITE_OPENROUTER_MODEL || 'openrouter/polaris-alpha';
  
  return {
    apiKey,
    baseURL,
    model,
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': typeof window !== 'undefined' ? window.location.origin : 'https://working-routine-advisor.app',
      'X-Title': 'Daily Check-in Lifestyle App',
      'Content-Type': 'application/json',
    },
  };
};

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
 * Retry logic for API calls
 */
async function apiCallWithRetry<T>(
  apiFunction: () => Promise<T>,
  maxRetries: number = 3
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await apiFunction();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
  throw new Error('Max retries exceeded');
}

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
 * Generate daily questions using OpenRouter AI
 */
export async function generateDailyQuestions(
  userId: string,
  currentTime: Date,
  previousCheckIn?: CheckInData
): Promise<{ questions: Question[] }> {
  const hour = currentTime.getHours();
  const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';

  const prompt = `You are a health and productivity coach. Generate exactly 6 multiple-choice questions for a ${timeOfDay} check-in.

CONTEXT:
- Current time: ${timeOfDay}
- Previous check-in data: ${previousCheckIn ? JSON.stringify(previousCheckIn) : 'No previous data'}

REQUIREMENTS:
1. Questions must be relevant to ${timeOfDay} (e.g., morning: sleep quality, breakfast; evening: stress levels, dinner)
2. If previous data shows issues, create follow-up questions (e.g., poor sleep last time → ask about sleep improvements attempted)
3. Cover these key areas across the 6 questions:
   - Sleep/Energy levels
   - Nutrition/Meals
   - Physical activity
   - Mental well-being/Stress
   - Hydration
   - Work productivity/Focus
4. Each question must have 4 answer options
5. Options should range from poor to excellent habits

FORMAT YOUR RESPONSE AS JSON:
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

  const config = getOpenRouterConfig();
  
  if (!config.apiKey) {
    console.warn('VITE_OPENROUTER_API_KEY not set. Using fallback questions.');
    return { questions: FALLBACK_QUESTIONS };
  }

  try {
    const result = await apiCallWithRetry(async () => {
      const response = await fetch(config.baseURL, {
        method: 'POST',
        headers: config.headers,
        body: JSON.stringify({
          model: config.model,
          messages: [
            {
              role: 'system',
              content: 'You are an expert health coach who creates personalized daily check-in questions. Always respond with valid JSON only.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.7,
          response_format: { type: 'json_object' },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;

      if (!content) {
        throw new Error('No content from OpenRouter API');
      }

      // Parse JSON response
      const cleanedContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(cleanedContent);

      // Validate structure
      if (!parsed.questions || !Array.isArray(parsed.questions) || parsed.questions.length !== 6) {
        throw new Error('Invalid question structure from API');
      }

      return parsed;
    });

    return result;
  } catch (error) {
    console.warn('OpenRouter API failed, using fallback questions:', error);
    return { questions: FALLBACK_QUESTIONS };
  }
}

/**
 * Analyze responses and generate recommendations using OpenRouter AI
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

FORMAT AS JSON:
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

  const config = getOpenRouterConfig();
  
  if (!config.apiKey) {
    console.warn('VITE_OPENROUTER_API_KEY not set. Using fallback analysis.');
    // Return a basic fallback analysis
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

  try {
    const result = await apiCallWithRetry(async () => {
      const response = await fetch(config.baseURL, {
        method: 'POST',
        headers: config.headers,
        body: JSON.stringify({
          model: config.model,
          messages: [
            {
              role: 'system',
              content: 'You are an expert health coach providing personalized lifestyle recommendations. Always respond with valid JSON only.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.8,
          max_tokens: 3000,
          response_format: { type: 'json_object' },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;

      if (!content) {
        throw new Error('No content from OpenRouter API');
      }

      // Parse JSON response
      const cleanedContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(cleanedContent);

      // Validate structure
      if (!parsed.assessment || !parsed.recommendations || !Array.isArray(parsed.recommendations)) {
        throw new Error('Invalid analysis structure from API');
      }

      return parsed as AnalysisResponse;
    });

    return result;
  } catch (error) {
    console.warn('OpenRouter analysis failed, using fallback analysis:', error);
    // Return a basic fallback analysis
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
 * Generate insights using Hugging Face API (Mistral-7B-Instruct)
 */
async function generateInsightsWithHF(checkIns: CheckInData[], apiKey: string): Promise<InsightResponse> {
  // Prepare check-in history
  const historyText = checkIns
    .slice(-7) // Last 7 check-ins
    .map((checkIn, idx) => {
      const date = new Date(checkIn.timestamp).toLocaleDateString();
      const answers = Object.entries(checkIn.answers)
        .map(([key, value]) => `${key}: ${value}`)
        .join(', ');
      return `Check-in ${idx + 1} (${date}): ${answers}`;
    })
    .join('\n');

  const prompt = `<s>[INST] You are a productivity and lifestyle coach analyzing daily check-in data.

Based on the following check-in history, provide personalized, actionable insights:

${historyText}

The check-in questions are:
- focusSessions: How many focused work sessions completed
- exercise: Physical activity level (No movement, Light walk, Moderate, Intense workout, Multiple sessions)
- meals: Meal quality (Mostly processed/fast food, Some healthy choices, Balanced meals, Very nutritious, Perfectly planned)
- distractions: Top distractions (Social media, Emails, Meetings, Phone calls, None)
- energy: Current energy level (Very low, Low, Moderate, High, Very high)
- satisfaction: Productivity satisfaction (1-5 scale)

IMPORTANT: Provide SPECIFIC, ACTIONABLE recommendations based on their actual answers:
- If meals are "Mostly processed/fast food" → Provide specific brain food recipes and meal suggestions
- If energy is "Very low" or "Low" → Suggest specific sleep schedules, wake times, and energy-boosting habits
- If exercise is "No movement" → Suggest specific exercise routines and movement breaks
- If distractions are high → Provide specific strategies to minimize those distractions
- If focusSessions are low → Suggest specific techniques to improve focus

Please provide your response as valid JSON only (no markdown, no code blocks):
{
  "insights": ["insight 1", "insight 2", ...],
  "summary": "brief summary text",
  "recommendations": ["specific recommendation 1", "specific recommendation 2", ...]
}

Format your response as JSON only. [/INST]`;

  const model = 'mistralai/Mistral-7B-Instruct-v0.2';
  
  // Note: Hugging Face Inference API has CORS restrictions for browser requests
  // For production, you'll need a backend proxy or use Hugging Face's hosted endpoints
  // For now, we'll try the direct API but expect it may fail due to CORS
  const url = `https://api-inference.huggingface.co/models/${model}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          temperature: 0.7,
          max_new_tokens: 1000,
          return_full_text: false,
        },
      }),
      // Note: CORS may block this request from browser
      // Consider using a backend proxy for production
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Hugging Face API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    // Handle array response (Hugging Face returns array)
    const result = Array.isArray(data) ? data[0] : data;
    const content = result?.generated_text || result?.text || '';

    if (!content) {
      throw new Error('No content from Hugging Face API');
    }

    // Parse JSON response (remove markdown code blocks if present)
    try {
      const cleanedContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(cleanedContent);
      
      return {
        insights: parsed.insights || [],
        summary: parsed.summary || '',
        recommendations: parsed.recommendations || [],
      };
    } catch (parseError) {
      console.warn('Failed to parse Hugging Face API response, using rule-based recommendations:', parseError);
      return getMockInsights(checkIns);
    }
  } catch (error: any) {
    // Check if it's a CORS or network error
    if (error?.message?.includes('CORS') || error?.message?.includes('Failed to fetch') || error?.name === 'TypeError') {
      console.warn('Hugging Face API CORS error: Direct browser access is blocked. Using rule-based recommendations.');
      throw new Error('CORS_ERROR: Hugging Face Inference API requires a backend proxy for browser access.');
    }
    console.error('Hugging Face API error:', error);
    throw error;
  }
}

/**
 * Generate insights using Gemini API (gemini-pro)
 */
async function generateInsightsWithGemini(checkIns: CheckInData[], apiKey: string): Promise<InsightResponse> {
  // Prepare check-in history for AI
  const historyText = checkIns
    .slice(-7) // Last 7 check-ins
    .map((checkIn, idx) => {
      const date = new Date(checkIn.timestamp).toLocaleDateString();
      const answers = Object.entries(checkIn.answers)
        .map(([key, value]) => `${key}: ${value}`)
        .join(', ');
      return `Check-in ${idx + 1} (${date}): ${answers}`;
    })
    .join('\n');

  // Build a comprehensive prompt based on user's instructions
  const prompt = `You are a health and productivity coach analyzing daily check-in data.

Analyze this person's daily habits and provide recommendations:

${historyText}

The check-in questions are:
- focusSessions: How many focused work sessions completed
- exercise: Physical activity level (No movement, Light walk, Moderate, Intense workout, Multiple sessions)
- meals: Meal quality (Mostly processed/fast food, Some healthy choices, Balanced meals, Very nutritious, Perfectly planned)
- distractions: Top distractions (Social media, Emails, Meetings, Phone calls, None)
- energy: Current energy level (Very low, Low, Moderate, High, Very high)
- satisfaction: Productivity satisfaction (1-5 scale)

IMPORTANT: Provide SPECIFIC, ACTIONABLE recommendations based on their actual answers:
- If meals are "Mostly processed/fast food" → Provide specific brain food recipes and meal suggestions
- If energy is "Very low" or "Low" → Suggest specific sleep schedules, wake times, and energy-boosting habits
- If exercise is "No movement" → Suggest specific exercise routines and movement breaks
- If distractions are high → Provide specific strategies to minimize those distractions
- If focusSessions are low → Suggest specific techniques to improve focus

Provide 3-5 specific, actionable recommendations to improve their health and productivity.

Format your response as JSON only (no markdown, no code blocks):
{
  "insights": ["insight 1", "insight 2", "insight 3"],
  "summary": "brief summary text (2-3 sentences)",
  "recommendations": ["specific recommendation 1", "specific recommendation 2", "specific recommendation 3", "specific recommendation 4", "specific recommendation 5"]
}`;

  // Try gemini-1.5-flash first (available for v1beta), then fallback to v1 API
  // Note: gemini-pro is not available for v1beta, use gemini-1.5-flash or gemini-1.5-pro instead
  const models = [
    { name: 'gemini-1.5-flash', version: 'v1beta' }, // Fast and free tier
    { name: 'gemini-1.5-pro', version: 'v1beta' }, // More capable
    { name: 'gemini-1.5-flash', version: 'v1' }, // Fallback to v1 API
  ];
  
  let lastError: string = '';
  let response: Response | null = null;
  
  // Try each model/API version combination
  for (const modelConfig of models) {
    const url = `https://generativelanguage.googleapis.com/${modelConfig.version}/models/${modelConfig.name}:generateContent?key=${apiKey}`;
    
    try {
      response = await fetch(url, {
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
            maxOutputTokens: 1000,
          },
        }),
      });
      
      if (response.ok) {
        console.log(`Successfully using Gemini model: ${modelConfig.name} (${modelConfig.version})`);
        break; // Success! Use this response
      } else {
        const errorText = await response.text();
        lastError = `Model ${modelConfig.name} (${modelConfig.version}) failed: ${response.status} - ${errorText}`;
        console.warn(lastError);
        response = null;
      }
    } catch (error) {
      lastError = `Model ${modelConfig.name} (${modelConfig.version}) error: ${error}`;
      console.warn(lastError);
      response = null;
    }
  }
  
  if (!response || !response.ok) {
    throw new Error(`Gemini API error: All model attempts failed. Last error: ${lastError}`);
  }

  const data = await response.json();
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!content) {
    throw new Error('No content from Gemini API');
  }

  // Parse JSON response (remove markdown code blocks if present)
  try {
    const cleanedContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleanedContent);
    
    return {
      insights: parsed.insights || [],
      summary: parsed.summary || '',
      recommendations: parsed.recommendations || [],
    };
  } catch (parseError) {
    console.warn('Failed to parse Gemini API response, using rule-based recommendations:', parseError);
    return getMockInsights(checkIns);
  }
}

export const generateInsights = async (checkIns: CheckInData[]): Promise<InsightResponse> => {
  const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY;
  const hfApiKey = import.meta.env.VITE_HUGGINGFACE_API_KEY;
  
  // Try Gemini first (works from browser, no CORS issues)
  if (geminiApiKey) {
    try {
      console.log('Using Gemini API (gemini-pro) for insights...');
      return await generateInsightsWithGemini(checkIns, geminiApiKey);
    } catch (error: any) {
      console.warn('Gemini API failed, trying fallback options:', error);
      // Fall through to try other options
    }
  }
  
  // Try Hugging Face as fallback (may have CORS issues)
  if (hfApiKey) {
    try {
      console.log('Using Hugging Face API (Mistral-7B-Instruct) for insights...');
      return await generateInsightsWithHF(checkIns, hfApiKey);
    } catch (error: any) {
      // If CORS error, skip Hugging Face and use rule-based recommendations
      if (error?.message?.includes('CORS_ERROR') || error?.message?.includes('Failed to fetch') || error?.name === 'TypeError') {
        console.warn('Hugging Face API blocked by CORS. Using rule-based recommendations (no API needed).');
        console.warn('Note: To use Hugging Face API, set up a backend proxy or use Hugging Face Spaces.');
      } else {
        console.warn('Hugging Face API failed, falling back to rule-based recommendations:', error);
      }
      return getMockInsights(checkIns);
    }
  }
  
  // Use rule-based recommendations (no API calls, always works)
  return getMockInsights(checkIns);
};

/**
 * Handle chatbot query using Hugging Face API
 */
async function handleChatbotQueryWithHF(
  query: string,
  checkIns: CheckInData[],
  previousInsights: InsightResponse | undefined,
  apiKey: string
): Promise<string> {
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

  const contextText = previousInsights
    ? `Previous insights: ${previousInsights.summary}\nKey insights: ${previousInsights.insights.join(', ')}`
    : 'No previous insights available.';

  const prompt = `<s>[INST] You are a helpful productivity and lifestyle coach. The user has been tracking their daily habits through check-ins.

Check-in history:
${historyText}

${contextText}

User question: ${query}

Provide a helpful, concise answer (2-3 sentences max) that relates to their check-in data and lifestyle patterns. [/INST]`;

  const model = 'mistralai/Mistral-7B-Instruct-v0.2';
  const url = `https://api-inference.huggingface.co/models/${model}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          temperature: 0.7,
          max_new_tokens: 300,
          return_full_text: false,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Hugging Face API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const result = Array.isArray(data) ? data[0] : data;
    const content = result?.generated_text || result?.text || '';
    
    return content || 'Sorry, I could not generate a response.';
  } catch (error) {
    console.error('Chatbot query failed:', error);
    return "I'm having trouble processing that right now. Please try again later or check your API configuration.";
  }
}

/**
 * Handle chatbot query using Gemini API
 */
async function handleChatbotQueryWithGemini(
  query: string,
  checkIns: CheckInData[],
  previousInsights: InsightResponse | undefined,
  apiKey: string
): Promise<string> {
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

  const contextText = previousInsights
    ? `Previous insights: ${previousInsights.summary}\nKey insights: ${previousInsights.insights.join(', ')}`
    : 'No previous insights available.';

  const prompt = `You are a helpful productivity and lifestyle coach. The user has been tracking their daily habits through check-ins.

Check-in history:
${historyText}

${contextText}

User question: ${query}

Provide a helpful, concise answer (2-3 sentences max) that relates to their check-in data and lifestyle patterns.`;

  // Try gemini-1.5-flash first (available for v1beta), then fallback to v1 API
  // Note: gemini-pro is not available for v1beta, use gemini-1.5-flash or gemini-1.5-pro instead
  const models = [
    { name: 'gemini-1.5-flash', version: 'v1beta' }, // Fast and free tier
    { name: 'gemini-1.5-pro', version: 'v1beta' }, // More capable
    { name: 'gemini-1.5-flash', version: 'v1' }, // Fallback to v1 API
  ];
  
  let lastError: string = '';
  let response: Response | null = null;
  
  // Try each model/API version combination
  for (const modelConfig of models) {
    const url = `https://generativelanguage.googleapis.com/${modelConfig.version}/models/${modelConfig.name}:generateContent?key=${apiKey}`;
    
    try {
      response = await fetch(url, {
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
            maxOutputTokens: 300,
          },
        }),
      });
      
      if (response.ok) {
        console.log(`Successfully using Gemini model: ${modelConfig.name} (${modelConfig.version})`);
        break; // Success! Use this response
      } else {
        const errorText = await response.text();
        lastError = `Model ${modelConfig.name} (${modelConfig.version}) failed: ${response.status} - ${errorText}`;
        console.warn(lastError);
        response = null;
      }
    } catch (error) {
      lastError = `Model ${modelConfig.name} (${modelConfig.version}) error: ${error}`;
      console.warn(lastError);
      response = null;
    }
  }
  
  if (!response || !response.ok) {
    throw new Error(`Gemini API error: All model attempts failed. Last error: ${lastError}`);
  }

  const data = await response.json();
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
  
  return content || 'Sorry, I could not generate a response.';
}

export const handleChatbotQuery = async (
  query: string,
  checkIns: CheckInData[],
  previousInsights?: InsightResponse
): Promise<string> => {
  const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY;
  const hfApiKey = import.meta.env.VITE_HUGGINGFACE_API_KEY;

  // Try Gemini first (works from browser, no CORS issues)
  if (geminiApiKey) {
    try {
      return await handleChatbotQueryWithGemini(query, checkIns, previousInsights, geminiApiKey);
    } catch (error) {
      console.warn('Gemini chatbot failed, trying fallback options:', error);
      // Fall through to try other options
    }
  }

  // Try Hugging Face as fallback (may have CORS issues)
  if (hfApiKey) {
    try {
      return await handleChatbotQueryWithHF(query, checkIns, previousInsights, hfApiKey);
    } catch (error) {
      console.warn('Hugging Face chatbot failed, falling back to default response:', error);
      return "I'm here to help! Regular check-ins help build better habits and productivity patterns.";
    }
  }

  // Fallback response
  return "I'm here to help! To enable AI chat, please set VITE_GEMINI_API_KEY in your environment variables. For now, I can tell you that regular check-ins help build better habits and productivity patterns.";
};

/**
 * Rule-based insights generator - analyzes check-in data and provides specific recommendations
 */
function getMockInsights(checkIns: CheckInData[]): InsightResponse {
  const count = checkIns.length;
  
  if (count === 0) {
    return {
      insights: [
        'Start your journey by completing your first check-in!',
        'Regular check-ins help you track your daily habits and productivity.',
        'Consistency is key to building better routines.',
      ],
      summary: 'Complete your first check-in to start receiving personalized insights and recommendations.',
      recommendations: [
        'Complete your first check-in to begin tracking your habits.',
        'Try to check in at the same time each day to build a routine.',
        'Be honest with your answers for the most accurate insights.',
      ],
    };
  }

  // Analyze recent check-ins (last 7)
  const recent = checkIns.slice(-7);
  
  // Analyze sleep patterns
  const sleepAnswers = recent.map(c => c.answers[1] || '').filter(Boolean);
  const lowSleep = sleepAnswers.filter(s => s === '<5' || s === '5-7').length;
  const goodSleep = sleepAnswers.filter(s => s === '7-9').length;
  
  // Analyze exercise patterns
  const exerciseAnswers = recent.map(c => c.answers[3] || '').filter(Boolean);
  const noExercise = exerciseAnswers.filter(e => e === 'No').length;
  const hasExercise = exerciseAnswers.filter(e => e !== 'No').length;
  
  // Analyze meal patterns
  const mealAnswers = recent.map(c => c.answers[4] || '').filter(Boolean);
  const lowMeals = mealAnswers.filter(m => m === '1' || m === '2').length;
  const goodMeals = mealAnswers.filter(m => m === '3' || m === '4+').length;
  
  // Analyze focus patterns
  const focusAnswers = recent.map(c => c.answers[5] || '').filter(Boolean);
  const lowFocus = focusAnswers.filter(f => f === 'Not at all' || f === 'Somewhat').length;
  const goodFocus = focusAnswers.filter(f => f === 'Mostly' || f === 'Completely').length;
  
  // Build insights based on patterns
  const insights: string[] = [];
  const recommendations: string[] = [];
  
  // Sleep insights
  if (lowSleep > goodSleep) {
    insights.push(`You've had insufficient sleep (${lowSleep} out of ${recent.length} days). Aim for 7-9 hours for optimal productivity.`);
    recommendations.push('Try going to bed 30 minutes earlier each night. Create a bedtime routine: dim lights, avoid screens, and read a book.');
    recommendations.push('Set a consistent sleep schedule: aim for 7-9 hours of sleep and wake up at the same time every day, even on weekends.');
  } else if (goodSleep > 0) {
    insights.push(`Great job maintaining good sleep habits! You've had ${goodSleep} days with 7-9 hours of sleep.`);
  }
  
  // Exercise insights
  if (noExercise > hasExercise) {
    insights.push(`You've skipped exercise ${noExercise} out of ${recent.length} days. Regular movement boosts energy and focus.`);
    recommendations.push('Start with 10-minute walks daily. Try a morning walk to boost energy: walk for 10-15 minutes right after waking up.');
    recommendations.push('Schedule exercise like a meeting: block 30 minutes in your calendar for physical activity, even if it\'s just a brisk walk.');
  } else if (hasExercise > 0) {
    insights.push(`Excellent! You've exercised ${hasExercise} out of ${recent.length} days. Keep it up!`);
  }
  
  // Meal insights
  if (lowMeals > goodMeals) {
    insights.push(`You've been eating ${lowMeals} out of ${recent.length} days with only 1-2 meals. Regular meals fuel your brain.`);
    recommendations.push('Plan brain-boosting meals: Include protein (eggs, fish), complex carbs (oats, quinoa), and healthy fats (avocado, nuts) in each meal.');
    recommendations.push('Prep healthy snacks: Keep nuts, fruits, and yogurt handy for when you miss meals. Try meal prepping on Sundays for the week.');
  } else if (goodMeals > 0) {
    insights.push(`Good nutrition habits! You've had regular meals (3+) on ${goodMeals} out of ${recent.length} days.`);
  }
  
  // Focus insights
  if (lowFocus > goodFocus) {
    insights.push(`You've struggled with focus ${lowFocus} out of ${recent.length} days. Small changes can make a big difference.`);
    recommendations.push('Use the Pomodoro Technique: Work for 25 minutes, then take a 5-minute break. Repeat 4 times, then take a longer break.');
    recommendations.push('Minimize distractions: Turn off notifications, use website blockers, and create a dedicated workspace free from interruptions.');
  } else if (goodFocus > 0) {
    insights.push(`Strong focus! You've been mostly or completely focused ${goodFocus} out of ${recent.length} days.`);
  }
  
  // Default insights if no patterns detected
  if (insights.length === 0) {
    insights.push(`You've completed ${count} check-in${count !== 1 ? 's' : ''} so far. Consistency is key!`);
    insights.push('Your energy levels seem to vary throughout the week. Consider tracking patterns.');
    insights.push('Regular check-ins help build awareness of your daily habits and productivity.');
  }
  
  // Default recommendations if none added
  if (recommendations.length === 0) {
    recommendations.push('Try to check in at the same time each day to build a routine.');
    recommendations.push('Review your insights weekly to identify patterns and areas for improvement.');
    recommendations.push('Set small, achievable goals based on your check-in data.');
  }
  
    return {
      insights: insights.slice(0, 3), // Limit to 3 insights
      summary: `Based on your ${count} check-in${count !== 1 ? 's' : ''}, ${insights.length > 0 ? insights[0].toLowerCase() : 'you\'re building a solid foundation for tracking your productivity and lifestyle habits.'} Keep up the consistency!`,
      recommendations: recommendations.slice(0, 4), // Limit to 4 recommendations
    };
  }

