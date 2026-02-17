import { Handle, Position, NodeProps } from 'reactflow';

export function CustomNode({ data }: NodeProps) {
  return (
    <div
      className="px-4 py-3 shadow-lg rounded-lg border-2 bg-white min-w-[150px]"
      style={{ borderColor: data.color || '#6b7280' }}
    >
      <Handle type="target" position={Position.Top} className="w-3 h-3" />
      
      <div className="flex items-center space-x-2">
        <div
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: data.color || '#6b7280' }}
        />
        <div className="font-medium text-sm">{data.label}</div>
      </div>
      
      {data.url && (
        <div className="mt-1 text-xs text-gray-500 truncate">{data.url}</div>
      )}
      
      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
    </div>
  );
}
