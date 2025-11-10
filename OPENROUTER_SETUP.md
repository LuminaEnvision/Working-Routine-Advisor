# OpenRouter AI Setup Guide

## Overview

The app uses OpenRouter AI to generate personalized daily check-in questions and provide comprehensive analysis with meal plans. OpenRouter provides access to multiple AI models through a single API.

## Setup Instructions

### 1. Get OpenRouter API Key

1. Go to [https://openrouter.ai](https://openrouter.ai)
2. Sign up for a free account or log in
3. Navigate to **Keys** in the sidebar
4. Click **"Create Key"**
5. Give your key a name (e.g., "Daily Check-in App")
6. **Copy the API key** - it starts with `sk-or-v1-...`

### 2. Add Environment Variable

Create a `.env` file in the root of your project (if it doesn't exist) and add:

```bash
VITE_OPENROUTER_API_KEY=sk-or-v1-your-api-key-here
```

**Optional:** You can also specify a different model:

```bash
VITE_OPENROUTER_API_KEY=sk-or-v1-your-api-key-here
VITE_OPENROUTER_MODEL=openrouter/polaris-alpha
```

**Default model:** `openrouter/polaris-alpha` (used if `VITE_OPENROUTER_MODEL` is not set)

### 3. Restart Your Dev Server

After adding the environment variable, restart your development server:

```bash
# Stop the current server (Ctrl+C)
# Then restart:
npm run dev
# or
pnpm dev
# or
bun dev
```

### 4. For Production Deployment (Vercel)

1. Go to your Vercel project dashboard
2. Navigate to **Settings → Environment Variables**
3. Add `VITE_OPENROUTER_API_KEY` with your OpenRouter API key
4. (Optional) Add `VITE_OPENROUTER_MODEL` if you want to use a different model
5. **Redeploy** your app

## How It Works

### Features Enabled

1. **Smart Question Generation**
   - Generates 6 contextual questions based on time of day (morning/afternoon/evening)
   - Adapts questions based on previous check-in data
   - Follows up on issues (e.g., poor sleep → sleep improvement questions)

2. **Comprehensive Analysis**
   - Overall assessment of lifestyle patterns
   - Key areas of concern
   - Prioritized actionable recommendations
   - Personalized meal plans with recipes (breakfast, lunch, dinner)
   - Quick wins for immediate improvement
   - Tracking metrics to monitor

### Fallback Behavior

If `VITE_OPENROUTER_API_KEY` is not set:
- The app will use **fallback questions** (predefined set of 6 questions)
- The app will use **fallback analysis** (basic recommendations without meal plans)
- The app will still function, but without AI-powered personalization

## Available Models

You can use any model available on OpenRouter. Some popular options:

- `openrouter/polaris-alpha` (default) - Fast and capable
- `openrouter/auto` - Automatically selects the best model
- `anthropic/claude-3.5-sonnet` - High quality, more expensive
- `openai/gpt-4-turbo` - OpenAI's latest model
- `google/gemini-pro-1.5` - Google's Gemini model

To use a different model, set `VITE_OPENROUTER_MODEL` in your `.env` file.

## Troubleshooting

### "VITE_OPENROUTER_API_KEY not set. Using fallback questions."

**Solution:**
- Make sure `VITE_OPENROUTER_API_KEY` is set in your `.env` file
- Restart your dev server after adding the variable
- Check that the API key is correct (no extra spaces or quotes)
- Verify the key starts with `sk-or-v1-`

### API Errors

**Common issues:**
- **401 Unauthorized**: Check your API key is correct
- **429 Too Many Requests**: You've hit the rate limit. Wait a moment and try again
- **500 Internal Server Error**: OpenRouter service issue. Try again later

### Questions Not Generating

**Check:**
1. Browser console for error messages
2. Network tab to see if API calls are being made
3. That your API key has sufficient credits/quota

## Cost Considerations

OpenRouter uses a pay-per-use model:
- Free tier available with limited credits
- Costs vary by model (check OpenRouter pricing)
- `openrouter/polaris-alpha` is cost-effective for this use case
- Monitor your usage in the OpenRouter dashboard

## Security Notes

- **Never commit your `.env` file to git** (it should already be in `.gitignore`)
- Keep your API key secret
- Use environment variables for all API keys
- Rotate your API key if it's exposed

