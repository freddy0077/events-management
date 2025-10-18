'use client'

import React, { useState, useMemo, useRef, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Plus, Trash2, UserPlus, Settings, Loader2, AlertCircle, Info, Search, ChevronDown, UserCheck, Eye, EyeOff } from 'lucide-react'
import { StepProps } from './types'
import { useAvailableEventManagers, useSearchEventManagers, useRegisterUser } from '@/lib/graphql/hooks'
import { GetAvailableEventManagersVariables } from '@/lib/graphql/types'
import { toast } from 'sonner'

export function OrganizersStep({ formData, setFormData, errors, setErrors }: StepProps) {
  // Get all available managers for displaying assigned ones
  const { data: availableManagersData, loading: managersLoading } = useAvailableEventManagers()
  const availableManagers = (availableManagersData as any)?.availableEventManagers || []
  
  // Search functionality for EVENT_ORGANIZER users
  const [searchEventManagers, { data: searchData, loading: searchLoading }] = useSearchEventManagers()
  const searchResults = (searchData as any)?.availableEventManagers || []
  
  // Search state for suggestion box
  const [searchQuery, setSearchQuery] = useState('')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  
  // New organizer form state
  const [newOrganizerForm, setNewOrganizerForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isCreatingOrganizer, setIsCreatingOrganizer] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  
  // Register user mutation
  const [registerUser] = useRegisterUser()
  
  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim().length > 0) {
        searchEventManagers({
          variables: { searchQuery: searchQuery.trim() }
        })
        setIsDropdownOpen(true)
      } else {
        setIsDropdownOpen(false)
      }
    }, 300) // 300ms debounce

    return () => clearTimeout(timeoutId)
  }, [searchQuery, searchEventManagers])
  
  // Filter search results to exclude already assigned organizers
  const filteredSuggestions = useMemo(() => {
    return searchResults.filter((manager: any) => 
      !formData.assignedOrganizers.includes(manager.id)
    )
  }, [searchResults, formData.assignedOrganizers])
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
          searchInputRef.current && !searchInputRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
        setHighlightedIndex(-1)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const addEventOrganizer = (organizerId: string) => {
    if (!formData.assignedOrganizers.includes(organizerId)) {
      setFormData(prev => ({
        ...prev,
        assignedOrganizers: [...prev.assignedOrganizers, organizerId]
      }))
      // Clear search after adding
      setSearchQuery('')
      setIsDropdownOpen(false)
      setHighlightedIndex(-1)
    }
  }
  
  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isDropdownOpen || filteredSuggestions.length === 0) return
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setHighlightedIndex(prev => 
          prev < filteredSuggestions.length - 1 ? prev + 1 : 0
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setHighlightedIndex(prev => 
          prev > 0 ? prev - 1 : filteredSuggestions.length - 1
        )
        break
      case 'Enter':
        e.preventDefault()
        if (highlightedIndex >= 0 && highlightedIndex < filteredSuggestions.length) {
          addEventOrganizer(filteredSuggestions[highlightedIndex].id)
        }
        break
      case 'Escape':
        setIsDropdownOpen(false)
        setHighlightedIndex(-1)
        break
    }
  }
  
  // Handle search input changes
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchQuery(value)
    setIsDropdownOpen(value.trim().length > 0)
    setHighlightedIndex(-1)
  }

  const removeEventOrganizer = (organizerId: string) => {
    setFormData(prev => ({
      ...prev,
      assignedOrganizers: prev.assignedOrganizers.filter(id => id !== organizerId)
    }))
  }

  // New organizer form handlers
  const handleNewOrganizerFormChange = (field: string, value: string) => {
    setNewOrganizerForm(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const validateNewOrganizerForm = () => {
    const errors: string[] = []
    
    if (!newOrganizerForm.firstName.trim()) errors.push('First name is required')
    if (!newOrganizerForm.lastName.trim()) errors.push('Last name is required')
    if (!newOrganizerForm.email.trim()) errors.push('Email is required')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newOrganizerForm.email)) errors.push('Invalid email format')
    if (!newOrganizerForm.password) errors.push('Password is required')
    if (newOrganizerForm.password.length < 8) errors.push('Password must be at least 8 characters')
    if (newOrganizerForm.password !== newOrganizerForm.confirmPassword) errors.push('Passwords do not match')
    
    // Check if email already exists in available managers
    const emailExists = availableManagers.some((manager: any) => 
      manager.email.toLowerCase() === newOrganizerForm.email.toLowerCase()
    )
    if (emailExists) errors.push('A user with this email already exists')
    
    return errors
  }

  const handleCreateNewOrganizer = async () => {
    const validationErrors = validateNewOrganizerForm()
    if (validationErrors.length > 0) {
      toast.error(validationErrors[0])
      return
    }
    setIsCreatingOrganizer(true)
    try {
      const result = await registerUser({
        variables: {
          input: {
            email: newOrganizerForm.email.trim(),
            firstName: newOrganizerForm.firstName.trim(),
            lastName: newOrganizerForm.lastName.trim(),
            password: newOrganizerForm.password.trim(),
            role: 'EVENT_ORGANIZER',
            mustChangePassword: true
          }
        }
      }) as any

      if (result.data?.registerUser?.success && result.data?.registerUser?.user) {
        const newUser = result.data.registerUser.user
        toast.success(`New organizer "${newOrganizerForm.firstName.trim()} ${newOrganizerForm.lastName.trim()}" created and assigned successfully!`)
        
        // Immediately add the new organizer to the assigned list
        setFormData(prev => ({
          ...prev,
          assignedOrganizers: [...prev.assignedOrganizers, newUser.id]
        }))
        
        // Reset form and close modal
        resetNewOrganizerForm()
        setIsModalOpen(false)
        
        // Clear search to close dropdown
        setSearchQuery('')
        setIsDropdownOpen(false)
        setHighlightedIndex(-1)
        
      } else {
        throw new Error(result.data?.registerUser?.message || 'Failed to create organizer')
      }
    } catch (error: any) {
      console.error('Create organizer error:', error)
      toast.error(error.message || 'Failed to create organizer. Please try again.')
    } finally {
      setIsCreatingOrganizer(false)
    }
  }

  const resetNewOrganizerForm = () => {
    setNewOrganizerForm({
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: ''
    })
    setShowPassword(false)
    setShowConfirmPassword(false)
  }

  return (
    <Card className="bg-gradient-to-br from-indigo-50 to-blue-50 border-2 border-indigo-200 shadow-xl">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-100 rounded-xl">
            <UserPlus className="h-6 w-6 text-indigo-600" />
          </div>
          <div>
            <CardTitle className="text-xl text-indigo-800">Event Organizers</CardTitle>
            <CardDescription className="text-indigo-600">
              Assign event organizers to manage this event
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Loading State */}
        {managersLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center space-x-2">
              <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
              <span className="text-indigo-700">Loading available organizers...</span>
            </div>
          </div>
        ) : (
          <>
            {/* Add Organizers - Suggestion Box */}
            <div className="space-y-4">
              <Label className="text-base font-semibold text-indigo-800">Add Event Organizers</Label>
              
              {/* Search Input with Suggestion Dropdown */}
              <div className="relative">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-indigo-400" />
                  <Input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search organizers by name or email..."
                    value={searchQuery}
                    onChange={handleSearchChange}
                    onKeyDown={handleKeyDown}
                    onFocus={() => searchQuery.trim().length > 0 && setIsDropdownOpen(true)}
                    className="pl-10 pr-10 border-indigo-200 focus:border-indigo-400 focus:ring-indigo-400"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('')
                        setIsDropdownOpen(false)
                        setHighlightedIndex(-1)
                      }}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-indigo-400 hover:text-indigo-600"
                    >
                      ×
                    </button>
                  )}
                </div>
                
                {/* Enhanced Suggestion Dropdown with Create Option */}
                {isDropdownOpen && (
                  <div 
                    ref={dropdownRef}
                    className="absolute z-50 w-full mt-1 bg-white border border-indigo-200 rounded-lg shadow-lg max-h-60 overflow-y-auto"
                  >
                    {searchLoading ? (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="h-4 w-4 animate-spin text-indigo-600 mr-2" />
                        <span className="text-sm text-indigo-700">Loading...</span>
                      </div>
                    ) : (
                      <>
                        {/* Existing organizers */}
                        {filteredSuggestions.map((manager: any, index: any) => (
                          <div
                            key={manager.id}
                            onClick={() => addEventOrganizer(manager.id)}
                            className={`px-4 py-3 cursor-pointer border-b border-indigo-50 transition-colors ${
                              index === highlightedIndex 
                                ? 'bg-indigo-50 text-indigo-900' 
                                : 'hover:bg-indigo-25 text-indigo-800'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium text-sm">{manager.firstName} {manager.lastName}</p>
                                <p className="text-xs text-indigo-600">{manager.email}</p>
                              </div>
                              <Plus className="h-4 w-4 text-indigo-500" />
                            </div>
                          </div>
                        ))}
                        
                        {/* Create New Organizer Option - Only show when search returns no results */}
                        {filteredSuggestions.length === 0 && searchQuery.trim().length > 0 && (
                          <div 
                            className="px-4 py-3 cursor-pointer hover:bg-green-50 text-green-800 border-t border-green-100"
                            onClick={() => {
                              setIsModalOpen(true)
                              setIsDropdownOpen(false)
                            }}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium text-sm flex items-center gap-2">
                                  <UserCheck className="h-4 w-4" />
                                  Create New Organizer
                                </p>
                                <p className="text-xs text-green-600">
                                  {searchQuery ? `Create "${searchQuery}" as new organizer` : 'Add a new event organizer'}
                                </p>
                              </div>
                              <Plus className="h-4 w-4 text-green-500" />
                            </div>
                          </div>
                        )}
                        
                        {filteredSuggestions.length === 0 && !searchQuery.trim() && (
                          <div className="px-4 py-3 text-sm text-indigo-600">
                            Start typing to search for organizers
                          </div>
                        )}
                        
                        {filteredSuggestions.length === 0 && searchQuery.trim().length > 0 && availableManagers.length === 0 && (
                          <div className="px-4 py-3 text-sm text-indigo-600">
                            No EVENT_ORGANIZER users found in the system
                          </div>
                        )}
                        
                        {filteredSuggestions.length === 10 && (
                          <div className="px-4 py-2 text-xs text-indigo-500 bg-indigo-25 border-t border-indigo-100">
                            Showing first 10 results. Type more to narrow down.
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Assigned Organizers */}
            {formData.assignedOrganizers.length > 0 && (
              <div className="space-y-4 mt-8 pt-6 border-t border-indigo-200">
                <Label className="text-base font-semibold text-indigo-800">
                  Assigned Event Organizers ({formData.assignedOrganizers.length})
                </Label>
                <div className="space-y-3">
                  {formData.assignedOrganizers.map((organizerId) => {
                    const organizer = availableManagers.find((m: any) => m.id === organizerId)
                    if (!organizer) return null
                    
                    return (
                      <div key={organizerId} className="flex items-center justify-between p-4 bg-indigo-50 border border-indigo-200 rounded-xl">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-indigo-100 rounded-lg">
                            <UserPlus className="h-4 w-4 text-indigo-600" />
                          </div>
                          <div>
                            <p className="font-medium text-sm text-indigo-900">{organizer.firstName} {organizer.lastName}</p>
                            <p className="text-xs text-indigo-700">{organizer.email}</p>
                          </div>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => removeEventOrganizer(organizerId)}
                          className="text-red-600 border-red-200 hover:bg-red-50"
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Remove
                        </Button>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* No Assigned Organizers Message */}
            {formData.assignedOrganizers.length === 0 && (
              <div className="text-center py-8 bg-white/50 border border-indigo-200 rounded-xl mt-8">
                <UserPlus className="h-12 w-12 text-indigo-400 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-indigo-800 mb-2">No Organizers Assigned</h3>
                <p className="text-indigo-600 mb-4">
                  Search for existing organizers above, or create new ones when no results are found.
                </p>
              </div>
            )}

            {/* Organizer Permissions Info */}
            <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200 p-6 rounded-xl mt-6">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <Settings className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-indigo-800 mb-2">Event Organizer Permissions</h4>
                  <ul className="text-sm text-indigo-700 space-y-1">
                    <li>• Manage only this assigned event</li>
                    <li>• View and manage registrations for this event</li>
                    <li>• Assign staff to this event (non-organizer roles only)</li>
                    <li>• Access event-specific reports and QR scanner</li>
                    <li>• Cannot create new events or access other events</li>
                  </ul>
                </div>
              </div>
            </div>


          </>
        )}
      </CardContent>
      
      {/* Create New Organizer Modal - Outside dropdown to avoid z-index issues */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-indigo-600" />
              Create New Event Organizer
            </DialogTitle>
            <DialogDescription>
              Create a new user with EVENT_ORGANIZER role who can manage this event.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="modal-firstName" className="text-sm font-medium">First Name *</Label>
                <Input
                  id="modal-firstName"
                  type="text"
                  placeholder="Enter first name"
                  value={newOrganizerForm.firstName}
                  onChange={(e) => handleNewOrganizerFormChange('firstName', e.target.value)}
                  className="border-indigo-200 focus:border-indigo-400 focus:ring-indigo-400"
                  autoFocus
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="modal-lastName" className="text-sm font-medium">Last Name *</Label>
                <Input
                  id="modal-lastName"
                  type="text"
                  placeholder="Enter last name"
                  value={newOrganizerForm.lastName}
                  onChange={(e) => handleNewOrganizerFormChange('lastName', e.target.value)}
                  className="border-indigo-200 focus:border-indigo-400 focus:ring-indigo-400"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="modal-email" className="text-sm font-medium">Email Address *</Label>
              <Input
                id="modal-email"
                type="email"
                placeholder="Enter email address"
                value={newOrganizerForm.email}
                onChange={(e) => handleNewOrganizerFormChange('email', e.target.value)}
                className="border-indigo-200 focus:border-indigo-400 focus:ring-indigo-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="modal-password" className="text-sm font-medium">Password *</Label>
                <div className="relative">
                  <Input
                    id="modal-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Min 8 characters"
                    value={newOrganizerForm.password}
                    onChange={(e) => handleNewOrganizerFormChange('password', e.target.value)}
                    className="pr-10 border-indigo-200 focus:border-indigo-400 focus:ring-indigo-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-indigo-400 hover:text-indigo-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="modal-confirmPassword" className="text-sm font-medium">Confirm Password *</Label>
                <div className="relative">
                  <Input
                    id="modal-confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm password"
                    value={newOrganizerForm.confirmPassword}
                    onChange={(e) => handleNewOrganizerFormChange('confirmPassword', e.target.value)}
                    className="pr-10 border-indigo-200 focus:border-indigo-400 focus:ring-indigo-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-indigo-400 hover:text-indigo-600"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 text-blue-600 mt-0.5" />
                <div className="text-xs text-blue-800">
                  <p className="font-medium mb-1">New organizer will:</p>
                  <ul className="space-y-0.5 text-blue-700">
                    <li>• Have EVENT_ORGANIZER role</li>
                    <li>• Must change password on first login</li>
                    <li>• Be automatically assigned to this event</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button
                type="button"
                onClick={handleCreateNewOrganizer}
                disabled={isCreatingOrganizer}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                {isCreatingOrganizer ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <UserCheck className="h-4 w-4 mr-2" />
                    Create & Assign
                  </>
                )}
              </Button>
              
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsModalOpen(false)
                  resetNewOrganizerForm()
                }}
                disabled={isCreatingOrganizer}
                className="border-indigo-200 text-indigo-600 hover:bg-indigo-50"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
