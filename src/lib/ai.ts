/**
 * AI Service for generating insights and handling chatbot queries
 * Uses Google Gemini API
 */

interface CheckInData {
  answers: Record<string, string>;
  timestamp: string;
  ipfsHash?: string;
}

interface InsightResponse {
  insights: string[];
  summary: string;
  recommendations: string[];
}

/**
 * Generate AI insights from check-in history
 */
export const generateInsights = async (checkIns: CheckInData[]): Promise<InsightResponse> => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  
  if (!apiKey) {
    // Fallback to mock insights if API key not set
    return getMockInsights(checkIns);
  }

  try {
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

    const prompt = `You are a productivity and lifestyle coach analyzing daily check-in data. 
Based on the following check-in history, provide personalized insights:

${historyText}

Please provide:
1. 3-5 key insights about their productivity patterns, energy levels, and habits
2. A brief summary (2-3 sentences) of their overall progress
3. 3-5 actionable recommendations for improvement

Format your response as JSON only (no markdown, no code blocks):
{
  "insights": ["insight 1", "insight 2", ...],
  "summary": "brief summary text",
  "recommendations": ["recommendation 1", "recommendation 2", ...]
}`;

    // Gemini API endpoint
    const model = 'gemini-1.5-flash'; // Fast and cost-effective model
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1000,
          responseMimeType: 'application/json',
        },
        systemInstruction: {
          parts: [
            {
              text: 'You are a helpful productivity coach. Always respond with valid JSON only, no markdown formatting.',
            },
          ],
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Gemini API error: ${response.statusText} - ${errorData}`);
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!content) {
      throw new Error('No response from Gemini API');
    }

    // Parse JSON response (remove markdown code blocks if present)
    const cleanedContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleanedContent);
    
    return {
      insights: parsed.insights || [],
      summary: parsed.summary || '',
      recommendations: parsed.recommendations || [],
    };
  } catch (error) {
    console.error('Failed to generate insights:', error);
    // Fallback to mock insights
    return getMockInsights(checkIns);
  }
};

/**
 * Handle chatbot query about insights and lifestyle
 */
export const handleChatbotQuery = async (
  query: string,
  checkIns: CheckInData[],
  previousInsights?: InsightResponse
): Promise<string> => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  if (!apiKey) {
    // Fallback response
    return "I'm here to help! To enable AI chat, please set VITE_GEMINI_API_KEY in your environment variables. For now, I can tell you that regular check-ins help build better habits and productivity patterns.";
  }

  try {
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

    // Gemini API endpoint
    const model = 'gemini-1.5-flash'; // Fast and cost-effective model
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 300,
        },
        systemInstruction: {
          parts: [
            {
              text: 'You are a helpful productivity coach. Keep responses concise and actionable (2-3 sentences max).',
            },
          ],
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Gemini API error: ${response.statusText} - ${errorData}`);
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    return content || 'Sorry, I could not generate a response.';
  } catch (error) {
    console.error('Chatbot query failed:', error);
    return "I'm having trouble processing that right now. Please try again later or check your API configuration.";
  }
};

/**
 * Mock insights for when API is not configured
 */
function getMockInsights(checkIns: CheckInData[]): InsightResponse {
  const count = checkIns.length;
  
  return {
    insights: [
      `You've completed ${count} check-in${count !== 1 ? 's' : ''} so far. Consistency is key!`,
      'Your energy levels seem to vary throughout the week. Consider tracking patterns.',
      'Regular check-ins help build awareness of your daily habits and productivity.',
    ],
    summary: `Based on your ${count} check-in${count !== 1 ? 's' : ''}, you're building a solid foundation for tracking your productivity and lifestyle habits. Keep up the consistency!`,
    recommendations: [
      'Try to check in at the same time each day to build a routine.',
      'Review your insights weekly to identify patterns and areas for improvement.',
      'Set small, achievable goals based on your check-in data.',
      'Share your progress with friends or join a community for accountability.',
    ],
  };
}

