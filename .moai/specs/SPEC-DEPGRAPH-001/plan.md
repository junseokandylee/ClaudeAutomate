# Implementation Plan: SPEC-DEPGRAPH-001

## Overview

Create interactive dependency graph visualization with React Flow.

## Task Breakdown

### Task 1: Graph Data Service

```typescript
// src/main/services/graph-data.service.ts
import { Spec } from '@/types'

interface GraphNode {
  id: string
  type: 'spec'
  position: { x: number; y: number }
  data: {
    spec: Spec
    status: 'pending' | 'running' | 'completed' | 'failed'
    wave: number
  }
}

interface GraphEdge {
  id: string
  source: string
  target: string
  type: 'dependency'
  animated?: boolean
}

interface GraphData {
  nodes: GraphNode[]
  edges: GraphEdge[]
}

export class GraphDataService {
  buildGraph(specs: Spec[], wavePlan: WavePlan): GraphData {
    const nodes: GraphNode[] = []
    const edges: GraphEdge[] = []

    // Create nodes
    specs.forEach((spec, index) => {
      const wave = this.findWaveForSpec(spec.id, wavePlan)
      nodes.push({
        id: spec.id,
        type: 'spec',
        position: this.calculatePosition(index, wave, wavePlan),
        data: {
          spec,
          status: 'pending',
          wave
        }
      })
    })

    // Create edges from dependencies
    specs.forEach(spec => {
      spec.dependencies?.forEach(depId => {
        edges.push({
          id: `${depId}-${spec.id}`,
          source: depId,
          target: spec.id,
          type: 'dependency'
        })
      })
    })

    return { nodes, edges }
  }

  private calculatePosition(index: number, wave: number, wavePlan: WavePlan): { x: number; y: number } {
    const waveSpecs = wavePlan.waves[wave]?.specs || []
    const indexInWave = waveSpecs.findIndex(s => s.id === index.toString())

    const xSpacing = 250
    const ySpacing = 150

    return {
      x: wave * xSpacing,
      y: (indexInWave >= 0 ? indexInWave : index) * ySpacing
    }
  }

  private findWaveForSpec(specId: string, wavePlan: WavePlan): number {
    for (let i = 0; i < wavePlan.waves.length; i++) {
      if (wavePlan.waves[i].specs.some(s => s.id === specId)) {
        return i
      }
    }
    return 0
  }

  detectCycles(specs: Spec[]): string[][] {
    const cycles: string[][] = []
    const visited = new Set<string>()
    const recursionStack = new Set<string>()
    const path: string[] = []

    const dfs = (specId: string): boolean => {
      visited.add(specId)
      recursionStack.add(specId)
      path.push(specId)

      const spec = specs.find(s => s.id === specId)
      for (const depId of spec?.dependencies || []) {
        if (!visited.has(depId)) {
          if (dfs(depId)) return true
        } else if (recursionStack.has(depId)) {
          const cycleStart = path.indexOf(depId)
          cycles.push([...path.slice(cycleStart), depId])
          return true
        }
      }

      path.pop()
      recursionStack.delete(specId)
      return false
    }

    specs.forEach(spec => {
      if (!visited.has(spec.id)) {
        dfs(spec.id)
      }
    })

    return cycles
  }

  getTopologicalOrder(specs: Spec[]): string[] {
    const visited = new Set<string>()
    const order: string[] = []

    const visit = (specId: string) => {
      if (visited.has(specId)) return
      visited.add(specId)

      const spec = specs.find(s => s.id === specId)
      spec?.dependencies?.forEach(depId => visit(depId))
      order.push(specId)
    }

    specs.forEach(spec => visit(spec.id))
    return order
  }
}
```

### Task 2: Custom Spec Node Component

```typescript
// src/renderer/components/graph/SpecNode.tsx
import { Handle, Position, NodeProps } from 'reactflow'
import { cn } from '@/lib/utils'

interface SpecNodeData {
  spec: Spec
  status: 'pending' | 'running' | 'completed' | 'failed'
  wave: number
}

const statusColors = {
  pending: 'bg-slate-700 border-slate-500',
  running: 'bg-blue-900 border-blue-500 animate-pulse',
  completed: 'bg-emerald-900 border-emerald-500',
  failed: 'bg-red-900 border-red-500'
}

const statusIcons = {
  pending: '○',
  running: '◐',
  completed: '✓',
  failed: '✗'
}

export function SpecNode({ data, selected }: NodeProps<SpecNodeData>) {
  return (
    <div
      className={cn(
        'px-4 py-3 rounded-lg border-2 min-w-[180px]',
        'transition-all duration-200',
        statusColors[data.status],
        selected && 'ring-2 ring-white ring-offset-2 ring-offset-slate-900'
      )}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-slate-400"
      />

      <div className="flex items-center gap-2">
        <span className="text-lg">{statusIcons[data.status]}</span>
        <div>
          <div className="font-semibold text-white text-sm">
            {data.spec.id}
          </div>
          <div className="text-xs text-slate-400 truncate max-w-[140px]">
            {data.spec.title}
          </div>
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between text-xs">
        <span className="text-slate-500">Wave {data.wave + 1}</span>
        <span className={cn(
          'px-2 py-0.5 rounded-full',
          data.spec.priority === 'CRITICAL' && 'bg-red-800 text-red-200',
          data.spec.priority === 'HIGH' && 'bg-amber-800 text-amber-200',
          data.spec.priority === 'MEDIUM' && 'bg-blue-800 text-blue-200',
          data.spec.priority === 'LOW' && 'bg-slate-600 text-slate-300'
        )}>
          {data.spec.priority}
        </span>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-slate-400"
      />
    </div>
  )
}
```

