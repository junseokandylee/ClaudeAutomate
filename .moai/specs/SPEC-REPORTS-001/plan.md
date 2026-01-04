# Implementation Plan: SPEC-REPORTS-001

## Overview

Create execution report generation system with statistics and visualizations.

## Task Breakdown

### Task 1: Define Report Types

```typescript
// Add to src/shared/types.ts
interface ExecutionReport {
  id: string
  generatedAt: Date
  summary: ReportSummary
  waves: WaveReport[]
  specs: SpecReport[]
  timeline: TimelineEntry[]
  errors: ErrorEntry[]
}

interface ReportSummary {
  totalSpecs: number
  successful: number
  failed: number
  totalDuration: number  // ms
  averagePerSpec: number
  parallelismEfficiency: number  // 0-1
}

interface WaveReport {
  waveNumber: number
  startTime: Date
  endTime: Date
  specs: string[]
  duration: number
}

interface SpecReport {
  specId: string
  wave: number
  status: SpecStatus
  startTime: Date
  endTime: Date
  duration: number
  outputSummary: string
  errorLog?: string
}

interface TimelineEntry {
  type: 'wave_start' | 'wave_end' | 'spec_start' | 'spec_end' | 'merge' | 'cleanup'
  timestamp: Date
  specId?: string
  wave?: number
}
```

### Task 2: Create Report Service

```typescript
// src/main/services/report.service.ts
import { writeFile } from 'fs/promises'
import path from 'path'

export class ReportService {
  private reportsDir = '.moai/reports'

  async generateReport(execution: ExecutionData): Promise<ExecutionReport> {
    const report: ExecutionReport = {
      id: uuid(),
      generatedAt: new Date(),
      summary: this.calculateSummary(execution),
      waves: this.buildWaveReports(execution),
      specs: this.buildSpecReports(execution),
      timeline: this.buildTimeline(execution),
      errors: this.extractErrors(execution)
    }

    await this.saveReport(report)
    return report
  }

  private calculateSummary(execution: ExecutionData): ReportSummary {
    const successful = execution.specs.filter(s => s.status === 'completed').length
    const totalDuration = execution.endTime - execution.startTime

    return {
      totalSpecs: execution.specs.length,
      successful,
      failed: execution.specs.length - successful,
      totalDuration,
      averagePerSpec: totalDuration / execution.specs.length,
      parallelismEfficiency: this.calculateEfficiency(execution)
    }
  }

  async renderHTML(report: ExecutionReport): Promise<string> {
    // Use template to generate HTML
    return `<!DOCTYPE html>
<html>
<head>
  <title>Execution Report - ${report.id}</title>
  <style>${this.getStyles()}</style>
</head>
<body>
  ${this.renderSummary(report.summary)}
  ${this.renderTimeline(report.timeline)}
  ${this.renderSpecs(report.specs)}
  ${this.renderErrors(report.errors)}
</body>
</html>`
  }
}
```

### Task 3: Create Report Viewer Component

```typescript
// src/renderer/components/main/ReportViewer.tsx
import { useState, useEffect } from 'react'

export default function ReportViewer() {
  const [reports, setReports] = useState<ExecutionReport[]>([])
  const [selectedReport, setSelectedReport] = useState<string | null>(null)

  useEffect(() => {
    window.electronAPI.getReportHistory().then(setReports)
  }, [])

  return (
    <div className="flex h-full">
      {/* Report list sidebar */}
      <aside className="w-64 border-r border-slate-700">
        <h3>Report History</h3>
        <ul>
          {reports.map(report => (
            <ReportListItem
              key={report.id}
              report={report}
              selected={selectedReport === report.id}
              onClick={() => setSelectedReport(report.id)}
            />
          ))}
        </ul>
      </aside>

      {/* Report content */}
      <main className="flex-1 p-4">
        {selectedReport && <ReportContent reportId={selectedReport} />}
      </main>
    </div>
  )
}
```

### Task 4: Create Timeline Visualization

```typescript
// src/renderer/components/main/ReportTimeline.tsx
import { motion } from 'framer-motion'

interface TimelineProps {
  entries: TimelineEntry[]
  waves: WaveReport[]
}

export default function ReportTimeline({ entries, waves }: TimelineProps) {
  const minTime = Math.min(...entries.map(e => e.timestamp.getTime()))
  const maxTime = Math.max(...entries.map(e => e.timestamp.getTime()))
  const totalDuration = maxTime - minTime

  const getPosition = (time: Date) => {
    return ((time.getTime() - minTime) / totalDuration) * 100
  }

  return (
    <div className="relative h-64 bg-slate-800 rounded-lg p-4">
      {/* Wave lanes */}
      {waves.map((wave, i) => (
        <motion.div
          key={wave.waveNumber}
          className="absolute h-8 bg-anthropic/30 rounded"
          style={{
            top: i * 40 + 20,
            left: `${getPosition(wave.startTime)}%`,
            width: `${(wave.duration / totalDuration) * 100}%`
          }}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
        >
          Wave {wave.waveNumber}
        </motion.div>
      ))}
    </div>
  )
}
```

### Task 5: Export Functionality

```typescript
// src/main/services/report-export.service.ts
export class ReportExportService {
  async exportHTML(report: ExecutionReport, filePath: string): Promise<void>
  async exportJSON(report: ExecutionReport, filePath: string): Promise<void>
  async exportMarkdown(report: ExecutionReport, filePath: string): Promise<void>
  async exportPDF(report: ExecutionReport, filePath: string): Promise<void>
}
```

## Report Template Structure

```html
<!DOCTYPE html>
<html>
<head>
  <title>CPR Execution Report</title>
  <!-- Embedded CSS for offline viewing -->
</head>
<body>
  <header>
    <h1>Execution Report</h1>
    <time>{generatedAt}</time>
  </header>

  <section id="summary">
    <h2>Summary</h2>
    <!-- Statistics cards -->
  </section>

  <section id="timeline">
    <h2>Execution Timeline</h2>
    <!-- Gantt chart -->
  </section>

  <section id="specs">
    <h2>SPEC Details</h2>
    <!-- Collapsible SPEC cards -->
  </section>

  <section id="errors">
    <h2>Errors</h2>
    <!-- Error logs -->
  </section>
</body>
</html>
```

## Risk Analysis

| Risk | Mitigation |
|------|------------|
| Large report files | Compress logs, limit history |
| Slow rendering | Virtual scrolling for large lists |
| Missing data | Graceful handling of incomplete runs |

## Success Criteria

- Reports generated on completion
- HTML renders correctly offline
- Timeline shows parallel execution
- Statistics are accurate
- Export formats work
- History maintained properly
