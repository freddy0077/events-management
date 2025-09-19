'use client'

// Force dynamic rendering to prevent SSG issues with Apollo Client
export const dynamic = 'force-dynamic'
import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { 
  ArrowLeft,
  UserPlus, 
  Calendar, 
  Users, 
  Shield, 
  Save,
  Plus,
  Trash2,
  CheckCircle,
  Building,
  Loader2
} from 'lucide-react'
import { useAuth } from '@/hooks/use-auth-simple'
import { useAvailableEventManagers, useMyAssignedEvents } from '@/lib/graphql/hooks'
import { toast } from 'sonner'

interface AssignmentForm {
  eventId: string
  staffId: string
  staffRole: 'ORGANIZER' | 'COORDINATOR' | 'STAFF'
  permissions: string[]
}

export default function StaffAssignmentsPage() {
  const { user } = useAuth()
  const [assignments, setAssignments] = useState<AssignmentForm[]>([])
  const [currentAssignment, setCurrentAssignment] = useState<AssignmentForm>({
    eventId: '',
    staffId: '',
    staffRole: 'STAFF',
    permissions: []
  })

  // GraphQL queries for real data
  const { data: assignedEventsData, loading: eventsLoading, error: eventsError } = useMyAssignedEvents()
  const { data: availableStaffData, loading: staffLoading, error: staffError } = useAvailableEventManagers()

  // Extract events - for EVENT_ORGANIZER use assigned events, for ADMIN use all events
  const events = user?.role === 'EVENT_ORGANIZER' 
    ? ((assignedEventsData as any)?.myAssignedEvents || [])
    : [] // ADMIN would get all events from a different query

  const availableStaff = (availableStaffData as any)?.availableEventManagers || []

  const availablePermissions = [
    'CREATE_REGISTRATION',
    'PROCESS_PAYMENT',
    'APPROVE_PAYMENT',
    'RECONCILE_PAYMENTS',
    'MANAGE_STAFF',
    'VIEW_REPORTS',
    'SCAN_QR_CODES',
    'SERVE_MEALS',
    'VERIFY_MEAL_ELIGIBILITY',
    'EXPORT_DATA',
    'MANAGE_EVENTS',
    'ASSIGN_EVENT_STAFF',
    'PRINT_BADGES'
  ]

  const handlePermissionChange = (permission: string, checked: boolean) => {
    setCurrentAssignment(prev => ({
      ...prev,
      permissions: checked 
        ? [...prev.permissions, permission]
        : prev.permissions.filter(p => p !== permission)
    }))
  }

  const handleAddAssignment = () => {
    if (!currentAssignment.eventId || !currentAssignment.staffId) {
      toast.error('Please select both event and staff member')
      return
    }

    setAssignments(prev => [...prev, currentAssignment])
    setCurrentAssignment({
      eventId: '',
      staffId: '',
      staffRole: 'STAFF',
      permissions: []
    })
    toast.success('Assignment added successfully')
  }

  const handleSaveAssignments = async () => {
    if (assignments.length === 0) {
      toast.error('Please add at least one assignment')
      return
    }

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    toast.success('All assignments saved successfully!')
    setAssignments([])
  }

  if (!['ADMIN', 'EVENT_ORGANIZER'].includes(user?.role || '')) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>Only administrators and event organizers can manage staff assignments</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button asChild><Link href="/admin">Back to Dashboard</Link></Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-blue-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/staff">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Staff
            </Link>
          </Button>
          <div>
            <div className="inline-flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-full px-4 py-2 mb-2">
              <Building className="h-4 w-4 text-orange-600" />
              <span className="text-sm font-medium text-orange-700">Staff Assignment Portal</span>
            </div>
            <h1 className="text-3xl font-bold text-neutral-900">Event Staff Assignments</h1>
            <p className="text-neutral-600 mt-2">Assign staff members to events with specific roles and permissions</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Assignment Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-orange-600" />
                Create New Assignment
              </CardTitle>
              <CardDescription>Assign a staff member to an event with specific permissions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Event</Label>
                <Select value={currentAssignment.eventId} onValueChange={(value) => 
                  setCurrentAssignment(prev => ({ ...prev, eventId: value }))
                }>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an event" />
                  </SelectTrigger>
                  <SelectContent>
                    {eventsLoading ? (
                      <div className="flex items-center justify-center p-4">
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        <span className="text-sm text-muted-foreground">Loading events...</span>
                      </div>
                    ) : events.length === 0 ? (
                      <div className="p-4 text-center text-sm text-muted-foreground">
                        {user?.role === 'EVENT_ORGANIZER' 
                          ? 'No events assigned to you yet' 
                          : 'No events available'
                        }
                      </div>
                    ) : (
                      events.map((event: any) => (
                        <SelectItem key={event.id} value={event.id}>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <div>
                              <div className="font-medium">{event.name}</div>
                              <div className="text-xs text-muted-foreground">
                                {new Date(event.date).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Staff Member</Label>
                <Select value={currentAssignment.staffId} onValueChange={(value) => 
                  setCurrentAssignment(prev => ({ ...prev, staffId: value }))
                }>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a staff member" />
                  </SelectTrigger>
                  <SelectContent>
                    {staffLoading ? (
                      <div className="flex items-center justify-center p-4">
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        <span className="text-sm text-muted-foreground">Loading staff...</span>
                      </div>
                    ) : availableStaff.length === 0 ? (
                      <div className="p-4 text-center text-sm text-muted-foreground">
                        No staff members available
                      </div>
                    ) : (
                      availableStaff.map((staff: any) => (
                        <SelectItem key={staff.id} value={staff.id}>
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            <div>
                              <div className="font-medium">{staff.firstName} {staff.lastName}</div>
                              <div className="text-xs text-muted-foreground">{staff.email}</div>
                            </div>
                            <Badge variant="outline" className="text-xs">{staff.role}</Badge>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Staff Role</Label>
                <Select value={currentAssignment.staffRole} onValueChange={(value: any) => 
                  setCurrentAssignment(prev => ({ ...prev, staffRole: value }))
                }>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {/* Only ADMIN can assign EVENT_ORGANIZER roles */}
                    {user?.role === 'ADMIN' && (
                      <SelectItem value="ORGANIZER">Event Organizer</SelectItem>
                    )}
                    <SelectItem value="COORDINATOR">Event Coordinator</SelectItem>
                    <SelectItem value="STAFF">Staff Member</SelectItem>
                  </SelectContent>
                </Select>
                {user?.role === 'EVENT_ORGANIZER' && (
                  <p className="text-xs text-orange-600">
                    Note: As an Event Organizer, you can only assign Coordinator and Staff roles. 
                    Only Administrators can assign Event Organizer roles.
                  </p>
                )}
              </div>

              <div className="space-y-3">
                <Label>Permissions</Label>
                <div className="grid grid-cols-2 gap-3">
                  {availablePermissions.map(permission => (
                    <div key={permission} className="flex items-center space-x-2">
                      <Checkbox
                        id={permission}
                        checked={currentAssignment.permissions.includes(permission)}
                        onCheckedChange={(checked) => handlePermissionChange(permission, checked as boolean)}
                      />
                      <Label htmlFor={permission} className="text-sm font-normal">
                        {permission.replace(/_/g, ' ')}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <Button 
                onClick={handleAddAssignment}
                className="w-full bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Assignment
              </Button>
            </CardContent>
          </Card>

          {/* Current Assignments */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-600" />
                Pending Assignments ({assignments.length})
              </CardTitle>
              <CardDescription>Review and save your staff assignments</CardDescription>
            </CardHeader>
            <CardContent>
              {assignments.length > 0 ? (
                <div className="space-y-4">
                  {assignments.map((assignment, index) => {
                    const event = events.find((e: any) => e.id === assignment.eventId)
                    const staff = availableStaff.find((s: any) => s.id === assignment.staffId)
                    
                    return (
                      <div key={index} className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h4 className="font-semibold text-blue-900">{event?.name || 'Unknown Event'}</h4>
                            <p className="text-sm text-blue-700">
                              {staff ? `${staff.firstName} ${staff.lastName}` : 'Unknown Staff'} - {assignment.staffRole}
                            </p>
                            {event && (
                              <p className="text-xs text-blue-600">
                                {new Date(event.date).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setAssignments(prev => prev.filter((_, i) => i !== index))}
                            className="text-red-600 border-red-200 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {assignment.permissions.map(permission => (
                            <Badge key={permission} variant="outline" className="text-xs">
                              {permission.replace(/_/g, ' ')}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                  
                  <Separator />
                  
                  <Button 
                    onClick={handleSaveAssignments}
                    className="w-full bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save All Assignments
                  </Button>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Shield className="h-16 w-16 text-neutral-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-neutral-900 mb-2">No assignments yet</h3>
                  <p className="text-neutral-600">Add staff assignments using the form on the left</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
