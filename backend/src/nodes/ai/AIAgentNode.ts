import { INode, NodeDefinition } from '../NodeRegistry';
import { ExecutionContext } from '../../engine/WorkflowEngine';
import { LLMProviderFactory } from '../../ai/providers';
import { LLMConfig, Message, AIAgentStep } from '../../../../shared/src/types/ai';

/**
 * AI Agent Node - Autonomous decision-making AI agent
 */
export class AIAgentNode implements INode {
  definition: NodeDefinition = {
    type: 'aiAgent',
    name: 'AI Agent',
    description: 'Autonomous AI agent that can reason and take actions',
    category: 'AI',
    color: '#8b5cf6',
    icon: '🤖',
    inputs: [
      {
        name: 'provider',
        type: 'string',
        required: true,
        default: 'openai',
        description: 'LLM provider',
      },
      {
        name: 'model',
        type: 'string',
        required: true,
        default: 'gpt-4o',
        description: 'Model name',
      },
      {
        name: 'apiKey',
        type: 'string',
        description: 'API key',
      },
      {
        name: 'systemPrompt',
        type: 'string',
        required: true,
        description: 'Agent behavior and capabilities description',
      },
      {
        name: 'task',
        type: 'string',
        required: true,
        description: 'Task for the agent to complete',
      },
      {
        name: 'context',
        type: 'object',
        description: 'Additional context data',
      },
      {
        name: 'maxIterations',
        type: 'number',
        default: 5,
        description: 'Maximum reasoning iterations',
      },
      {
        name: 'tools',
        type: 'array',
        description: 'Available tools for the agent',
      },
    ],
    outputs: [
      {
        name: 'result',
        type: 'string',
        description: 'Agent result',
      },
      {
        name: 'steps',
        type: 'array',
        description: 'Agent reasoning steps',
      },
      {
        name: 'totalUsage',
        type: 'object',
        description: 'Total token usage',
      },
    ],
  };

  async execute(data: any, _context: ExecutionContext): Promise<any> {
    const {
      provider = 'openai',
      model,
      apiKey,
      systemPrompt,
      task,
      context: agentContext = {},
      maxIterations = 5,
      tools = [],
    } = data;

    const config: LLMConfig = {
      provider,
      model,
      apiKey,
      temperature: 0.7,
    };

    const llmProvider = LLMProviderFactory.createProvider(config);
    
    // Build system prompt for agent
    const agentSystemPrompt = `${systemPrompt}

You are an autonomous AI agent. Break down complex tasks into steps, reason through them, and provide solutions.

For each iteration, provide:
1. THOUGHT: Your reasoning about what to do next
2. ACTION: The action you want to take
3. OBSERVATION: What you learned from the action

Continue until the task is complete, then provide FINAL ANSWER.

${tools.length > 0 ? `Available tools: ${tools.map((t: any) => t.name).join(', ')}` : ''}`;

    const messages: Message[] = [
      { role: 'system', content: agentSystemPrompt },
      {
        role: 'user',
        content: `Task: ${task}\n\nContext: ${JSON.stringify(agentContext, null, 2)}`,
      },
    ];

    const steps: AIAgentStep[] = [];
    let totalPromptTokens = 0;
    let totalCompletionTokens = 0;
    let iteration = 0;
    let finalAnswer = '';

    while (iteration < maxIterations) {
      iteration++;

      const result = await llmProvider.complete(messages);
      totalPromptTokens += result.usage.promptTokens;
      totalCompletionTokens += result.usage.completionTokens;

      // Parse response
      const content = result.content;
      
      // Check if we have a final answer
      if (content.includes('FINAL ANSWER')) {
        finalAnswer = content.split('FINAL ANSWER:')[1]?.trim() || content;
        
        steps.push({
          stepNumber: iteration,
          action: 'COMPLETE',
          thought: 'Task completed',
          observation: finalAnswer,
          tokenUsage: result.usage,
        });
        
        break;
      }

      // Parse thought, action, observation
      const thought = this.extractSection(content, 'THOUGHT');
      const action = this.extractSection(content, 'ACTION');
      
      // Simulate action execution (in real implementation, would call tools)
      const observation = `Executed: ${action}`;

      steps.push({
        stepNumber: iteration,
        action,
        thought,
        observation,
        tokenUsage: result.usage,
      });

      // Add assistant response and continue
      messages.push({ role: 'assistant', content });
      messages.push({
        role: 'user',
        content: `OBSERVATION: ${observation}\n\nContinue with next step or provide FINAL ANSWER.`,
      });
    }

    return {
      result: finalAnswer || 'Max iterations reached without final answer',
      steps,
      totalUsage: {
        promptTokens: totalPromptTokens,
        completionTokens: totalCompletionTokens,
        totalTokens: totalPromptTokens + totalCompletionTokens,
      },
    };
  }

  private extractSection(content: string, section: string): string {
    const regex = new RegExp(`${section}:(.+?)(?=\\n[A-Z]+:|$)`, 's');
    const match = content.match(regex);
    return match ? match[1].trim() : '';
  }
}
