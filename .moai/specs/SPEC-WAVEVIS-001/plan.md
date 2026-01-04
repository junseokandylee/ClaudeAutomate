# Implementation Plan: SPEC-WAVEVIS-001

## Overview

Create advanced wave visualization with React Flow and Framer Motion.

## Task Breakdown

### Task 1: React Flow Graph Component

```typescript
// src/renderer/components/main/DependencyGraph.tsx
import ReactFlow, {
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState
} from 'reactflow'
import 'reactflow/dist/style.css'

interface Props {
  specs: SpecInfo[]
  waves: Wave[]
}

export function DependencyGraph({ specs, waves }: Props) {
  const { nodes, edges } = useMemo(() => {
    return buildGraphData(specs, waves)
  }, [specs, waves])

  const [graphNodes, setNodes, onNodesChange] = useNodesState(nodes)
  const [graphEdges, setEdges, onEdgesChange] = useEdgesState(edges)

  return (
    <div className="h-full">
      <ReactFlow
        nodes={graphNodes}
        edges={graphEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
      >
        <Background />
        <Controls />
        <MiniMap
          nodeStrokeColor={(n) => getStatusColor(n.data.status)}
          nodeColor={(n) => getStatusColor(n.data.status)}
        />
      </ReactFlow>
    </div>
  )
}

function buildGraphData(specs: SpecInfo[], waves: Wave[]) {
  const nodes: Node[] = specs.map((spec, index) => {
    const wave = waves.findIndex(w => w.specs.some(s => s.id === spec.id))
    return {
      id: spec.id,
      type: 'specNode',
      position: { x: wave * 250, y: index * 80 },
      data: {
        label: spec.id,
        title: spec.title,
        status: spec.status,
        wave
      }
    }
  })

  const edges: Edge[] = specs.flatMap(spec =>
    spec.dependencies.map(dep => ({
      id: `${dep}-${spec.id}`,
      source: dep,
      target: spec.id,
      animated: spec.status === 'running',
      style: { stroke: '#FF6B35' }
    }))
  )

  return { nodes, edges }
}
```

### Task 2: Custom SPEC Node Component

```typescript
// src/renderer/components/main/SpecNode.tsx
import { Handle, Position } from 'reactflow'
import { motion } from 'framer-motion'

interface SpecNodeData {
  label: string
  title: string
  status: SpecStatus
  wave: number
}

export function SpecNode({ data }: { data: SpecNodeData }) {
  const statusColors = {
    pending: 'bg-slate-600',
    running: 'bg-blue-500',
    completed: 'bg-emerald-500',
    failed: 'bg-red-500'
  }

  return (
    <motion.div
      className={`
        px-4 py-2 rounded-lg border border-slate-600
        ${statusColors[data.status]}
        shadow-lg min-w-[150px]
      `}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{
        opacity: 1,
        scale: 1,
        ...(data.status === 'running' && {
          boxShadow: ['0 0 0 0 rgba(59, 130, 246, 0.5)', '0 0 0 10px rgba(59, 130, 246, 0)']
        })
      }}
      transition={{
        duration: 0.3,
        ...(data.status === 'running' && {
          boxShadow: { repeat: Infinity, duration: 1.5 }
        })
      }}
    >
      <Handle type="target" position={Position.Left} />

      <div className="text-sm font-bold text-white">{data.label}</div>
      <div className="text-xs text-white/70 truncate">{data.title}</div>
      <div className="text-xs mt-1 text-white/50">Wave {data.wave + 1}</div>

      <Handle type="source" position={Position.Right} />
    </motion.div>
  )
}
```

### Task 3: Wave Timeline Component

```typescript
// src/renderer/components/main/WaveTimeline.tsx
import { motion } from 'framer-motion'

interface Props {
  waves: Wave[]
  progress: ExecutionProgress
}

export function WaveTimeline({ waves, progress }: Props) {
  const timelineWidth = 800
  const laneHeight = 40
  const totalDuration = progress.estimatedDuration || 1

  return (
    <div className="relative overflow-x-auto">
      {/* Time markers */}
      <div className="flex justify-between text-xs text-slate-400 mb-2">
        <span>0s</span>
        <span>{Math.round(totalDuration / 2)}s</span>
        <span>{totalDuration}s</span>
      </div>

      {/* Wave lanes */}
      <div className="relative" style={{ height: waves.length * laneHeight }}>
        {waves.map((wave, index) => (
          <div
            key={wave.waveNumber}
            className="absolute left-0 right-0 h-8 border-b border-slate-700"
            style={{ top: index * laneHeight }}
          >
            <span className="absolute -left-12 text-xs text-slate-400">
              Wave {wave.waveNumber}
            </span>

            {wave.specs.map((spec, specIndex) => {
              const specProgress = progress.specs.find(s => s.id === spec.id)
              const startPercent = (specProgress?.startTime || 0) / totalDuration * 100
              const width = (specProgress?.duration || 10) / totalDuration * 100

              return (
                <motion.div
                  key={spec.id}
                  className={`
                    absolute h-6 rounded
                    ${getStatusColor(spec.status)}
                  `}
                  style={{
                    left: `${startPercent}%`,
                    width: `${width}%`,
                    top: 2
                  }}
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  <span className="text-xs text-white px-2 truncate">
                    {spec.id}
                  </span>
                </motion.div>
              )
            })}
          </div>
        ))}

        {/* Current time marker */}
        <motion.div
          className="absolute top-0 bottom-0 w-0.5 bg-anthropic"
          animate={{
            left: `${(progress.elapsed / totalDuration) * 100}%`
          }}
        />
      </div>
    </div>
  )
}
```

