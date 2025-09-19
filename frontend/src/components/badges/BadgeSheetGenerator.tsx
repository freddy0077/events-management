import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { 
  Printer, 
  Download, 
  Settings,
  Grid3x3,
  Maximize,
  Minimize,
  FileText,
  Loader2
} from 'lucide-react'
import { BadgeData, renderBadgeToHTML } from './ProfessionalBadgeDesign'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

interface BadgeSheetGeneratorProps {
  badges: BadgeData[]
  variant?: 'standard' | 'minimal'
  templateId?: string
  onGenerate?: (format: 'pdf' | 'print') => void
}

interface SheetConfig {
  paperSize: 'letter' | 'a4' | 'legal'
  orientation: 'portrait' | 'landscape'
  badgesPerRow: number
  badgesPerColumn: number
  margin: number
  spacing: number
  badgeScale: number
  showCutLines: boolean
  showPageNumbers: boolean
}

const paperSizes = {
  letter: { width: 8.5, height: 11, label: 'Letter (8.5" x 11")' },
  a4: { width: 8.27, height: 11.69, label: 'A4 (210mm x 297mm)' },
  legal: { width: 8.5, height: 14, label: 'Legal (8.5" x 14")' }
}

export function BadgeSheetGenerator({ 
  badges, 
  variant = 'standard',
  templateId,
  onGenerate 
}: BadgeSheetGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [config, setConfig] = useState<SheetConfig>({
    paperSize: 'letter',
    orientation: 'portrait',
    badgesPerRow: 2,
    badgesPerColumn: 3,
    margin: 0.5,
    spacing: 0.25,
    badgeScale: 0.9,
    showCutLines: true,
    showPageNumbers: true
  })

  const calculateLayout = () => {
    const paper = paperSizes[config.paperSize]
    const width = config.orientation === 'portrait' ? paper.width : paper.height
    const height = config.orientation === 'portrait' ? paper.height : paper.width
    
    const usableWidth = width - (2 * config.margin)
    const usableHeight = height - (2 * config.margin)
    
    const badgeWidth = (usableWidth - ((config.badgesPerRow - 1) * config.spacing)) / config.badgesPerRow
    const badgeHeight = (usableHeight - ((config.badgesPerColumn - 1) * config.spacing)) / config.badgesPerColumn
    
    const badgesPerPage = config.badgesPerRow * config.badgesPerColumn
    const totalPages = Math.ceil(badges.length / badgesPerPage)
    
    return {
      width,
      height,
      badgeWidth,
      badgeHeight,
      badgesPerPage,
      totalPages,
      usableWidth,
      usableHeight
    }
  }

  const generateSheetHTML = () => {
    const layout = calculateLayout()
    let html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          @page {
            size: ${layout.width}in ${layout.height}in;
            margin: 0;
          }
          @media print {
            .page { 
              page-break-after: always;
              width: ${layout.width}in;
              height: ${layout.height}in;
            }
            .no-print { display: none; }
          }
          body {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          }
          .page {
            position: relative;
            width: ${layout.width}in;
            height: ${layout.height}in;
            padding: ${config.margin}in;
            box-sizing: border-box;
          }
          .badge-grid {
            display: grid;
            grid-template-columns: repeat(${config.badgesPerRow}, 1fr);
            grid-template-rows: repeat(${config.badgesPerColumn}, 1fr);
            gap: ${config.spacing}in;
            width: 100%;
            height: 100%;
          }
          .badge-container {
            position: relative;
            width: 100%;
            height: 100%;
            overflow: hidden;
            ${config.showCutLines ? `
              border: 1px dashed #ccc;
            ` : ''}
          }
          .badge-content {
            transform: scale(${config.badgeScale});
            transform-origin: center;
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .page-number {
            position: absolute;
            bottom: 0.25in;
            right: 0.25in;
            font-size: 10px;
            color: #666;
          }
          ${config.showCutLines ? `
            .cut-mark {
              position: absolute;
              width: 0.25in;
              height: 1px;
              background: #999;
            }
            .cut-mark-v {
              width: 1px;
              height: 0.25in;
              background: #999;
            }
          ` : ''}
        </style>
      </head>
      <body>
    `

    let currentPage = 1
    for (let pageIndex = 0; pageIndex < layout.totalPages; pageIndex++) {
      const startIndex = pageIndex * layout.badgesPerPage
      const endIndex = Math.min(startIndex + layout.badgesPerPage, badges.length)
      const pageBadges = badges.slice(startIndex, endIndex)

      html += `<div class="page">`
      
      if (config.showCutLines) {
        // Add corner cut marks
        html += `
          <div class="cut-mark" style="top: ${config.margin - 0.125}in; left: ${config.margin - 0.25}in;"></div>
          <div class="cut-mark" style="top: ${config.margin - 0.125}in; right: ${config.margin - 0.25}in;"></div>
          <div class="cut-mark" style="bottom: ${config.margin - 0.125}in; left: ${config.margin - 0.25}in;"></div>
          <div class="cut-mark" style="bottom: ${config.margin - 0.125}in; right: ${config.margin - 0.25}in;"></div>
          <div class="cut-mark-v" style="left: ${config.margin - 0.125}in; top: ${config.margin - 0.25}in;"></div>
          <div class="cut-mark-v" style="left: ${config.margin - 0.125}in; bottom: ${config.margin - 0.25}in;"></div>
          <div class="cut-mark-v" style="right: ${config.margin - 0.125}in; top: ${config.margin - 0.25}in;"></div>
          <div class="cut-mark-v" style="right: ${config.margin - 0.125}in; bottom: ${config.margin - 0.25}in;"></div>
        `
      }

      html += `<div class="badge-grid">`

      // Fill the grid with badges
      for (let i = 0; i < layout.badgesPerPage; i++) {
        if (i < pageBadges.length) {
          const badge = pageBadges[i]
          const badgeHTML = renderBadgeToHTML(badge, variant, templateId)
          const badgeContent = badgeHTML.match(/<body[^>]*>([\s\S]*)<\/body>/)?.[1] || ''
          
          html += `
            <div class="badge-container">
              <div class="badge-content">
                ${badgeContent}
              </div>
            </div>
          `
        } else {
          // Empty cell
          html += `<div class="badge-container"></div>`
        }
      }

      html += `</div>` // Close badge-grid

      if (config.showPageNumbers) {
        html += `<div class="page-number">Page ${currentPage} of ${layout.totalPages}</div>`
      }

      html += `</div>` // Close page
      currentPage++
    }

    html += `
      </body>
      </html>
    `

    return html
  }

  const handlePrint = async () => {
    if (badges.length === 0) {
      toast.error('No badges to print')
      return
    }

    setIsGenerating(true)
    try {
      const printWindow = window.open('', '_blank')
      if (!printWindow) {
        toast.error('Please allow popups to print badge sheets')
        return
      }

      const html = generateSheetHTML()
      printWindow.document.write(html)
      printWindow.document.close()

      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print()
          printWindow.onafterprint = () => {
            printWindow.close()
          }
        }, 500)
      }

      toast.success(`Badge sheet prepared for printing (${badges.length} badges)`)
      onGenerate?.('print')
    } catch (error) {
      console.error('Error printing badge sheet:', error)
      toast.error('Failed to print badge sheet')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleGeneratePDF = async () => {
    if (badges.length === 0) {
      toast.error('No badges to generate PDF')
      return
    }

    setIsGenerating(true)
    try {
      const layout = calculateLayout()
      
      // Create PDF with custom dimensions
      const pdf = new jsPDF({
        orientation: config.orientation,
        unit: 'in',
        format: [layout.width, layout.height]
      })

      // Generate HTML and convert to canvas for each page
      const tempDiv = document.createElement('div')
      tempDiv.style.position = 'absolute'
      tempDiv.style.left = '-9999px'
      tempDiv.style.width = `${layout.width}in`
      tempDiv.style.height = `${layout.height}in`
      document.body.appendChild(tempDiv)

      const html = generateSheetHTML()
      tempDiv.innerHTML = html

      // Process each page
      const pages = tempDiv.querySelectorAll('.page')
      for (let i = 0; i < pages.length; i++) {
        if (i > 0) {
          pdf.addPage()
        }

        const canvas = await html2canvas(pages[i] as HTMLElement, {
          scale: 2,
          useCORS: true,
          logging: false
        })

        const imgData = canvas.toDataURL('image/png')
        pdf.addImage(imgData, 'PNG', 0, 0, layout.width, layout.height)
      }

      document.body.removeChild(tempDiv)

      // Save the PDF
      pdf.save(`badge-sheet-${new Date().toISOString().split('T')[0]}.pdf`)
      
      toast.success(`PDF generated with ${badges.length} badges`)
      onGenerate?.('pdf')
    } catch (error) {
      console.error('Error generating PDF:', error)
      toast.error('Failed to generate PDF')
    } finally {
      setIsGenerating(false)
    }
  }

  const layout = calculateLayout()

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-soft">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Grid3x3 className="h-5 w-5" />
          Badge Sheet Generator
        </CardTitle>
        <CardDescription>
          Configure and generate badge sheets for batch printing
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Configuration Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <Label>Paper Size</Label>
              <Select
                value={config.paperSize}
                onValueChange={(value: any) => setConfig({ ...config, paperSize: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(paperSizes).map(([key, size]) => (
                    <SelectItem key={key} value={key}>
                      {size.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Orientation</Label>
              <div className="flex gap-2 mt-2">
                <Button
                  variant={config.orientation === 'portrait' ? 'default' : 'outline'}
                  onClick={() => setConfig({ ...config, orientation: 'portrait' })}
                  className="flex-1"
                  size="sm"
                >
                  <Maximize className="h-4 w-4 mr-2 rotate-0" />
                  Portrait
                </Button>
                <Button
                  variant={config.orientation === 'landscape' ? 'default' : 'outline'}
                  onClick={() => setConfig({ ...config, orientation: 'landscape' })}
                  className="flex-1"
                  size="sm"
                >
                  <Maximize className="h-4 w-4 mr-2 rotate-90" />
                  Landscape
                </Button>
              </div>
            </div>

            <div>
              <Label>Badges Per Row: {config.badgesPerRow}</Label>
              <Slider
                value={[config.badgesPerRow]}
                onValueChange={([value]) => setConfig({ ...config, badgesPerRow: value })}
                min={1}
                max={4}
                step={1}
                className="mt-2"
              />
            </div>

            <div>
              <Label>Badges Per Column: {config.badgesPerColumn}</Label>
              <Slider
                value={[config.badgesPerColumn]}
                onValueChange={([value]) => setConfig({ ...config, badgesPerColumn: value })}
                min={1}
                max={5}
                step={1}
                className="mt-2"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label>Margin (inches): {config.margin}</Label>
              <Slider
                value={[config.margin]}
                onValueChange={([value]) => setConfig({ ...config, margin: value })}
                min={0}
                max={1}
                step={0.25}
                className="mt-2"
              />
            </div>

            <div>
              <Label>Spacing (inches): {config.spacing}</Label>
              <Slider
                value={[config.spacing]}
                onValueChange={([value]) => setConfig({ ...config, spacing: value })}
                min={0}
                max={0.5}
                step={0.125}
                className="mt-2"
              />
            </div>

            <div>
              <Label>Badge Scale: {Math.round(config.badgeScale * 100)}%</Label>
              <Slider
                value={[config.badgeScale]}
                onValueChange={([value]) => setConfig({ ...config, badgeScale: value })}
                min={0.5}
                max={1}
                step={0.05}
                className="mt-2"
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Show Cut Lines</Label>
                <Switch
                  checked={config.showCutLines}
                  onCheckedChange={(checked) => setConfig({ ...config, showCutLines: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Show Page Numbers</Label>
                <Switch
                  checked={config.showPageNumbers}
                  onCheckedChange={(checked) => setConfig({ ...config, showPageNumbers: checked })}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="bg-neutral-50 rounded-lg p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-neutral-600">Total Badges:</span>
              <span className="ml-2 font-medium">{badges.length}</span>
            </div>
            <div>
              <span className="text-neutral-600">Badges per Page:</span>
              <span className="ml-2 font-medium">{layout.badgesPerPage}</span>
            </div>
            <div>
              <span className="text-neutral-600">Total Pages:</span>
              <span className="ml-2 font-medium">{layout.totalPages}</span>
            </div>
            <div>
              <span className="text-neutral-600">Badge Size:</span>
              <span className="ml-2 font-medium">
                {layout.badgeWidth.toFixed(2)}" × {layout.badgeHeight.toFixed(2)}"
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            onClick={handlePrint}
            disabled={isGenerating || badges.length === 0}
            className="flex-1"
          >
            {isGenerating ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Printer className="h-4 w-4 mr-2" />
            )}
            Print Sheet
          </Button>
          <Button
            onClick={handleGeneratePDF}
            disabled={isGenerating || badges.length === 0}
            variant="outline"
            className="flex-1"
          >
            {isGenerating ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <FileText className="h-4 w-4 mr-2" />
            )}
            Generate PDF
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
