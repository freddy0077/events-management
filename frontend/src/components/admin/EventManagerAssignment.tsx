'use client'

import React, { useState } from 'react'
import { 
  useEvents, 
  useAvailableEventManagers, 
  useEventManagers, 
  useAssignEventManager, 
  useRemoveEventManager 
} from '@/lib/graphql/hooks'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, UserPlus, UserMinus, Calendar, Users } from 'lucide-react'
import { toast } from 'sonner'

interface EventManagerAssignmentProps {
  className?: string
}

export default function EventManagerAssignment({ className }: EventManagerAssignmentProps) {
  const [selectedEventId, setSelectedEventId] = useState<string>('')
  const [selectedManagerId, setSelectedManagerId] = useState<string>('')
  const [isAssigning, setIsAssigning] = useState(false)

  // GraphQL hooks
  const { data: eventsData, loading: eventsLoading } = useEvents()
  const { data: managersData, loading: managersLoading } = useAvailableEventManagers()
  const { data: eventManagersData, loading: eventManagersLoading, refetch: refetchEventManagers } = useEventManagers(selectedEventId)
  const [assignEventManager] = useAssignEventManager()
  const [removeEventManager] = useRemoveEventManager()

  const events = eventsData?.events || []
  const availableManagers = (managersData as any)?.availableEventManagers || []
  const currentEventManagers = (eventManagersData as any)?.eventManagers || []

  const handleAssignManager = async () => {
    if (!selectedEventId || !selectedManagerId) {
      toast.error('Please select both an event and an event manager')
      return
    }

    setIsAssigning(true)
    try {
      await assignEventManager({
        variables: {
          eventId: selectedEventId,
          userId: selectedManagerId
        }
      })
      
      toast.success('Event manager assigned successfully!')
      setSelectedManagerId('')
      refetchEventManagers()
    } catch (error: any) {
      console.error('Error assigning event manager:', error)
      toast.error(error.message || 'Failed to assign event manager')
    } finally {
      setIsAssigning(false)
    }
  }

  const handleRemoveManager = async (userId: string, userName: string) => {
    if (!selectedEventId) return

    try {
      await removeEventManager({
        variables: {
          eventId: selectedEventId,
          userId: userId
        }
      })
      
      toast.success(`${userName} removed from event management`)
      refetchEventManagers()
    } catch (error: any) {
      console.error('Error removing event manager:', error)
      toast.error(error.message || 'Failed to remove event manager')
    }
  }

  const getManagerName = (manager: any) => {
    return `${manager.firstName} ${manager.lastName}`.trim() || manager.email
  }

  const selectedEvent = events.find(event => event.id === selectedEventId)

  if (eventsLoading || managersLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading...</span>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex items-center space-x-2">
        <Users className="h-6 w-6" />
        <h2 className="text-2xl font-bold">Event Manager Assignment</h2>
      </div>

      {/* Event Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>Select Event</span>
          </CardTitle>
          <CardDescription>
            Choose an event to manage event manager assignments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedEventId} onValueChange={setSelectedEventId}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select an event..." />
            </SelectTrigger>
            <SelectContent>
              {events.map((event) => (
                <SelectItem key={event.id} value={event.id}>
                  <div className="flex flex-col">
                    <span className="font-medium">{event.name}</span>
                    <span className="text-sm text-muted-foreground">
                      {new Date(event.date).toLocaleDateString()}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Current Event Managers */}
      {selectedEventId && (
        <Card>
          <CardHeader>
            <CardTitle>Current Event Managers</CardTitle>
            <CardDescription>
              Event managers assigned to {selectedEvent?.name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {eventManagersLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="ml-2">Loading event managers...</span>
              </div>
            ) : currentEventManagers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No event managers assigned to this event yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {currentEventManagers.map((assignment: any) => (
                  <div key={assignment.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div>
                        <p className="font-medium">{getManagerName(assignment.user)}</p>
                        <p className="text-sm text-muted-foreground">{assignment.user.email}</p>
                      </div>
                      <Badge variant="secondary">{assignment.role}</Badge>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-muted-foreground">
                        Assigned {new Date(assignment.assignedAt).toLocaleDateString()}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveManager(assignment.user.id, getManagerName(assignment.user))}
                        className="text-red-600 hover:text-red-700"
                      >
                        <UserMinus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Assign New Manager */}
      {selectedEventId && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <UserPlus className="h-5 w-5" />
              <span>Assign New Event Manager</span>
            </CardTitle>
            <CardDescription>
              Select an available event manager to assign to this event
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select value={selectedManagerId} onValueChange={setSelectedManagerId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select an event manager..." />
              </SelectTrigger>
              <SelectContent>
                {availableManagers
                  .filter((manager: any) => 
                    !currentEventManagers.some((assignment: any) => assignment.user.id === manager.id)
                  )
                  .map((manager: any) => (
                    <SelectItem key={manager.id} value={manager.id}>
                      <div className="flex flex-col">
                        <span className="font-medium">{getManagerName(manager)}</span>
                        <span className="text-sm text-muted-foreground">{manager.email}</span>
                      </div>
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            
            <Button 
              onClick={handleAssignManager}
              disabled={!selectedManagerId || isAssigning}
              className="w-full"
            >
              {isAssigning ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Assigning...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Assign Event Manager
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Available Managers Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Available Event Managers</CardTitle>
          <CardDescription>
            All users with EVENT_ORGANIZER role available for assignment
          </CardDescription>
        </CardHeader>
        <CardContent>
          {availableManagers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No event managers available.</p>
              <p className="text-sm">Create users with EVENT_ORGANIZER role to assign them to events.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {availableManagers.map((manager: any) => (
                <div key={manager.id} className="p-3 border rounded-lg">
                  <p className="font-medium">{getManagerName(manager)}</p>
                  <p className="text-sm text-muted-foreground">{manager.email}</p>
                  <Badge variant="outline" className="mt-1">{manager.role}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
