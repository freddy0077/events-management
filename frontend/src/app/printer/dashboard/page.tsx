'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Printer, 
  QrCode, 
  Calendar, 
  Users,
  CheckCircle,
  Clock,
  AlertCircle,
  TrendingUp,
  FileText,
  Search,
  Loader2
} from 'lucide-react'
import { useAuth } from '@/hooks/use-auth-simple'
import { useQuery } from '@apollo/client/react'
import { GET_MY_ASSIGNED_EVENTS, GET_MY_EVENT_REGISTRATIONS } from '@/lib/graphql/queries'

export default function PrinterDashboardPage() {
  const { user } = useAuth()
  
  const { data: eventsData, loading: eventsLoading } = useQuery(GET_MY_ASSIGNED_EVENTS)
  const events = (eventsData as any)?.myAssignedEvents || []
  
  const eventIds = events.map((e: any) => e.id)
  
  const { data: registrationsData, loading: registrationsLoading } = useQuery(GET_MY_EVENT_REGISTRATIONS, {
    variables: { eventIds },
    skip: eventIds.length === 0
  })
  
  const registrations = (registrationsData as any)?.registrations || []
  
  // Calculate stats from registrations
  const totalRegistrations = registrations.length
  const paidRegistrations = registrations.filter((r: any) => r.paymentStatus === 'PAID').length
  const badgesPrinted = registrations.filter((r: any) => r.badgePrinted).length
  const pendingBadges = paidRegistrations - badgesPrinted
  const activeEventsCount = events.filter((e: any) => e.isActive).length
  
  // Calculate today's prints
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const printedToday = registrations.filter((r: any) => {
    if (!r.badgePrintedAt) return false
    const printDate = new Date(r.badgePrintedAt)
    printDate.setHours(0, 0, 0, 0)
    return printDate.getTime() === today.getTime()
  }).length

  const stats = [
    {
      title: 'Badges Printed Today',
      value: printedToday.toString(),
      icon: Printer,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      change: `${badgesPrinted} total`,
      changeType: 'positive' as const
    },
    {
      title: 'Pending Badges',
      value: pendingBadges.toString(),
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
      change: 'Ready to print',
      changeType: 'neutral' as const
    },
    {
      title: 'Total Printed',
      value: badgesPrinted.toString(),
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      change: `${paidRegistrations} paid`,
      changeType: 'positive' as const
    },
    {
      title: 'Active Events',
      value: activeEventsCount.toString(),
      icon: Calendar,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      change: `${events.length} total`,
      changeType: 'neutral' as const
    }
  ]

  const quickActions = [
    {
      title: 'Print Badges',
      description: 'Print badges for registered participants',
      icon: Printer,
      href: '/printer/badges/print',
      color: 'bg-blue-600 hover:bg-blue-700'
    },
    {
      title: 'Search Registration',
      description: 'Find and print specific badges',
      icon: Search,
      href: '/printer/badges/search',
      color: 'bg-purple-600 hover:bg-purple-700'
    },
    {
      title: 'Batch Print',
      description: 'Print multiple badges at once',
      icon: FileText,
      href: '/printer/badges/batch',
      color: 'bg-green-600 hover:bg-green-700'
    },
    {
      title: 'My Events',
      description: 'View events assigned to you',
      icon: Calendar,
      href: '/printer/events',
      color: 'bg-orange-600 hover:bg-orange-700'
    }
  ]

  if (eventsLoading || registrationsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
          <span className="text-lg font-medium">Loading dashboard...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Badge Printer Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Welcome back, {user?.firstName}! Manage badge printing operations.
          </p>
        </div>
        <Badge variant="secondary" className="bg-amber-100 text-amber-800">
          Badge Printer
        </Badge>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className={`text-xs ${
                stat.changeType === 'positive' ? 'text-green-600' :
                stat.changeType === 'negative' ? 'text-red-600' :
                'text-gray-600'
              }`}>
                {stat.change} from yesterday
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common badge printing tasks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {quickActions.map((action) => (
              <Link key={action.title} href={action.href}>
                <div className="group cursor-pointer">
                  <div className={`${action.color} text-white p-6 rounded-lg transition-all duration-200 hover:shadow-lg`}>
                    <action.icon className="h-8 w-8 mb-3" />
                    <h3 className="font-semibold mb-1">{action.title}</h3>
                    <p className="text-sm text-white/90">{action.description}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Badge Printing Activity</CardTitle>
          <CardDescription>
            Your latest badge printing operations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <Printer className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p>No recent badge printing activity</p>
            <p className="text-sm mt-2">Start printing badges to see your activity here</p>
          </div>
        </CardContent>
      </Card>

      {/* Help & Tips */}
      <Card>
        <CardHeader>
          <CardTitle>Badge Printing Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Printer className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Print Quality</h4>
                <p className="text-sm text-gray-600">
                  Ensure your printer is set to high quality mode for best badge results
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <QrCode className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">QR Code Verification</h4>
                <p className="text-sm text-gray-600">
                  Always verify QR codes scan correctly after printing
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Batch Printing</h4>
                <p className="text-sm text-gray-600">
                  Use batch printing for multiple badges to save time
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <AlertCircle className="h-4 w-4 text-orange-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Badge Stock</h4>
                <p className="text-sm text-gray-600">
                  Check badge paper stock before starting large print jobs
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
