import React, { useState, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Drawer,
  List,
  ListItem,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Chip,
  Tooltip,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  PlayArrow,
  Stop,
  Save,
  Settings,
  Delete,
  Schedule,
  SmartToy,
  Image,
  VideoLibrary,
  Share,
  Code,
  Transform,
  FilterAlt,
  Storage,
} from '@mui/icons-material';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ReactFlow, Node, Controls, Background, useNodesState, useEdgesState, addEdge, Connection } from 'reactflow';
import 'reactflow/dist/style.css';

interface WorkflowNode {
  id: string;
  type: 'trigger' | 'action' | 'condition' | 'data';
  category: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  config: Record<string, any>;
  inputs: string[];
  outputs: string[];
}

interface WorkflowConnection {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
}

interface DragDropWorkflowDesignerProps {
  initialWorkflow?: {
    nodes: WorkflowNode[];
    connections: WorkflowConnection[];
  };
  onWorkflowChange?: (workflow: { nodes: WorkflowNode[]; connections: WorkflowConnection[] }) => void;
  onSave?: (workflow: any) => void;
  readOnly?: boolean;
}

const WorkflowContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  height: '100vh',
  backgroundColor: theme.palette.background.default,
}));

const NodePalette = styled(Drawer)(({ theme }) => ({
  '& .MuiDrawer-paper': {
    width: 280,
    position: 'relative',
    backgroundColor: theme.palette.background.paper,
    borderRight: `1px solid ${theme.palette.divider}`,
  },
}));

const CanvasArea = styled(Box)(({ theme }) => ({
  flex: 1,
  position: 'relative',
  backgroundColor: theme.palette.grey[50],
}));

const NodeCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  margin: theme.spacing(1),
  cursor: 'grab',
  border: `2px solid transparent`,
  transition: 'all 0.2s ease',
  '&:hover': {
    borderColor: theme.palette.primary.main,
    transform: 'translateY(-2px)',
    boxShadow: theme.shadows[4],
  },
  '&.dragging': {
    opacity: 0.5,
    transform: 'rotate(5deg)',
  },
}));

const WorkflowNodeComponent = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  minWidth: 200,
  border: `2px solid ${theme.palette.divider}`,
  borderRadius: theme.shape.borderRadius,
  backgroundColor: theme.palette.background.paper,
  '&.selected': {
    borderColor: theme.palette.primary.main,
    boxShadow: `0 0 0 2px ${theme.palette.primary.main}20`,
  },
  '&.trigger': {
    borderColor: theme.palette.success.main,
  },
  '&.action': {
    borderColor: theme.palette.info.main,
  },
  '&.condition': {
    borderColor: theme.palette.warning.main,
  },
  '&.data': {
    borderColor: theme.palette.secondary.main,
  },
}));

const ConnectionHandle = styled(Box)(({ theme }) => ({
  width: 12,
  height: 12,
  borderRadius: '50%',
  backgroundColor: theme.palette.primary.main,
  position: 'absolute',
  cursor: 'crosshair',
  '&.input': {
    left: -6,
    top: '50%',
    transform: 'translateY(-50%)',
  },
  '&.output': {
    right: -6,
    top: '50%',
    transform: 'translateY(-50%)',
  },
}));

