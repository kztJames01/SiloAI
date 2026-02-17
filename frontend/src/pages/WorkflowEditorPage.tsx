import { useMemo, useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { workflowApi, nodeApi } from '../lib/api';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { 
  Play, X, MoreVertical, Clock3, 
  Zap, MessageSquare, FileText, Database, Code, Undo2, Redo2, Settings
} from 'lucide-react';
import toast from 'react-hot-toast';
import type { NodeDefinition } from '@silo/shared';

type StepType = string; // Now using backend node types

interface WorkflowStep {
  id: string;
  type: StepType;
  label: string;
  prompt: string;
  config: Record<string, any>;
  position: { x: number; y: number };
  retryConfig?: {
    enabled: boolean;
    maxRetries: number;
    retryDelay: number;
  };
}

interface WorkflowSnapshot {
  timestamp: number;
  steps: WorkflowStep[];
}

interface TriggerConfig {
  type: 'manual' | 'webhook' | 'schedule';
  config: {
    cronExpression?: string;
    timezone?: string;
    method?: string;
    validateHeaders?: boolean;
  };
}

const getIconComponent = (nodeType: string) => {
  const iconMap: Record<string, any> = {
    httpRequest: Zap,
    code: Code,
    dataTransform: FileText,
    webhook: MessageSquare,
    schedule: Clock3,
    start: Database,
    if: MessageSquare,
    switch: MessageSquare,
  };
  return iconMap[nodeType] || Database;
};

const createStep = (type: StepType, yPosition: number, nodeDef?: NodeDefinition): WorkflowStep => ({
  id: `step-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
  type,
  label: nodeDef?.name || 'Step',
  prompt: '',
  config: {},
  position: { x: 400, y: yPosition },
  retryConfig: {
    enabled: false,
    maxRetries: 3,
    retryDelay: 1000,
  },
});

export default function WorkflowEditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isNewWorkflow = !id;

  const [name, setName] = useState('Untitled Workflow');
  const [isEditingName, setIsEditingName] = useState(false);
  const [description, setDescription] = useState('');
  const [steps, setSteps] = useState<WorkflowStep[]>([]);
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);
  const [showRightPanel, setShowRightPanel] = useState(false);
  const [showTriggerPanel, setShowTriggerPanel] = useState(false);
  const [canvasOffset, setCanvasOffset] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [draggingStep, setDraggingStep] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [history, setHistory] = useState<WorkflowSnapshot[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [triggerConfig, setTriggerConfig] = useState<TriggerConfig>({
    type: 'manual',
    config: {},
  });
  const canvasRef = useRef<HTMLDivElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Fetch available nodes from backend
  const { data: nodesData } = useQuery({
    queryKey: ['nodes'],
    queryFn: async () => {
      const response = await nodeApi.list();
      return response.data;
    },
  });

  const availableNodes = nodesData?.nodes || [];

  const selectedStep = useMemo(
    () => steps.find((step) => step.id === selectedStepId) || null,
    [selectedStepId, steps]
  );

  const { data: workflow, isLoading } = useQuery({
    queryKey: ['workflow', id],
    queryFn: async () => {
      const response = await workflowApi.get(id!);
      return response.data.workflow;
    },
    enabled: !isNewWorkflow,
  });

  const pushHistory = (nextSteps: WorkflowStep[]) => {
    const nextHistory = history.slice(0, historyIndex + 1);
    nextHistory.push({
      timestamp: Date.now(),
      steps: nextSteps.map((step) => ({
        ...step,
        config: { ...step.config },
      })),
    });
    setHistory(nextHistory);
    setHistoryIndex(nextHistory.length - 1);
  };

  useEffect(() => {
    if (!workflow && isNewWorkflow) {
      const firstNode = availableNodes.find((n: NodeDefinition) => n.type === 'start') || availableNodes[0];
      const baseSteps = firstNode ? [createStep(firstNode.type, 100, firstNode)] : [];

      setSteps(baseSteps);
      setSelectedStepId(baseSteps[0]?.id || null);
      setHistory([{ timestamp: Date.now(), steps: baseSteps }]);
      setHistoryIndex(0);
      setShowRightPanel(true);
      return;
    }

    if (workflow) {
      setName(workflow.name);
      setDescription(workflow.description || '');
      setTriggerConfig(workflow.trigger as TriggerConfig);

      const loadedSteps: WorkflowStep[] = (workflow.nodes || []).map((node: any, index: number) => ({
        id: node.id,
        type: node.type || 'start',
        label: node.data?.label || 'Step',
        prompt: node.data?.prompt || '',
        config: node.data?.config || {},
        position: node.position || { x: 400, y: 100 + index * 200 },
        retryConfig: node.data?.retryConfig || { enabled: false, maxRetries: 3, retryDelay: 1000 },
      }));

      const initial = loadedSteps.length ? loadedSteps : [];
      setSteps(initial);
      setSelectedStepId(initial[0]?.id || null);
      setHistory([{ timestamp: Date.now(), steps: initial }]);
      setHistoryIndex(0);
      setShowRightPanel(true);
    }
  }, [workflow, isNewWorkflow, availableNodes]);

  useEffect(() => {
    if (isEditingName && nameInputRef.current) {
      nameInputRef.current.focus();
      nameInputRef.current.select();
    }
  }, [isEditingName]);

  const setAndTrackSteps = (nextSteps: WorkflowStep[]) => {
    setSteps(nextSteps);
    pushHistory(nextSteps);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const nodes = steps.map((step) => ({
        id: step.id,
        type: step.type,
        position: step.position,
        data: {
          label: step.label,
          nodeType: step.type,
          prompt: step.prompt,
          config: step.config,
          retryConfig: step.retryConfig,
        },
      }));

      const edges = steps.slice(0, -1).map((step, index) => ({
        id: `edge-${step.id}-${steps[index + 1].id}`,
        source: step.id,
        target: steps[index + 1].id,
      }));

      const payload = {
        name,
        description,
        nodes,
        edges,
        trigger: triggerConfig,
      };

      if (isNewWorkflow) {
        return workflowApi.create(payload);
      }
      return workflowApi.update(id!, payload);
    },
    onSuccess: (response) => {
      toast.success('Workflow saved successfully');
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
      if (isNewWorkflow) {
        navigate(`/workflows/${response.data.workflow.id}`);
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to save workflow');
    },
  });

  const executeMutation = useMutation({
    mutationFn: async () => {
      if (!id) {
        throw new Error('Please save before running');
      }
      return workflowApi.execute(id);
    },
    onSuccess: (response) => {
      toast.success('Workflow started');
      navigate(`/executions/${response.data.executionId}`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to run workflow');
    },
  });

  const addStepToCanvas = (type: StepType) => {
    const nodeDef = availableNodes.find((n: NodeDefinition) => n.type === type);
    const nextY = steps.length > 0 
      ? Math.max(...steps.map(s => s.position.y)) + 200 
      : 100;
    const newStep = createStep(type, nextY, nodeDef);
    const next = [...steps, newStep];
    setAndTrackSteps(next);
    setSelectedStepId(newStep.id);
    setShowRightPanel(true);
  };

  const deleteStep = (stepId: string) => {
    const next = steps.filter((step) => step.id !== stepId);
    setAndTrackSteps(next);
    if (selectedStepId === stepId) {
      setSelectedStepId(next[0]?.id || null);
    }
    if (next.length === 0) {
      setShowRightPanel(false);
    }
  };

  const updateSelectedStep = (updates: Partial<WorkflowStep>) => {
    if (!selectedStep) {
      return;
    }

    const next = steps.map((step) =>
      step.id === selectedStep.id
        ? {
            ...step,
            ...updates,
            config: updates.config ? { ...step.config, ...updates.config } : step.config,
          }
        : step
    );
    setAndTrackSteps(next);
  };

  const rollbackToVersion = (index: number) => {
    if (!history[index]) {
      return;
    }
    const version = history[index];
    const restored = version.steps.map((step) => ({ ...step, config: { ...step.config } }));
    setSteps(restored);
    setHistoryIndex(index);
  };

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    // Allow panning with any mouse button on canvas background
    if ((e.target as HTMLElement).closest('.step-card')) {
      return; // Don't pan if clicking on a step
    }
    setIsPanning(true);
    setPanStart({ x: e.clientX - canvasOffset.x, y: e.clientY - canvasOffset.y });
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setCanvasOffset({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
    } else if (draggingStep) {
      const step = steps.find(s => s.id === draggingStep);
      if (step) {
        const newX = (e.clientX - dragOffset.x - canvasOffset.x) / zoom;
        const newY = (e.clientY - dragOffset.y - canvasOffset.y) / zoom;
        updateStepPosition(draggingStep, { x: newX, y: newY });
      }
    }
  };

  const handleCanvasMouseUp = () => {
    setIsPanning(false);
    if (draggingStep) {
      setDraggingStep(null);
      // Save to history when drag ends
      pushHistory(steps);
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom(prev => Math.max(0.1, Math.min(3, prev + delta)));
  };

  const handleStepMouseDown = (e: React.MouseEvent, stepId: string) => {
    e.stopPropagation();
    const step = steps.find(s => s.id === stepId);
    if (step) {
      setDraggingStep(stepId);
      const rect = (e.target as HTMLElement).getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left - canvasOffset.x,
        y: e.clientY - rect.top - canvasOffset.y,
      });
    }
  };

  const updateStepPosition = (stepId: string, position: { x: number; y: number }) => {
    setSteps(prevSteps => prevSteps.map(step =>
      step.id === stepId ? { ...step, position } : step
    ));
  };

  const zoomIn = () => setZoom(prev => Math.min(3, prev + 0.2));
  const zoomOut = () => setZoom(prev => Math.max(0.1, prev - 0.2));
  const resetZoom = () => setZoom(1);

  const getStepIcon = (type: StepType) => {
    return getIconComponent(type);
  };

  const getStepColor = (type: StepType) => {
    const nodeDef = availableNodes.find((n: NodeDefinition) => n.type === type);
    return nodeDef?.color || '#3B82F6';
  };

  const getNodeDef = (type: StepType) => {
    return availableNodes.find((n: NodeDefinition) => n.type === type);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const sortedSteps = [...steps].sort((a, b) => a.position.y - b.position.y);

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-white">
      {/* Top Bar */}
      <div className="h-16 border-b border-gray-200 flex items-center justify-between px-6 bg-white z-30">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/workflows')}
            className="text-gray-600"
          >
            ← Back
          </Button>
          
          {isEditingName ? (
            <input
              ref={nameInputRef}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => setIsEditingName(false)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') setIsEditingName(false);
                if (e.key === 'Escape') {
                  setIsEditingName(false);
                  setName(name);
                }
              }}
              className="text-lg font-semibold px-2 py-1 border border-primary rounded focus:outline-none focus:ring-2 focus:ring-primary"
            />
          ) : (
            <h1 
              onClick={() => setIsEditingName(true)}
              className="text-lg font-semibold cursor-pointer hover:text-primary px-2 py-1 rounded hover:bg-gray-50"
            >
              {name}
            </h1>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => rollbackToVersion(Math.max(0, historyIndex - 1))}
            disabled={historyIndex <= 0}
          >
            <Undo2 className="h-4 w-4" />
            Undo
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => rollbackToVersion(Math.min(history.length - 1, historyIndex + 1))}
            disabled={historyIndex >= history.length - 1}
          >
            <Redo2 className="h-4 w-4" />
            Redo
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowTriggerPanel(true)}
            className="text-gray-600"
          >
            <Settings className="h-4 w-4 mr-2" />
            Trigger: {triggerConfig.type}
          </Button>
          <div className="h-6 w-px bg-gray-300 mx-2" />
          <Button
            variant="outline"
            size="sm"
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            className="bg-white"
          >
            {saveMutation.isPending ? 'Saving...' : 'Publish'}
          </Button>
          <Button
            size="sm"
            onClick={() => executeMutation.mutate()}
            disabled={isNewWorkflow || executeMutation.isPending}
          >
            <Play className="h-4 w-4 mr-2" />
            {executeMutation.isPending ? 'Running...' : 'Test run'}
          </Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden relative">
        {/* Fixed Node Palette Sidebar */}
        <aside className="fixed left-24 top-6 z-20 w-16 bg-white rounded-lg shadow-lg border border-gray-200">
          <div className="p-2 space-y-2">
              {availableNodes.filter((n: NodeDefinition) => n.category !== 'Triggers' && n.category !== 'Logic').map((node: NodeDefinition) => {
                const Icon = getIconComponent(node.type);
                return (
                  <button
                    key={node.type}
                    onClick={() => addStepToCanvas(node.type)}
                    className="w-12 h-12 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors group relative"
                    title={node.name}
                    style={{ color: node.color || '#3B82F6' }}
                  >
                    <Icon className="h-5 w-5" />
                    <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap">
                      {node.name}
                    </div>
                  </button>
                );
              })}
            </div>
          </aside>

        {/* Canvas */}
        <div 
          ref={canvasRef}
          className="flex-1 overflow-auto relative bg-gray-50"
          style={{ cursor: isPanning ? 'grabbing' : draggingStep ? 'move' : 'default' }}
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
          onMouseLeave={handleCanvasMouseUp}
          onWheel={handleWheel}
        >
          {/* Zoom Controls */}
          <div className="absolute bottom-6 right-6 z-20 bg-white rounded-lg shadow-lg border border-gray-200 p-2 flex flex-col gap-1" style={{ marginRight: '24px' }}>
            <button
              onClick={zoomIn}
              className="w-10 h-10 flex items-center justify-center rounded hover:bg-gray-100 transition-colors"
              title="Zoom In"
            >
              <span className="text-xl font-bold">+</span>
            </button>
            <button
              onClick={resetZoom}
              className="w-10 h-10 flex items-center justify-center rounded hover:bg-gray-100 transition-colors text-xs font-semibold"
              title={`${Math.round(zoom * 100)}%`}
            >
              {Math.round(zoom * 100)}%
            </button>
            <button
              onClick={zoomOut}
              className="w-10 h-10 flex items-center justify-center rounded hover:bg-gray-100 transition-colors"
              title="Zoom Out"
            >
              <span className="text-xl font-bold">−</span>
            </button>
          </div>
          <div 
            className="relative"
            style={{
              width: '200%',
              height: '200%',
              minHeight: '2000px',
              transform: `translate(${canvasOffset.x}px, ${canvasOffset.y}px) scale(${zoom})`,
              transformOrigin: '0 0',
            }}
          >
            {/* Connection Lines */}
            <svg className="absolute inset-0 pointer-events-none" style={{ width: '100%', height: '100%' }}>
              {sortedSteps.map((step, index) => {
                if (index === sortedSteps.length - 1) return null;
                const nextStep = sortedSteps[index + 1];
                
                // Calculate start and end points
                const startX = step.position.x + 150; // center of card
                const startY = step.position.y + 70; // bottom of card
                const endX = nextStep.position.x + 150;
                const endY = nextStep.position.y;
                
                // Calculate control points for smooth curve
                const midY = (startY + endY) / 2;
                const curvature = Math.min(Math.abs(endY - startY) / 3, 60);
                
                const path = `M ${startX} ${startY} 
                  C ${startX} ${startY + curvature}, 
                  ${endX} ${endY - curvature}, 
                  ${endX} ${endY}`;
                
                return (
                  <g key={`line-${step.id}`}>
                    <path
                      d={path}
                      stroke="#E5E7EB"
                      strokeWidth="2"
                      fill="none"
                    />
                    {/* Add node button in the middle */}
                    <g transform={`translate(${(startX + endX) / 2}, ${midY})`}>
                      <circle
                        cx="0"
                        cy="0"
                        r="12"
                        fill="white"
                        stroke="#E5E7EB"
                        strokeWidth="2"
                        className="cursor-pointer"
                        style={{ pointerEvents: 'all' }}
                        onClick={() => {
                          const firstNode = availableNodes[0];
                          if (firstNode) {
                            const newStep = createStep(firstNode.type, midY, firstNode);
                            newStep.position.x = (startX + endX) / 2 - 150;
                            setSteps([...steps, newStep]);
                            setSelectedStepId(newStep.id);
                            setShowRightPanel(true);
                          }
                        }}
                      />
                      <line x1="-5" y1="0" x2="5" y2="0" stroke="#9CA3AF" strokeWidth="2" style={{ pointerEvents: 'none' }} />
                      <line x1="0" y1="-5" x2="0" y2="5" stroke="#9CA3AF" strokeWidth="2" style={{ pointerEvents: 'none' }} />
                    </g>
                  </g>
                );
              })}
            </svg>

            {/* Step Cards */}
            {steps.map((step, index) => {
              const Icon = getStepIcon(step.type);
              const color = getStepColor(step.type);
              const isSelected = selectedStepId === step.id;
              const nodeDef = getNodeDef(step.type);

              return (
                <div
                  key={step.id}
                  className={`step-card absolute w-[300px] bg-white rounded-lg shadow-sm border-2 cursor-move transition-all ${
                    isSelected ? 'border-primary shadow-md' : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    handleStepMouseDown(e, step.id);
                    setSelectedStepId(step.id);
                    setShowRightPanel(true);
                  }}
                  style={{
                    left: step.position.x,
                    top: step.position.y,
                    userSelect: 'none',
                  }}
                >
                  <div className="flex items-center gap-3 p-4">
                    <div 
                      className="w-10 h-10 rounded flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${color}15`, color }}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {nodeDef?.name || step.type}
                        </p>
                        {step.retryConfig?.enabled && (
                          <span className="text-xs px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">
                            Retry
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 truncate mt-0.5">
                        {index + 1}. {step.label}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                      className="p-1 hover:bg-gray-100 rounded"
                    >
                      <MoreVertical className="h-4 w-4 text-gray-400" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Configuration Panel */}
        {showRightPanel && selectedStep && (
          <div className="w-[420px] bg-white border-l border-gray-200 flex flex-col z-20 shadow-lg">
            <div className="h-16 px-6 flex items-center justify-between border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div 
                  className="w-8 h-8 rounded flex items-center justify-center"
                  style={{ 
                    backgroundColor: `${getStepColor(selectedStep.type)}15`, 
                    color: getStepColor(selectedStep.type) 
                  }}
                >
                  {(() => {
                    const Icon = getStepIcon(selectedStep.type);
                    return <Icon className="h-4 w-4" />;
                  })()}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {sortedSteps.findIndex(s => s.id === selectedStep.id) + 1}. {selectedStep.label}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowRightPanel(false)}
                className="p-1.5 hover:bg-gray-100 rounded-lg"
              >
                <X className="h-4 w-4 text-gray-500" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Node Type <span className="text-red-500">*</span>
                </label>
                <button className="w-full px-4 py-2.5 text-left border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center justify-between">
                  <span className="text-sm text-gray-900">
                    {getNodeDef(selectedStep.type)?.name || selectedStep.type}
                  </span>
                  <span className="text-blue-600 text-xs font-medium">Change</span>
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Node Type
                </label>
                <select
                  value={selectedStep.type}
                  onChange={(e) => updateSelectedStep({ type: e.target.value as StepType })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                >
                  <option value="">Choose a node...</option>
                  {availableNodes.filter((n: NodeDefinition) => n.category !== 'Triggers' && n.category !== 'Logic').map((node: NodeDefinition) => (
                    <option key={node.type} value={node.type}>
                      {node.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Step Instructions
                </label>
                <textarea
                  value={selectedStep.prompt}
                  onChange={(e) => updateSelectedStep({ prompt: e.target.value })}
                  rows={4}
                  placeholder="Describe what you want this step to do..."
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm resize-none"
                />
              </div>

              {/* Conditional Logic for Code nodes */}
              {selectedStep.type === 'code' && (
                <div className="pt-4 border-t border-gray-200">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Execution Logic
                  </label>
                  <select
                    value={selectedStep.config.executionType || 'sequential'}
                    onChange={(e) => updateSelectedStep({
                      config: { ...selectedStep.config, executionType: e.target.value }
                    })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                  >
                    <option value="sequential">Sequential</option>
                    <option value="if-else">If/Else Conditional</option>
                    <option value="switch">Switch/Case</option>
                  </select>

                  {selectedStep.config.executionType === 'if-else' && (
                    <div className="mt-3 space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Condition</label>
                        <Input
                          placeholder="e.g., data.value > 10"
                          value={selectedStep.config.condition || ''}
                          onChange={(e) => updateSelectedStep({
                            config: { ...selectedStep.config, condition: e.target.value }
                          })}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">True Branch</label>
                        <textarea
                          placeholder="Code to execute if true..."
                          value={selectedStep.config.trueBranch || ''}
                          onChange={(e) => updateSelectedStep({
                            config: { ...selectedStep.config, trueBranch: e.target.value }
                          })}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm resize-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">False Branch</label>
                        <textarea
                          placeholder="Code to execute if false..."
                          value={selectedStep.config.falseBranch || ''}
                          onChange={(e) => updateSelectedStep({
                            config: { ...selectedStep.config, falseBranch: e.target.value }
                          })}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm resize-none"
                        />
                      </div>
                    </div>
                  )}

                  {selectedStep.config.executionType === 'switch' && (
                    <div className="mt-3">
                      <label className="block text-xs font-medium text-gray-600 mb-1">Switch Variable</label>
                      <Input
                        placeholder="e.g., data.status"
                        value={selectedStep.config.switchVar || ''}
                        onChange={(e) => updateSelectedStep({
                          config: { ...selectedStep.config, switchVar: e.target.value }
                        })}
                      />
                      <p className="mt-2 text-xs text-gray-500">Define cases in your code using switch statement</p>
                    </div>
                  )}
                </div>
              )}

              {/* Retry Configuration */}
              <div className="pt-4 border-t border-gray-200">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedStep.retryConfig?.enabled || false}
                    onChange={(e) => updateSelectedStep({
                      retryConfig: {
                        ...selectedStep.retryConfig,
                        enabled: e.target.checked,
                        maxRetries: selectedStep.retryConfig?.maxRetries || 3,
                        retryDelay: selectedStep.retryConfig?.retryDelay || 1000,
                      }
                    })}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm font-medium text-gray-700">Enable Retry on Failure</span>
                </label>

                {selectedStep.retryConfig?.enabled && (
                  <div className="mt-3 space-y-3 pl-6">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Max Retries</label>
                      <Input
                        type="number"
                        min="1"
                        max="10"
                        value={selectedStep.retryConfig.maxRetries}
                        onChange={(e) => updateSelectedStep({
                          retryConfig: {
                            ...selectedStep.retryConfig!,
                            maxRetries: parseInt(e.target.value) || 3,
                          }
                        })}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Retry Delay (ms)</label>
                      <Input
                        type="number"
                        min="100"
                        step="100"
                        value={selectedStep.retryConfig.retryDelay}
                        onChange={(e) => updateSelectedStep({
                          retryConfig: {
                            ...selectedStep.retryConfig!,
                            retryDelay: parseInt(e.target.value) || 1000,
                          }
                        })}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-gray-200">
                <Button
                  variant="ghost"
                  className="w-full text-red-600 hover:bg-red-50"
                  onClick={() => {
                    deleteStep(selectedStep.id);
                    setShowRightPanel(false);
                  }}
                >
                  Delete Step
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Trigger Configuration Panel */}
        {showTriggerPanel && (
          <div className="absolute inset-0 z-50 bg-black/50 flex items-center justify-center" onClick={() => setShowTriggerPanel(false)}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md m-4" onClick={(e) => e.stopPropagation()}>
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-lg font-semibold">Workflow Trigger</h2>
                <button onClick={() => setShowTriggerPanel(false)} className="p-1 hover:bg-gray-100 rounded">
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Trigger Type</label>
                  <select
                    value={triggerConfig.type}
                    onChange={(e) => setTriggerConfig({ type: e.target.value as any, config: {} })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                  >
                    <option value="manual">Manual</option>
                    <option value="webhook">Webhook</option>
                    <option value="schedule">Schedule</option>
                  </select>
                </div>

                {triggerConfig.type === 'webhook' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">HTTP Method</label>
                    <select
                      value={triggerConfig.config.method || 'POST'}
                      onChange={(e) => setTriggerConfig({
                        ...triggerConfig,
                        config: { ...triggerConfig.config, method: e.target.value }
                      })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                    >
                      <option>GET</option>
                      <option>POST</option>
                      <option>PUT</option>
                      <option>DELETE</option>
                    </select>
                  </div>
                )}

                {triggerConfig.type === 'schedule' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Cron Expression</label>
                      <Input
                        value={triggerConfig.config.cronExpression || ''}
                        onChange={(e) => setTriggerConfig({
                          ...triggerConfig,
                          config: { ...triggerConfig.config, cronExpression: e.target.value }
                        })}
                        placeholder="0 0 * * *"
                      />
                      <p className="mt-1 text-xs text-gray-500">e.g., 0 0 * * * = Daily at midnight</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Timezone</label>
                      <Input
                        value={triggerConfig.config.timezone || 'UTC'}
                        onChange={(e) => setTriggerConfig({
                          ...triggerConfig,
                          config: { ...triggerConfig.config, timezone: e.target.value }
                        })}
                        placeholder="UTC"
                      />
                    </div>
                  </>
                )}
              </div>

              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowTriggerPanel(false)}>
                  Cancel
                </Button>
                <Button onClick={() => setShowTriggerPanel(false)}>
                  Save Trigger
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
