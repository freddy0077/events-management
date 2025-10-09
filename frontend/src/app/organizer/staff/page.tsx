'use client'

// Force dynamic rendering to prevent SSG issues with Apollo Client
export const dynamic = 'force-dynamic'
import { useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { 
  UserPlus,
  Search,
  Users,
  Calendar,
  Settings,
  Trash2,
  Eye,
  Loader2,
  AlertCircle,
  CheckCircle,
  User,
  Mail,
  Shield,
  Plus,
  X,
  Clock,
  Phone,
  MapPin,
  QrCode
} from 'lucide-react'
import { useAuth } from '@/hooks/use-auth-simple'
import { 
  useMyAssignedEvents,
  useEventStaff,
  useAssignStaffToEvent,
  useAvailableEventManagers,
  useRemoveStaffFromEvent,
  useRegisterUser,
} from '@/lib/graphql/hooks'
import { format } from 'date-fns'
import { toast } from 'sonner'

export default function OrganizerStaffPage() {
  const { user } = useAuth()
  const searchParams = useSearchParams()
  const preselectedEventId = searchParams.get('eventId')
  
  const [selectedEvent, setSelectedEvent] = useState<string>(preselectedEventId || '')
  const [selectedRole, setSelectedRole] = useState<string>('STAFF')
  const [selectedUserId, setSelectedUserId] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState('')
  const [showCreateUser, setShowCreateUser] = useState(false)
  const [viewingStaff, setViewingStaff] = useState<any>(null)
  const [showStaffModal, setShowStaffModal] = useState(false)
  const [newUserData, setNewUserData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'REGISTRATION_STAFF',
    eventRole: 'REGISTRATION_ONLY' // The event-specific role
  })
  
  // Fetch assigned events
  const { data: eventsData, loading: eventsLoading } = useMyAssignedEvents()
  const events = (eventsData as any)?.myAssignedEvents || []

  // Available users to assign (reuse availableEventManagers as pool of users)
  const { data: availableStaffData, loading: staffLoading } = useAvailableEventManagers()
  const availableStaffAll = (availableStaffData as any)?.availableEventManagers || []

  // Current event staff
  const { data: eventStaffData, loading: eventStaffLoading, refetch: refetchEventStaff } = useEventStaff(selectedEvent)
  const eventStaff = (eventStaffData as any)?.eventStaff?.staff || []

  // Staff assignment & removal mutations
  const [assignStaffMutation, { loading: assignLoading }] = useAssignStaffToEvent()
  const assignStaff = assignStaffMutation
  const [removeStaffMutation, { loading: removeLoading }] = useRemoveStaffFromEvent()
  const [createUserMutation, { loading: createUserLoading }] = useRegisterUser()

  const handleAssignStaff = async () => {
    if (!selectedEvent || !selectedUserId || !selectedRole) {
      toast.error('Please select an event, user, and role')
      return
    }

    try {
      await assignStaff({
        variables: {
          input: {
            eventId: selectedEvent,
            userId: selectedUserId,
            role: selectedRole,
            permissions: getDefaultPermissions(selectedRole)
          }
        }
      })

      toast.success('Staff member assigned successfully')
      setSelectedUserId('')
      refetchEventStaff()
    } catch (error: any) {
      toast.error(error.message || 'Failed to assign staff member')
    }
  }

  const getDefaultPermissions = (role: string) => {
    switch (role) {
      // EventStaffRole permissions (matching backend getRolePermissions exactly)
      case 'STAFF':
        // Backend STAFF role: 2 permissions
        return ['CREATE_REGISTRATION', 'SCAN_QR_CODES']
      case 'REGISTRATION_ONLY':
        // Registration only - can register but not print badges
        return ['CREATE_REGISTRATION']
      case 'BADGE_PRINTER':
        // Badge printing only - can print badges but not register
        return ['PRINT_BADGES', 'MANAGE_BADGES']
      case 'SUPERVISOR':
        // Map SUPERVISOR to backend COORDINATOR role: 4 permissions
        return ['CREATE_REGISTRATION', 'VIEW_REPORTS', 'SCAN_QR_CODES', 'EXPORT_DATA', 'PRINT_BADGES', 'MANAGE_BADGES']
      case 'MANAGER':
        // MANAGER role - enhanced COORDINATOR with staff management: 5 permissions
        return ['CREATE_REGISTRATION', 'VIEW_REPORTS', 'SCAN_QR_CODES', 'EXPORT_DATA', 'MANAGE_STAFF', 'PRINT_BADGES', 'MANAGE_BADGES']
      case 'ORGANIZER':
        // Backend ORGANIZER role: 6 permissions
        return ['CREATE_REGISTRATION', 'APPROVE_PAYMENT', 'MANAGE_STAFF', 'VIEW_REPORTS', 'SCAN_QR_CODES', 'EXPORT_DATA', 'PRINT_BADGES', 'MANAGE_BADGES']
      default:
        return []
    }
  }

  const getPermissionsForRole = (role: string) => {
    // Use the same logic as getDefaultPermissions for consistency
    return getDefaultPermissions(role)
  }

  const handleCreateUser = async () => {
    if (!newUserData.firstName || !newUserData.lastName || !newUserData.email || !newUserData.password || !newUserData.role) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      const result = await createUserMutation({
        variables: {
          input: {
            firstName: newUserData.firstName,
            lastName: newUserData.lastName,
            email: newUserData.email,
            role: newUserData.role,
            password: newUserData.password,
            mustChangePassword: true // Flag to indicate this account was created by an organizer
          }
        }
      })

      if ((result.data as any)?.registerUser?.success) {
        toast.success(
          (result.data as any).registerUser.message || 
          `User ${newUserData.firstName} ${newUserData.lastName} created successfully! 
          They will be required to change their password on first login.`,
          { duration: 5000 }
        )
        
        // Auto-assign the new user to the selected event if an event is selected
        if (selectedEvent && (result.data as any).registerUser.user) {
          const newUserId = (result.data as any).registerUser.user.id
          // Use the selected event role
          const assignmentRole = newUserData.eventRole
          
          try {
            // Automatically assign the new user to the selected event
            console.log('🔄 Attempting to assign user to event:', {
              eventId: selectedEvent,
              userId: newUserId,
              role: assignmentRole,
              permissions: getDefaultPermissions(assignmentRole)
            })
            
            // Validate data before sending
            console.log('🔍 Data validation check:', {
              eventIdType: typeof selectedEvent,
              eventIdLength: selectedEvent?.length,
              userIdType: typeof newUserId,
              userIdLength: newUserId?.length,
              roleType: typeof assignmentRole,
              roleValue: assignmentRole,
              permissionsType: typeof getDefaultPermissions(assignmentRole),
              permissionsValue: getDefaultPermissions(assignmentRole)
            })
            
            const assignResult = await assignStaff({
              variables: {
                input: {
                  eventId: selectedEvent,
                  userId: newUserId,
                  role: assignmentRole,
                  permissions: getDefaultPermissions(assignmentRole)
                }
              }
            })
            
            console.log('✅ Assignment successful:', assignResult)
            toast.success('User created and assigned to event successfully!')
            refetchEventStaff()
          } catch (assignError: any) {
            console.error('❌ Assignment failed:', assignError)
            toast.error(`User created but assignment failed: ${assignError.message}`)
          }
          
          setShowCreateUser(false)
          
          // Reset form
          setNewUserData({
            firstName: '',
            lastName: '',
            email: '',
            password: '',
            role: 'REGISTRATION_STAFF',
            eventRole: 'REGISTRATION_ONLY'
          })
        }
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to create user')
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      // EventStaffRole colors
      case 'ORGANIZER':
        return 'bg-red-100 text-red-800'
      case 'MANAGER':
        return 'bg-purple-100 text-purple-800'
      case 'SUPERVISOR':
        return 'bg-blue-100 text-blue-800'
      case 'STAFF':
        return 'bg-green-100 text-green-800'
      case 'REGISTRATION_ONLY':
        return 'bg-cyan-100 text-cyan-800'
      case 'BADGE_PRINTER':
        return 'bg-amber-100 text-amber-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const handleRemoveStaff = async (staffId: string) => {
    if (!staffId) return
    try {
      await removeStaffMutation({ variables: { staffId } })
      toast.success('Staff member removed successfully')
      refetchEventStaff()
    } catch (error: any) {
      toast.error(error.message || 'Failed to remove staff member')
    }
  }

  const handleViewStaff = (staff: any) => {
    setViewingStaff(staff)
    setShowStaffModal(true)
  }

  // Build available staff list excluding already assigned users and apply search
  const assignedUserIds = new Set(eventStaff.map((s: any) => s.user?.id))
  const availableStaff = availableStaffAll.filter((u: any) => !assignedUserIds.has(u.id))
  const filteredStaff = availableStaff.filter((staff: any) =>
    staff.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    staff.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    staff.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (eventsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin text-orange-600" />
          <span className="text-gray-600">Loading events...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Staff Management</h1>
          <p className="text-gray-600 mt-1">
            Assign coordinators and staff to your events
          </p>
        </div>
        <Badge variant="secondary" className="bg-orange-100 text-orange-800">
          Event Organizer
        </Badge>
      </div>

      {/* Event Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="h-5 w-5 mr-2 text-blue-600" />
            Select Event
          </CardTitle>
          <CardDescription>
            Choose an event to manage its staff assignments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedEvent} onValueChange={setSelectedEvent}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select an event to manage staff" />
            </SelectTrigger>
            <SelectContent>
              {events.map((event: any) => (
                <SelectItem key={event.id} value={event.id}>
                  <div className="flex items-center justify-between w-full">
                    <span>{event.name}</span>
                    <span className="text-sm text-gray-500 ml-2">
                      {event.date && format(new Date(event.date), 'MMM d, yyyy')}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Role Restriction Notice */}
      <Card className="border-orange-200 bg-orange-50">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <div className="p-1 bg-orange-100 rounded-full">
              <Shield className="h-4 w-4 text-orange-600" />
            </div>
            <div>
              <h4 className="font-semibold text-orange-900">Staff Role Assignment</h4>
              <p className="text-sm text-orange-800 mt-1">
                As an Event Organizer, you can create new users with system-wide roles and assign them event-specific 
                staff roles including <strong>Staff</strong>, <strong>Registration Only</strong>, <strong>Badge Printer</strong>, 
                <strong>Supervisor</strong>, and <strong>Manager</strong>. 
                Each role has specific permissions tailored to their responsibilities within the event.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedEvent && (
        <>
          {/* Create New User Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center">
                  <Plus className="h-5 w-5 mr-2 text-green-600" />
                  Create New Staff Member
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCreateUser(!showCreateUser)}
                >
                  {showCreateUser ? (
                    <>
                      <X className="h-4 w-4 mr-1" />
                      Cancel
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-1" />
                      Add New User
                    </>
                  )}
                </Button>
              </CardTitle>
              <CardDescription>
                Create a new user account and assign them to this event
              </CardDescription>
            </CardHeader>
            {showCreateUser && (
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      First Name *
                    </label>
                    <Input
                      value={newUserData.firstName}
                      onChange={(e) => setNewUserData({ ...newUserData, firstName: e.target.value })}
                      placeholder="Enter first name"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Last Name *
                    </label>
                    <Input
                      value={newUserData.lastName}
                      onChange={(e) => setNewUserData({ ...newUserData, lastName: e.target.value })}
                      placeholder="Enter last name"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Email Address *
                  </label>
                  <Input
                    type="email"
                    value={newUserData.email}
                    onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                    placeholder="Enter email address"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Password *
                  </label>
                  <Input
                    type="password"
                    value={newUserData.password}
                    onChange={(e) => setNewUserData({ ...newUserData, password: e.target.value })}
                    placeholder="Enter password"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Password should be at least 8 characters long
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Staff Role *
                  </label>
                  <Select value={newUserData.eventRole} onValueChange={(value) => {
                    // Auto-set system role based on event role
                    const systemRole = value === 'REGISTRATION_ONLY' || value === 'BADGE_PRINTER' ? 'REGISTRATION_STAFF' :
                                      value === 'CATERING_TEAM' ? 'CATERING_TEAM' :
                                      value === 'FINANCE_TEAM' ? 'FINANCE_TEAM' : 'REGISTRATION_STAFF'
                    setNewUserData({ ...newUserData, eventRole: value, role: systemRole })
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select staff role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="REGISTRATION_ONLY">
                        <div className="flex items-center space-x-2">
                          <Badge className="bg-cyan-100 text-cyan-800">Registration Only</Badge>
                          <span className="text-sm text-gray-600">- Can register participants only (no badge printing)</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="BADGE_PRINTER">
                        <div className="flex items-center space-x-2">
                          <Badge className="bg-amber-100 text-amber-800">Badge Printer</Badge>
                          <span className="text-sm text-gray-600">- Can print & manage badges only (no registration)</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="FINANCE_TEAM">
                        <div className="flex items-center space-x-2">
                          <Badge className="bg-yellow-100 text-yellow-800">Finance Team</Badge>
                          <span className="text-sm text-gray-600">- Monitors and reconciles payments received</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="CATERING_TEAM">
                        <div className="flex items-center space-x-2">
                          <Badge className="bg-pink-100 text-pink-800">Catering Team</Badge>
                          <span className="text-sm text-gray-600">- Verifies eligibility during meal sessions via QR scans</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500 mt-1">
                    Select the role for this staff member. They will be assigned to the selected event.
                  </p>
                </div>

                {/* First-time login notice */}
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <div className="p-1 bg-blue-100 rounded-full mt-0.5">
                      <Shield className="h-3 w-3 text-blue-600" />
                    </div>
                    <div className="text-sm">
                      <p className="font-medium text-blue-900">First-Time Login Security</p>
                      <p className="text-blue-800 mt-1">
                        The new user will be required to change their password when they first log in. 
                        Make sure to share their email and the password you set with them securely.
                      </p>
                    </div>
                  </div>
                </div>

                <Button 
                  onClick={handleCreateUser}
                  disabled={createUserLoading || !newUserData.firstName || !newUserData.lastName || !newUserData.email || !newUserData.password}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  {createUserLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating User...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Create User & Assign to Event
                    </>
                  )}
                </Button>
              </CardContent>
            )}
          </Card>

          {/* Staff Assignment Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <UserPlus className="h-5 w-5 mr-2 text-green-600" />
                Assign New Staff Member
              </CardTitle>
              <CardDescription>
                Add coordinators and staff to help manage this event
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search Staff */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search available staff by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {/* User Selection */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Select Staff Member
                  </label>
                  <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a staff member" />
                    </SelectTrigger>
                    <SelectContent>
                      {staffLoading ? (
                        <div className="p-2 text-center">
                          <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                        </div>
                      ) : filteredStaff.length === 0 ? (
                        <div className="p-2 text-center text-gray-500">
                          No available staff found
                        </div>
                      ) : (
                        filteredStaff.map((staff: any) => (
                          <SelectItem key={staff.id} value={staff.id}>
                            <div className="flex items-center space-x-2">
                              <span>{staff.firstName} {staff.lastName}</span>
                              <span className="text-sm text-gray-500">({staff.email})</span>
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {/* Role Selection */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Assign Role
                  </label>
                  <Select value={selectedRole} onValueChange={setSelectedRole}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="STAFF">
                        <div className="flex items-center space-x-2">
                          <Badge className="bg-green-100 text-green-800">Staff</Badge>
                          <span className="text-sm text-gray-600">- Can register participants & scan QR codes</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="REGISTRATION_ONLY">
                        <div className="flex items-center space-x-2">
                          <Badge className="bg-cyan-100 text-cyan-800">Registration Only</Badge>
                          <span className="text-sm text-gray-600">- Can register participants only (no badge printing)</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="BADGE_PRINTER">
                        <div className="flex items-center space-x-2">
                          <Badge className="bg-amber-100 text-amber-800">Badge Printer</Badge>
                          <span className="text-sm text-gray-600">- Can print & manage badges only (no registration)</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="SUPERVISOR">
                        <div className="flex items-center space-x-2">
                          <Badge className="bg-blue-100 text-blue-800">Supervisor</Badge>
                          <span className="text-sm text-gray-600">- Can manage staff, view reports, print badges</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="MANAGER">
                        <div className="flex items-center space-x-2">
                          <Badge className="bg-purple-100 text-purple-800">Manager</Badge>
                          <span className="text-sm text-gray-600">- Full access to event settings & all features</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button 
                onClick={handleAssignStaff}
                disabled={!selectedEvent || !selectedUserId || !selectedRole || assignLoading}
                className="w-full bg-orange-600 hover:bg-orange-700"
              >
                {assignLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Assigning...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Assign Staff Member
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Current Event Staff */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center">
                  <Users className="h-5 w-5 mr-2 text-purple-600" />
                  Current Event Staff
                </span>
                <Badge variant="secondary">
                  {eventStaff.length} Staff Member{eventStaff.length !== 1 ? 's' : ''}
                </Badge>
              </CardTitle>
              <CardDescription>
                Staff members currently assigned to this event
              </CardDescription>
            </CardHeader>
            <CardContent>
              {eventStaffLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-orange-600" />
                </div>
              ) : eventStaff.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Staff Assigned</h3>
                  <p className="text-gray-600">
                    No staff members have been assigned to this event yet.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {eventStaff.map((staff: any) => (
                    <div key={staff.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-white rounded-full">
                          <User className="h-4 w-4 text-gray-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">
                            {staff.user.firstName} {staff.user.lastName}
                          </h4>
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <Mail className="h-3 w-3" />
                            <span>{staff.user.email}</span>
                          </div>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge className={getRoleColor(staff.role)}>
                              {staff.role}
                            </Badge>
                            {staff.permissions && staff.permissions.length > 0 && (
                              <span className="text-xs text-gray-500">
                                {staff.permissions.length} permission{staff.permissions.length !== 1 ? 's' : ''}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm" onClick={() => handleViewStaff(staff)}>
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        {staff.role !== 'ORGANIZER' && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-red-600 border-red-200 hover:bg-red-50"
                            disabled={removeLoading}
                            onClick={() => handleRemoveStaff(staff.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            {removeLoading ? 'Removing...' : 'Remove'}
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Staff Management Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Staff Management Best Practices</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Users className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Staff Role</h4>
                <p className="text-sm text-gray-600">
                  Can register participants and scan QR codes for check-ins
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-cyan-100 rounded-lg">
                <UserPlus className="h-4 w-4 text-cyan-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Registration Only</h4>
                <p className="text-sm text-gray-600">
                  Can register participants but cannot print badges
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <QrCode className="h-4 w-4 text-amber-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Badge Printer</h4>
                <p className="text-sm text-gray-600">
                  Can print and manage badges but cannot register participants
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <CheckCircle className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Supervisor Role</h4>
                <p className="text-sm text-gray-600">
                  Can manage staff, view reports, and print badges
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Settings className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Manager Role</h4>
                <p className="text-sm text-gray-600">
                  Full access to modify event settings and manage all aspects
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Shield className="h-4 w-4 text-orange-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Separation of Duties</h4>
                <p className="text-sm text-gray-600">
                  You can separate registration and badge printing responsibilities for better control
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Staff Detail Modal */}
      <Dialog open={showStaffModal} onOpenChange={setShowStaffModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <User className="h-5 w-5 text-blue-600" />
              <span>Staff Member Details</span>
            </DialogTitle>
            <DialogDescription>
              Comprehensive information about this staff member
            </DialogDescription>
          </DialogHeader>

          {viewingStaff && (
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center space-x-2">
                      <User className="h-4 w-4 text-blue-600" />
                      <span>Personal Information</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Full Name</label>
                      <p className="text-gray-900 font-medium">
                        {viewingStaff.user.firstName} {viewingStaff.user.lastName}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Email Address</label>
                      <div className="flex items-center space-x-2">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <p className="text-gray-900">{viewingStaff.user.email}</p>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">User ID</label>
                      <p className="text-gray-600 font-mono text-sm">{viewingStaff.user.id}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center space-x-2">
                      <Shield className="h-4 w-4 text-green-600" />
                      <span>Role & Permissions</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Current Role</label>
                      <div className="mt-1">
                        <Badge className={getRoleColor(viewingStaff.role)}>
                          {viewingStaff.role}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Permissions</label>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {getPermissionsForRole(viewingStaff.role).map((permission) => (
                          <Badge key={permission} variant="outline" className="text-xs">
                            {permission.replace('_', ' ')}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Assignment Information */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-purple-600" />
                    <span>Assignment Details</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Assigned Event</label>
                      <p className="text-gray-900 font-medium">{viewingStaff.event?.name || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Assignment Date</label>
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <p className="text-gray-900">
                          {viewingStaff.assignedAt ? format(new Date(viewingStaff.assignedAt), 'PPP') : 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {viewingStaff.assignedByUser && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Assigned By</label>
                      <p className="text-gray-900">
                        {viewingStaff.assignedByUser.firstName} {viewingStaff.assignedByUser.lastName}
                      </p>
                      <p className="text-gray-600 text-sm">{viewingStaff.assignedByUser.email}</p>
                    </div>
                  )}

                  <div>
                    <label className="text-sm font-medium text-gray-500">Status</label>
                    <div className="mt-1">
                      <Badge variant={viewingStaff.isActive ? "default" : "secondary"}>
                        {viewingStaff.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Actions */}
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <Button variant="outline" onClick={() => setShowStaffModal(false)}>
                  Close
                </Button>
                {viewingStaff.role !== 'ORGANIZER' && (
                  <Button 
                    variant="destructive" 
                    onClick={() => {
                      handleRemoveStaff(viewingStaff.id)
                      setShowStaffModal(false)
                    }}
                    disabled={removeLoading}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {removeLoading ? 'Removing...' : 'Remove Staff'}
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