const nodeTypes = {
  trigger: [
    {
      id: 'schedule',
      name: 'Schedule Trigger',
      description: 'Trigger workflow at specific times',
      icon: <Schedule />,
      category: 'Triggers',
      config: { interval: '1h', timezone: 'UTC' },
      inputs: [],
      outputs: ['trigger'],
    },
    {
      id: 'webhook',
      name: 'Webhook Trigger',
      description: 'Trigger workflow via HTTP webhook',
      icon: <Code />,
      category: 'Triggers',
      config: { method: 'POST', path: '/webhook' },
      inputs: [],
      outputs: ['data'],
    },
  ],
  action: [
    {
      id: 'ai-generate',
      name: 'AI Content Generation',
      description: 'Generate content using AI',
      icon: <SmartToy />,
      category: 'AI Actions',
      config: { provider: 'openai', model: 'gpt-4', temperature: 0.7 },
      inputs: ['prompt'],
      outputs: ['content'],
    },
    {
      id: 'image-generate',
      name: 'Image Generation',
      description: 'Generate images using AI',
      icon: <Image />,
      category: 'Media Actions',
      config: { provider: 'dalle', size: '1024x1024' },
      inputs: ['prompt'],
      outputs: ['image'],
    },
    {
      id: 'video-create',
      name: 'Video Creation',
      description: 'Create videos with AI avatar',
      icon: <VideoLibrary />,
      category: 'Media Actions',
      config: { avatar: 'default', voice: 'natural' },
      inputs: ['script', 'avatar'],
      outputs: ['video'],
    },
    {
      id: 'social-post',
      name: 'Social Media Post',
      description: 'Post content to social platforms',
      icon: <Share />,
      category: 'Publishing',
      config: { platforms: ['facebook', 'twitter'], schedule: false },
      inputs: ['content', 'media'],
      outputs: ['post_id'],
    },
  ],
  condition: [
    {
      id: 'content-filter',
      name: 'Content Filter',
      description: 'Filter content based on criteria',
      icon: <FilterAlt />,
      category: 'Logic',
      config: { criteria: 'length > 100' },
      inputs: ['content'],
      outputs: ['pass', 'fail'],
    },
    {
      id: 'approval-gate',
      name: 'Approval Gate',
      description: 'Require manual approval',
      icon: <Stop />,
      category: 'Logic',
      config: { approvers: [], timeout: '24h' },
      inputs: ['content'],
      outputs: ['approved', 'rejected'],
    },
  ],
  data: [
    {
      id: 'data-transform',
      name: 'Data Transform',
      description: 'Transform data structure',
      icon: <Transform />,
      category: 'Data',
      config: { transformation: 'json' },
      inputs: ['data'],
      outputs: ['transformed'],
    },
    {
      id: 'data-store',
      name: 'Data Storage',
      description: 'Store data in database',
      icon: <Storage />,
      category: 'Data',
      config: { table: 'content', operation: 'insert' },
      inputs: ['data'],
      outputs: ['stored'],
    },
  ],
};

const DraggableNodeItem: React.FC<{ node: WorkflowNode; onDragStart: (node: WorkflowNode) => void }> = ({
  node,
  onDragStart,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: node.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <NodeCard
      ref={setNodeRef}
      style={style}
      className={isDragging ? 'dragging' : ''}
      {...attributes}
      {...listeners}
      onMouseDown={() => onDragStart(node)}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
        {node.icon}
        <Typography variant="subtitle2" sx={{ ml: 1, fontWeight: 600 }}>
          {node.name}
        </Typography>
      </Box>
      <Typography variant="body2" color="textSecondary">
        {node.description}
      </Typography>
      <Box sx={{ mt: 1, display: 'flex', gap: 0.5 }}>
        <Chip label={node.category} size="small" variant="outlined" />
      </Box>
    </NodeCard>
  );
};

