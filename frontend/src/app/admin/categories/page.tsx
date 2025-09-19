"use client"

import { useState, useMemo } from 'react'
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff, 
  Users, 
  DollarSign,
  Filter,
  MoreHorizontal,
  AlertTriangle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { useCategories, useCategoriesByEvent, useEvents, useCreateCategory, useUpdateCategory, useDeleteCategory, useToggleCategoryStatus } from '@/lib/graphql/hooks'
import { formatCurrency, formatDate } from '@/lib/utils'
import { toast } from 'sonner'

interface Category {
  id: string
  eventId: string
  name: string
  description?: string
  price: number
  maxCapacity?: number
  isActive: boolean
  createdAt: string
  updatedAt: string
  currentCount: number
}

interface CategoryFormData {
  eventId: string
  name: string
  description: string
  price: number
  maxCapacity?: number
  isActive: boolean
}

export default function CategoriesPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [selectedEventId, setSelectedEventId] = useState<string>('')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [formData, setFormData] = useState<CategoryFormData>({
    eventId: '',
    name: '',
    description: '',
    price: 0,
    maxCapacity: undefined,
    isActive: true
  })

  // GraphQL hooks
  const { data: eventsData, loading: eventsLoading } = useEvents()
  const { data: categoriesData, loading, error, refetch } = useCategoriesByEvent(selectedEventId)
  const [createCategory, { loading: createLoading }] = useCreateCategory()
  const [updateCategory, { loading: updateLoading }] = useUpdateCategory()
  const [deleteCategory, { loading: deleteLoading }] = useDeleteCategory()
  const [toggleCategoryStatus] = useToggleCategoryStatus()

  const events = (eventsData as any)?.events || []
  const categories = (categoriesData as any)?.categoriesByEvent || []

  // Filtered categories
  const filteredCategories = useMemo(() => {
    return categories.filter((category: any) => {
      const matchesSearch = category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           category.description?.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesStatus = statusFilter === 'all' || 
                           (statusFilter === 'active' && category.isActive) ||
                           (statusFilter === 'inactive' && !category.isActive)
      
      return matchesSearch && matchesStatus
    })
  }, [categories, searchTerm, statusFilter])

  // Statistics
  const stats = useMemo(() => {
    const total = categories.length
    const active = categories.filter((c: any) => c.isActive).length
    const inactive = total - active
    const totalRegistrations = categories.reduce((sum: number, c: any) => sum + (c.currentCount || 0), 0)
    
    return { total, active, inactive, totalRegistrations }
  }, [categories])

  // Form handlers
  const resetForm = () => {
    setFormData({
      eventId: selectedEventId,
      name: '',
      description: '',
      price: 0,
      maxCapacity: undefined,
      isActive: true
    })
    setSelectedCategory(null)
  }

  const handleCreate = async () => {
    if (!selectedEventId) {
      toast.error('Please select an event first')
      return
    }

    try {
      await createCategory({
        variables: {
          input: {
            eventId: selectedEventId,
            name: formData.name,
            description: formData.description || null,
            price: formData.price,
            maxCapacity: formData.maxCapacity || null,
            isActive: formData.isActive
          }
        }
      })
      
      toast.success('Category created successfully!')
      setIsCreateDialogOpen(false)
      resetForm()
      refetch()
    } catch (error) {
      toast.error('Failed to create category')
      console.error('Create category error:', error)
    }
  }

  const handleEdit = (category: Category) => {
    setSelectedCategory(category)
    setFormData({
      eventId: category.eventId,
      name: category.name,
      description: category.description || '',
      price: category.price,
      maxCapacity: category.maxCapacity,
      isActive: category.isActive
    })
    setIsEditDialogOpen(true)
  }

  const handleUpdate = async () => {
    if (!selectedCategory) return

    try {
      await updateCategory({
        variables: {
          id: selectedCategory.id,
          input: {
            name: formData.name,
            description: formData.description || null,
            price: formData.price,
            maxCapacity: formData.maxCapacity || null,
            isActive: formData.isActive
          }
        }
      })
      
      toast.success('Category updated successfully!')
      setIsEditDialogOpen(false)
      resetForm()
      refetch()
    } catch (error) {
      toast.error('Failed to update category')
      console.error('Update category error:', error)
    }
  }

  const handleDelete = async () => {
    if (!selectedCategory) return

    try {
      await deleteCategory({
        variables: { id: selectedCategory.id }
      })
      
      toast.success('Category deleted successfully!')
      setIsDeleteDialogOpen(false)
      resetForm()
      refetch()
    } catch (error) {
      toast.error('Failed to delete category')
      console.error('Delete category error:', error)
    }
  }

  const handleToggleStatus = async (category: Category) => {
    try {
      await toggleCategoryStatus({
        variables: { id: category.id }
      })
      
      toast.success(`Category ${category.isActive ? 'deactivated' : 'activated'} successfully!`)
      refetch()
    } catch (error) {
      toast.error('Failed to toggle category status')
      console.error('Toggle status error:', error)
    }
  }

  const openDeleteDialog = (category: Category) => {
    setSelectedCategory(category)
    setIsDeleteDialogOpen(true)
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          <Skeleton className="h-96" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-red-600">
              <AlertTriangle className="h-12 w-12 mx-auto mb-4" />
              <p>Failed to load categories. Please try again.</p>
              <Button onClick={() => refetch()} className="mt-4">
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Categories</h1>
            <p className="text-muted-foreground">
              Manage event registration categories and pricing
            </p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm} disabled={!selectedEventId}>
                <Plus className="h-4 w-4 mr-2" />
                Create Category
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Category</DialogTitle>
                <DialogDescription>
                  Add a new registration category with pricing information.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Standard, VIP, Student"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Optional description of the category"
                    rows={3}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="price">Price *</Label>
                  <Input
                    id="price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                    placeholder="0.00"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="maxCapacity">Max Capacity</Label>
                  <Input
                    id="maxCapacity"
                    type="number"
                    min="1"
                    value={formData.maxCapacity || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, maxCapacity: e.target.value ? parseInt(e.target.value) : undefined }))}
                    placeholder="Optional maximum number of registrations"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
                  />
                  <Label htmlFor="isActive">Active</Label>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreate} 
                  disabled={createLoading || !formData.name.trim()}
                >
                  {createLoading ? 'Creating...' : 'Create Category'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Event Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Select Event</CardTitle>
            <CardDescription>
              Choose an event to manage its categories
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={selectedEventId} onValueChange={setSelectedEventId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select an event..." />
              </SelectTrigger>
              <SelectContent>
                {events.map((event: any) => (
                  <SelectItem key={event.id} value={event.id}>
                    {event.name} - {formatDate(event.date)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!selectedEventId && (
              <p className="text-sm text-muted-foreground mt-2">
                Please select an event to view and manage its categories.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active</CardTitle>
              <Eye className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Inactive</CardTitle>
              <EyeOff className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-500">{stats.inactive}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Registrations</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.totalRegistrations}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Categories</CardTitle>
            <CardDescription>
              Manage your event registration categories
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search categories..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={(value: 'all' | 'active' | 'inactive') => setStatusFilter(value)}>
                <SelectTrigger className="w-40">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active Only</SelectItem>
                  <SelectItem value="inactive">Inactive Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Categories Table */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Registrations</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCategories.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        {searchTerm || statusFilter !== 'all' ? 'No categories match your filters' : 'No categories created yet'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredCategories.map((category: any) => (
                      <TableRow key={category.id}>
                        <TableCell className="font-medium">{category.name}</TableCell>
                        <TableCell className="max-w-xs truncate">
                          {category.description || <span className="text-muted-foreground">No description</span>}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <DollarSign className="h-4 w-4 mr-1" />
                            {formatCurrency(category.price)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={category.isActive ? 'default' : 'secondary'}>
                            {category.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Users className="h-4 w-4 mr-1" />
                            {category.currentCount || 0}
                          </div>
                        </TableCell>
                        <TableCell>{formatDate(category.createdAt)}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => handleEdit(category)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleToggleStatus(category)}>
                                {category.isActive ? (
                                  <>
                                    <EyeOff className="h-4 w-4 mr-2" />
                                    Deactivate
                                  </>
                                ) : (
                                  <>
                                    <Eye className="h-4 w-4 mr-2" />
                                    Activate
                                  </>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => openDeleteDialog(category)}
                                className="text-red-600"
                                disabled={(category.currentCount || 0) > 0}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Category</DialogTitle>
              <DialogDescription>
                Update the category information and pricing.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-name">Name *</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Standard, VIP, Student"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Optional description of the category"
                  rows={3}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-price">Price *</Label>
                <Input
                  id="edit-price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                  placeholder="0.00"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="edit-isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
                />
                <Label htmlFor="edit-isActive">Active</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleUpdate} 
                disabled={updateLoading || !formData.name.trim()}
              >
                {updateLoading ? 'Updating...' : 'Update Category'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Category</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete "{selectedCategory?.name}"? This action cannot be undone.
                {(selectedCategory?.currentCount || 0) > 0 && (
                  <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md">
                    <div className="flex items-center">
                      <AlertTriangle className="h-4 w-4 text-red-600 mr-2" />
                      <span className="text-red-800 text-sm">
                        This category has {selectedCategory && selectedCategory.currentCount || 0} registration(s) and cannot be deleted.
                      </span>
                    </div>
                  </div>
                )}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleDelete} 
                disabled={deleteLoading || (selectedCategory?.currentCount || 0) > 0}
              >
                {deleteLoading ? 'Deleting...' : 'Delete Category'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
