# AI Integration Layer - Complete Guide

## Overview

Silo now features a comprehensive AI Integration Layer that enables deep AI capabilities in your workflow automation. This guide explains all AI features, how to use them, and best practices for implementation.

## 🎯 Key Features

### 1. **Multi-Provider LLM Support**
- **OpenAI** (GPT-4, GPT-3.5-turbo)
- **Anthropic** (Claude 3 family)
- **Google Gemini** (Gemini Pro, Gemini 1.5)
- **Ollama** (Self-hosted local models)
- **Custom Endpoints** (Any OpenAI-compatible API)

### 2. **AI Node Library**
Nine specialized AI nodes for different use cases:
- LLM Completion
- Prompt Templates
- AI Agent (autonomous decision-making)
- Text Classification
- Entity Extraction
- Sentiment Analysis
- AI Data Transform
- Workflow Generation
- Conversation (multi-turn with memory)

### 3. **Advanced Features**
- Prompt templating system with variable substitution
- Context management for multi-turn conversations
- Token usage tracking and cost analytics
- AI debugging tools with performance analysis
- RAG (Retrieval Augmented Generation) support

---

## 🚀 Quick Start

### Step 1: Configure Your LLM Provider

#### Option A: Using OpenAI
```typescript
// Set environment variable
OPENAI_API_KEY=sk-your-api-key

// Or configure in UI (AI Settings page)
provider: "openai"
model: "gpt-4o"
apiKey: "sk-your-api-key" // optional if env var is set
```

#### Option B: Using Ollama (Self-hosted, Free)
```bash
# Install Ollama
curl -fsSL https://ollama.com/install.sh | sh

# Pull a model
ollama pull llama3

# Configure in Silo
provider: "ollama"
model: "llama3"
baseUrl: "http://localhost:11434"
```

#### Option C: Using Claude (Anthropic)
```typescript
ANTHROPIC_API_KEY=sk-ant-your-api-key

provider: "anthropic"
model: "claude-3-5-sonnet-20241022"
```

#### Option D: Using Gemini
```typescript
GEMINI_API_KEY=your-api-key

provider: "gemini"
model: "gemini-1.5-pro"
```

### Step 2: Add AI Nodes to Your Workflow

1. Open the workflow editor
2. Navigate to the **AI** category in the node palette
3. Drag an AI node into your workflow
4. Connect it to other nodes
5. Configure the node parameters

---

## 📚 AI Nodes Reference

### 1. LLM Completion Node

**Purpose**: Generate text completions using any LLM provider

**Inputs**:
- `provider`: LLM provider (openai, anthropic, gemini, ollama, custom)
- `model`: Model name (e.g., gpt-4o, claude-3-sonnet)
- `apiKey`: API key (optional if using env variables)
- `baseUrl`: Base URL for custom/Ollama endpoints
- `systemPrompt`: System prompt to set AI behavior
- `prompt`: User prompt/message (required)
- `temperature`: Creativity level (0-2, default 0.7)
- `maxTokens`: Maximum tokens to generate
- `stream`: Enable streaming response

**Outputs**:
- `response`: Generated text
- `usage`: Token usage and cost information
- `model`: Model that was used

**Example Use Case**: Generate customer support responses
```json
{
  "provider": "openai",
  "model": "gpt-4o",
  "systemPrompt": "You are a helpful customer support agent.",
  "prompt": "How do I reset my password?",
  "temperature": 0.7
}
```

### 2. Prompt Template Node

**Purpose**: Use reusable prompt templates with variable substitution

**Inputs**:
- `templateId`: ID of template from library (e.g., "data_transform")
- `customTemplate`: Custom template with `{{ variable }}` syntax
- `variables`: Object with variable values
- `provider`, `model`, etc.: LLM configuration

**Outputs**:
- `response`: Generated response
- `renderedPrompt`: The prompt that was sent
- `usage`: Token usage