const WorkflowNodeRenderer: React.FC<{
  node: WorkflowNode;
  selected: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onConfigure: (node: WorkflowNode) => void;
}> = ({ node, selected, onSelect, onDelete, onConfigure }) => {
  return (
    <WorkflowNodeComponent
      className={`${node.type} ${selected ? 'selected' : ''}`}
      onClick={() => onSelect(node.id)}
    >
      <ConnectionHandle className="input" />
      <ConnectionHandle className="output" />
      
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {node.icon}
          <Typography variant="subtitle2" sx={{ ml: 1, fontWeight: 600 }}>
            {node.name}
          </Typography>
        </Box>
        <Box>
          <IconButton size="small" onClick={(e) => { e.stopPropagation(); onConfigure(node); }}>
            <Settings />
          </IconButton>
          <IconButton size="small" onClick={(e) => { e.stopPropagation(); onDelete(node.id); }}>
            <Delete />
          </IconButton>
        </Box>
      </Box>
      
      <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
        {node.description}
      </Typography>
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          {node.inputs.length > 0 && (
            <Chip label={`${node.inputs.length} inputs`} size="small" color="primary" variant="outlined" />
          )}
        </Box>
        <Box>
          {node.outputs.length > 0 && (
            <Chip label={`${node.outputs.length} outputs`} size="small" color="secondary" variant="outlined" />
          )}
        </Box>
      </Box>
    </WorkflowNodeComponent>
  );
};