### Task 4: Resource Allocation Panel

```typescript
// src/renderer/components/main/ResourcePanel.tsx
import { Progress } from '@/components/ui'

interface Props {
  currentWave: number
  sessionCount: number
  memoryUsage: number
  cpuUsage: number
}

export function ResourcePanel({
  currentWave,
  sessionCount,
  memoryUsage,
  cpuUsage
}: Props) {
  return (
    <div className="glass-panel p-4 space-y-4">
      <h3 className="text-sm font-semibold text-slate-300">
        Resource Allocation
      </h3>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="flex justify-between text-xs text-slate-400">
            <span>Active Sessions</span>
            <span>{sessionCount} / 10</span>
          </div>
          <Progress value={sessionCount * 10} className="h-2 mt-1" />
        </div>

        <div>
          <div className="flex justify-between text-xs text-slate-400">
            <span>Memory</span>
            <span>{Math.round(memoryUsage)}%</span>
          </div>
          <Progress
            value={memoryUsage}
            className={`h-2 mt-1 ${memoryUsage > 80 ? 'bg-red-500' : ''}`}
          />
        </div>

        <div>
          <div className="flex justify-between text-xs text-slate-400">
            <span>CPU</span>
            <span>{Math.round(cpuUsage)}%</span>
          </div>
          <Progress
            value={cpuUsage}
            className={`h-2 mt-1 ${cpuUsage > 80 ? 'bg-amber-500' : ''}`}
          />
        </div>

        <div>
          <div className="flex justify-between text-xs text-slate-400">
            <span>Current Wave</span>
            <span>{currentWave}</span>
          </div>
        </div>
      </div>

      {(memoryUsage > 80 || cpuUsage > 80) && (
        <div className="text-xs text-amber-400 bg-amber-400/10 p-2 rounded">
          High resource usage detected. Consider reducing parallel sessions.
        </div>
      )}
    </div>
  )
}
```

### Task 5: Export Functionality

```typescript
// src/renderer/services/graph-export.service.ts
import html2canvas from 'html2canvas'

export class GraphExportService {
  async exportToPNG(element: HTMLElement, filename: string): Promise<void> {
    const canvas = await html2canvas(element, {
      backgroundColor: '#0F172A',
      scale: 2
    })

    const link = document.createElement('a')
    link.download = `${filename}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  async exportToSVG(element: HTMLElement, filename: string): Promise<void> {
    // Clone SVG elements from React Flow
    const svg = element.querySelector('svg')
    if (!svg) return

    const clone = svg.cloneNode(true) as SVGElement
    const data = new XMLSerializer().serializeToString(clone)
    const blob = new Blob([data], { type: 'image/svg+xml' })

    const link = document.createElement('a')
    link.download = `${filename}.svg`
    link.href = URL.createObjectURL(blob)
    link.click()
  }

  exportToJSON(plan: ExecutionPlan, filename: string): void {
    const data = JSON.stringify(plan, null, 2)
    const blob = new Blob([data], { type: 'application/json' })

    const link = document.createElement('a')
    link.download = `${filename}.json`
    link.href = URL.createObjectURL(blob)
    link.click()
  }
}
```

## Visualization Features

| Feature | Library | Status |
|---------|---------|--------|
| Dependency Graph | React Flow | Required |
| Wave Lanes | Custom + Motion | Required |
| Timeline | Custom + Motion | Optional |
| Resource Panel | Custom | Required |
| Export | html2canvas | Optional |

## Risk Analysis

| Risk | Mitigation |
|------|------------|
| Performance with many nodes | Virtual rendering |
| Complex layouts | Auto-layout algorithm |
| Animation jank | Use GPU-accelerated motion |

## Success Criteria

- Graph renders all SPECs correctly
- Animations are smooth 60fps
- Interactive features work
- Export produces valid files
