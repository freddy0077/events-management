'use client'

export const dynamic = 'force-dynamic'

import { useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useMyAssignedEvents, useMyEventRegistrations } from '@/lib/graphql/hooks'
import { formatGHS } from '@/lib/utils/currency'
import {
  BarChart3,
  Download,
  Filter,
  PieChart,
  Users,
  CheckCircle,
  Clock,
  Loader2
} from 'lucide-react'

interface EventSummary {
  id: string
  name: string
  totalRegistrations: number
  paidRegistrations: number
  pendingRegistrations: number
  checkedInRegistrations: number
  revenue: number
}

interface CategorySummary {
  name: string
  registrations: number
  revenue: number
}

const ALL_EVENTS = 'ALL'

export default function StaffReportsPage() {
  const [selectedEventId, setSelectedEventId] = useState<string>(ALL_EVENTS)

  const { data: eventsData, loading: eventsLoading, error: eventsError } = useMyAssignedEvents()
  const assignedEvents = (eventsData as any)?.myAssignedEvents || []

  const eventIds = useMemo(() => {
    if (!assignedEvents.length) return []
    if (selectedEventId === ALL_EVENTS) {
      return assignedEvents.map((event: any) => event.id)
    }
    return [selectedEventId]
  }, [assignedEvents, selectedEventId])

  const {
    data: registrationsData,
    loading: registrationsLoading,
    error: registrationsError
  } = useMyEventRegistrations(eventIds)

  const registrations = (registrationsData as any)?.registrations || []

  const isLoading = eventsLoading || registrationsLoading

  const summary = useMemo(() => {
    const totalRegistrations = registrations.length
    const paidRegistrations = registrations.filter((reg: any) => reg.paymentStatus === 'PAID').length
    const pendingRegistrations = registrations.filter((reg: any) => reg.paymentStatus !== 'PAID').length
    const checkedInRegistrations = registrations.filter((reg: any) => reg.checkedIn).length
    const totalRevenue = registrations.reduce((sum: number, reg: any) => {
      const amount = reg.transactions
        ?.filter((txn: any) => txn.paymentStatus === 'PAID')
        .reduce((txnSum: number, txn: any) => txnSum + (txn.amount || 0), 0) || 0

      return sum + (amount > 0 ? amount : (reg.category?.price || 0))
    }, 0)

    return {
      totalRegistrations,
      paidRegistrations,
      pendingRegistrations,
      checkedInRegistrations,
      totalRevenue
    }
  }, [registrations])

  const eventSummaries: EventSummary[] = useMemo(() => {
    return assignedEvents.map((event: any) => {
      const eventRegistrations = registrations.filter((reg: any) => reg.event?.id === event.id)
      const totalRegistrations = eventRegistrations.length
      const paidRegistrations = eventRegistrations.filter((reg: any) => reg.paymentStatus === 'PAID').length
      const pendingRegistrations = totalRegistrations - paidRegistrations
      const checkedInRegistrations = eventRegistrations.filter((reg: any) => reg.checkedIn).length
      const revenue = eventRegistrations.reduce((sum: number, reg: any) => {
        const amount = reg.transactions
          ?.filter((txn: any) => txn.paymentStatus === 'PAID')
          .reduce((txnSum: number, txn: any) => txnSum + (txn.amount || 0), 0) || 0

        return sum + (amount > 0 ? amount : (reg.category?.price || 0))
      }, 0)

      return {
        id: event.id,
        name: event.name,
        totalRegistrations,
        paidRegistrations,
        pendingRegistrations,
        checkedInRegistrations,
        revenue
      }
    })
  }, [assignedEvents, registrations])

  const categorySummaries: CategorySummary[] = useMemo(() => {
    const map = new Map<string, { registrations: number; revenue: number }>()

    registrations.forEach((reg: any) => {
      const categoryName = reg.category?.name || 'Uncategorized'
      const amount = reg.transactions
        ?.filter((txn: any) => txn.paymentStatus === 'PAID')
        .reduce((txnSum: number, txn: any) => txnSum + (txn.amount || 0), 0) || 0

      const revenue = amount > 0 ? amount : (reg.category?.price || 0)

      if (!map.has(categoryName)) {
        map.set(categoryName, { registrations: 0, revenue: 0 })
      }

      const entry = map.get(categoryName)!
      entry.registrations += 1
      entry.revenue += revenue
    })

    return Array.from(map.entries())
      .map(([name, value]) => ({ name, ...value }))
      .sort((a, b) => b.revenue - a.revenue)
  }, [registrations])

  const hasData = summary.totalRegistrations > 0

  if (eventsError) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Error loading reports</CardTitle>
            <CardDescription>{eventsError.message}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  if (registrationsError) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Error loading registration data</CardTitle>
            <CardDescription>{registrationsError.message}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-600 mt-2">
            Monitor registration performance and revenue across your assigned events
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <select
              className="border border-gray-300 rounded-md px-3 py-2 text-sm"
              value={selectedEventId}
              onChange={(event) => setSelectedEventId(event.target.value)}
              disabled={isLoading || assignedEvents.length === 0}
            >
              <option value={ALL_EVENTS}>All Events</option>
              {assignedEvents.map((event: any) => (
                <option key={event.id} value={event.id}>{event.name}</option>
              ))}
            </select>
          </div>
          <Button variant="outline" disabled={!hasData}>
            <Download className="h-4 w-4 mr-2" />
            Export Summary
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <div className="flex items-center gap-3 text-gray-600">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Loading analytics...</span>
          </div>
        </div>
      ) : !hasData ? (
        <Card className="border-dashed border-2">
          <CardContent className="py-16 text-center space-y-4">
            <BarChart3 className="h-12 w-12 mx-auto text-gray-400" />
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-gray-900">No registration data yet</h2>
              <p className="text-gray-500">
                When registrations start coming in, you will see detailed analytics for your events here.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Registrations</p>
                    <p className="text-2xl font-bold text-gray-900">{summary.totalRegistrations}</p>
                    <p className="text-xs text-gray-500">Across {eventSummaries.length} events</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Paid Registrations</p>
                    <p className="text-2xl font-bold text-gray-900">{summary.paidRegistrations}</p>
                    <p className="text-xs text-green-600">
                      {(summary.totalRegistrations > 0
                        ? ((summary.paidRegistrations / summary.totalRegistrations) * 100).toFixed(1)
                        : '0.0')}% of total
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <Clock className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Pending / Outstanding</p>
                    <p className="text-2xl font-bold text-gray-900">{summary.pendingRegistrations}</p>
                    <p className="text-xs text-yellow-600">
                      {(summary.totalRegistrations > 0
                        ? ((summary.pendingRegistrations / summary.totalRegistrations) * 100).toFixed(1)
                        : '0.0')}% of total
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <PieChart className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Revenue (GHS)</p>
                    <p className="text-2xl font-bold text-gray-900">{formatGHS(summary.totalRevenue)}</p>
                    <p className="text-xs text-gray-500">Includes estimated revenue for unpaid registrations</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Event Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Event Performance</CardTitle>
              <CardDescription>Registrations and revenue by event</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {eventSummaries.map((event) => (
                <div
                  key={event.id}
                  className="border border-gray-200 rounded-lg p-4 hover:border-blue-200 transition-colors"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold text-gray-900">{event.name}</h3>
                        <Badge variant="secondary" className="bg-blue-50 text-blue-700">
                          {event.totalRegistrations} registrations
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                        <div>
                          <p className="text-xs text-gray-500 uppercase">Paid</p>
                          <p className="text-base font-medium text-gray-900">{event.paidRegistrations}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 uppercase">Pending</p>
                          <p className="text-base font-medium text-gray-900">{event.pendingRegistrations}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 uppercase">Checked In</p>
                          <p className="text-base font-medium text-gray-900">{event.checkedInRegistrations}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 uppercase">Revenue</p>
                          <p className="text-base font-medium text-gray-900">{formatGHS(event.revenue)}</p>
                        </div>
                      </div>
                    </div>
                    <div className="text-sm text-gray-600">
                      Completion Rate:{' '}
                      {event.totalRegistrations > 0
                        ? `${((event.paidRegistrations / event.totalRegistrations) * 100).toFixed(1)}%`
                        : '0.0%'}
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Category Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Category Breakdown</CardTitle>
              <CardDescription>Registrations and revenue grouped by category</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {categorySummaries.map((category) => (
                <div
                  key={category.name}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border border-gray-200 rounded-lg px-4 py-3"
                >
                  <div>
                    <h3 className="font-medium text-gray-900">{category.name}</h3>
                    <p className="text-sm text-gray-500">{category.registrations} registrations</p>
                  </div>
                  <div className="text-sm text-gray-600">
                    Revenue: <span className="font-semibold text-gray-900">{formatGHS(category.revenue)}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
