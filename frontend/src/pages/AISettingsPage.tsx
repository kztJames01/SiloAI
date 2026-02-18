import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { LLMConfigPanel } from '../components/ai/LLMConfigPanel';
import { TokenUsageDashboard } from '../components/ai/TokenUsageDashboard';
import { PromptTemplateEditor } from '../components/ai/PromptTemplateEditor';
import { api } from '../lib/api';

type Tab = 'config' | 'tokens' | 'templates';

export function AISettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('config');
  const [templates, setTemplates] = useState<any[]>([]);
  const [editingTemplate, setEditingTemplate] = useState<any | null>(null);

  const handleSaveLLMConfig = async (config: any) => {
    try {
      await api.post('/ai/config', config);
      alert('Configuration saved successfully!');
    } catch (error) {
      console.error('Failed to save configuration:', error);
      alert('Failed to save configuration');
    }
  };

  const handleSaveTemplate = async (template: any) => {
    try {
      if (template.id) {
        await api.put(`/ai/templates/${template.id}`, template);
      } else {
        await api.post('/ai/templates', template);
      }
      setEditingTemplate(null);
      // Refresh templates list
      fetchTemplates();
    } catch (error) {
      console.error('Failed to save template:', error);
      alert('Failed to save template');
    }
  };

  const fetchTemplates = async () => {
    try {
      const response = await api.get('/ai/templates');
      setTemplates(response.data.templates || []);
    } catch (error) {
      console.error('Failed to fetch templates:', error);
    }
  };

  const tabs = [
    { id: 'config' as Tab, label: 'LLM Configuration', icon: '⚙️' },
    { id: 'tokens' as Tab, label: 'Token Usage', icon: '📊' },
    { id: 'templates' as Tab, label: 'Prompt Templates', icon: '📝' },
  ];

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">AI Settings</h1>
        <p className="text-gray-600">
          Configure AI providers, monitor usage, and manage prompt templates
        </p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 mb-6 border-b">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === tab.id
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <span className="mr-2">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'config' && (
          <LLMConfigPanel onChange={handleSaveLLMConfig} />
        )}

        {activeTab === 'tokens' && <TokenUsageDashboard />}

        {activeTab === 'templates' && (
          <div className="space-y-4">
            {editingTemplate ? (
              <PromptTemplateEditor
                template={editingTemplate}
                onSave={handleSaveTemplate}
                onCancel={() => setEditingTemplate(null)}
              />
            ) : (
              <>
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold">Prompt Templates</h2>
                  <Button onClick={() => setEditingTemplate({})}>
                    Create New Template
                  </Button>
                </div>

                {templates.length === 0 ? (
                  <Card>
                    <CardContent className="py-8 text-center text-gray-600">
                      No templates yet. Create your first one!
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {templates.map((template) => (
                      <Card key={template.id}>
                        <CardHeader>
                          <CardTitle className="text-base">{template.name}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-gray-600 mb-3">
                            {template.description || 'No description'}
                          </p>
                          <div className="text-xs text-gray-500 mb-3">
                            {template.variables?.length || 0} variables
                          </div>
                          <Button
                            onClick={() => setEditingTemplate(template)}
                            variant="outline"
                            className="w-full"
                          >
                            Edit
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
