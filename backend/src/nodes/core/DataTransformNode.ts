import { INode, NodeDefinition } from '../NodeRegistry';
import { ExecutionContext } from '../../engine/WorkflowEngine';

export class DataTransformNode implements INode {
  definition: NodeDefinition = {
    type: 'dataTransform',
    name: 'Transform Data',
    description: 'Transform and manipulate data using JSON paths',
    category: 'Data',
    color: '#06b6d4',
    inputs: [
      {
        name: 'data',
        type: 'any',
        required: true,
        description: 'Input data to transform',
      },
      {
        name: 'operations',
        type: 'array',
        required: true,
        description: 'Array of transformation operations',
      },
    ],
    outputs: [
      {
        name: 'result',
        type: 'any',
        description: 'Transformed data',
      },
    ],
  };

  async execute(data: any, context: ExecutionContext): Promise<any> {
    const inputData = data.data || context.previousNodeData;
    const operations = data.operations || [];

    let result = JSON.parse(JSON.stringify(inputData)); // Deep clone

    for (const op of operations) {
      result = this.applyOperation(result, op);
    }

    return result;
  }

  private applyOperation(data: any, operation: any): any {
    const { type, path, value } = operation;

    switch (type) {
      case 'set':
        return this.setPath(data, path, value);
      case 'delete':
        return this.deletePath(data, path);
      case 'map':
        return this.mapArray(data, path, value);
      case 'filter':
        return this.filterArray(data, path, value);
      default:
        return data;
    }
  }

  private setPath(obj: any, path: string, value: any): any {
    const keys = path.split('.');
    let current = obj;

    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) {
        current[keys[i]] = {};
      }
      current = current[keys[i]];
    }

    current[keys[keys.length - 1]] = value;
    return obj;
  }

  private deletePath(obj: any, path: string): any {
    const keys = path.split('.');
    let current = obj;

    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) return obj;
      current = current[keys[i]];
    }

    delete current[keys[keys.length - 1]];
    return obj;
  }

  private mapArray(obj: any, path: string, mapFn: string): any {
    const arr = this.getPath(obj, path);
    if (!Array.isArray(arr)) return obj;

    const func = new Function('item', 'index', mapFn);
    const mapped = arr.map((item, index) => func(item, index));

    return this.setPath(obj, path, mapped);
  }

  private filterArray(obj: any, path: string, filterFn: string): any {
    const arr = this.getPath(obj, path);
    if (!Array.isArray(arr)) return obj;

    const func = new Function('item', 'index', filterFn);
    const filtered = arr.filter((item, index) => func(item, index));

    return this.setPath(obj, path, filtered);
  }

  private getPath(obj: any, path: string): any {
    const keys = path.split('.');
    let current = obj;

    for (const key of keys) {
      if (current === undefined || current === null) return undefined;
      current = current[key];
    }

    return current;
  }
}
