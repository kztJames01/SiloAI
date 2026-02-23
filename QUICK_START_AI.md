# 🚀 AI Integration Layer - Quick Start

## Installation & Setup (5 minutes)

### 1. Install Backend Dependencies
```bash
cd backend
npm install @google/generative-ai
npx prisma generate
npx prisma migrate dev --name add_ai_features
```

### 2. Configure Environment Variables
Add to `backend/.env`:
```bash
# At minimum, choose ONE provider:

# Option 1: Ollama (Free, Self-hosted, Recommended for testing)
OLLAMA_BASE_URL=http://localhost:11434

# Option 2: OpenAI
OPENAI_API_KEY=sk-your-key-here

# Option 3: Anthropic (Claude)
ANTHROPIC_API_KEY=sk-ant-your-key-here

# Option 4: Google Gemini
GEMINI_API_KEY=your-key-here
```

### 3. Install Ollama (Optional but Recommended)
For FREE, self-hosted AI with no API costs:
```bash
# macOS/Linux
curl -fsSL https://ollama.com/install.sh | sh

# Start Ollama
ollama serve

# Pull a model (in another terminal)
ollama pull llama3
```

### 4. Start the Servers
```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend  
cd frontend
npm run dev
```

### 5. Test the Integration
1. Open browser: `http://localhost:5173`
2. Login to your account
3. Navigate to **AI Settings** (or add route if needed)
4. Configure your LLM provider
5. Create a test workflow with an AI node

## Your First AI Workflow

### Example: Customer Feedback Analyzer

1. **Add a Start Node**
2. **Add "Sentiment Analysis" Node** (from AI category)
   - Connect from Start
   - Configure:
     ```json
     {
       "text": "{{ input.feedback }}",
       "provider": "ollama",
       "model": "llama3"
     }
     ```

3. **Add "Entity Extraction" Node**
   - Connect from Sentiment Analysis
   - Configure:
     ```json
     {
       "text": "{{ input.feedback }}",
       "entityTypes": ["product", "issue", "person"]
     }
     ```

4. **Add "If" Node** (Logic)
   - Connect from Sentiment Analysis
   - Condition: `sentiment.score < -0.5` (negative feedback)

5. **Add "HTTP Request" Node** (Notify team)
   - Connect from If (true branch)
   - Send notification about negative feedback

6. **Save and Test!**

## Quick Test Without UI

### Test AI Completion API
```bash
curl -X POST http://localhost:3000/api/ai/complete \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "provider": "ollama",
    "model": "llama3",
    "messages": [
      { "role": "user", "content": "Say hello!" }
    ]
  }'
```

### Test Providers List
```bash
curl http://localhost:3000/api/ai/providers \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Common Issues & Solutions

### "Cannot find module shared/src/types/ai"
This is a TypeScript path resolution issue. The code will work at runtime. To fix:
```bash
cd backend
npx tsc --noEmit  # Check for real errors
npm run dev       # Should work despite warnings
```

### "Ollama connection refused"
Make sure Ollama is running:
```bash
ollama serve
# In another terminal:
ollama list  # Should show installed models
```

### "API key is invalid"
Double-check your `.env` file:
```bash
cd backend
cat .env | grep API_KEY  # Verify keys are set
```

### TypeScript errors in IDE
Run the build to generate types:
```bash
cd backend
npx prisma generate
cd ../shared
npm run build  # If you have a build script
```

## Verify Everything Works

✅ Backend starts without errors
✅ Can access `http://localhost:3000/health`
✅ Frontend loads at `http://localhost:5173`
✅ Can login to your account
✅ AI nodes appear in node palette
✅ Can configure LLM provider in settings

## Next Steps

1. **Read the Full Guide**: [AI_INTEGRATION_GUIDE.md](./AI_INTEGRATION_GUIDE.md)
2. **Try Prompt Templates**: Create reusable prompts
3. **Monitor Token Usage**: Check the analytics dashboard
4. **Debug AI Operations**: Use the debug panel
5. **Create Advanced Workflows**: Try the AI Agent node

## Getting Help

**Error Messages**: Check the debug panel and server logs
**Provider Issues**: Consult the provider's documentation
**Cost Concerns**: Use Ollama for development/testing

## Ollama Models Recommendations

```bash
# General purpose (4.7GB)
ollama pull llama3

# Fast and efficient (4.1GB)
ollama pull mistral

# Lightweight (1.6GB)
ollama pull phi

# Code generation (3.8GB)
ollama pull codellama

# Latest and greatest (4.7GB)
ollama pull llama3.1
```

## Pro Tips

1. **Start with Ollama** - Free, fast, private
2. **Use Templates** - Save time and tokens
3. **Monitor Costs** - Check token dashboard regularly
4. **Test Locally First** - Before using paid APIs
5. **Read Debug Logs** - They show exactly what's happening

---

**Time to First AI Workflow**: ~5-10 minutes with Ollama 🚀

Questions? Check [AI_INTEGRATION_GUIDE.md](./AI_INTEGRATION_GUIDE.md) for detailed documentation!
