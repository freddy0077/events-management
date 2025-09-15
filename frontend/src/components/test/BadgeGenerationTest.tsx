'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useCentralizedBadge } from '@/hooks/use-centralized-qr-badge'
import { toast } from 'sonner'

/**
 * Test component to verify badge generation functionality
 * This component can be used to test the corrected GraphQL badge mutations
 */
export function BadgeGenerationTest() {
  const [registrationId, setRegistrationId] = useState('')
  const [registrationIds, setRegistrationIds] = useState('')
  const [format, setFormat] = useState('pdf')
  const [result, setResult] = useState<string | null>(null)
  
  const { generate, generateSheet, regenerate, loading } = useCentralizedBadge()

  const handleGenerateBadge = async () => {
    if (!registrationId.trim()) {
      toast.error('Please enter a registration ID')
      return
    }

    try {
      const badgeData = await generate(registrationId.trim(), format)
      if (badgeData) {
        setResult(badgeData)
        toast.success('Badge generated successfully!')
        console.log('Badge data (base64):', badgeData.substring(0, 100) + '...')
      } else {
        toast.error('Failed to generate badge')
      }
    } catch (error) {
      console.error('Badge generation error:', error)
      toast.error(`Badge generation failed: ${(error as any)?.message || 'Unknown error'}`)
    }
  }

  const handleRegenerateBadge = async () => {
    if (!registrationId.trim()) {
      toast.error('Please enter a registration ID')
      return
    }

    try {
      const badgeData = await regenerate(registrationId.trim(), format)
      if (badgeData) {
        setResult(badgeData)
        toast.success('Badge regenerated successfully!')
        console.log('Regenerated badge data (base64):', badgeData.substring(0, 100) + '...')
      } else {
        toast.error('Failed to regenerate badge')
      }
    } catch (error) {
      console.error('Badge regeneration error:', error)
      toast.error(`Badge regeneration failed: ${(error as any)?.message || 'Unknown error'}`)
    }
  }

  const handleGenerateBadgeSheet = async () => {
    if (!registrationIds.trim()) {
      toast.error('Please enter registration IDs (comma-separated)')
      return
    }

    try {
      const ids = registrationIds.split(',').map(id => id.trim()).filter(id => id)
      const sheetData = await generateSheet(ids)
      if (sheetData) {
        setResult(sheetData)
        toast.success('Badge sheet generated successfully!')
        console.log('Badge sheet data (base64):', sheetData.substring(0, 100) + '...')
      } else {
        toast.error('Failed to generate badge sheet')
      }
    } catch (error) {
      console.error('Badge sheet generation error:', error)
      toast.error(`Badge sheet generation failed: ${(error as any)?.message || 'Unknown error'}`)
    }
  }

  const downloadResult = () => {
    if (!result) return

    try {
      const blob = new Blob([atob(result)], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `badge_${Date.now()}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      toast.success('Badge downloaded successfully!')
    } catch (error) {
      console.error('Download error:', error)
      toast.error('Failed to download badge')
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Badge Generation Test</CardTitle>
        <CardDescription>
          Test the corrected GraphQL badge generation mutations
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Single Badge Generation */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Single Badge Generation</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="registrationId">Registration ID</Label>
              <Input
                id="registrationId"
                value={registrationId}
                onChange={(e) => setRegistrationId(e.target.value)}
                placeholder="Enter registration ID"
              />
            </div>
            <div>
              <Label htmlFor="format">Format</Label>
              <select
                id="format"
                value={format}
                onChange={(e) => setFormat(e.target.value)}
                className="w-full p-2 border rounded"
              >
                <option value="pdf">PDF</option>
                <option value="png">PNG</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={handleGenerateBadge} 
              disabled={loading}
            >
              {loading ? 'Generating...' : 'Generate Badge'}
            </Button>
            <Button 
              onClick={handleRegenerateBadge} 
              disabled={loading}
              variant="outline"
            >
              {loading ? 'Regenerating...' : 'Regenerate Badge'}
            </Button>
          </div>
        </div>

        {/* Badge Sheet Generation */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Badge Sheet Generation</h3>
          <div>
            <Label htmlFor="registrationIds">Registration IDs (comma-separated)</Label>
            <Input
              id="registrationIds"
              value={registrationIds}
              onChange={(e) => setRegistrationIds(e.target.value)}
              placeholder="Enter registration IDs separated by commas"
            />
          </div>
          <Button 
            onClick={handleGenerateBadgeSheet} 
            disabled={loading}
          >
            {loading ? 'Generating...' : 'Generate Badge Sheet'}
          </Button>
        </div>

        {/* Result Display */}
        {result && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Result</h3>
            <div className="p-4 bg-gray-100 rounded">
              <p className="text-sm text-gray-600 mb-2">Base64 Data (first 200 characters):</p>
              <code className="text-xs break-all">
                {result.substring(0, 200)}...
              </code>
            </div>
            <Button onClick={downloadResult} variant="outline">
              Download as PDF
            </Button>
          </div>
        )}

        {/* Instructions */}
        <div className="p-4 bg-blue-50 rounded">
          <h4 className="font-semibold text-blue-900 mb-2">Instructions:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>1. Enter a valid registration ID from your database</li>
            <li>2. Choose the format (PDF recommended)</li>
            <li>3. Click "Generate Badge" to test single badge generation</li>
            <li>4. For batch generation, enter multiple IDs separated by commas</li>
            <li>5. Check the browser console for detailed logs</li>
            <li>6. If successful, you can download the generated badge</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
