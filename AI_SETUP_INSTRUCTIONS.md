# AI Integration Layer - Package Dependencies

Add these dependencies to your `backend/package.json`:

```json
{
  "dependencies": {
    "@anthropic-ai/sdk": "^0.20.0",
    "@google/generative-ai": "^0.3.0",
    "openai": "^4.28.0"
  }
}
```

## Installation Commands

```bash
cd backend
npm install @anthropic-ai/sdk @google/generative-ai openai
```

## Environment Variables

Add these to your `.env` file:

```bash
# OpenAI
OPENAI_API_KEY=sk-your-openai-key

# Anthropic (Claude)
ANTHROPIC_API_KEY=sk-ant-your-anthropic-key

# Google Gemini
GEMINI_API_KEY=your-gemini-key

# Ollama (Self-hosted)
OLLAMA_BASE_URL=http://localhost:11434

# Optional: Default LLM provider
DEFAULT_LLM_PROVIDER=openai
DEFAULT_LLM_MODEL=gpt-4o
```

## Database Migration

Run the database migration to add AI tables:

```bash
cd backend
npx prisma migrate dev --name add_ai_features
npx prisma generate
```

## Testing the Installation

```bash
# Start Ollama (if using self-hosted)
ollama serve
ollama pull llama3

# Test the backend
cd backend
npm run dev

# Test AI endpoint
curl -X POST http://localhost:3000/api/ai/providers \
  -H "Content-Type: application/json"
```

## Verify Installation

1. Start your backend server
2. Navigate to AI Settings in the frontend
3. Configure an LLM provider
4. Create a test workflow with an AI node
5. Check the token usage dashboard

## Optional: Install Ollama

For self-hosted AI without API costs:

```bash
# Linux/Mac
curl -fsSL https://ollama.com/install.sh | sh

# Windows
# Download from https://ollama.com/download

# Pull models
ollama pull llama3        # 4.7GB
ollama pull mistral       # 4.1GB
ollama pull phi           # 1.6GB (lightweight)
```

## Frontend Setup

The frontend components are already created. Just ensure your routes are configured:

```typescript
// frontend/src/App.tsx
import { AISettingsPage } from './pages/AISettingsPage';

// Add route
<Route path="/ai-settings" element={<AISettingsPage />} />
```
