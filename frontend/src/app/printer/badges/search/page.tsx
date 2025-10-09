'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  Search,
  Printer,
  User,
  Mail,
  Phone,
  Calendar,
  Tag,
  Eye,
  Loader2,
  AlertCircle
} from 'lucide-react'
import { useLazyQuery, useMutation } from '@apollo/client/react'
import { SEARCH_REGISTRATIONS } from '@/lib/graphql/queries'
import { GENERATE_BADGE } from '@/lib/graphql/mutations/qr-mutations'
import { toast } from 'sonner'
import { format } from 'date-fns'

export default function SearchBadgesPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  
  console.log('Current search results state:', searchResults)

  const [searchRegistrations, { loading: searching }] = useLazyQuery(SEARCH_REGISTRATIONS, {
    onCompleted: (data) => {
      console.log('Search completed:', data)
      const results = data.searchRegistrations || []
      console.log('Setting search results:', results)
      setSearchResults(results)
      
      if (results.length === 0) {
        toast.info('No results found')
      } else {
        const withoutQR = results.filter((r: any) => !r.qrCode).length
        const withQR = results.length - withoutQR
        
        if (withoutQR > 0 && withQR === 0) {
          toast.warning(`Found ${results.length} participant(s) but none have QR codes generated yet`)
        } else if (withoutQR > 0) {
          toast.success(`Found ${results.length} participant(s) - ${withoutQR} without QR codes`)
        } else {
          toast.success(`Found ${results.length} participant(s)`)
        }
      }
    },
    onError: (error) => {
      console.error('Search error:', error)
      toast.error(error.message || 'Search failed')
      setSearchResults([])
    }
  })

  const [generateBadge, { loading: printingBadge }] = useMutation(GENERATE_BADGE)

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast.error('Please enter a search term')
      return
    }

    searchRegistrations({
      variables: { searchTerm: searchQuery }
    })
  }

  const handlePrintBadge = async (registrationId: string, hasQRCode: boolean) => {
    if (!hasQRCode) {
      toast.error('Cannot print badge - QR code not generated yet. Please generate QR code first.')
      return
    }

    try {
      const result = await generateBadge({
        variables: { registrationId, format: 'pdf' }
      })
      
      // Download the badge PDF
      const base64Data = result.data.generateBadge
      const link = document.createElement('a')
      link.href = `data:application/pdf;base64,${base64Data}`
      link.download = `badge-${registrationId}.pdf`
      link.click()
      
      toast.success('Badge printed successfully!')
    } catch (error: any) {
      toast.error(error.message || 'Failed to print badge')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Search & Print Badges</h1>
          <p className="text-gray-600 mt-1">
            Find participants by name, email, phone, or registration ID
          </p>
        </div>
        <Badge variant="secondary" className="bg-amber-100 text-amber-800">
          <Search className="h-4 w-4 mr-1" />
          Search
        </Badge>
      </div>

      {/* Search Box */}
      <Card>
        <CardHeader>
          <CardTitle>Search Participants</CardTitle>
          <CardDescription>
            Enter name, email, phone number, or registration ID
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                placeholder="Search by name, email, phone, or registration ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10 h-12 text-lg"
              />
            </div>
            <Button 
              onClick={handleSearch}
              disabled={searching || !searchQuery.trim()}
              className="bg-amber-600 hover:bg-amber-700 h-12 px-8"
            >
              {searching ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="h-5 w-5 mr-2" />
                  Search
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Search Results</CardTitle>
            <CardDescription>
              Found {searchResults.length} participant(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {searchResults.map((result) => (
                <div
                  key={result.id}
                  className="border rounded-lg p-6 hover:border-amber-300 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-4 flex-1">
                      {/* Participant Info */}
                      <div>
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-xl font-bold text-gray-900">
                            {result.firstName} {result.lastName}
                          </h3>
                          <Badge variant="outline" className="text-sm">
                            {result.category?.name}
                          </Badge>
                          <Badge 
                            variant={result.paymentStatus === 'PAID' ? 'default' : 'secondary'}
                            className={result.paymentStatus === 'PAID' ? 'bg-green-600' : ''}
                          >
                            {result.paymentStatus}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div className="flex items-center text-gray-600">
                            <Mail className="h-4 w-4 mr-2" />
                            {result.email}
                          </div>
                          <div className="flex items-center text-gray-600">
                            <Phone className="h-4 w-4 mr-2" />
                            {result.phone || 'N/A'}
                          </div>
                          <div className="flex items-center text-gray-600">
                            <Tag className="h-4 w-4 mr-2" />
                            {result.id.slice(0, 8)}
                          </div>
                          <div className="flex items-center text-gray-600">
                            <Calendar className="h-4 w-4 mr-2" />
                            {result.event?.name}
                          </div>
                        </div>
                      </div>

                      {/* Badge Status */}
                      <div className={`flex items-center space-x-2 text-sm ${
                        result.qrCode ? 'text-green-600' : 'text-gray-600'
                      }`}>
                        {result.qrCode ? (
                          <>
                            <div className="h-2 w-2 bg-green-600 rounded-full"></div>
                            <span>QR Code generated</span>
                          </>
                        ) : (
                          <>
                            <div className="h-2 w-2 bg-gray-400 rounded-full"></div>
                            <span>QR Code not generated yet</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col space-y-2 ml-6">
                      <Button 
                        size="sm"
                        onClick={() => handlePrintBadge(result.id, !!result.qrCode)}
                        disabled={printingBadge || !result.qrCode}
                        className="bg-amber-600 hover:bg-amber-700 disabled:opacity-50"
                      >
                        {printingBadge ? (
                          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                        ) : (
                          <Printer className="h-4 w-4 mr-1" />
                        )}
                        {!result.qrCode ? 'No QR Code' : 'Print Badge'}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Results */}
      {searchResults.length === 0 && searchQuery && !searching && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-gray-500">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium">No results found</p>
              <p className="text-sm mt-2">Try searching with a different term</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search Tips */}
      <Card>
        <CardHeader>
          <CardTitle>Search Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <User className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">By Name</h4>
                <p className="text-sm text-gray-600">
                  Search using first name, last name, or full name
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Mail className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">By Email</h4>
                <p className="text-sm text-gray-600">
                  Enter the participant's email address
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Phone className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">By Phone</h4>
                <p className="text-sm text-gray-600">
                  Use phone number to find participants
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Tag className="h-4 w-4 text-orange-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">By Registration ID</h4>
                <p className="text-sm text-gray-600">
                  Search using the unique registration ID
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
