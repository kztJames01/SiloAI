import prisma from '../db/prisma';
// Define Workflow interface based on your schema
export interface Workflow {
  id: string;
  nodes: any[];
  edges: any[];
  // Add other fields as needed
}
import { logger } from '../utils/logger';
import { nodeRegistry } from '../nodes/NodeRegistry';
import { v4 as uuidv4 } from 'uuid';

export interface ExecutionContext {
  executionId: string;
  workflowId: string;
  data: Record<string, any>;
  previousNodeData?: any;
}

export class WorkflowEngine {
  async executeWorkflow(workflow: Workflow, inputData: any = {}): Promise<string> {
    const executionId = uuidv4();

    // Create execution record
    await prisma.workflowExecution.create({
      data: {
        id: executionId,
        workflowId: workflow.id,
        status: 'RUNNING',
        input: inputData,
      },
    });

    // Execute workflow asynchronously
    this.runWorkflow(executionId, workflow, inputData).catch((error) => {
      logger.error(`Workflow execution ${executionId} failed:`, error);
    });

    return executionId;
  }

  private async runWorkflow(
    executionId: string,
    workflow: Workflow,
    inputData: any
  ): Promise<void> {
    try {
      const nodes = workflow.nodes as any[];
      const edges = workflow.edges as any[];

      // Log start
      await this.log(executionId, 'workflow', 'Workflow', 'INFO', 'Workflow execution started');

      const context: ExecutionContext = {
        executionId,
        workflowId: workflow.id,
        data: { input: inputData },
      };

      // Build execution order using topological sort
      const executionOrder = this.buildExecutionOrder(nodes, edges);

      // Execute nodes in order
      for (const nodeId of executionOrder) {
        const node = nodes.find((n) => n.id === nodeId);
        if (!node) continue;

        await this.executeNode(node, context);
      }

      // Mark as success
      await prisma.workflowExecution.update({
        where: { id: executionId },
        data: {
          status: 'SUCCESS',
          finishedAt: new Date(),
          output: context.data,
        },
      });

      await this.log(executionId, 'workflow', 'Workflow', 'INFO', 'Workflow completed successfully');
    } catch (error: any) {
      logger.error(`Workflow execution error:`, error);
      
      await prisma.workflowExecution.update({
        where: { id: executionId },
        data: {
          status: 'FAILED',
          finishedAt: new Date(),
          error: error.message,
        },
      });

      await this.log(executionId, 'workflow', 'Workflow', 'ERROR', `Workflow failed: ${error.message}`);
    }
  }

  private async executeNode(node: any, context: ExecutionContext): Promise<void> {
    try {
      await this.log(
        context.executionId,
        node.id,
        node.data.label || node.type,
        'INFO',
        `Executing node ${node.type}`
      );

      const nodeHandler = nodeRegistry.getNode(node.type);
      if (!nodeHandler) {
        throw new Error(`Node type ${node.type} not found`);
      }

      const result = await nodeHandler.execute(node.data, context);
      context.data[node.id] = result;
      context.previousNodeData = result;

      await this.log(
        context.executionId,
        node.id,
        node.data.label || node.type,
        'INFO',
        `Node executed successfully`,
        result
      );
    } catch (error: any) {
      await this.log(
        context.executionId,
        node.id,
        node.data.label || node.type,
        'ERROR',
        `Node execution failed: ${error.message}`
      );
      throw error;
    }
  }

  private buildExecutionOrder(nodes: any[], edges: any[]): string[] {
    // Simple topological sort
    const inDegree = new Map<string, number>();
    const adjacencyList = new Map<string, string[]>();

    // Initialize
    nodes.forEach((node) => {
      inDegree.set(node.id, 0);
      adjacencyList.set(node.id, []);
    });

    // Build graph
    edges.forEach((edge) => {
      adjacencyList.get(edge.source)?.push(edge.target);
      inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1);
    });

    // Find starting nodes (no incoming edges)
    const queue: string[] = [];
    inDegree.forEach((degree, nodeId) => {
      if (degree === 0) {
        queue.push(nodeId);
      }
    });

    const result: string[] = [];

    while (queue.length > 0) {
      const nodeId = queue.shift()!;
      result.push(nodeId);

      adjacencyList.get(nodeId)?.forEach((neighbor) => {
        const newDegree = (inDegree.get(neighbor) || 0) - 1;
        inDegree.set(neighbor, newDegree);
        if (newDegree === 0) {
          queue.push(neighbor);
        }
      });
    }

    return result;
  }

  private async log(
    executionId: string,
    nodeId: string,
    nodeName: string,
    level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG',
    message: string,
    data?: any
  ): Promise<void> {
    await prisma.executionLog.create({
      data: {
        executionId,
        nodeId,
        nodeName,
        level,
        message,
        data: data || null,
      },
    });
  }
}
