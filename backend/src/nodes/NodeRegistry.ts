import { ExecutionContext } from '../engine/WorkflowEngine';

export interface NodeDefinition {
  type: string;
  name: string;
  description: string;
  category: string;
  icon?: string;
  color?: string;
  inputs: NodeInput[];
  outputs: NodeOutput[];
}

export interface NodeInput {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'any';
  required?: boolean;
  default?: any;
  description?: string;
}

export interface NodeOutput {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'any';
  description?: string;
}

export interface INode {
  definition: NodeDefinition;
  execute(data: any, context: ExecutionContext): Promise<any>;
}

export class NodeRegistry {
  private nodes: Map<string, INode> = new Map();

  register(node: INode): void {
    this.nodes.set(node.definition.type, node);
  }

  getNode(type: string): INode | undefined {
    return this.nodes.get(type);
  }

  getAllNodes(): NodeDefinition[] {
    return Array.from(this.nodes.values()).map((node) => node.definition);
  }

  getCategories(): string[] {
    const categories = new Set<string>();
    this.nodes.forEach((node) => {
      categories.add(node.definition.category);
    });
    return Array.from(categories).sort();
  }
}

export const nodeRegistry = new NodeRegistry();
