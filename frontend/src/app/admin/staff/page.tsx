'use client'

// Force dynamic rendering to prevent SSG issues with Apollo Client
export const dynamic = 'force-dynamic'
import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { 
  UserPlus, 
  Users, 
  Search, 
  Filter, 
  Crown, 
  Shield, 
  Eye, 
  Edit, 
  Trash2,
  Building,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  Mail,
  Phone,
  UserCheck,
  UserX,
  MoreHorizontal,
  Plus,
  Settings
} from 'lucide-react'
import { useAuth } from '@/hooks/use-auth-simple'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'

interface StaffMember {
  id: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  role: 'ADMIN' | 'MODERATOR' | 'USER'
  isActive: boolean
  createdAt: string
  lastLoginAt?: string
  eventAssignments: EventAssignment[]
}

interface EventAssignment {
  id: string
  eventId: string
  eventName: string
  eventDate: string
  staffRole: 'ORGANIZER' | 'COORDINATOR' | 'STAFF'
  permissions: string[]
  isActive: boolean
  assignedAt: string
  assignedBy: string
}

export default function StaffManagementPage() {
  const { user } = useAuth()
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedStaff, setSelectedStaff] = useState<string[]>([])

  // Staff data - will be loaded from GraphQL API
  const staffData: StaffMember[] = []

  // Filter and search staff
  const filteredStaff = useMemo(() => {
    return staffData.filter(staff => {
      const matchesSearch = searchTerm === '' || 
        staff.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        staff.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        staff.email.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesRole = roleFilter === 'all' || staff.role === roleFilter
      const matchesStatus = statusFilter === 'all' || 
        (statusFilter === 'active' && staff.isActive) ||
        (statusFilter === 'inactive' && !staff.isActive)

      return matchesSearch && matchesRole && matchesStatus
    })
  }, [staffData, searchTerm, roleFilter, statusFilter])

  const handleSelectStaff = (staffId: string) => {
    setSelectedStaff(prev => 
      prev.includes(staffId)
        ? prev.filter(id => id !== staffId)
        : [...prev, staffId]
    )
  }

  const handleSelectAll = () => {
    if (selectedStaff.length === filteredStaff.length) {
      setSelectedStaff([])
    } else {
      setSelectedStaff(filteredStaff.map((s: any) => s.id))
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return <Crown className="h-4 w-4 text-orange-600" />
      case 'MODERATOR':
        return <Shield className="h-4 w-4 text-blue-600" />
      case 'USER':
      default:
        return <UserCheck className="h-4 w-4 text-green-600" />
    }
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return <Badge className="bg-orange-50 text-orange-700 border-orange-200">Administrator</Badge>
      case 'MODERATOR':
        return <Badge className="bg-blue-50 text-blue-700 border-blue-200">Moderator</Badge>
      case 'USER':
      default:
        return <Badge className="bg-green-50 text-green-700 border-green-200">Staff Member</Badge>
    }
  }

  const getStatusIcon = (isActive: boolean) => {
    return isActive ? 
      <CheckCircle className="h-4 w-4 text-green-600" /> : 
      <XCircle className="h-4 w-4 text-red-600" />
  }

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? 
      <Badge className="bg-green-50 text-green-700 border-green-200">Active</Badge> :
      <Badge className="bg-red-50 text-red-700 border-red-200">Inactive</Badge>
  }

  // Check if user has admin access
  if (user?.role !== 'ADMIN') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              Only administrators can access staff management
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button asChild>
              <Link href="/admin">
                Back to Dashboard
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-blue-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center mb-8 space-y-4 lg:space-y-0">
          <div>
            <div className="inline-flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-full px-4 py-2 mb-4 animate-fade-in">
              <Building className="h-4 w-4 text-orange-600" />
              <span className="text-sm font-medium text-orange-700">Staff Management Portal</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-neutral-900 mb-4 animate-slide-in">
              <span className="bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent">
                Staff Management
              </span>
            </h1>
            <p className="text-xl text-neutral-600 animate-slide-in">
              Manage staff members, roles, and event assignments
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button asChild className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white shadow-glow hover:shadow-medium transition-all duration-300 group">
              <Link href="/admin/staff/create">
                <UserPlus className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
                Add Staff Member
              </Link>
            </Button>
            <Button asChild variant="outline" className="border-2 border-blue-200 hover:border-blue-300 hover:bg-blue-50 transition-all duration-300">
              <Link href="/admin/staff/assignments">
                <Calendar className="h-4 w-4 mr-2" />
                Manage Assignments
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-soft">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-neutral-600">Total Staff</p>
                  <p className="text-3xl font-bold text-neutral-900">{staffData.length}</p>
                </div>
                <div className="p-3 bg-orange-50 rounded-xl">
                  <Users className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-soft">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-neutral-600">Active Staff</p>
                  <p className="text-3xl font-bold text-green-600">{staffData.filter(s => s.isActive).length}</p>
                </div>
                <div className="p-3 bg-green-50 rounded-xl">
                  <UserCheck className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-soft">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-neutral-600">Administrators</p>
                  <p className="text-3xl font-bold text-orange-600">{staffData.filter(s => s.role === 'ADMIN').length}</p>
                </div>
                <div className="p-3 bg-orange-50 rounded-xl">
                  <Crown className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-soft">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-neutral-600">Event Assignments</p>
                  <p className="text-3xl font-bold text-blue-600">{staffData.reduce((acc, s) => acc + s.eventAssignments.length, 0)}</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-xl">
                  <Calendar className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="mb-8 bg-white/80 backdrop-blur-sm border-0 shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-orange-600" />
              Filters & Search
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-neutral-400" />
                <Input
                  placeholder="Search staff members..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-2 border-neutral-200 focus:border-orange-300 transition-colors"
                />
              </div>
              
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="border-2 border-neutral-200 focus:border-orange-300">
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="ADMIN">Administrator</SelectItem>
                  <SelectItem value="MODERATOR">Moderator</SelectItem>
                  <SelectItem value="USER">Staff Member</SelectItem>
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="border-2 border-neutral-200 focus:border-orange-300">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>

              <Button 
                onClick={() => {
                  setSearchTerm('')
                  setRoleFilter('all')
                  setStatusFilter('all')
                }}
                variant="outline"
                className="border-2 border-neutral-200 hover:border-orange-300 hover:bg-orange-50"
              >
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Staff List */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-soft">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-orange-600" />
                Staff Members ({filteredStaff.length})
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  onClick={handleSelectAll}
                  variant="outline"
                  size="sm"
                  className="border-2 border-neutral-200 hover:border-orange-300 hover:bg-orange-50"
                >
                  {selectedStaff.length === filteredStaff.length ? 'Deselect All' : 'Select All'}
                </Button>
                {selectedStaff.length > 0 && (
                  <Badge className="bg-orange-50 text-orange-700 border-orange-200">
                    {selectedStaff.length} selected
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredStaff.map((staff) => (
                <div
                  key={staff.id}
                  className={`p-6 rounded-xl border-2 transition-all duration-300 hover:shadow-md ${
                    selectedStaff.includes(staff.id)
                      ? 'border-orange-300 bg-orange-50/50'
                      : 'border-neutral-200 hover:border-orange-200 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <input
                        type="checkbox"
                        checked={selectedStaff.includes(staff.id)}
                        onChange={() => handleSelectStaff(staff.id)}
                        className="w-4 h-4 text-orange-600 border-2 border-neutral-300 rounded focus:ring-orange-500"
                      />
                      
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                          {staff.firstName.charAt(0)}{staff.lastName.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-neutral-900 text-lg">
                              {staff.firstName} {staff.lastName}
                            </h3>
                            {getRoleIcon(staff.role)}
                            {getStatusIcon(staff.isActive)}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-neutral-600">
                            <div className="flex items-center gap-1">
                              <Mail className="h-4 w-4" />
                              {staff.email}
                            </div>
                            {staff.phone && (
                              <div className="flex items-center gap-1">
                                <Phone className="h-4 w-4" />
                                {staff.phone}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="flex items-center gap-2 mb-2">
                          {getRoleBadge(staff.role)}
                          {getStatusBadge(staff.isActive)}
                        </div>
                        <div className="text-sm text-neutral-600">
                          {staff.eventAssignments.length} event{staff.eventAssignments.length !== 1 ? 's' : ''}
                        </div>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm" className="border-2 border-neutral-200 hover:border-orange-300">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/staff/${staff.id}`}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/staff/${staff.id}/edit`}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Staff
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/staff/${staff.id}/assignments`}>
                              <Calendar className="h-4 w-4 mr-2" />
                              Manage Assignments
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => toast.success(`${staff.isActive ? 'Deactivated' : 'Activated'} ${staff.firstName} ${staff.lastName}`)}
                            className={staff.isActive ? 'text-red-600' : 'text-green-600'}
                          >
                            {staff.isActive ? <UserX className="h-4 w-4 mr-2" /> : <UserCheck className="h-4 w-4 mr-2" />}
                            {staff.isActive ? 'Deactivate' : 'Activate'}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {/* Event Assignments */}
                  {staff.eventAssignments.length > 0 && (
                    <>
                      <Separator className="my-4" />
                      <div>
                        <h4 className="font-medium text-neutral-900 mb-3 flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-blue-600" />
                          Event Assignments ({staff.eventAssignments.length})
                        </h4>
                        <div className="grid md:grid-cols-2 gap-3">
                          {staff.eventAssignments.map((assignment) => (
                            <div
                              key={assignment.id}
                              className="p-3 bg-blue-50 rounded-lg border border-blue-200"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <h5 className="font-medium text-blue-900">{assignment.eventName}</h5>
                                <Badge className="bg-blue-100 text-blue-800 text-xs">
                                  {assignment.staffRole}
                                </Badge>
                              </div>
                              <div className="text-sm text-blue-700">
                                <p>Date: {new Date(assignment.eventDate).toLocaleDateString()}</p>
                                <p>Permissions: {assignment.permissions.length}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))}

              {filteredStaff.length === 0 && (
                <div className="text-center py-12">
                  <Users className="h-16 w-16 text-neutral-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-neutral-900 mb-2">No staff members found</h3>
                  <p className="text-neutral-600 mb-4">
                    {searchTerm || roleFilter !== 'all' || statusFilter !== 'all'
                      ? 'Try adjusting your search or filters'
                      : 'Get started by adding your first staff member'
                    }
                  </p>
                  <Button asChild className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600">
                    <Link href="/admin/staff/create">
                      <UserPlus className="h-4 w-4 mr-2" />
                      Add Staff Member
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
