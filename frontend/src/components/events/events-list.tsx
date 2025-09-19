'use client'

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatDate, formatCurrency } from '@/lib/utils'
import { Calendar, MapPin, Users, Clock, Loader2, QrCode, ArrowRight, Star } from 'lucide-react'
import Link from 'next/link'
import { useEvents } from '@/lib/graphql/hooks'


export function EventsList() {
  const { data, loading, error } = useEvents()

  // Use GraphQL data if available, otherwise fallback to mock data
  const events = (data as any)?.events

  if (loading) {
    return (
      <section id="events" className="py-16">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-full px-4 py-2 mb-6">
            <Calendar className="h-4 w-4 text-orange-600" />
            <span className="text-sm font-medium text-orange-700">Featured Events</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-neutral-900 mb-6 animate-slide-in">
            Discover Amazing
            <span className="block text-orange-600">
              Events
            </span>
          </h2>
          <p className="text-xl text-neutral-600 max-w-3xl mx-auto animate-slide-in">
            Join thousands of participants in exciting events with seamless QR code registration
          </p>
        </div>
        <div className="flex justify-center items-center py-16">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-orange-600 mx-auto mb-4" />
            <span className="text-lg text-neutral-600">Loading amazing events...</span>
          </div>
        </div>
      </section>
    )
  }

  if (error) {
    console.error('Error loading events:', error)
    // Continue with mock data on error
  }

  return (
    <section id="events" className="py-16">
      <div className="text-center mb-16">
        <div className="inline-flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-full px-4 py-2 mb-6">
          <Calendar className="h-4 w-4 text-orange-600" />
          <span className="text-sm font-medium text-orange-700">Featured Events</span>
        </div>
        <h2 className="text-4xl md:text-5xl font-bold text-neutral-900 mb-6 animate-slide-in">
          Discover Amazing
          <span className="block text-orange-600">
            Events
          </span>
        </h2>
        <p className="text-xl text-neutral-600 max-w-3xl mx-auto animate-slide-in">
          Join thousands of participants in exciting events with seamless QR code registration
        </p>
        <div className="mt-8">
          <Button asChild size="lg" variant="outline" className="border-2 border-orange-300 hover:bg-orange-50 text-orange-700 hover:text-orange-800">
            <Link href="/events">
              View All Events
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {events.map((event: any) => (
          <Card key={event.id} className="group event-card overflow-hidden bg-white/80 backdrop-blur-sm border-0 shadow-soft hover:shadow-medium transition-all duration-300 hover:-translate-y-1 animate-scale-in">
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-3 h-3 bg-gradient-to-r from-success-500 to-success-600 rounded-full animate-pulse-glow"></div>
                    <Badge variant={event.status === 'ACTIVE' || event.isActive ? 'default' : 'secondary'} 
                           className={`${event.status === 'ACTIVE' || event.isActive ? 'bg-success-50 text-success-700 border-success-200' : ''}`}>
                      {event.status === 'ACTIVE' || event.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <CardTitle className="text-xl mb-3 text-gray-900 group-hover:text-orange-700 transition-colors">
                    {event.name}
                  </CardTitle>
                  <CardDescription className="text-sm line-clamp-2 text-neutral-600">
                    {event.description}
                  </CardDescription>
                </div>
                <div className="ml-4 p-2 bg-orange-50 rounded-xl group-hover:bg-orange-100 transition-colors">
                  <QrCode className="h-5 w-5 text-orange-600" />
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4 pb-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center text-sm text-neutral-600">
                  <Calendar className="h-4 w-4 mr-2 text-orange-500" />
                  <span className="truncate">{formatDate(event.date)}</span>
                </div>
                
                <div className="flex items-center text-sm text-neutral-600">
                  <Clock className="h-4 w-4 mr-2 text-primary-500" />
                  <span className="truncate">All Day</span>
                </div>
              </div>
              
              <div className="flex items-center text-sm text-neutral-600">
                <MapPin className="h-4 w-4 mr-2 text-warning-500" />
                <span className="truncate">{event.venue}</span>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center text-neutral-600">
                  <Users className="h-4 w-4 mr-2 text-success-500" />
                  <span>{event.approvedRegistrations} / {event.maxCapacity}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 text-warning-400 fill-current" />
                  <span className="text-neutral-600 text-xs">4.8</span>
                </div>
              </div>

              <div className="bg-neutral-50 rounded-xl p-4 space-y-2">
                <h4 className="font-semibold text-sm text-neutral-800">Ticket Categories</h4>
                {event.categories?.slice(0, 2).map((category: any) => (
                  <div key={category.id} className="flex justify-between items-center text-sm">
                    <span className="text-neutral-600">{category.name}</span>
                    <span className="font-semibold text-orange-700">{formatCurrency(category.price)}</span>
                  </div>
                )) || (
                  <div className="text-sm text-neutral-500">No categories available</div>
                )}
                {(event.categories?.length || 0) > 2 && (
                  <div className="text-xs text-neutral-500">+{(event.categories?.length || 0) - 2} more categories</div>
                )}
              </div>
            </CardContent>

            <CardFooter className="flex gap-3 pt-0">
              <Button asChild className="flex-1 bg-orange-600 hover:bg-orange-700 text-white transition-all duration-300 group">
                <Link href={`/events/${event.slug}`}>
                  View Details
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button variant="outline" asChild className="border-2 border-gray-200 hover:border-orange-300 hover:bg-orange-50 transition-all duration-300">
                <Link href={`/events/${event.slug}/register`}>Register</Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* Call to Action */}
      <div className="text-center mt-16">
        <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-2xl p-8 border border-orange-200">
          <h3 className="text-2xl font-bold text-neutral-900 mb-4">Can't find what you're looking for?</h3>
          <p className="text-neutral-600 mb-6 max-w-2xl mx-auto">
            Create your own event with our powerful event management platform. Generate QR codes, track attendance, and manage registrations effortlessly.
          </p>
          <Button size="lg" className="bg-orange-600 hover:bg-orange-700 text-white transition-all duration-300" asChild>
            <Link href="/admin/events/create">Create Your Event</Link>
          </Button>
        </div>
      </div>

      {events.length === 0 && (
        <div className="text-center py-16">
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-12 max-w-md mx-auto">
            <Calendar className="h-16 w-16 text-orange-400 mx-auto mb-6" />
            <h3 className="text-2xl font-bold text-neutral-900 mb-4">No events available</h3>
            <p className="text-neutral-600 mb-6">Be the first to create an amazing event experience!</p>
            <Button className="bg-orange-600 hover:bg-orange-700 text-white" asChild>
              <Link href="/admin/events/create">Create Event</Link>
            </Button>
          </div>
        </div>
      )}
    </section>
  )
}
