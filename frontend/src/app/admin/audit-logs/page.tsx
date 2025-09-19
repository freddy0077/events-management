'use client'

import { useAuth } from '@/hooks/use-auth-simple'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, ShieldCheck, Activity } from 'lucide-react'
import AuditLogs from '@/components/admin/audit-logs'

export default function AuditLogsPage() {
  const { isAuthenticated, user } = useAuth()

  if (!isAuthenticated || user?.role !== 'ADMIN') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              You don't have permission to view audit logs
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button asChild>
              <Link href="/admin">Back to Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-primary-50 to-neutral-50">
      <div className="container mx-auto px-4 py-8">
        {/* MODERN HERO HEADER */}
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-orange-50 via-white to-purple-50 p-8 flex flex-col md:flex-row items-center justify-between shadow-lg mb-10 animate-fade-in">
          <div>
            <div className="inline-flex items-center gap-2 bg-orange-100 border border-orange-200 rounded-full px-4 py-2 mb-4">
              <ShieldCheck className="h-5 w-5 text-orange-600" />
              <span className="text-base font-semibold text-orange-700">Security & Compliance</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-black text-gray-900 tracking-tight mb-2">Audit Logs</h1>
            <p className="text-xl text-gray-600 max-w-2xl mb-4">Monitor system activity, user actions, and security events in real-time with powerful filters and export options.</p>
            <div className="flex flex-wrap gap-2 mt-2">
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-700 font-medium text-xs">Real-time Tracking</span>
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-purple-100 text-purple-700 font-medium text-xs">Advanced Filters</span>
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-700 font-medium text-xs">CSV & JSON Export</span>
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-orange-100 text-orange-700 font-medium text-xs">Role-based Access</span>
            </div>
          </div>
          <div className="hidden md:block">
            <Activity className="w-32 h-32 text-purple-200" />
          </div>
        </div>

        {/* Audit Logs Component */}
        <AuditLogs />
      </div>
    </div>
  )
}