**Built-in Templates**:
- `data_transform`: Transform data formats
- `code_generation`: Generate code
- `summarization`: Summarize text
- `classification`: Classify text
- `entity_extraction`: Extract entities
- `question_answering`: Answer questions
- `workflow_generation`: Generate workflows

**Example**:
```json
{
  "templateId": "summarization",
  "variables": {
    "text": "Long article text here...",
    "length": 3,
    "focus": "key business insights"
  }
}
```

### 3. AI Agent Node

**Purpose**: Autonomous AI that can reason and take actions

**Inputs**:
- `systemPrompt`: Agent behavior and capabilities
- `task`: Task for the agent to complete
- `context`: Additional context data
- `maxIterations`: Max reasoning steps (default 5)
- `tools`: Available tools for the agent

**Outputs**:
- `result`: Final result
- `steps`: Array of reasoning steps
- `totalUsage`: Total token usage

**Example**: Research and analysis agent
```json
{
  "systemPrompt": "You are a market research analyst. Break down complex tasks, analyze data, and provide insights.",
  "task": "Analyze the competitive landscape for SaaS workflow tools",
  "maxIterations": 5
}
```

### 4. Text Classification Node

**Purpose**: Classify text into predefined categories

**Example**: Email routing
```json
{
  "text": "I need help with my order #12345",
  "categories": ["support", "sales", "billing", "general"]
}
// Output: { category: "support", confidence: 0.95 }
```

### 5. Entity Extraction Node

**Purpose**: Extract structured data from unstructured text

**Example**: Parse customer feedback
```json
{
  "text": "John Smith from Acme Corp called about invoice #5678 on March 15th",
  "entityTypes": ["names", "companies", "invoice_numbers", "dates"]
}
// Output: { 
//   names: ["John Smith"],
//   companies: ["Acme Corp"],
//   invoice_numbers: ["#5678"],
//   dates: ["March 15th"]
// }
```

### 6. Sentiment Analysis Node

**Purpose**: Analyze sentiment and emotions in text

**Example**: Social media monitoring
```json
{
  "text": "I absolutely love this product! Best purchase ever!"
}
// Output: {
//   sentiment: "positive",
//   score: 0.92,
//   emotions: { joy: 0.85, surprise: 0.15 }
// }
```

### 7. AI Data Transform Node

**Purpose**: Transform data using natural language instructions

**Example**: Convert formats
```json
{
  "data": { "first": "John", "last": "Doe", "age": 30 },
  "instructions": "Convert to full name and add a greeting",
  "outputFormat": "json"
}
// Output: { 
//   "greeting": "Hello, John Doe! You are 30 years old."
// }
```

### 8. Workflow Generation Node

**Purpose**: Generate workflows from natural language descriptions

**Example**: Auto-create workflows
```json
{
  "description": "When a customer submits feedback, analyze sentiment, extract key topics, and notify the team",
  "industry": "retail",
  "complexity": "moderate"
}
// Output: Complete workflow structure with nodes and connections
```

### 9. Conversation Node

**Purpose**: Multi-turn conversations with memory

**Example**: Chatbot
```json
{
  "message": "What features do you offer?",
  "conversationId": "conv_123",
  "systemPrompt": "You are a product specialist",
  "maxHistory": 10
}
// Output: { 
//   response: "We offer...",
//   conversationId: "conv_123",
//   messageCount: 4
// }
```

---

## 🔐 Data Privacy & Security

### Self-Hosted Options

**Why use self-hosted models?**
- Complete data privacy
- No external API calls
- HIPAA/GDPR compliance
- Zero API costs

**Recommended: Ollama**
```bash
# Install Ollama
curl -fsSL https://ollama.com/install.sh | sh

# Pull models
ollama pull llama3        # General purpose
ollama pull mistral       # Fast and efficient
ollama pull codellama     # Code generation
ollama pull phi           # Lightweight

# Run with Docker (optional)
docker run -d -v ollama:/root/.ollama -p 11434:11434 --name ollama ollama/ollama
```

