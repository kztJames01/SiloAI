import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

interface PromptTemplateEditorProps {
  template?: {
    id?: string;
    name: string;
    description?: string;
    template: string;
    systemPrompt?: string;
    variables: Array<{
      name: string;
      type: string;
      required: boolean;
      default?: any;
    }>;
  };
  onSave: (template: any) => void;
  onCancel?: () => void;
}

export function PromptTemplateEditor({
  template,
  onSave,
  onCancel,
}: PromptTemplateEditorProps) {
  const [name, setName] = useState(template?.name || '');
  const [description, setDescription] = useState(template?.description || '');
  const [templateText, setTemplateText] = useState(template?.template || '');
  const [systemPrompt, setSystemPrompt] = useState(template?.systemPrompt || '');
  const [variables, setVariables] = useState(
    template?.variables || []
  );

  const extractVariables = (text: string): string[] => {
    const regex = /\{\{\s*(\w+)\s*\}\}/g;
    const matches: string[] = [];
    let match;

    while ((match = regex.exec(text)) !== null) {
      matches.push(match[1]);
    }

    return Array.from(new Set(matches));
  };

  const handleExtractVariables = () => {
    const extractedVars = extractVariables(templateText + ' ' + systemPrompt);
    const newVariables = extractedVars
      .filter((v) => !variables.find((existing) => existing.name === v))
      .map((v) => ({
        name: v,
        type: 'string',
        required: true,
        default: undefined,
      }));

    setVariables([...variables, ...newVariables]);
  };

  const handleSave = () => {
    onSave({
      id: template?.id,
      name,
      description,
      template: templateText,
      systemPrompt,
      variables,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {template?.id ? 'Edit Prompt Template' : 'Create Prompt Template'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium mb-1">Template Name</label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Customer Support Response"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <Input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What does this template do?"
          />
        </div>

        {/* System Prompt */}
        <div>
          <label className="block text-sm font-medium mb-1">
            System Prompt (Optional)
          </label>
          <textarea
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            placeholder="You are a helpful assistant..."
            className="w-full px-3 py-2 border rounded-md min-h-[100px] font-mono text-sm"
          />
        </div>

        {/* Template */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Template (use {'{{ variable }}'} syntax)
          </label>
          <textarea
            value={templateText}
            onChange={(e) => setTemplateText(e.target.value)}
            placeholder="Hello {{ name }}, your order {{ orderId }} is ready..."
            className="w-full px-3 py-2 border rounded-md min-h-[150px] font-mono text-sm"
          />
        </div>

        {/* Extract Variables Button */}
        <Button onClick={handleExtractVariables} variant="outline" className="w-full">
          🔍 Extract Variables from Template
        </Button>

        {/* Variables */}
        {variables.length > 0 && (
          <div>
            <label className="block text-sm font-medium mb-2">Variables</label>
            <div className="space-y-2 border rounded-md p-3">
              {variables.map((variable, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 p-2 bg-muted rounded"
                >
                  <span className="font-mono text-sm flex-1">
                    {'{{ ' + variable.name + ' }}'}
                  </span>
                  <select
                    value={variable.type}
                    onChange={(e) => {
                      const newVars = [...variables];
                      newVars[index].type = e.target.value;
                      setVariables(newVars);
                    }}
                    className="px-2 py-1 border rounded text-sm"
                  >
                    <option value="string">String</option>
                    <option value="number">Number</option>
                    <option value="boolean">Boolean</option>
                    <option value="array">Array</option>
                    <option value="object">Object</option>
                  </select>
                  <label className="flex items-center text-sm">
                    <input
                      type="checkbox"
                      checked={variable.required}
                      onChange={(e) => {
                        const newVars = [...variables];
                        newVars[index].required = e.target.checked;
                        setVariables(newVars);
                      }}
                      className="mr-1"
                    />
                    Required
                  </label>
                  <Button
                    onClick={() => {
                      setVariables(variables.filter((_, i) => i !== index));
                    }}
                    variant="outline"
                    className="text-red-600 hover:bg-red-50"
                  >
                    ✕
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Button onClick={handleSave} className="flex-1">
            Save Template
          </Button>
          {onCancel && (
            <Button onClick={onCancel} variant="outline">
              Cancel
            </Button>
          )}
        </div>

        {/* Example */}
        <div className="p-3 bg-info/10 border border-info/20 rounded-md text-sm">
          <p className="font-semibold mb-1">📝 Example</p>
          <pre className="text-xs font-mono bg-muted/50 p-2 rounded border border-border">
            {`Template: "Summarize {{ text }} in {{ length }} sentences"
Variables: text (string), length (number)
Result: "Summarize [user input] in 3 sentences"`}
          </pre>
        </div>
      </CardContent>
    </Card>
  );
}