### Task 3: Dependency Graph Component

```typescript
// src/renderer/components/graph/DependencyGraph.tsx
import { useCallback, useMemo, useEffect } from 'react'
import ReactFlow, {
  Controls,
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
  ConnectionMode,
  Panel
} from 'reactflow'
import dagre from 'dagre'
import 'reactflow/dist/style.css'

import { SpecNode } from './SpecNode'
import { useSpecStore } from '@/stores/spec-store'
import { useSessionStore } from '@/stores/session-store'

const nodeTypes = {
  spec: SpecNode
}

const dagreGraph = new dagre.graphlib.Graph()
dagreGraph.setDefaultEdgeLabel(() => ({}))

function getLayoutedElements(nodes: Node[], edges: Edge[]) {
  dagreGraph.setGraph({ rankdir: 'LR', nodesep: 80, ranksep: 150 })

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: 200, height: 80 })
  })

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target)
  })

  dagre.layout(dagreGraph)

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id)
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - 100,
        y: nodeWithPosition.y - 40
      }
    }
  })

  return { nodes: layoutedNodes, edges }
}

export function DependencyGraph() {
  const { specs, wavePlan } = useSpecStore()
  const { sessions } = useSessionStore()

  const initialData = useMemo(() => {
    const graphService = new GraphDataService()
    return graphService.buildGraph(specs, wavePlan)
  }, [specs, wavePlan])

  const { nodes: layoutedNodes, edges: layoutedEdges } = useMemo(
    () => getLayoutedElements(initialData.nodes, initialData.edges),
    [initialData]
  )

  const [nodes, setNodes, onNodesChange] = useNodesState(layoutedNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(layoutedEdges)

  // Update node statuses based on sessions
  useEffect(() => {
    setNodes(nds =>
      nds.map(node => {
        const session = sessions.find(s => s.specId === node.id)
        if (session) {
          return {
            ...node,
            data: {
              ...node.data,
              status: session.status
            }
          }
        }
        return node
      })
    )

    // Animate edges for running sessions
    setEdges(eds =>
      eds.map(edge => {
        const targetSession = sessions.find(s => s.specId === edge.target)
        return {
          ...edge,
          animated: targetSession?.status === 'running'
        }
      })
    )
  }, [sessions, setNodes, setEdges])

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    // Show spec details
    console.log('Selected spec:', node.data.spec)
  }, [])

  const onNodeDoubleClick = useCallback((event: React.MouseEvent, node: Node) => {
    // Navigate to terminal
    const session = sessions.find(s => s.specId === node.id)
    if (session) {
      window.electronAPI.focusSession(session.id)
    }
  }, [sessions])

  return (
    <div className="w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        onNodeDoubleClick={onNodeDoubleClick}
        nodeTypes={nodeTypes}
        connectionMode={ConnectionMode.Loose}
        fitView
        minZoom={0.1}
        maxZoom={2}
      >
        <Background color="#334155" gap={20} />
        <Controls className="bg-slate-800 border-slate-600" />
        <MiniMap
          className="bg-slate-800"
          nodeColor={(node) => {
            const status = node.data?.status
            switch (status) {
              case 'completed': return '#10b981'
              case 'running': return '#3b82f6'
              case 'failed': return '#ef4444'
              default: return '#64748b'
            }
          }}
        />

        <Panel position="top-left" className="bg-slate-800/80 p-3 rounded-lg">
          <div className="flex gap-4 text-xs">
            <LegendItem color="bg-slate-500" label="Pending" />
            <LegendItem color="bg-blue-500" label="Running" />
            <LegendItem color="bg-emerald-500" label="Completed" />
            <LegendItem color="bg-red-500" label="Failed" />
          </div>
        </Panel>
      </ReactFlow>
    </div>
  )
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className={`w-3 h-3 rounded-full ${color}`} />
      <span className="text-slate-300">{label}</span>
    </div>
  )
}
```