**Custom Endpoints**
Host your own LLM API using:
- vLLM
- text-generation-inference
- LocalAI
- LM Studio

Configure as provider: "custom" with your baseUrl.

---

## 📊 Token Usage & Cost Management

### Monitoring Usage

**Dashboard**: Navigate to AI Settings → Token Usage

**Key Metrics**:
- Total tokens used
- Total cost estimate
- Usage by provider
- Usage by model
- Usage by workflow

**API Endpoint**:
```typescript
GET /api/ai/token-usage?days=30
```

### Cost Optimization Tips

1. **Use appropriate models**
   - GPT-4o for complex reasoning
   - GPT-3.5-turbo for simple tasks
   - Ollama for development

2. **Set max token limits**
   ```json
   { "maxTokens": 500 }
   ```

3. **Use prompt templates**
   - Reuse optimized prompts
   - Reduce trial-and-error

4. **Cache responses**
   - Store common query results
   - Reduce duplicate API calls

5. **Use cheaper models when possible**
   - Claude Haiku for fast, simple tasks
   - Gemini Flash for high-throughput

### Pricing Reference (2026 rates per 1M tokens)

| Provider | Model | Input | Output |
|----------|-------|-------|--------|
| OpenAI | GPT-4o | $5 | $15 |
| OpenAI | GPT-4-turbo | $10 | $30 |
| OpenAI | GPT-3.5-turbo | $0.50 | $1.50 |
| Anthropic | Claude 3.5 Sonnet | $3 | $15 |
| Anthropic | Claude 3 Haiku | $0.25 | $1.25 |
| Gemini | Gemini 1.5 Pro | $1.25 | $5 |
| Gemini | Gemini Flash | $0.075 | $0.30 |
| Ollama | All models | $0 | $0 |

---

## 🐛 Debugging AI Workflows

### AI Debug Panel

Access via: Execution Details → AI Debug Tab

**Features**:
- View all AI operations
- Inspect prompts and responses
- Analyze token usage per call
- Track latency
- Identify errors

**Performance Analysis**:
- Slow nodes (>5s latency)
- High token usage nodes (>10k tokens)
- Error-prone nodes
- Cost optimization suggestions

### Example Debug Session
```json
{
  "executionId": "exec_123",
  "summary": {
    "totalCalls": 5,
    "totalTokens": 2450,
    "totalCost": 0.0123,
    "avgLatency": 1200,
    "errors": 0
  },
  "recommendations": [
    "Node llm_1 uses many tokens. Consider shorter prompts.",
    "Consider using a faster model for simple tasks."
  ]
}
```

---

## 🎨 Creating Custom Prompt Templates

### Via UI (Recommended)

1. Navigate to AI Settings → Prompt Templates
2. Click "Create New Template"
3. Define your template with `{{ variables }}`
4. Extract variables automatically
5. Set variable types and defaults
6. Save and reuse

### Programmatically

```typescript
import { PromptLibrary } from './ai/PromptTemplateEngine';

PromptLibrary.register({
  id: 'my_custom_template',
  name: 'Customer Onboarding',
  description: 'Generate personalized onboarding emails',
  template: `Welcome {{ customerName }} to {{ productName }}!

Your account is ready at {{ accountUrl }}.

{{ customMessage }}`,
  systemPrompt: 'You are a friendly customer success manager.',
  variables: [
    { name: 'customerName', type: 'string', required: true },
    { name: 'productName', type: 'string', required: true },
    { name: 'accountUrl', type: 'string', required: true },
    { name: 'customMessage', type: 'string', required: false, default: '' }
  ]
});
```

---

## 🔄 RAG (Retrieval Augmented Generation)

### Coming Features
- Vector database integration (Pinecone, Weaviate, Chroma)
- Document indexing and embedding
- Semantic search
- Context injection

### Current Workaround
Use the HTTP Request node to query your vector database, then pass results to an AI node:

```
[HTTP Request] → Query Vector DB
    ↓
[LLM Completion] → Generate answer with context
```

---

## 🌐 API Reference

