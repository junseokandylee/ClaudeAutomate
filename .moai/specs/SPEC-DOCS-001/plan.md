# Implementation Plan: SPEC-DOCS-001

## Overview

Implement documentation generation with multiple export formats.

## Task Breakdown

### Task 1: Report Generator Service

```typescript
// src/main/services/report-generator.service.ts
import { marked } from 'marked'
import puppeteer from 'puppeteer'
import fs from 'fs/promises'
import path from 'path'
import { app } from 'electron'

interface ExecutionReport {
  title: string
  generatedAt: Date
  projectPath: string
  summary: {
    total: number
    passed: number
    failed: number
    skipped: number
    duration: number
  }
  waves: WaveReport[]
  specs: SpecReport[]
  errors: ErrorEntry[]
  resources: ResourceStats
}

interface WaveReport {
  number: number
  specs: string[]
  startTime: Date
  endTime: Date
  duration: number
  status: 'completed' | 'partial' | 'failed'
}

interface SpecReport {
  id: string
  title: string
  status: 'passed' | 'failed' | 'skipped'
  wave: number
  duration: number
  output?: string
  error?: string
}

export class ReportGeneratorService {
  private templatesPath: string

  constructor() {
    this.templatesPath = path.join(app.getAppPath(), 'templates')
  }

  async generateReport(
    executionData: ExecutionData,
    sessions: Session[]
  ): Promise<ExecutionReport> {
    const specs = this.buildSpecReports(executionData, sessions)
    const waves = this.buildWaveReports(executionData)

    return {
      title: `Execution Report - ${path.basename(executionData.projectPath)}`,
      generatedAt: new Date(),
      projectPath: executionData.projectPath,
      summary: {
        total: specs.length,
        passed: specs.filter(s => s.status === 'passed').length,
        failed: specs.filter(s => s.status === 'failed').length,
        skipped: specs.filter(s => s.status === 'skipped').length,
        duration: this.calculateTotalDuration(waves)
      },
      waves,
      specs,
      errors: this.extractErrors(sessions),
      resources: this.getResourceStats()
    }
  }

  private buildSpecReports(data: ExecutionData, sessions: Session[]): SpecReport[] {
    return data.plan.waves.flatMap((wave, waveIndex) =>
      wave.specs.map(spec => {
        const session = sessions.find(s => s.specId === spec.id)
        return {
          id: spec.id,
          title: spec.title || spec.id,
          status: this.mapSessionStatus(session?.status),
          wave: waveIndex,
          duration: session?.duration || 0,
          output: session?.output,
          error: session?.error
        }
      })
    )
  }

  private buildWaveReports(data: ExecutionData): WaveReport[] {
    return data.plan.waves.map((wave, index) => ({
      number: index + 1,
      specs: wave.specs.map(s => s.id),
      startTime: wave.startTime || new Date(),
      endTime: wave.endTime || new Date(),
      duration: wave.duration || 0,
      status: this.calculateWaveStatus(wave)
    }))
  }

  private mapSessionStatus(status?: string): 'passed' | 'failed' | 'skipped' {
    switch (status) {
      case 'completed': return 'passed'
      case 'failed':
      case 'error': return 'failed'
      default: return 'skipped'
    }
  }

  private calculateWaveStatus(wave: Wave): 'completed' | 'partial' | 'failed' {
    const failed = wave.specs.some(s => s.status === 'failed')
    const allComplete = wave.specs.every(s =>
      s.status === 'completed' || s.status === 'failed'
    )

    if (failed) return 'failed'
    if (allComplete) return 'completed'
    return 'partial'
  }

  private calculateTotalDuration(waves: WaveReport[]): number {
    return waves.reduce((sum, w) => sum + w.duration, 0)
  }

  private extractErrors(sessions: Session[]): ErrorEntry[] {
    return sessions
      .filter(s => s.error)
      .map(s => ({
        specId: s.specId,
        message: s.error!,
        timestamp: s.endTime || new Date()
      }))
  }

  private getResourceStats(): ResourceStats {
    return {
      peakMemory: process.memoryUsage().heapUsed,
      avgCpu: 0, // Would be collected during execution
      diskUsed: 0
    }
  }
}
```

### Task 2: Markdown Export

```typescript
// src/main/services/markdown-export.service.ts
import { formatDuration, formatDate } from '@/lib/format'

export class MarkdownExportService {
  generate(report: ExecutionReport): string {
    const sections = [
      this.generateHeader(report),
      this.generateSummary(report),
      this.generateWaveSection(report),
      this.generateSpecDetails(report),
      this.generateErrorSection(report),
      this.generateFooter(report)
    ]

    return sections.join('\n\n---\n\n')
  }

  private generateHeader(report: ExecutionReport): string {
    return `# ${report.title}