export const DragDropWorkflowDesigner: React.FC<DragDropWorkflowDesignerProps> = ({
  initialWorkflow,
  onWorkflowChange,
  onSave,
  readOnly = false,
}) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [workflowNodes, setWorkflowNodes] = useState<WorkflowNode[]>(initialWorkflow?.nodes || []);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [draggedNode, setDraggedNode] = useState<WorkflowNode | null>(null);
  const [showConfigDialog, setShowConfigDialog] = useState(false);
  const [configNode, setConfigNode] = useState<WorkflowNode | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = useCallback((node: WorkflowNode) => {
    setDraggedNode(node);
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { over } = event;
    
    if (over && over.id === 'canvas' && draggedNode) {
      // Add node to canvas
      const newNode: WorkflowNode = {
        ...draggedNode,
        id: `${draggedNode.id}-${Date.now()}`,
      };
      
      setWorkflowNodes(prev => [...prev, newNode]);
      
      // Add to React Flow
      const reactFlowNode: Node = {
        id: newNode.id,
        type: 'default',
        position: { x: Math.random() * 400, y: Math.random() * 400 },
        data: { 
          label: (
            <WorkflowNodeRenderer
              node={newNode}
              selected={selectedNode === newNode.id}
              onSelect={setSelectedNode}
              onDelete={handleDeleteNode}
              onConfigure={handleConfigureNode}
            />
          )
        },
      };
      
      setNodes(prev => [...prev, reactFlowNode]);
    }
    
    setDraggedNode(null);
  }, [draggedNode, selectedNode]);

  const handleDeleteNode = useCallback((nodeId: string) => {
    setWorkflowNodes(prev => prev.filter(n => n.id !== nodeId));
    setNodes(prev => prev.filter(n => n.id !== nodeId));
    setEdges(prev => prev.filter(e => e.source !== nodeId && e.target !== nodeId));
  }, [setNodes, setEdges]);

  const handleConfigureNode = useCallback((node: WorkflowNode) => {
    setConfigNode(node);
    setShowConfigDialog(true);
  }, []);

  const handleSaveConfig = useCallback((config: Record<string, any>) => {
    if (configNode) {
      setWorkflowNodes(prev => 
        prev.map(n => n.id === configNode.id ? { ...n, config } : n)
      );
    }
    setShowConfigDialog(false);
    setConfigNode(null);
  }, [configNode]);

  const onConnect = useCallback((params: Connection) => {
    setEdges(eds => addEdge(params, eds));
  }, [setEdges]);

  const handleRunWorkflow = useCallback(async () => {
    setIsRunning(true);
    try {
      // Simulate workflow execution
      await new Promise(resolve => setTimeout(resolve, 2000));
      console.log('Workflow executed successfully');
    } catch (error) {
      console.error('Workflow execution failed:', error);
    } finally {
      setIsRunning(false);
    }
  }, []);

  const handleSaveWorkflow = useCallback(() => {
    const workflow = {
      nodes: workflowNodes,
      connections: edges.map(e => ({
        id: e.id,
        source: e.source,
        target: e.target,
        sourceHandle: e.sourceHandle ?? undefined,
        targetHandle: e.targetHandle ?? undefined,
      })),
    };
    
    onSave?.(workflow);
    onWorkflowChange?.(workflow);
  }, [workflowNodes, edges, onSave, onWorkflowChange]);

  const allNodeTypes: WorkflowNode[] = Object.entries(nodeTypes).flatMap(([type, nodes]) =>
    nodes.map((n: any) => ({ ...n, type }))
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={({ active }) => {
        const node = allNodeTypes.find(n => n.id === active.id);
        if (node) setDraggedNode(node);
      }}
      onDragEnd={handleDragEnd}
    >
      <WorkflowContainer>
        <NodePalette variant="permanent" open>
          <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
            <Typography variant="h6" gutterBottom>
              Workflow Nodes
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Drag nodes to the canvas to build your workflow
            </Typography>
          </Box>
          
          <List sx={{ p: 0 }}>
            {Object.entries(nodeTypes).map(([category, nodes]) => (
              <Box key={category}>
                <ListItem>
                  <Typography variant="subtitle2" color="primary" sx={{ fontWeight: 600 }}>
                    {category.toUpperCase()}
                  </Typography>
                </ListItem>
                <SortableContext items={nodes.map(n => n.id)} strategy={verticalListSortingStrategy}>
                  {nodes.map(node => (
                    <DraggableNodeItem
                      key={node.id}
                      node={{ ...node, type: category as WorkflowNode['type'] }}
                      onDragStart={handleDragStart}
                    />
                  ))}
                </SortableContext>
              </Box>
            ))}
          </List>
        </NodePalette>

        <CanvasArea>
          <Box sx={{ position: 'absolute', top: 16, right: 16, zIndex: 1000, display: 'flex', gap: 1 }}>
            <Tooltip title="Run Workflow">
              <Fab
                color="primary"
                onClick={handleRunWorkflow}
                disabled={isRunning || readOnly}
                size="medium"
              >
                {isRunning ? <Stop /> : <PlayArrow />}
              </Fab>
            </Tooltip>
            
            <Tooltip title="Save Workflow">
              <Fab
                color="secondary"
                onClick={handleSaveWorkflow}
                disabled={readOnly}
                size="medium"
              >
                <Save />
              </Fab>
            </Tooltip>
          </Box>

          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            fitView
            attributionPosition="bottom-left"
          >
            <Controls />
            <Background />
          </ReactFlow>
          
          {/* Drop zone for canvas */}
          <Box
            id="canvas"
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              pointerEvents: draggedNode ? 'auto' : 'none',
            }}
          />
        </CanvasArea>

        <DragOverlay>
          {draggedNode && (
            <NodeCard>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                {draggedNode.icon}
                <Typography variant="subtitle2" sx={{ ml: 1, fontWeight: 600 }}>
                  {draggedNode.name}
                </Typography>
              </Box>
              <Typography variant="body2" color="textSecondary">
                {draggedNode.description}
              </Typography>
            </NodeCard>
          )}
        </DragOverlay>
      </WorkflowContainer>

      {/* Configuration Dialog */}
      <Dialog
        open={showConfigDialog}
        onClose={() => setShowConfigDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Configure {configNode?.name}
        </DialogTitle>
        <DialogContent>
          {configNode && (
            <Box sx={{ pt: 2 }}>
              {Object.entries(configNode.config).map(([key, value]) => (
                <TextField
                  key={key}
                  fullWidth
                  label={key.charAt(0).toUpperCase() + key.slice(1)}
                  value={value}
                  onChange={(e) => {
                    if (configNode) {
                      setConfigNode({
                        ...configNode,
                        config: {
                          ...configNode.config,
                          [key]: e.target.value,
                        },
                      });
                    }
                  }}
                  margin="normal"
                />
              ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowConfigDialog(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => handleSaveConfig(configNode?.config || {})}
            variant="contained"
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </DndContext>
  );
};

export default DragDropWorkflowDesigner;