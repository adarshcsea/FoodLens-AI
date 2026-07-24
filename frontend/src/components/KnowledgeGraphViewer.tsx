import React, { useMemo, useCallback } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  Handle,
  Position,
  Node,
  Edge,
  useNodesState,
  useEdgesState,
} from '@xyflow/react';
import dagre from 'dagre';
import '@xyflow/react/dist/style.css';

// =============================================================================
// 1. TYPES & INTERFACES
// =============================================================================

export interface GraphNodeData extends Record<string, unknown> {
  label: string;
  type: 'INGREDIENT' | 'EFFECT' | 'CONDITION' | 'RISK';
  severityLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  description?: string;
  evidenceCount?: number;
}

export interface GraphEdgeData {
  source: string;
  target: string;
  relationship: string;
  evidenceStrength: 'WEAK' | 'MODERATE' | 'STRONG' | 'CLINICAL_CONSENSUS';
}

interface KnowledgeGraphViewerProps {
  nodes: { id: string; data: GraphNodeData }[];
  edges: GraphEdgeData[];
  onNodeSelect?: (nodeId: string, data: GraphNodeData) => void;
}

// Custom Node structure compatible with @xyflow/react v12
export type CustomNode = Node<GraphNodeData>;

// =============================================================================
// 2. DAGRE HIERARCHICAL LAYOUT ENGINE UTILITY
// =============================================================================

const NODE_WIDTH = 220;
const NODE_HEIGHT = 80;

const getLayoutedElements = (
  nodes: CustomNode[],
  edges: Edge[],
  direction = 'TB' // Top-to-Bottom Tree Flow
) => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  dagreGraph.setGraph({ rankdir: direction, nodesep: 50, ranksep: 80 });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes: CustomNode[] = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      targetPosition: Position.Top,
      sourcePosition: Position.Bottom,
      position: {
        x: nodeWithPosition.x - NODE_WIDTH / 2,
        y: nodeWithPosition.y - NODE_HEIGHT / 2,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
};

// =============================================================================
// 3. CUSTOM REACT FLOW NODE COMPONENT
// =============================================================================

// Let TypeScript infer node props directly
const CustomGraphNode = ({ data }: { data: GraphNodeData }) => {
  const getSeverityStyle = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return 'border-rose-500/80 bg-rose-950/40 text-rose-200 shadow-rose-900/30';
      case 'HIGH':
        return 'border-amber-500/80 bg-amber-950/40 text-amber-200 shadow-amber-900/30';
      case 'MODERATE':
        return 'border-yellow-500/80 bg-yellow-950/40 text-yellow-200 shadow-yellow-900/30';
      default:
        return 'border-emerald-500/80 bg-emerald-950/40 text-emerald-200 shadow-emerald-900/30';
    }
  };

  const isIngredient = data.type === 'INGREDIENT';

  return (
    <div
      className={`relative px-4 py-3 rounded-xl border backdrop-blur-md shadow-lg transition-all duration-200 hover:scale-105 cursor-pointer w-[210px] ${
        isIngredient
          ? 'border-indigo-500 bg-indigo-950/60 text-indigo-100 shadow-indigo-900/40 ring-2 ring-indigo-500/30'
          : getSeverityStyle(data.severityLevel)
      }`}
    >
      <Handle type="target" position={Position.Top} className="!bg-slate-400 !w-2.5 !h-2.5" />

      {/* Node Header Badge */}
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] font-mono tracking-wider uppercase opacity-75">
          {data.type}
        </span>
        {!isIngredient && (
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase bg-black/40">
            {data.severityLevel}
          </span>
        )}
      </div>

      {/* Node Main Title */}
      <div className="text-xs font-semibold truncate leading-tight">{data.label}</div>

      <Handle type="source" position={Position.Bottom} className="!bg-slate-400 !w-2.5 !h-2.5" />
    </div>
  );
};

// =============================================================================
// 4. MAIN KNOWLEDGE GRAPH CONTAINER
// =============================================================================

export const KnowledgeGraphViewer: React.FC<KnowledgeGraphViewerProps> = ({
  nodes: initialNodes,
  edges: initialEdges,
  onNodeSelect,
}) => {
  const nodeTypes = useMemo(() => ({ customNode: CustomGraphNode }), []);

  const rawNodes: CustomNode[] = useMemo(() => {
    return initialNodes.map((n) => ({
      id: n.id,
      type: 'customNode',
      data: n.data,
      position: { x: 0, y: 0 },
    }));
  }, [initialNodes]);

  const rawEdges: Edge[] = useMemo(() => {
    return initialEdges.map((e, idx) => ({
      id: `e-${e.source}-${e.target}-${idx}`,
      source: e.source,
      target: e.target,
      label: e.relationship,
      animated: e.evidenceStrength === 'CLINICAL_CONSENSUS' || e.evidenceStrength === 'STRONG',
      style: {
        stroke: e.evidenceStrength === 'CLINICAL_CONSENSUS' ? '#f43f5e' : '#64748b',
        strokeWidth: 2,
      },
      labelStyle: { fill: '#94a3b8', fontSize: 10, fontWeight: 600 },
      labelBgStyle: { fill: '#0f172a', fillOpacity: 0.8 },
      labelBgPadding: [4, 2] as [number, number],
      labelBgBorderRadius: 4,
    }));
  }, [initialEdges]);

  const { nodes: layoutedNodes, edges: layoutedEdges } = useMemo(
    () => getLayoutedElements(rawNodes, rawEdges, 'TB'),
    [rawNodes, rawEdges]
  );

  const [nodes, , onNodesChange] = useNodesState(layoutedNodes);
  const [edges, , onEdgesChange] = useEdgesState(layoutedEdges);

  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      if (onNodeSelect) {
        onNodeSelect(node.id, node.data as GraphNodeData);
      }
    },
    [onNodeSelect]
  );

  return (
    <div className="w-full h-[550px] rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 shadow-2xl relative">
      <div className="absolute top-4 left-4 z-10 flex gap-3 px-3 py-2 rounded-lg bg-slate-900/80 border border-slate-800/80 backdrop-blur-md text-[11px] text-slate-300">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block" /> Ingredient
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" /> Critical Hazard
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" /> High Risk
        </span>
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        fitView
        attributionPosition="bottom-right"
      >
        <Background color="#1e293b" gap={20} size={1} />
        <Controls className="!bg-slate-900 !border-slate-800 !text-white" />
      </ReactFlow>
    </div>
  );
};