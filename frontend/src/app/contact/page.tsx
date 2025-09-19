'use client'

// Force dynamic rendering to prevent SSG issues with Apollo Client
export const dynamic = 'force-dynamic'
import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { 
  Calendar, 
  Mail, 
  Phone, 
  MapPin, 
  Clock, 
  Send,
  CheckCircle,
  ArrowLeft,
  Building2,
  Users,
  Zap
} from 'lucide-react'
import { getAppShortName, getAppName } from '@/lib/app-config'
import { toast } from 'sonner'

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    phone: '',
    eventType: '',
    message: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    toast.success('Thank you for your inquiry! We\'ll get back to you within 24 hours.')
    
    // Reset form
    setFormData({
      name: '',
      email: '',
      company: '',
      phone: '',
      eventType: '',
      message: ''
    })
    
    setIsSubmitting(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <Link href="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
                <div className="bg-orange-600 p-2 rounded-lg">
                  <Calendar className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">{getAppShortName()}</h1>
                  <p className="text-xs text-gray-500">Enterprise Event Management Platform</p>
                </div>
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="ghost" className="text-gray-600 hover:text-gray-900">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Home
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="outline" className="border-orange-600 text-orange-600 hover:bg-orange-50">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-2 bg-orange-100 text-orange-800 rounded-full text-sm font-medium mb-6">
              <Mail className="h-4 w-4 mr-2" />
              Get in Touch
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-6">
              Ready to Transform Your Events?
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Let's discuss how our enterprise event management platform can streamline your operations 
              and deliver exceptional experiences for your attendees.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Contact Form */}
            <div className="lg:col-span-2">
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="text-2xl text-gray-900">Send us a Message</CardTitle>
                  <p className="text-gray-600">
                    Fill out the form below and we'll get back to you within 24 hours.
                  </p>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="name" className="text-gray-700 font-medium">Full Name *</Label>
                        <Input
                          id="name"
                          name="name"
                          type="text"
                          value={formData.name}
                          onChange={handleInputChange}
                          placeholder="John Smith"
                          required
                          className="h-11 border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-gray-700 font-medium">Email Address *</Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          placeholder="john@company.com"
                          required
                          className="h-11 border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="company" className="text-gray-700 font-medium">Company</Label>
                        <Input
                          id="company"
                          name="company"
                          type="text"
                          value={formData.company}
                          onChange={handleInputChange}
                          placeholder="Your Company Name"
                          className="h-11 border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone" className="text-gray-700 font-medium">Phone Number</Label>
                        <Input
                          id="phone"
                          name="phone"
                          type="tel"
                          value={formData.phone}
                          onChange={handleInputChange}
                          placeholder="+1 (555) 123-4567"
                          className="h-11 border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="eventType" className="text-gray-700 font-medium">Type of Events</Label>
                      <select
                        id="eventType"
                        name="eventType"
                        value={formData.eventType}
                        onChange={handleInputChange}
                        className="w-full h-11 px-3 border border-gray-300 rounded-md focus:border-orange-500 focus:ring-orange-500 bg-white"
                      >
                        <option value="">Select event type</option>
                        <option value="conferences">Conferences & Seminars</option>
                        <option value="corporate">Corporate Events</option>
                        <option value="workshops">Workshops & Training</option>
                        <option value="networking">Networking Events</option>
                        <option value="trade-shows">Trade Shows & Exhibitions</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message" className="text-gray-700 font-medium">Message *</Label>
                      <Textarea
                        id="message"
                        name="message"
                        value={formData.message}
                        onChange={handleInputChange}
                        placeholder="Tell us about your event management needs, expected attendee count, and any specific requirements..."
                        required
                        rows={5}
                        className="border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                      />
                    </div>

                    <Button 
                      type="submit" 
                      size="lg"
                      className="w-full bg-orange-600 hover:bg-orange-700 text-white font-medium h-12"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Sending Message...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Send Message
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Contact Information & Benefits */}
            <div className="space-y-8">
              {/* Contact Info */}
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="text-xl text-gray-900">Get in Touch</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-start space-x-4">
                    <div className="bg-orange-100 p-3 rounded-lg">
                      <Mail className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Email</h4>
                      <p className="text-gray-600">sales@eventmanagement.com</p>
                      <p className="text-sm text-gray-500">We respond within 24 hours</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="bg-blue-100 p-3 rounded-lg">
                      <Phone className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Phone</h4>
                      <p className="text-gray-600">+1 (555) 123-4567</p>
                      <p className="text-sm text-gray-500">Mon-Fri, 9AM-6PM EST</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="bg-green-100 p-3 rounded-lg">
                      <Clock className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Response Time</h4>
                      <p className="text-gray-600">Within 24 hours</p>
                      <p className="text-sm text-gray-500">Usually much faster</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Why Choose Us */}
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="text-xl text-gray-900">Why Choose Us?</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-gray-900">Enterprise-Grade Security</h4>
                      <p className="text-sm text-gray-600">Bank-level encryption and compliance</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-gray-900">24/7 Support</h4>
                      <p className="text-sm text-gray-600">Dedicated support team for your events</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-gray-900">Scalable Solution</h4>
                      <p className="text-sm text-gray-600">From 50 to 50,000+ attendees</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-gray-900">Quick Implementation</h4>
                      <p className="text-sm text-gray-600">Get started in days, not months</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <Card className="shadow-lg bg-gradient-to-br from-orange-50 to-orange-100">
                <CardContent className="p-6">
                  <div className="text-center space-y-4">
                    <div className="flex items-center justify-center space-x-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-600">1000+</div>
                        <div className="text-sm text-gray-600">Events Managed</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-600">99.9%</div>
                        <div className="text-sm text-gray-600">Uptime</div>
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">500K+</div>
                      <div className="text-sm text-gray-600">Attendees Served</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-orange-600 p-2 rounded-lg">
                <Calendar className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="font-bold">{getAppShortName()}</div>
                <div className="text-sm text-gray-400">Enterprise Event Management</div>
              </div>
            </div>
            <div className="text-sm text-gray-400">
              © 2024 {getAppName()}. All rights reserved.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
