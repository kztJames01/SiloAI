import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Bookmark, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '../components/ui/Card';

const categories = [
  'All templates',
  'Featured',
  'Healthcare',
  'Field Service',
  'Invoicing',
  'Data collection',
  'Approval',
  'Notifications',
  'Scheduling',
];

const useCases = [
  { id: 'lead', label: 'Lead management', color: 'bg-teal-700' },
  { id: 'sales', label: 'Sales pipeline', color: 'bg-amber-700' },
  { id: 'marketing', label: 'Marketing campaigns', color: 'bg-slate-700' },
  { id: 'support', label: 'Customer support', color: 'bg-stone-600' },
  { id: 'data', label: 'Data management', color: 'bg-slate-600' },
];

const templates = [
  {
    id: 'healthcare-intake',
    category: 'Healthcare',
    title: 'Patient Intake Follow-up',
    description: 'When a patient form arrives, notify care staff and wait for approval before processing',
    icon: '🏥',
    connectors: ['📋', '📧', '✅'],
    tags: ['Automated', 'Multi-step'],
    usageCount: '2.4K',
    featured: true,
  },
  {
    id: 'field-hazard',
    category: 'Field Service',
    title: 'Hazard Report Escalation',
    description: 'Capture hazard details, notify supervisor, and request confirmation with photo evidence',
    icon: '⚠️',
    connectors: ['📸', '📧', '📊'],
    tags: ['Instant', 'Mobile-ready'],
    usageCount: '1.8K',
    featured: true,
  },
  {
    id: 'invoice-approval',
    category: 'Invoicing',
    title: 'Invoice Approval Workflow',
    description: 'Read invoice totals, send for review, and post approved records automatically',
    icon: '📄',
    connectors: ['📊', '✅', '💰'],
    tags: ['Automated', 'Business'],
    usageCount: '3.2K',
    featured: true,
  },
  {
    id: 'appointment-scheduler',
    category: 'Healthcare',
    title: 'Appointment Scheduler',
    description: 'Schedule patient appointments and send automated reminders via email and SMS',
    icon: '📅',
    connectors: ['📅', '📧', '📱'],
    tags: ['Automated', 'Healthcare'],
    usageCount: '1.9K',
    featured: false,
  },
  {
    id: 'inventory-check',
    category: 'Field Service',
    title: 'Daily Inventory Check',
    description: 'Conduct inventory checks, log results, and alert when stock is low',
    icon: '📦',
    connectors: ['📦', '📊', '🔔'],
    tags: ['Scheduled', 'Field'],
    usageCount: '1.5K',
    featured: false,
  },
  {
    id: 'expense-approval',
    category: 'Invoicing',
    title: 'Expense Report Approval',
    description: 'Submit expense reports, route for approval, and sync with accounting systems',
    icon: '💳',
    connectors: ['💳', '✅', '📊'],
    tags: ['Automated', 'Finance'],
    usageCount: '2.7K',
    featured: true,
  },
  {
    id: 'onboarding',
    category: 'Data collection',
    title: 'Employee Onboarding',
    description: 'Collect new hire information, create accounts, and schedule orientation sessions',
    icon: '👥',
    connectors: ['📋', '👤', '📧'],
    tags: ['Automated', 'HR'],
    usageCount: '2.1K',
    featured: false,
  },
  {
    id: 'maintenance-request',
    category: 'Field Service',
    title: 'Maintenance Request Handler',
    description: 'Receive maintenance requests, assign to technicians, and track completion',
    icon: '🔧',
    connectors: ['📝', '👨‍🔧', '✅'],
    tags: ['Instant', 'Service'],
    usageCount: '1.6K',
    featured: false,
  },
];

export default function TemplatesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All templates');
  const [selectedUseCase, setSelectedUseCase] = useState<string | null>(null);
  const [savedTemplates, setSavedTemplates] = useState<Set<string>>(new Set());

  const toggleSaveTemplate = (templateId: string) => {
    const newSaved = new Set(savedTemplates);
    if (newSaved.has(templateId)) {
      newSaved.delete(templateId);
    } else {
      newSaved.add(templateId);
    }
    setSavedTemplates(newSaved);
  };

  const filteredTemplates = templates.filter((template) => {
    const matchesSearch = template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All templates' || 
      (selectedCategory === 'Featured' && template.featured) ||
      template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-12 text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Workflow Automation Templates
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto mb-8">
            Automate your work from start to finish. Explore our templates and create powerful,
            unstoppable solutions in minutes—no code needed.
          </p>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mb-8">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white shadow-sm"
              />
            </div>
          </div>

          {/* Use Cases */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-3">Browse by use case</p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              {useCases.map((useCase) => (
                <button
                  key={useCase.id}
                  onClick={() => setSelectedUseCase(selectedUseCase === useCase.id ? null : useCase.id)}
                  className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    selectedUseCase === useCase.id
                      ? `${useCase.color} text-white shadow-md`
                      : 'bg-white text-gray-700 border border-gray-300 hover:border-gray-400'
                  }`}
                >
                  {useCase.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Category Tabs */}
        <div className="mb-8">
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === category
                    ? 'bg-primary text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Templates Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold text-gray-900">
              {selectedCategory === 'Featured' ? 'Featured solution templates' : 'Templates'}
            </h2>
            <p className="text-sm text-gray-600">
              {filteredTemplates.length} {filteredTemplates.length === 1 ? 'template' : 'templates'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map((template) => (
              <Link
                key={template.id}
                to={`/workflows/new?template=${template.id}`}
                className="group"
              >
                <Card className="relative overflow-hidden hover:shadow-xl transition-shadow duration-300 cursor-pointer border-2 hover:border-primary/50 h-full">
                  {/* Category Badge */}
                  <div className="absolute top-4 left-4 z-10">
                    <span className="px-3 py-1 bg-gray-900 text-white text-xs font-medium rounded-md">
                      {template.category}
                    </span>
                  </div>

                  {/* Bookmark Button */}
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      toggleSaveTemplate(template.id);
                    }}
                    className="absolute top-4 right-4 z-10 p-2 bg-white rounded-lg shadow-md hover:bg-gray-50 transition-colors"
                  >
                    <Bookmark
                      className={`h-4 w-4 ${
                        savedTemplates.has(template.id)
                          ? 'fill-primary text-primary'
                          : 'text-gray-600'
                      }`}
                    />
                  </button>

                  <CardContent className="p-0">
                    {/* Visual Preview Area */}
                    <div className="h-48 bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center relative overflow-hidden">
                      {/* Large Icon */}
                      <div className="text-8xl opacity-90 group-hover:scale-110 transition-transform duration-300">
                        {template.icon}
                      </div>
                      
                      {/* Connector Icons */}
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                        {template.connectors.map((connector, idx) => (
                          <div
                            key={idx}
                            className="w-10 h-10 bg-white rounded-lg shadow-md flex items-center justify-center text-xl"
                          >
                            {connector}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-5 space-y-3">
                      <h3 className="font-semibold text-gray-900 text-lg group-hover:text-primary transition-colors">
                        {template.title}
                      </h3>
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {template.description}
                      </p>

                      {/* Tags and Stats */}
                      <div className="flex items-center justify-between pt-2">
                        <div className="flex gap-2">
                          {template.tags.slice(0, 2).map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <TrendingUp className="h-3 w-3" />
                          <span>{template.usageCount}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          {filteredTemplates.length === 0 && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No templates found</h3>
              <p className="text-gray-600">Try adjusting your search or filters</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
