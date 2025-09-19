'use client'

import Link from 'next/link'
import { CheckCircle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface Event {
  name: string
  date: string
}

interface SuccessPageProps {
  event: Event
  slug: string
}

export function SuccessPage({ event, slug }: SuccessPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
      <Card className="w-full max-w-md bg-white/80 backdrop-blur-sm border-0 shadow-lg">
        <CardHeader className="text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <CardTitle className="text-green-700">Registration Successful!</CardTitle>
          <CardDescription>
            You have successfully registered for {event.name}. A confirmation email has been sent to your email address.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <p className="text-sm text-green-700">
              <strong>Next Steps:</strong><br />
              • Check your email for QR code<br />
              • Save the date: {new Date(event.date).toLocaleDateString()}<br />
              • Bring your QR code to the event
            </p>
          </div>
          <Button asChild className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white">
            <Link href={`/events/${slug}`}>
              Back to Event Details
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