**Generated:** ${formatDate(report.generatedAt)}
**Project:** \`${report.projectPath}\`
`
  }

  private generateSummary(report: ExecutionReport): string {
    const { summary } = report
    const passRate = ((summary.passed / summary.total) * 100).toFixed(1)

    return `## Summary

| Metric | Value |
|--------|-------|
| Total SPECs | ${summary.total} |
| Passed | ${summary.passed} |
| Failed | ${summary.failed} |
| Skipped | ${summary.skipped} |
| Pass Rate | ${passRate}% |
| Duration | ${formatDuration(summary.duration)} |

### Status Distribution

\`\`\`
Passed:  ${'█'.repeat(Math.round(summary.passed / summary.total * 20))} ${summary.passed}
Failed:  ${'█'.repeat(Math.round(summary.failed / summary.total * 20))} ${summary.failed}
Skipped: ${'█'.repeat(Math.round(summary.skipped / summary.total * 20))} ${summary.skipped}
\`\`\`
`
  }

  private generateWaveSection(report: ExecutionReport): string {
    let content = '## Wave Execution\n\n'

    report.waves.forEach(wave => {
      const statusIcon = wave.status === 'completed' ? '✓' :
        wave.status === 'failed' ? '✗' : '○'

      content += `### Wave ${wave.number} ${statusIcon}\n\n`
      content += `- **Status:** ${wave.status}\n`
      content += `- **Duration:** ${formatDuration(wave.duration)}\n`
      content += `- **SPECs:** ${wave.specs.join(', ')}\n\n`
    })

    return content
  }

  private generateSpecDetails(report: ExecutionReport): string {
    let content = '## SPEC Details\n\n'

    report.specs.forEach(spec => {
      const statusIcon = spec.status === 'passed' ? '✓' :
        spec.status === 'failed' ? '✗' : '○'

      content += `### ${spec.id} ${statusIcon}\n\n`
      content += `- **Title:** ${spec.title}\n`
      content += `- **Status:** ${spec.status}\n`
      content += `- **Wave:** ${spec.wave + 1}\n`
      content += `- **Duration:** ${formatDuration(spec.duration)}\n`

      if (spec.error) {
        content += `\n**Error:**\n\`\`\`\n${spec.error}\n\`\`\`\n`
      }

      content += '\n'
    })

    return content
  }

  private generateErrorSection(report: ExecutionReport): string {
    if (report.errors.length === 0) {
      return '## Errors\n\nNo errors occurred during execution.'
    }

    let content = '## Errors\n\n'

    report.errors.forEach(error => {
      content += `### ${error.specId}\n\n`
      content += `**Time:** ${formatDate(error.timestamp)}\n\n`
      content += `\`\`\`\n${error.message}\n\`\`\`\n\n`
    })

    return content
  }

  private generateFooter(report: ExecutionReport): string {
    return `---

*Report generated by ClaudeParallelRunner*
*${formatDate(report.generatedAt)}*
`
  }
}
```

### Task 3: HTML Export

```typescript
// src/main/services/html-export.service.ts
import { marked } from 'marked'
import hljs from 'highlight.js'

export class HtmlExportService {
  private markdownService: MarkdownExportService

  constructor() {
    this.markdownService = new MarkdownExportService()

    // Configure marked with syntax highlighting
    marked.setOptions({
      highlight: (code, lang) => {
        if (lang && hljs.getLanguage(lang)) {
          return hljs.highlight(code, { language: lang }).value
        }
        return hljs.highlightAuto(code).value
      }
    })
  }

