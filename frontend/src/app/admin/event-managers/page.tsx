'use client'

// Force dynamic rendering to prevent SSG issues with Apollo Client
export const dynamic = 'force-dynamic'
import React from 'react'
import EventManagerAssignment from '@/components/admin/EventManagerAssignment'

export default function EventManagersPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-primary-50 to-neutral-50">
      <div className="container mx-auto px-4 py-8">
        <EventManagerAssignment />
      </div>
    </div>
  )
}
