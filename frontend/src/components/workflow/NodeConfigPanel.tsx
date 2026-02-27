import { Node } from 'reactflow';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Trash2 } from 'lucide-react';

interface NodeConfigPanelProps {
  node: Node | null;
  onUpdate: (nodeId: string, data: any) => void;
  onDelete: (nodeId: string) => void;
}

export function NodeConfigPanel({ node, onUpdate, onDelete }: NodeConfigPanelProps) {
  if (!node) {
    return (
      <Card className="h-full">
        <CardContent className="flex items-center justify-center h-full">
          <p className="text-sm text-muted-foreground">Select a node to configure</p>
        </CardContent>
      </Card>
    );
  }

  const handleInputChange = (field: string, value: any) => {
    onUpdate(node.id, { [field]: value });
  };

  return (
    <Card className="h-full overflow-y-auto">
      <CardHeader>
        <CardTitle className="text-sm flex items-center justify-between">
          <span>Node Configuration</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(node.id)}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Input
            label="Label"
            value={node.data.label || ''}
            onChange={(e) => handleInputChange('label', e.target.value)}
            placeholder="Node label"
          />

          {/* HTTP Request Node */}
          {node.data.nodeType === 'httpRequest' && (
            <>
              <Input
                label="URL"
                value={node.data.url || ''}
                onChange={(e) => handleInputChange('url', e.target.value)}
                placeholder="https://api.example.com"
              />
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Method
                </label>
                <select
                  value={node.data.method || 'GET'}
                  onChange={(e) => handleInputChange('method', e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
                >
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                  <option value="PUT">PUT</option>
                  <option value="DELETE">DELETE</option>
                  <option value="PATCH">PATCH</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Headers (JSON)
                </label>
                <textarea
                  value={node.data.headers || '{}'}
                  onChange={(e) => handleInputChange('headers', e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm bg-background text-foreground"
                  rows={3}
                  placeholder='{"Content-Type": "application/json"}'
                />
              </div>
            </>
          )}

          {/* Code Node */}
          {node.data.nodeType === 'code' && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                JavaScript Code
              </label>
              <textarea
                value={node.data.code || ''}
                onChange={(e) => handleInputChange('code', e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm bg-background text-foreground"
                rows={6}
                placeholder="return data.map(item => item.name);"
              />
            </div>
          )}

          {/* If/Else Node */}
          {node.data.nodeType === 'if' && (
            <>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Condition (JavaScript)
                </label>
                <textarea
                  value={node.data.condition || ''}
                  onChange={(e) => handleInputChange('condition', e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm bg-background text-foreground"
                  rows={2}
                  placeholder="data.value > 100"
                />
              </div>
            </>
          )}

          <div className="pt-4 border-t">
            <p className="text-xs text-muted-foreground">Node ID: {node.id}</p>
            <p className="text-xs text-muted-foreground">Type: {node.data.nodeType}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
