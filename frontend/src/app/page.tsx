'use client'

// Force dynamic rendering to prevent SSG issues with Apollo Client
export const dynamic = 'force-dynamic'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { 
  Users, 
  Calendar, 
  Shield, 
  QrCode, 
  CreditCard, 
  BarChart3, 
  UserCheck, 
  Utensils, 
  Building2, 
  Clock, 
  CheckCircle,
  ArrowRight,
  Star,
  Zap,
  Mail
} from 'lucide-react'
import { getAppShortName, getAppName } from '@/lib/app-config'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="bg-orange-600 p-2 rounded-lg">
                <Calendar className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{getAppShortName()}</h1>
                <p className="text-xs text-gray-500">Enterprise Event Management Platform</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/contact">
                <Button variant="ghost" className="text-gray-600 hover:text-gray-900">
                  Contact
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

      {/* Hero Section */}
      <div className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="mb-8">
            <div className="inline-flex items-center px-4 py-2 bg-orange-100 text-orange-800 rounded-full text-sm font-medium mb-6">
              <Star className="h-4 w-4 mr-2" />
              Trusted by Event Professionals Worldwide
            </div>
            <h1 className="text-5xl font-bold text-gray-900 mb-6">
              Transform Your Events Into
              <span className="text-orange-600 block">Seamless Experiences</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              The only event management platform you'll ever need. Streamline operations, maximize attendance, 
              and deliver flawless events that leave lasting impressions. Trusted by industry leaders to manage 
              everything from intimate gatherings to large-scale conferences.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/login">
              <Button size="lg" className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-3 text-lg">
                Get Started Today
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/contact">
              <Button variant="outline" size="lg" className="px-8 py-3 text-lg">
                Contact Sales
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Features Grid */}
      <div className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Everything You Need to Manage Events Like a Pro
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              From initial planning to final reporting, our comprehensive platform handles every aspect of event management.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
            {/* Event Creation */}
            <Card className="p-8 hover:shadow-lg transition-shadow duration-200">
              <CardContent className="p-0">
                <div className="flex items-start space-x-4">
                  <div className="bg-blue-100 p-4 rounded-xl">
                    <Building2 className="h-8 w-8 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">Effortless Event Creation</h3>
                    <p className="text-gray-600 mb-4">
                      Launch events in minutes, not hours. Intelligent setup wizards guide you through categories, 
                      sessions, and team assignments with zero complexity.
                    </p>
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />Multi-category event setup</li>
                      <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />Automated staff assignments</li>
                      <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />Capacity management</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Registration Management */}
            <Card className="p-8 hover:shadow-lg transition-shadow duration-200">
              <CardContent className="p-0">
                <div className="flex items-start space-x-4">
                  <div className="bg-orange-100 p-4 rounded-xl">
                    <UserCheck className="h-8 w-8 text-orange-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">Lightning-Fast Registrations</h3>
                    <p className="text-gray-600 mb-4">
                      Process registrations 3x faster with our intuitive POS interface. Real-time capacity alerts 
                      prevent overbooking while secure payments flow seamlessly.
                    </p>
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />POS-style interface</li>
                      <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />Real-time capacity tracking</li>
                      <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />Instant payment processing</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* QR & Badge System */}
            <Card className="p-8 hover:shadow-lg transition-shadow duration-200">
              <CardContent className="p-0">
                <div className="flex items-start space-x-4">
                  <div className="bg-green-100 p-4 rounded-xl">
                    <QrCode className="h-8 w-8 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">Smart Badge Technology</h3>
                    <p className="text-gray-600 mb-4">
                      Eliminate check-in queues forever. Military-grade encrypted QR codes ensure security while 
                      delivering instant, contactless experiences your attendees will love.
                    </p>
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />Professional badge printing</li>
                      <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />Encrypted QR codes</li>
                      <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />Instant check-in scanning</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Meal Management */}
            <Card className="p-8 hover:shadow-lg transition-shadow duration-200">
              <CardContent className="p-0">
                <div className="flex items-start space-x-4">
                  <div className="bg-purple-100 p-4 rounded-xl">
                    <Utensils className="h-8 w-8 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">Intelligent Catering Control</h3>
                    <p className="text-gray-600 mb-4">
                      Never waste food again. Smart tracking prevents duplicate servings while real-time analytics 
                      optimize portions and reduce costs by up to 30%.
                    </p>
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />Duplicate prevention</li>
                      <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />Real-time attendance</li>
                      <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />Cost optimization</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Additional Features */}
      <div className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Built for Enterprise Success
            </h2>
            <p className="text-lg text-gray-600">
              Advanced features that scale with your organization
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center p-6">
              <div className="bg-indigo-100 p-3 rounded-lg w-fit mx-auto mb-4">
                <Users className="h-6 w-6 text-indigo-600" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Enterprise Security</h4>
              <p className="text-sm text-gray-600">Bank-level security with role-based access controls</p>
            </div>

            <div className="text-center p-6">
              <div className="bg-emerald-100 p-3 rounded-lg w-fit mx-auto mb-4">
                <BarChart3 className="h-6 w-6 text-emerald-600" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Actionable Insights</h4>
              <p className="text-sm text-gray-600">Data-driven decisions with executive-ready reports</p>
            </div>

            <div className="text-center p-6">
              <div className="bg-rose-100 p-3 rounded-lg w-fit mx-auto mb-4">
                <CreditCard className="h-6 w-6 text-rose-600" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Seamless Payments</h4>
              <p className="text-sm text-gray-600">Accept payments globally with automated reconciliation</p>
            </div>

            <div className="text-center p-6">
              <div className="bg-amber-100 p-3 rounded-lg w-fit mx-auto mb-4">
                <Shield className="h-6 w-6 text-amber-600" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">24/7 Reliability</h4>
              <p className="text-sm text-gray-600">99.9% uptime with enterprise-grade infrastructure</p>
            </div>
          </div>
        </div>
      </div>

      {/* Trust Indicators */}
      <div className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <Card className="p-8">
            <CardContent className="p-0">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-semibold text-gray-900 mb-4">Why Industry Leaders Choose Us</h3>
                <p className="text-gray-600">
                  Join thousands of event professionals who've transformed their operations and delivered exceptional experiences
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                <div>
                  <div className="flex items-center justify-center mb-4">
                    <div className="bg-green-100 p-4 rounded-full">
                      <CheckCircle className="h-8 w-8 text-green-600" />
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-gray-900 mb-2">Zero Stress</div>
                  <div className="text-gray-500">Event Management</div>
                </div>
                <div>
                  <div className="flex items-center justify-center mb-4">
                    <div className="bg-blue-100 p-4 rounded-full">
                      <Zap className="h-8 w-8 text-blue-600" />
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-gray-900 mb-2">Instant</div>
                  <div className="text-gray-500">Data & Insights</div>
                </div>
                <div>
                  <div className="flex items-center justify-center mb-4">
                    <div className="bg-purple-100 p-4 rounded-full">
                      <Star className="h-8 w-8 text-purple-600" />
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-gray-900 mb-2">Premium</div>
                  <div className="text-gray-500">Brand Experience</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-20 bg-gradient-to-r from-orange-600 to-orange-700">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Transform Your Events?
          </h2>
          <p className="text-xl text-orange-100 mb-8">
            Join thousands of event professionals who trust our platform to deliver exceptional experiences.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/login">
              <Button size="lg" variant="secondary" className="bg-white text-orange-600 hover:bg-gray-50 px-8 py-3 text-lg">
                Sign In to Get Started
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/contact">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-orange-600 px-8 py-3 text-lg">
                <Mail className="mr-2 h-5 w-5" />
                Contact Sales
              </Button>
            </Link>
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
