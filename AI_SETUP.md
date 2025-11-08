# AI Insights & Chatbot Setup Guide

## Overview

Your app now includes AI-powered insights and a chatbot feature that analyzes check-in data and provides personalized recommendations. Here's how to set it up.

## Features Implemented

### 1. **AI Insights Generation**
- Analyzes check-in history from localStorage
- Generates personalized insights, summary, and recommendations
- Uses Google Gemini API (with fallback to mock insights if API key not set)

### 2. **Insights Display Component**
- Shows written insights in a clean, mobile-first UI
- Displays summary, key insights, and actionable recommendations
- Includes loading states and empty states

### 3. **AI Chatbot**
- Dialog-based chat interface
- Users can ask questions about their insights, habits, and lifestyle
- Context-aware responses based on check-in history
- Mobile-optimized with auto-scroll

## Setup Instructions

### 1. Get Google Gemini API Key

1. Go to https://aistudio.google.com/
2. Sign in with your Google account
3. Click "Get API Key"
4. Create a new API key
5. Copy the key (starts with `AIza...`)

### 2. Add Environment Variable

Add to your `.env` file:

```bash
VITE_GEMINI_API_KEY=AIza-your-api-key-here
```

**For Vercel deployment:**
1. Go to your Vercel project dashboard
2. Navigate to Settings → Environment Variables
3. Add `VITE_GEMINI_API_KEY` with your Gemini API key
4. Redeploy your app

### 3. Current Configuration

The app is configured to use **Google Gemini 1.5 Flash** model:
- Fast and cost-effective
- Good for generating insights and chat responses
- Free tier available with generous limits

### 4. Alternative Models

You can change the model in `src/lib/ai.ts`:
- `gemini-1.5-flash` (current) - Fast, cost-effective
- `gemini-1.5-pro` - More capable, slower
- `gemini-pro` - Previous generation

## How It Works

### Flow

1. **User completes check-in** → Data saved to localStorage and IPFS
2. **User navigates to Recommendations page** → Check-in history loaded
3. **AI generates insights** → `generateInsights()` called with check-in data
4. **Insights displayed** → `InsightsDisplay` component shows results
5. **User clicks "Ask AI Coach"** → Chatbot dialog opens
6. **User asks questions** → `handleChatbotQuery()` processes query with context

### Data Structure

**Check-in Data:**
```typescript
interface CheckInData {
  answers: Record<string, string>;  // Question ID → Answer
  timestamp: string;                  // ISO timestamp
  ipfsHash?: string;                  // IPFS CID (optional)
}
```

**Insight Response:**
```typescript
interface InsightResponse {
  insights: string[];        // 3-5 key insights
  summary: string;           // Brief summary (2-3 sentences)
  recommendations: string[]; // 3-5 actionable recommendations
}
```

## Cost Considerations

### Google Gemini Pricing (as of 2024)
- **gemini-1.5-flash**: Free tier with 15 requests per minute
- **Paid tier**: Very affordable pricing
- **Estimated cost per user per month**:
  - Insights generation: ~$0.001-0.002 per check-in
  - Chatbot queries: ~$0.0001-0.0002 per message
  - **Total**: ~$0.10-0.20 per active user per month (or free with free tier)

### Cost Optimization Tips

1. **Cache insights**: Generate insights once per day, not on every page load
2. **Limit history**: Only analyze last 7-14 check-ins
3. **Use Flash model**: `gemini-1.5-flash` is fast and cost-effective
4. **Rate limiting**: Limit chatbot queries per user per day
5. **Mock mode**: Use mock insights for testing/development
6. **Free tier**: Gemini offers generous free tier for development

## Testing Without API Key

If you don't set `VITE_GEMINI_API_KEY`, the app will:
- Use mock insights (still functional)
- Show fallback chatbot responses
- Work perfectly for UI/UX testing

## Components

### `src/lib/ai.ts`
- `generateInsights()`: Generates insights from check-in history
- `handleChatbotQuery()`: Handles chatbot questions
- `getMockInsights()`: Fallback mock insights

### `src/components/InsightsDisplay.tsx`
- Displays insights in cards
- Shows loading states
- Handles empty states

### `src/components/Chatbot.tsx`
- Dialog-based chat interface
- Message history
- Auto-scroll and focus management

### `src/pages/Recommendations.tsx`
- Loads check-in history
- Triggers insight generation
- Manages chatbot dialog state

## Security Notes

1. **API Keys**: Never commit API keys to git
2. **Rate Limiting**: Consider adding rate limiting on your backend
3. **Input Validation**: Chatbot queries are sent to Gemini API - validate/sanitize if needed
4. **Cost Monitoring**: Set up Google Cloud usage alerts
5. **API Key Restrictions**: In Google Cloud Console, set restrictions on your API key to limit usage

## Future Enhancements

- [ ] Cache insights in localStorage or backend
- [ ] Add rate limiting for chatbot queries
- [ ] Support for multiple AI providers
- [ ] Custom prompts per user preference
- [ ] Export insights as PDF
- [ ] Share insights with friends
- [ ] Historical insights comparison

