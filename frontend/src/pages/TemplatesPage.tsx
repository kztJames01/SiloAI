import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  'Students',
  'SMB',
  'Startups',
];

const useCases = [
  { id: 'lead', label: 'Lead management', color: 'bg-teal-700' },
  { id: 'sales', label: 'Sales pipeline', color: 'bg-amber-700' },
  { id: 'marketing', label: 'Marketing campaigns', color: 'bg-slate-700' },
  { id: 'support', label: 'Customer support', color: 'bg-stone-600' },
  { id: 'data', label: 'Data management', color: 'bg-slate-600' },
];

const templates = [
  // ── Healthcare ──────────────────────────────────────────────────────────────
  {
    id: 'healthcare-intake',
    category: 'Healthcare',
    title: 'Patient Intake Follow-up',
    description: 'When a patient form arrives, validate data, notify care staff, and wait for approval before processing.',
    icon: '🏥',
    connectors: ['📋', '📧', '✅'],
    tags: ['Automated', 'Multi-step'],
    usageCount: '2.4K',
    featured: true,
  },
  {
    id: 'appointment-scheduler',
    category: 'Healthcare',
    title: 'Appointment Scheduler',
    description: 'Schedule patient appointments and send automated reminders via email and SMS.',
    icon: '📅',
    connectors: ['📅', '📧', '📱'],
    tags: ['Automated', 'Healthcare'],
    usageCount: '1.9K',
    featured: false,
  },
  // ── Field Service ───────────────────────────────────────────────────────────
  {
    id: 'field-hazard',
    category: 'Field Service',
    title: 'Hazard Report Escalation',
    description: 'Capture hazard details, notify supervisor instantly, and log the incident to the safety management system.',
    icon: '⚠️',
    connectors: ['📸', '📧', '📊'],
    tags: ['Instant', 'Mobile-ready'],
    usageCount: '1.8K',
    featured: true,
  },
  {
    id: 'inventory-check',
    category: 'Field Service',
    title: 'Daily Inventory Check',
    description: 'Run every morning, pull stock levels, and send a low-stock alert when items fall below reorder point.',
    icon: '📦',
    connectors: ['📦', '📊', '🔔'],
    tags: ['Scheduled', 'Field'],
    usageCount: '1.5K',
    featured: false,
  },
  {
    id: 'maintenance-request',
    category: 'Field Service',
    title: 'Maintenance Request Handler',
    description: 'Receive requests, create work orders, assign technicians, and notify them automatically.',
    icon: '🔧',
    connectors: ['📝', '👨‍🔧', '✅'],
    tags: ['Instant', 'Service'],
    usageCount: '1.6K',
    featured: false,
  },
  // ── Invoicing ──────────────────────────────────────────────────────────────
  {
    id: 'invoice-approval',
    category: 'Invoicing',
    title: 'Invoice Approval Workflow',
    description: 'Parse invoice totals, route high-value invoices for manager sign-off, then post approved records automatically.',
    icon: '📄',
    connectors: ['📊', '✅', '💰'],
    tags: ['Automated', 'Business'],
    usageCount: '3.2K',
    featured: true,
  },
  {
    id: 'expense-approval',
    category: 'Invoicing',
    title: 'Expense Report Approval',
    description: 'Submit expense reports, validate against company policy, flag violations, and sync approved records with Xero.',
    icon: '💳',
    connectors: ['💳', '✅', '📊'],
    tags: ['Automated', 'Finance'],
    usageCount: '2.7K',
    featured: true,
  },
  // ── Data collection / HR ────────────────────────────────────────────────────
  {
    id: 'onboarding',
    category: 'Data collection',
    title: 'Employee Onboarding',
    description: 'Detect new hires, provision Google Workspace + Slack accounts, and send a personalised welcome email.',
    icon: '👥',
    connectors: ['📋', '👤', '📧'],
    tags: ['Automated', 'HR'],
    usageCount: '2.1K',
    featured: false,
  },
  // ── Students ────────────────────────────────────────────────────────────────
  {
    id: 'student-research-assistant',
    category: 'Students',
    title: 'AI Research Assistant',
    description: 'Submit a research topic and get back a structured summary with key findings, notable authors, and further reading.',
    icon: '🎓',
    connectors: ['🔍', '🤖', '📄'],
    tags: ['AI', 'Research'],
    usageCount: '5.1K',
    featured: true,
  },
  {
    id: 'student-essay-feedback',
    category: 'Students',
    title: 'Essay Feedback Bot',
    description: 'Paste a draft essay and receive instant, actionable feedback on structure, argument, grammar, and citations.',
    icon: '✏️',
    connectors: ['📝', '🤖', '💬'],
    tags: ['AI', 'Writing'],
    usageCount: '4.3K',
    featured: true,
  },
  {
    id: 'student-study-scheduler',
    category: 'Students',
    title: 'Smart Study Planner',
    description: 'Upload your syllabus and exam dates — get an AI-generated week-by-week study schedule synced to Google Calendar.',
    icon: '📆',
    connectors: ['📚', '🤖', '📅'],
    tags: ['AI', 'Productivity'],
    usageCount: '3.7K',
    featured: false,
  },
  {
    id: 'student-citation-formatter',
    category: 'Students',
    title: 'Citation & Bibliography Builder',
    description: 'Paste raw source URLs and get a perfectly formatted APA 7th edition bibliography, sorted alphabetically.',
    icon: '📑',
    connectors: ['📄', '🤖', '✅'],
    tags: ['AI', 'Academic'],
    usageCount: '2.9K',
    featured: false,
  },
  // ── SMB ──────────────────────────────────────────────────────────────────
  {
    id: 'smb-lead-capture',
    category: 'SMB',
    title: 'Lead Capture & CRM Sync',
    description: 'Capture website leads, extract contact info with AI, score them, and sync automatically to HubSpot.',
    icon: '🎯',
    connectors: ['🌐', '🤖', '💼'],
    tags: ['Automated', 'Sales'],
    usageCount: '6.8K',
    featured: true,
  },
  {
    id: 'smb-customer-support',
    category: 'SMB',
    title: 'Customer Support Triage',
    description: 'Classify incoming tickets by intent, escalate billing/refunds, and draft an on-brand AI first response.',
    icon: '🎧',
    connectors: ['📨', '🤖', '✅'],
    tags: ['AI', 'Support'],
    usageCount: '4.2K',
    featured: true,
  },
  {
    id: 'smb-invoice-reminder',
    category: 'SMB',
    title: 'Invoice Payment Reminders',
    description: 'Every Monday, fetch overdue invoices from Xero and fire personalised reminder emails to customers with outstanding balances.',
    icon: '💰',
    connectors: ['📊', '📧', '🔔'],
    tags: ['Scheduled', 'Finance'],
    usageCount: '3.5K',
    featured: false,
  },
  {
    id: 'smb-review-request',
    category: 'SMB',
    title: 'Post-Purchase Review Request',
    description: 'Three days after an order ships, send a personalised review request to boost your Google / Trustpilot ratings.',
    icon: '⭐',
    connectors: ['🛒', '⏱️', '📧'],
    tags: ['Automated', 'Marketing'],
    usageCount: '2.8K',
    featured: false,
  },
  // ── Startups ────────────────────────────────────────────────────────────────
  {
    id: 'startup-user-feedback',
    category: 'Startups',
    title: 'User Feedback Analyzer',
    description: 'Collect in-app feedback, run sentiment analysis, escalate negative responses to CS, and log insights to ProductBoard.',
    icon: '💡',
    connectors: ['💬', '🤖', '📊'],
    tags: ['AI', 'Product'],
    usageCount: '3.9K',
    featured: true,
  },
  {
    id: 'startup-onboarding-email',
    category: 'Startups',
    title: 'User Onboarding Email Series',
    description: "On sign-up, personalise a welcome email to the user's role and use case, then dispatch via Customer.io.",
    icon: '🚀',
    connectors: ['👤', '🤖', '📧'],
    tags: ['AI', 'Growth'],
    usageCount: '5.4K',
    featured: true,
  },
  {
    id: 'startup-metrics-report',
    category: 'Startups',
    title: 'Weekly Metrics Digest',
    description: 'Every Friday, pull KPIs from your analytics stack, get an AI plain-English summary, and post it to Slack.',
    icon: '📈',
    connectors: ['📊', '🤖', '💬'],
    tags: ['Scheduled', 'Analytics'],
    usageCount: '4.1K',
    featured: false,
  },
  {
    id: 'startup-ab-test',
    category: 'Startups',
    title: 'A/B Test Result Processor',
    description: 'Fetch experiment data weekly, determine the winning variant with AI statistical analysis, and notify your product team.',
    icon: '🧪',
    connectors: ['🔬', '🤖', '💬'],
    tags: ['AI', 'Product'],
    usageCount: '2.3K',
    featured: false,
  },
];

