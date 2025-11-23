# AI API Setup Guide

This guide will help you set up the Gemini API key needed for AI features in the Working Routine Advisor app.

## Google Gemini API Setup

**Why Gemini?**
- Free tier available (60 requests/minute)
- High-quality AI responses
- No CORS issues
- Multiple model versions for reliability
- Easy to set up

---

## How to Get Your Gemini API Key

### Step 1: Go to Google AI Studio
Visit [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)

### Step 2: Sign In
Sign in with your Google account

### Step 3: Create API Key
1. Click "Create API Key"
2. Select "Create API key in new project" (or use an existing project)
3. Copy your API key (starts with `AIzaSy...`)

### Step 4: Add to Your `.env` File
Create or edit the `.env` file in your project root:

```bash
VITE_GEMINI_API_KEY=AIzaSyxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### Step 5: Restart Dev Server
```bash
npm run dev
```

---

## Testing Your Setup

After adding your API key:

1. **Check the browser console** for messages like:
   - ✅ `"Successfully using Gemini model: gemini-2.0-flash-exp"`

2. **Test AI features:**
   - Go to Daily Check-in page
   - Complete a check-in
   - Go to Recommendations page
   - You should see AI-generated insights

---

## Available Gemini Models

The app automatically tries these models in order:
1. **gemini-2.0-flash-exp** - Latest experimental flash model (fastest)
2. **gemini-exp-1206** - Experimental model from Dec 2024
3. **gemini-2.0-flash-thinking-exp-1219** - Advanced reasoning model

If one model fails, it automatically falls back to the next one.

---

## Troubleshooting

### "VITE_GEMINI_API_KEY not configured" error
- Make sure your `.env` file is in the project root directory
- Check that the variable name is exactly `VITE_GEMINI_API_KEY`
- Restart your dev server after adding the key

### "Gemini API error: 400" 
- Verify your API key is correct (copy-paste from Google AI Studio)
- Make sure you haven't exceeded rate limits (60 requests/minute)

### "Gemini API error: 429" (Rate limit)
- You've exceeded the free tier limit (60 requests/minute)
- Wait a minute and try again
- Consider upgrading to a paid plan if needed

### No AI insights showing
- Check browser console for error messages
- Verify your API key is set correctly
- Make sure you have internet connection
- Try refreshing the page

---

## Free Tier Limits

Google Gemini free tier includes:
- **60 requests per minute**
- **1,500 requests per day**
- **1 million tokens per month**

This is more than enough for personal use of the Working Routine Advisor app!

---

## Need Help?

If you're still having issues:
1. Check the browser console for detailed error messages
2. Verify your API key at [Google AI Studio](https://aistudio.google.com/app/apikey)
3. Make sure your `.env` file is properly formatted
4. Restart your development server

The app includes fallback questions and insights if the API fails, so you can still use basic features without an API key.


---

## 1. OpenRouter API (Recommended) ⭐

**Why OpenRouter?**
- Uses free Grok-4.1-fast model (no cost)
- Most reliable for browser apps
- No CORS issues
- Best quality responses

**How to get your API key:**

1. Go to [https://openrouter.ai/](https://openrouter.ai/)
2. Sign up for a free account
3. Go to [https://openrouter.ai/keys](https://openrouter.ai/keys)
4. Click "Create Key"
5. Copy your API key

**Add to your `.env` file:**
```bash
VITE_OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxxxxxxxxxxx
VITE_OPENROUTER_MODEL=x-ai/grok-4.1-fast:free
```

---

## 2. Google Gemini API (Alternative)

**Why Gemini?**
- Free tier available (60 requests/minute)
- Good quality responses
- No CORS issues
- Multiple model versions available

**How to get your API key:**

1. Go to [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Select "Create API key in new project" or use existing project
5. Copy your API key

**Add to your `.env` file:**
```bash
VITE_GEMINI_API_KEY=AIzaSyxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

## 3. Hugging Face API (Fallback)

**⚠️ Note:** Hugging Face has CORS restrictions for browser requests. It may not work without a backend proxy.

**How to get your API key:**

1. Go to [https://huggingface.co/](https://huggingface.co/)
2. Sign up for a free account
3. Go to [https://huggingface.co/settings/tokens](https://huggingface.co/settings/tokens)
4. Click "New token"
5. Give it a name and select "read" permissions
6. Copy your token

**Add to your `.env` file:**
```bash
VITE_HUGGINGFACE_API_KEY=hf_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

## Complete .env File Example

Create a `.env` file in your project root with:

```bash
# AI API Keys (add at least one)
VITE_OPENROUTER_API_KEY=your_openrouter_key_here
VITE_OPENROUTER_MODEL=x-ai/grok-4.1-fast:free
VITE_GEMINI_API_KEY=your_gemini_key_here
VITE_HUGGINGFACE_API_KEY=your_huggingface_key_here

# Blockchain & IPFS (if you have them)
VITE_PINATA_JWT=your_pinata_jwt_here
VITE_PINATA_GATEWAY=your_pinata_gateway_url_here
```

---

## Testing Your Setup

After adding your API keys:

1. **Restart your dev server:**
   ```bash
   npm run dev
   ```

2. **Check the browser console** for messages like:
   - ✅ `"Successfully using OpenRouter API"` 
   - ✅ `"Successfully using Gemini model: gemini-2.5-flash"`

3. **Test AI features:**
   - Go to Daily Check-in page
   - Complete a check-in
   - Go to Recommendations page
   - You should see AI-generated insights

---

## Troubleshooting

### "No AI API keys configured" error
- Make sure your `.env` file is in the project root
- Check that variable names start with `VITE_`
- Restart your dev server after adding keys

### OpenRouter not working
- Verify your API key is correct
- Check you have credits/free tier available
- Look for error messages in browser console

### Gemini not working
- Make sure you're using a valid API key
- Check you haven't exceeded rate limits (60 req/min)
- Try using `gemini-2.5-flash` model (fastest)

### Hugging Face CORS errors
- This is expected in browser environments
- Use OpenRouter or Gemini instead
- Or set up a backend proxy for Hugging Face

---

## Recommended Setup

For best results, add **both OpenRouter and Gemini** keys:
- OpenRouter as primary (free Grok model)
- Gemini as backup (in case OpenRouter has issues)

This gives you redundancy and ensures AI features always work!
