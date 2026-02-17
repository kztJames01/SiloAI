import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Plus } from 'lucide-react';

interface NodePaletteProps {
  nodes: any[];
  onAddNode: (node: any) => void;
}

export function NodePalette({ nodes, onAddNode }: NodePaletteProps) {
  const categories = Array.from(new Set(nodes.map((n) => n.category)));

  return (
    <Card className="h-full overflow-y-auto">
      <CardHeader>
        <CardTitle className="text-sm">Nodes</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {categories.map((category) => (
            <div key={category}>
              <h3 className="text-xs font-semibold text-gray-700 mb-2">{category}</h3>
              <div className="space-y-1">
                {nodes
                  .filter((node) => node.category === category)
                  .map((node) => (
                    <button
                      key={node.type}
                      onClick={() => onAddNode(node)}
                      className="w-full flex items-center space-x-2 px-3 py-2 text-sm rounded-md hover:bg-gray-100 transition-colors text-left"
                      style={{ borderLeft: `3px solid ${node.color}` }}
                    >
                      <Plus className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">{node.name}</span>
                    </button>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
