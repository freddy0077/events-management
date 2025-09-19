'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DollarSign, CreditCard, AlertCircle, Info, Eye, EyeOff, Calendar } from 'lucide-react'
import { StepProps } from './types'

export function PaymentSettingsStep({ formData, setFormData, errors, setErrors }: StepProps) {
  const [showAdvanced, setShowAdvanced] = React.useState(false)

  // Helper function to get event date range
  const getEventDateRange = () => {
    const startDate = formData.date ? new Date(formData.date) : null
    const endDate = formData.endDate ? new Date(formData.endDate) : startDate
    return { startDate, endDate }
  }

  // Helper function to validate payment timeline
  const validatePaymentTimeline = () => {
    const { startDate, endDate } = getEventDateRange()
    const validationErrors: string[] = []

    if (!startDate) return validationErrors

    // Use end date as the final deadline (or start date if single day event)
    const finalDeadline = endDate || startDate

    // Validate payment deadline - allow until event end date
    if (formData.paymentDeadline) {
      const paymentDeadline = new Date(formData.paymentDeadline)
      if (paymentDeadline > finalDeadline) {
        validationErrors.push('Payment deadline must be no later than the event end date')
      }
    }

    // Validate full payment deadline if deposits are allowed
    if (formData.depositAllowed && formData.fullPaymentDeadline) {
      const fullPaymentDeadline = new Date(formData.fullPaymentDeadline)
      
      if (fullPaymentDeadline > finalDeadline) {
        validationErrors.push('Full payment deadline must be no later than the event end date')
      }

      // Full payment deadline should be after or equal to payment deadline
      if (formData.paymentDeadline) {
        const paymentDeadline = new Date(formData.paymentDeadline)
        if (fullPaymentDeadline < paymentDeadline) {
          validationErrors.push('Full payment deadline must be after or equal to the initial payment deadline')
        }
      }
    }

    return validationErrors
  }

  const handleInputChange = (field: keyof typeof formData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  // Get current validation errors for real-time feedback
  const currentTimelineErrors = validatePaymentTimeline()
  const { startDate, endDate } = getEventDateRange()
  const isMultiDay = startDate && endDate && startDate.toDateString() !== endDate.toDateString()

  return (
    <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 border-2 border-purple-200 shadow-xl">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-purple-100 rounded-xl">
            <DollarSign className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <CardTitle className="text-xl text-purple-800">Payment Settings</CardTitle>
            <CardDescription className="text-purple-600">
              Configure payment requirements and policies
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Event Date Range Info */}
        {startDate && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">
                Event Date Range
              </span>
            </div>
            <p className="text-sm text-blue-700">
              {isMultiDay ? (
                <>Multi-day event: {startDate.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })} - {endDate?.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}</>
              ) : (
                <>Single-day event: {startDate.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}</>
              )}
            </p>
            <p className="text-xs text-blue-600 mt-1">
              Payment deadlines can be set up to the event end date (ideal for events where first date is arrival)
            </p>
          </div>
        )}

        {/* Timeline Validation Errors */}
        {currentTimelineErrors.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <span className="text-sm font-medium text-red-800">Payment Timeline Issues</span>
            </div>
            <div className="space-y-1">
              {currentTimelineErrors.map((error, index) => (
                <div key={`timeline-${index}`} className="text-sm text-red-700">• {error}</div>
              ))}
            </div>
          </div>
        )}
        {/* Payment Required Toggle */}
        <div className="bg-white/80 border border-purple-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-base font-semibold text-purple-800">
                Require Payment
              </Label>
              <p className="text-sm text-purple-600">
                Enable if attendees need to pay for registration
              </p>
            </div>
            <Switch
              checked={formData.paymentRequired}
              onCheckedChange={(checked) => handleInputChange('paymentRequired', checked)}
            />
          </div>
        </div>

        {/* Payment Configuration */}
        {formData.paymentRequired && (
          <div className="space-y-6">
            {/* Payment Deadline */}
            <div className="space-y-2">
              <Label htmlFor="paymentDeadline" className="text-sm font-medium text-gray-700">
                Payment Deadline
              </Label>
              <Input
                id="paymentDeadline"
                type="datetime-local"
                value={formData.paymentDeadline}
                onChange={(e) => handleInputChange('paymentDeadline', e.target.value)}
                max={startDate ? new Date(startDate.getTime() - 24 * 60 * 60 * 1000).toISOString().slice(0, 16) : undefined}
                className={`border-purple-200 focus:border-purple-500 bg-white/80 ${
                  currentTimelineErrors.some(error => error.includes('Payment deadline')) ? 'border-red-300 focus:border-red-500' : ''
                }`}
              />
              <p className="text-xs text-purple-600">
                Final date for payment completion (must be before event start)
              </p>
              {errors.paymentDeadline && (
                <p className="text-xs text-red-600">{errors.paymentDeadline}</p>
              )}
            </div>

            {/* Deposit Settings */}
            <div className="bg-white/80 border border-purple-200 rounded-xl p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-base font-semibold text-purple-800">
                    Allow Deposit Payments
                  </Label>
                  <p className="text-sm text-purple-600">
                    Let attendees pay a partial amount initially
                  </p>
                </div>
                <Switch
                  checked={formData.depositAllowed}
                  onCheckedChange={(checked) => handleInputChange('depositAllowed', checked)}
                />
              </div>

              {formData.depositAllowed && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-purple-100">
                  <div className="space-y-2">
                    <Label htmlFor="depositPercentage" className="text-sm font-medium text-gray-700">
                      Deposit Percentage (%)
                    </Label>
                    <Input
                      id="depositPercentage"
                      type="number"
                      min="1"
                      max="99"
                      value={formData.depositPercentage}
                      onChange={(e) => handleInputChange('depositPercentage', parseInt(e.target.value) || 0)}
                      placeholder="50"
                      className="border-purple-200 focus:border-purple-500 bg-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fullPaymentDeadline" className="text-sm font-medium text-gray-700">
                      Full Payment Deadline
                    </Label>
                    <Input
                      id="fullPaymentDeadline"
                      type="datetime-local"
                      value={formData.fullPaymentDeadline}
                      onChange={(e) => handleInputChange('fullPaymentDeadline', e.target.value)}
                      min={formData.paymentDeadline || undefined}
                      max={startDate ? new Date(startDate.getTime() - 24 * 60 * 60 * 1000).toISOString().slice(0, 16) : undefined}
                      className={`border-purple-200 focus:border-purple-500 bg-white ${
                        currentTimelineErrors.some(error => error.includes('Full payment deadline')) ? 'border-red-300 focus:border-red-500' : ''
                      }`}
                    />
                    <p className="text-xs text-purple-600">
                      Final date for full payment (must be after payment deadline and before event start)
                    </p>
                    {errors.fullPaymentDeadline && (
                      <p className="text-xs text-red-600">{errors.fullPaymentDeadline}</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Advanced Settings Toggle */}
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full border-purple-200 text-purple-700 hover:bg-purple-50"
            >
              {showAdvanced ? (
                <EyeOff className="h-4 w-4 mr-2" />
              ) : (
                <Eye className="h-4 w-4 mr-2" />
              )}
              {showAdvanced ? 'Hide' : 'Show'} Advanced Settings
            </Button>

            {/* Advanced Settings */}
            {showAdvanced && (
              <div className="bg-white/80 border border-purple-200 rounded-xl p-4 space-y-4">
                <h3 className="text-lg font-semibold text-purple-800 mb-4">Advanced Payment Settings</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="latePaymentFee" className="text-sm font-medium text-gray-700">
                    Late Payment Fee (GHS)
                  </Label>
                  <Input
                    id="latePaymentFee"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.latePaymentFee}
                    onChange={(e) => handleInputChange('latePaymentFee', parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    className="border-purple-200 focus:border-purple-500 bg-white"
                  />
                  <p className="text-xs text-purple-600">
                    Additional fee for payments made after deadline
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="refundPolicy" className="text-sm font-medium text-gray-700">
                    Refund Policy
                  </Label>
                  <Select
                    value={formData.refundPolicy}
                    onValueChange={(value) => handleInputChange('refundPolicy', value)}
                  >
                    <SelectTrigger className="border-purple-200 focus:border-purple-500 bg-white">
                      <SelectValue placeholder="Select refund policy" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full">Full Refund</SelectItem>
                      <SelectItem value="partial">Partial Refund</SelectItem>
                      <SelectItem value="deposit">Deposit Only</SelectItem>
                      <SelectItem value="none">No Refund</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-purple-600">
                    Policy for registration cancellations
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Free Event Message */}
        {!formData.paymentRequired && (
          <div className="text-center py-8 bg-white/50 border border-purple-200 rounded-xl">
            <CreditCard className="h-12 w-12 text-purple-400 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-purple-800 mb-2">Free Event</h3>
            <p className="text-purple-600">
              This event is free to attend. No payment configuration needed.
            </p>
          </div>
        )}

        {/* Info Box */}
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 p-4 rounded-xl">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Info className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <h4 className="font-semibold text-purple-800 mb-1">Payment Guidelines</h4>
              <ul className="text-sm text-purple-700 space-y-1">
                <li>• Set payment deadlines well before the event date</li>
                <li>• Consider offering deposit options for expensive events</li>
                <li>• Clearly communicate refund policies to attendees</li>
                <li>• Late fees should be reasonable and clearly stated</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Payment Summary */}
        {formData.paymentRequired && (
          <div className="bg-white/80 border border-purple-200 rounded-xl p-4">
            <h4 className="font-semibold text-purple-800 mb-3">Payment Summary</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Payment Required:</span>
                  <span className="font-medium text-purple-800">Yes</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Deposit Allowed:</span>
                  <span className="font-medium text-purple-800">
                    {formData.depositAllowed ? `Yes (${formData.depositPercentage}%)` : 'No'}
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Late Fee:</span>
                  <span className="font-medium text-purple-800">
                    {formData.latePaymentFee > 0 ? `GHS${formData.latePaymentFee}` : 'None'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Refund Policy:</span>
                  <span className="font-medium text-purple-800 capitalize">
                    {formData.refundPolicy || 'Not set'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
