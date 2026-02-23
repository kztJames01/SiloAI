import { PromptTemplate, Message } from '../../../shared/src/types/ai';

/**
 * Prompt Template Engine for dynamic prompt generation
 */
export class PromptTemplateEngine {
  /**
   * Render a prompt template with variables
   */
  static render(template: PromptTemplate, variables: Record<string, any>): string {
    // Validate required variables
    this.validateVariables(template, variables);

    let rendered = template.template;

    // Replace variables in the template
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      rendered = rendered.replace(regex, String(value));
    }

    // Check for unreplaced variables
    const unreplacedVars = rendered.match(/{{.*?}}/g);
    if (unreplacedVars) {
      console.warn('Unreplaced variables in template:', unreplacedVars);
    }

    return rendered;
  }

  /**
   * Build messages array from template
   */
  static buildMessages(
    template: PromptTemplate,
    variables: Record<string, any>,
    includeExamples: boolean = false
  ): Message[] {
    const messages: Message[] = [];

    // Add system prompt if available
    if (template.systemPrompt) {
      messages.push({
        role: 'system',
        content: this.render({ ...template, template: template.systemPrompt }, variables),
      });
    }

    // Add examples if requested
    if (includeExamples && template.examples) {
      messages.push(...template.examples);
    }

    // Add the main user message
    messages.push({
      role: 'user',
      content: this.render(template, variables),
    });

    return messages;
  }

  /**
   * Validate that all required variables are provided
   */
  private static validateVariables(
    template: PromptTemplate,
    variables: Record<string, any>
  ): void {
    const requiredVars = template.variables.filter(v => v.required);

    for (const variable of requiredVars) {
      if (!(variable.name in variables)) {
        // Check if there's a default value
        if (variable.default !== undefined) {
          variables[variable.name] = variable.default;
        } else {
          throw new Error(`Required variable "${variable.name}" is missing`);
        }
      }
    }

    // Apply defaults for optional variables
    for (const variable of template.variables) {
      if (!(variable.name in variables) && variable.default !== undefined) {
        variables[variable.name] = variable.default;
      }
    }
  }

  /**
   * Extract variables from a template string
   */
  static extractVariables(templateString: string): string[] {
    const regex = /{{\\s*(\\w+)\\s*}}/g;
    const matches: string[] = [];
    let match;

    while ((match = regex.exec(templateString)) !== null) {
      matches.push(match[1]);
    }

    return Array.from(new Set(matches));
  }

  /**
   * Create a template from a string
   */
  static createTemplate(
    name: string,
    templateString: string,
    systemPrompt?: string
  ): PromptTemplate {
    const variables = this.extractVariables(templateString);
    const systemVariables = systemPrompt ? this.extractVariables(systemPrompt) : [];
    const allVariables = Array.from(new Set([...variables, ...systemVariables]));

    return {
      id: this.generateId(),
      name,
      template: templateString,
      systemPrompt,
      variables: allVariables.map(name => ({
        name,
        type: 'string',
        required: true,
      })),
    };
  }

  private static generateId(): string {
    return `prompt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Pre-built prompt templates library
 */
export class PromptLibrary {
  private static templates: Map<string, PromptTemplate> = new Map();

  static initialize(): void {
    // Data transformation template
    this.register({
      id: 'data_transform',
      name: 'Data Transformation',
      description: 'Transform data from one format to another',
      template: `Transform the following data according to the instructions:

Data: {{ data }}

Instructions: {{ instructions }}

Output the transformed data in {{ format }} format.`,
      systemPrompt: 'You are a data transformation specialist. Transform data accurately according to the provided instructions.',
      variables: [
        { name: 'data', type: 'string', required: true },
        { name: 'instructions', type: 'string', required: true },
        { name: 'format', type: 'string', required: true, default: 'JSON' },
      ],
    });

    // Code generation template
    this.register({
      id: 'code_generation',
      name: 'Code Generation',
      description: 'Generate code based on requirements',
      template: `Generate {{ language }} code for the following requirements:

Requirements:
{{ requirements }}

{{ context }}

Provide clean, well-documented code.`,
      systemPrompt: 'You are an expert programmer. Generate clean, efficient, and well-documented code.',
      variables: [
        { name: 'language', type: 'string', required: true },
        { name: 'requirements', type: 'string', required: true },
        { name: 'context', type: 'string', required: false, default: '' },
      ],
    });

    // Text summarization template
    this.register({
      id: 'summarization',
      name: 'Text Summarization',
      description: 'Summarize text content',
      template: `Summarize the following text in {{ length }} sentences:

{{ text }}

Focus on: {{ focus }}`,
      systemPrompt: 'You are a text summarization expert. Create clear and concise summaries.',
      variables: [
        { name: 'text', type: 'string', required: true },
        { name: 'length', type: 'number', required: true, default: 3 },
        { name: 'focus', type: 'string', required: false, default: 'key points' },
      ],
    });

    // Classification template
    this.register({
      id: 'classification',
      name: 'Text Classification',
      description: 'Classify text into categories',
      template: `Classify the following text into one of these categories: {{ categories }}

Text: {{ text }}

Provide the category name and confidence score.`,
      systemPrompt: 'You are a text classification expert. Classify text accurately and provide confidence scores.',
      variables: [
        { name: 'text', type: 'string', required: true },
        { name: 'categories', type: 'string', required: true },
      ],
    });

    // Entity extraction template
    this.register({
      id: 'entity_extraction',
      name: 'Entity Extraction',
      description: 'Extract entities from text',
      template: `Extract {{ entity_types }} from the following text:

{{ text }}

Return the results as a structured JSON object.`,
      systemPrompt: 'You are an entity extraction expert. Extract entities accurately and return structured data.',
      variables: [
        { name: 'text', type: 'string', required: true },
        { name: 'entity_types', type: 'string', required: true, default: 'names, dates, locations' },
      ],
    });

    // Question answering template
    this.register({
      id: 'question_answering',
      name: 'Question Answering',
      description: 'Answer questions based on context',
      template: `Answer the following question based on the provided context:

Context: {{ context }}

Question: {{ question }}

Provide a clear and concise answer.`,
      systemPrompt: 'You are a question answering expert. Provide accurate answers based on the given context.',
      variables: [
        { name: 'context', type: 'string', required: true },
        { name: 'question', type: 'string', required: true },
      ],
    });

    // Workflow generation template
    this.register({
      id: 'workflow_generation',
      name: 'Workflow Generation',
      description: 'Generate workflow from natural language',
      template: `Create a workflow automation for: {{ description }}

Requirements:
{{ requirements }}

Industry: {{ industry }}

Return a JSON structure with nodes and edges representing the workflow.`,
      systemPrompt: 'You are a workflow automation expert. Create efficient and practical workflows based on requirements.',
      variables: [
        { name: 'description', type: 'string', required: true },
        { name: 'requirements', type: 'string', required: false, default: '' },
        { name: 'industry', type: 'string', required: false, default: 'general' },
      ],
    });
  }

  static register(template: PromptTemplate): void {
    this.templates.set(template.id, template);
  }

  static get(id: string): PromptTemplate | undefined {
    return this.templates.get(id);
  }

  static getAll(): PromptTemplate[] {
    return Array.from(this.templates.values());
  }

  static getByCategory(_category: string): PromptTemplate[] {
    // Could implement category-based filtering
    return this.getAll();
  }
}

// Initialize the library
PromptLibrary.initialize();