  generate(report: ExecutionReport): string {
    const markdown = this.markdownService.generate(report)
    const htmlContent = marked(markdown)

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${report.title}</title>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.8.0/styles/github-dark.min.css">
  <style>
    :root {
      --bg-primary: #0f172a;
      --bg-secondary: #1e293b;
      --text-primary: #f1f5f9;
      --text-secondary: #94a3b8;
      --accent: #3b82f6;
      --success: #22c55e;
      --error: #ef4444;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: var(--bg-primary);
      color: var(--text-primary);
      line-height: 1.6;
      padding: 2rem;
      max-width: 1000px;
      margin: 0 auto;
    }

    h1, h2, h3 {
      margin-top: 2rem;
      margin-bottom: 1rem;
    }

    h1 { color: var(--accent); }

    table {
      width: 100%;
      border-collapse: collapse;
      margin: 1rem 0;
    }

    th, td {
      padding: 0.75rem;
      text-align: left;
      border-bottom: 1px solid var(--bg-secondary);
    }

    th {
      background: var(--bg-secondary);
    }

    code {
      background: var(--bg-secondary);
      padding: 0.2rem 0.4rem;
      border-radius: 4px;
      font-family: 'JetBrains Mono', monospace;
    }

    pre {
      background: var(--bg-secondary);
      padding: 1rem;
      border-radius: 8px;
      overflow-x: auto;
      margin: 1rem 0;
    }

    pre code {
      background: transparent;
      padding: 0;
    }

    hr {
      border: none;
      border-top: 1px solid var(--bg-secondary);
      margin: 2rem 0;
    }

    .passed { color: var(--success); }
    .failed { color: var(--error); }

    @media print {
      body {
        background: white;
        color: black;
      }
    }
  </style>
</head>
<body>
  ${htmlContent}
</body>
</html>`
  }
}
```

### Task 4: PDF Export

```typescript
// src/main/services/pdf-export.service.ts
import puppeteer from 'puppeteer'
import path from 'path'
import fs from 'fs/promises'
import { app } from 'electron'

export class PdfExportService {
  private htmlService: HtmlExportService

  constructor() {
    this.htmlService = new HtmlExportService()
  }

  async generate(report: ExecutionReport, outputPath: string): Promise<void> {
    const html = this.htmlService.generate(report)

    // Write temporary HTML file
    const tempPath = path.join(app.getPath('temp'), `report-${Date.now()}.html`)
    await fs.writeFile(tempPath, html)

    // Generate PDF
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox']
    })

    try {
      const page = await browser.newPage()
      await page.goto(`file://${tempPath}`, { waitUntil: 'networkidle0' })

      await page.pdf({
        path: outputPath,
        format: 'A4',
        margin: {
          top: '20mm',
          right: '20mm',
          bottom: '20mm',
          left: '20mm'
        },
        printBackground: true
      })
    } finally {
      await browser.close()
      await fs.unlink(tempPath)
    }
  }
}
```

### Task 5: Report Preview Component

```typescript
// src/renderer/components/docs/ReportPreview.tsx
import { useState, useEffect } from 'react'
import { marked } from 'marked'
import { Download, FileText, FileCode, File } from 'lucide-react'
import { Button, Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui'

interface Props {
  report: ExecutionReport
}

export function ReportPreview({ report }: Props) {
  const [markdown, setMarkdown] = useState('')
  const [activeTab, setActiveTab] = useState('preview')

  useEffect(() => {
    window.electronAPI.generateMarkdownReport(report).then(setMarkdown)
  }, [report])

  const handleExport = async (format: 'md' | 'html' | 'pdf' | 'json') => {
    await window.electronAPI.exportReport(report, format)
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-slate-700">
        <h2 className="font-semibold text-white">Execution Report</h2>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => handleExport('md')}>
            <FileText className="w-4 h-4 mr-1" />
            Markdown
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleExport('html')}>
            <FileCode className="w-4 h-4 mr-1" />
            HTML
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleExport('pdf')}>
            <File className="w-4 h-4 mr-1" />
            PDF
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleExport('json')}>
            <Download className="w-4 h-4 mr-1" />
            JSON
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
        <TabsList className="px-4">
          <TabsTrigger value="preview">Preview</TabsTrigger>
          <TabsTrigger value="source">Source</TabsTrigger>
        </TabsList>

        <TabsContent value="preview" className="flex-1 overflow-auto p-4">
          <div
            className="prose prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: marked(markdown) }}
          />
        </TabsContent>

        <TabsContent value="source" className="flex-1 overflow-auto">
          <pre className="p-4 text-sm font-mono text-slate-300 whitespace-pre-wrap">
            {markdown}
          </pre>
        </TabsContent>
      </Tabs>
    </div>
  )
}
```

### Task 6: Session Log Bundler

```typescript
// src/main/services/log-bundler.service.ts
import archiver from 'archiver'
import fs from 'fs'
import path from 'path'

export class LogBundlerService {
  async bundleLogs(
    sessions: Session[],
    outputPath: string,
    options: { preserveAnsi?: boolean } = {}
  ): Promise<string> {
    const output = fs.createWriteStream(outputPath)
    const archive = archiver('zip', { zlib: { level: 9 } })

    return new Promise((resolve, reject) => {
      output.on('close', () => resolve(outputPath))
      archive.on('error', reject)

      archive.pipe(output)

      // Add session logs
      for (const session of sessions) {
        const logContent = options.preserveAnsi
          ? session.output
          : this.stripAnsi(session.output || '')

        archive.append(logContent, {
          name: `sessions/${session.specId}.log`
        })

        // Add metadata
        archive.append(JSON.stringify({
          specId: session.specId,
          status: session.status,
          startTime: session.startTime,
          endTime: session.endTime,
          duration: session.duration
        }, null, 2), {
          name: `sessions/${session.specId}.meta.json`
        })
      }

      // Add summary
      archive.append(JSON.stringify({
        bundledAt: new Date().toISOString(),
        sessionCount: sessions.length,
        sessions: sessions.map(s => ({
          specId: s.specId,
          status: s.status
        }))
      }, null, 2), {
        name: 'summary.json'
      })

      archive.finalize()
    })
  }

  private stripAnsi(text: string): string {
    return text.replace(
      /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g,
      ''
    )
  }
}
```

## Export Formats

| Format | Use Case |
|--------|----------|
| Markdown | Version control, editing |
| HTML | Viewing, sharing |
| PDF | Printing, archiving |
| JSON | Automation, analysis |

## Risk Analysis

| Risk | Mitigation |
|------|------------|
| Large PDF files | Pagination, compression |
| Syntax highlight | Client-side rendering |
| Template errors | Validation, fallbacks |

## Success Criteria

- Reports generate correctly
- All formats export properly
- Preview renders accurately
- Session logs bundle correctly
- PDF generation works