### Complete an AI Task
```typescript
POST /api/ai/complete
{
  "provider": "openai",
  "model": "gpt-4o",
  "messages": [
    { "role": "system", "content": "You are helpful" },
    { "role": "user", "content": "Hello!" }
  ],
  "temperature": 0.7
}
```

### Get Token Usage
```typescript
GET /api/ai/token-usage?days=30
```

### Get Debug Logs
```typescript
GET /api/ai/debug/:executionId
```

### List Templates
```typescript
GET /api/ai/templates
```

### Create Template
```typescript
POST /api/ai/templates
{
  "name": "My Template",
  "template": "Hello {{ name }}",
  "variables": [...]
}
```

---

## 📋 Best Practices

### 1. Start with Self-Hosted
- Use Ollama during development
- Switch to cloud APIs for production

### 2. Use Appropriate Models
- Simple tasks → GPT-3.5 / Claude Haiku
- Complex reasoning → GPT-4 / Claude Opus
- Code generation → GPT-4o / Claude Sonnet

### 3. Implement Error Handling
```json
{
  "nodes": [
    { "type": "llmCompletion", "id": "ai_1" },
    { "type": "if", "condition": "ai_1.error !== null" },
    { "type": "notification", "message": "AI failed" }
  ]
}
```

### 4. Monitor Costs
- Set up alerts for high usage
- Review token usage weekly
- Optimize prompts regularly

### 5. Secure API Keys
- Use environment variables
- Never commit keys to git
- Rotate keys regularly

### 6. Test Prompts Thoroughly
- Use the debug panel
- Compare model outputs
- A/B test different prompts

---

## 🔧 Troubleshooting

### "API key is invalid"
- Check environment variables
- Verify key hasn't expired
- Test key with provider's playground

### "Rate limit exceeded"
- Implement backoff/retry logic
- Consider upgrading API tier
- Use request queuing

### "Model not found"
- Verify model name spelling
- Check provider documentation
- Some models require special access

### "High latency"
- Use faster models (Haiku, 3.5-turbo)
- Reduce max_tokens
- Consider caching

### "Ollama connection refused"
- Ensure Ollama is running: `ollama serve`
- Check baseUrl is correct
- Verify firewall settings

---

## 🎓 Example Workflows

### 1. Customer Support Automation
```
[Webhook] → Receive support ticket
    ↓
[Text Classification] → Categorize urgency
    ↓
[If] → High urgency?
    ↓ yes
[LLM Completion] → Generate response
    ↓
[HTTP Request] → Send to ticketing system
```

### 2. Content Moderation
```
[Webhook] → New user comment
    ↓
[Sentiment Analysis] → Check sentiment
    ↓
[Entity Extraction] → Check for sensitive info
    ↓
[If] → Passes moderation?
    ↓ yes
[HTTP Request] → Approve and publish
```

### 3. Data Processing Pipeline
```
[Schedule] → Daily report trigger
    ↓
[HTTP Request] → Fetch data
    ↓
[AI Data Transform] → Clean and format
    ↓
[LLM Completion] → Generate insights
    ↓
[HTTP Request] → Send summary email
```

---

## 🚀 Next Steps

1. **Set up your first LLM provider** (recommend Ollama for testing)
2. **Create a simple workflow** with an LLM Completion node
3. **Explore prompt templates** to save time
4. **Monitor your token usage** in the dashboard
5. **Experiment with AI Agents** for complex tasks

## 📚 Resources

- [OpenAI Documentation](https://platform.openai.com/docs)
- [Anthropic Claude](https://docs.anthropic.com)
- [Google Gemini](https://ai.google.dev)
- [Ollama Models](https://ollama.com/library)

## 🤝 Support

For issues or questions:
- Check the debug logs
- Review token usage patterns
- Test with different models
- Consult provider documentation

---

**Built with ❤️ for data privacy and flexibility**

*Note: This AI integration layer is designed to give you full control over your data. Use self-hosted options for sensitive workloads.*