export default function TemplatesPage() {
  const navigate = useNavigate();
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

  const handleUseTemplate = (templateId: string) => {
    navigate(`/workflows/new?template=${templateId}`);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-background to-muted border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-12 text-center">
          <h1 className="text-5xl font-bold text-foreground mb-4">
            Workflow Automation Templates
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto mb-8">
            Automate your work from start to finish. Explore our templates and create powerful,
            unstoppable solutions in minutes—no code needed.
          </p>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mb-8">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 text-base border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-card text-foreground placeholder:text-muted-foreground shadow-sm"
              />
            </div>
          </div>

          {/* Use Cases */}
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-3">Browse by use case</p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              {useCases.map((useCase) => (
                <button
                  key={useCase.id}
                  onClick={() => setSelectedUseCase(selectedUseCase === useCase.id ? null : useCase.id)}
                  className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    selectedUseCase === useCase.id
                      ? `${useCase.color} text-white shadow-md`
                      : 'bg-card text-foreground border border-border hover:border-primary/50'
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
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-card text-muted-foreground border border-border hover:bg-accent'
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
            <h2 className="text-2xl font-semibold text-foreground">
              {selectedCategory === 'Featured' ? 'Featured solution templates' : 'Templates'}
            </h2>
            <p className="text-sm text-muted-foreground">
              {filteredTemplates.length} {filteredTemplates.length === 1 ? 'template' : 'templates'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map((template) => (
              <div
                key={template.id}
                onClick={() => handleUseTemplate(template.id)}
                className="group cursor-pointer"
              >
                <Card className="relative overflow-hidden hover:shadow-xl transition-shadow duration-300 border-2 hover:border-primary/50 h-full">
                  {/* Category Badge */}
                  <div className="absolute top-4 left-4 z-10">
                    <span className="px-3 py-1 bg-foreground text-background text-xs font-medium rounded-md">
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
                    className="absolute top-4 right-4 z-10 p-2 bg-card rounded-lg shadow-md hover:bg-accent transition-colors"
                  >
                    <Bookmark
                      className={`h-4 w-4 ${
                        savedTemplates.has(template.id)
                          ? 'fill-primary text-primary'
                          : 'text-muted-foreground'
                      }`}
                    />
                  </button>

                  <CardContent className="p-0">
                    {/* Visual Preview Area */}
                    <div className="h-48 bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center relative overflow-hidden">
                      {/* Large Icon */}
                      <div className="text-8xl opacity-90 group-hover:scale-110 transition-transform duration-300">
                        {template.icon}
                      </div>
                      
                      {/* Connector Icons */}
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                        {template.connectors.map((connector, idx) => (
                          <div
                            key={idx}
                            className="w-10 h-10 bg-card rounded-lg shadow-md flex items-center justify-center text-xl"
                          >
                            {connector}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-5 space-y-3">
                      <h3 className="font-semibold text-foreground text-lg group-hover:text-primary transition-colors">
                        {template.title}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {template.description}
                      </p>

                      {/* Tags and Stats */}
                      <div className="flex items-center justify-between pt-2">
                        <div className="flex gap-2">
                          {template.tags.slice(0, 2).map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-1 bg-muted text-muted-foreground text-xs rounded"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <TrendingUp className="h-3 w-3" />
                          <span>{template.usageCount}</span>
                        </div>
                      </div>
                      {/* CTA */}
                      <div className="pt-1">
                        <span className="text-xs font-semibold text-primary group-hover:underline">
                          Use this template →
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>

          {filteredTemplates.length === 0 && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-lg font-medium text-foreground mb-2">No templates found</h3>
              <p className="text-muted-foreground">Try adjusting your search or filters</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
