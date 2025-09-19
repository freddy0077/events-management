'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils'

interface Category {
  id: string
  name: string
  price: number
  description: string
}

interface Event {
  name: string
  venue: string
  date: string
  categories?: Category[]
}

interface EventSummaryProps {
  event: Event
  selectedCategory?: Category
}

export function EventSummary({ event, selectedCategory }: EventSummaryProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Event Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="font-medium">{event.name}</h4>
          <p className="text-sm text-gray-600">{event.venue}</p>
          <p className="text-sm text-gray-600">
            {new Date(event.date).toLocaleDateString()} at {new Date(event.date).toLocaleTimeString()}
          </p>
        </div>
        
        {selectedCategory && (
          <div className="border-t pt-4">
            <div className="flex justify-between items-start">
              <div>
                <h5 className="font-medium">{selectedCategory.name}</h5>
                <p className="text-sm text-gray-600">{selectedCategory.description}</p>
              </div>
              <Badge variant="secondary">
                {formatCurrency(selectedCategory.price)}
              </Badge>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