### Task 4: Graph Export Service

```typescript
// src/renderer/services/graph-export.service.ts
import { toPng, toSvg } from 'html-to-image'
import { getRectOfNodes, getTransformForBounds } from 'reactflow'

export class GraphExportService {
  async exportToPng(
    element: HTMLElement,
    nodes: Node[],
    filename = 'dependency-graph.png'
  ): Promise<void> {
    const nodesBounds = getRectOfNodes(nodes)
    const transform = getTransformForBounds(
      nodesBounds,
      nodesBounds.width,
      nodesBounds.height,
      0.5,
      2
    )

    const dataUrl = await toPng(element, {
      backgroundColor: '#0f172a',
      width: nodesBounds.width,
      height: nodesBounds.height,
      style: {
        transform: `translate(${transform[0]}px, ${transform[1]}px) scale(${transform[2]})`
      }
    })

    const link = document.createElement('a')
    link.download = filename
    link.href = dataUrl
    link.click()
  }

  async exportToSvg(
    element: HTMLElement,
    filename = 'dependency-graph.svg'
  ): Promise<void> {
    const dataUrl = await toSvg(element, {
      backgroundColor: '#0f172a'
    })

    const link = document.createElement('a')
    link.download = filename
    link.href = dataUrl
    link.click()
  }

  exportToJson(nodes: Node[], edges: Edge[], filename = 'dependency-graph.json'): void {
    const data = {
      exportedAt: new Date().toISOString(),
      nodes: nodes.map(n => ({
        id: n.id,
        specId: n.data.spec.id,
        title: n.data.spec.title,
        status: n.data.status,
        wave: n.data.wave,
        position: n.position
      })),
      edges: edges.map(e => ({
        source: e.source,
        target: e.target
      })),
      stats: {
        totalNodes: nodes.length,
        totalEdges: edges.length,
        completed: nodes.filter(n => n.data.status === 'completed').length,
        failed: nodes.filter(n => n.data.status === 'failed').length
      }
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.download = filename
    link.href = url
    link.click()

    URL.revokeObjectURL(url)
  }
}
```

### Task 5: Graph Toolbar Component

```typescript
// src/renderer/components/graph/GraphToolbar.tsx
import { useReactFlow } from 'reactflow'
import { Button, Tooltip } from '@/components/ui'
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Download,
  Layout,
  RefreshCw
} from 'lucide-react'

interface Props {
  onExport: (format: 'png' | 'svg' | 'json') => void
  onLayoutChange: (layout: 'dagre' | 'force' | 'hierarchical') => void
}

export function GraphToolbar({ onExport, onLayoutChange }: Props) {
  const { zoomIn, zoomOut, fitView } = useReactFlow()

  return (
    <div className="absolute top-4 right-4 z-10 flex gap-2">
      <div className="flex bg-slate-800 rounded-lg border border-slate-600">
        <Tooltip content="Zoom In">
          <Button variant="ghost" size="sm" onClick={() => zoomIn()}>
            <ZoomIn className="w-4 h-4" />
          </Button>
        </Tooltip>

        <Tooltip content="Zoom Out">
          <Button variant="ghost" size="sm" onClick={() => zoomOut()}>
            <ZoomOut className="w-4 h-4" />
          </Button>
        </Tooltip>

        <Tooltip content="Fit View">
          <Button variant="ghost" size="sm" onClick={() => fitView()}>
            <Maximize2 className="w-4 h-4" />
          </Button>
        </Tooltip>
      </div>

      <div className="flex bg-slate-800 rounded-lg border border-slate-600">
        <Tooltip content="Auto Layout">
          <Button variant="ghost" size="sm" onClick={() => onLayoutChange('dagre')}>
            <Layout className="w-4 h-4" />
          </Button>
        </Tooltip>

        <Tooltip content="Refresh">
          <Button variant="ghost" size="sm" onClick={() => fitView()}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </Tooltip>
      </div>

      <div className="flex bg-slate-800 rounded-lg border border-slate-600">
        <Tooltip content="Export PNG">
          <Button variant="ghost" size="sm" onClick={() => onExport('png')}>
            <Download className="w-4 h-4" />
          </Button>
        </Tooltip>
      </div>
    </div>
  )
}
```

## Layout Options

| Layout | Best For |
|--------|----------|
| Dagre | Complex dependency chains |
| Hierarchical | Wave-based visualization |
| Force | Exploring relationships |

## Risk Analysis

| Risk | Mitigation |
|------|------------|
| Large graph performance | Virtual rendering, node clustering |
| Complex layouts | Pre-computed positions |
| Real-time updates | Throttled state updates |

## Success Criteria

- Graph renders all SPECs
- Dependencies shown as edges
- Real-time status updates
- Smooth zoom and pan
- Export functions work
