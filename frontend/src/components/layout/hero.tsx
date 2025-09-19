import { Button } from '@/components/ui/button'
import { Calendar, Users, QrCode, ArrowRight, CheckCircle, Star, Zap, Shield, Clock } from 'lucide-react'
import Link from 'next/link'

export function Hero() {
  return (
    <section className="relative bg-white">
      <div className="container mx-auto px-4 py-16">
        {/* Main Hero Content */}
        <div className="max-w-4xl mx-auto text-center mb-20">
          {/* Trust Badge */}
          <div className="inline-flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-full px-4 py-2 mb-8">
            <Star className="h-4 w-4 text-orange-600" />
            <span className="text-sm font-medium text-orange-700">Trusted by 4,500+ events worldwide</span>
          </div>

          {/* Main Headline - Hubtel Style */}
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Create and manage events
            <span className="block text-orange-600">with ease</span>
          </h1>
          
          {/* Subtitle */}
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
            Accept registrations, manage finances, grow your event attendance. 
            4,500+ events have already chosen to grow with us. Let's do it with you too.
          </p>
          
          {/* Primary CTA */}
          <div className="mb-12">
            <Button size="lg" className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-4 text-lg font-semibold rounded-lg mr-4" asChild>
              <Link href="/auth/register">Get Started for Free</Link>
            </Button>
            <Button variant="outline" size="lg" className="border-2 border-gray-300 hover:border-orange-600 hover:text-orange-600 px-8 py-4 text-lg font-semibold rounded-lg" asChild>
              <Link href="/events">Browse Events</Link>
            </Button>
          </div>
        </div>

        {/* Services Grid - Hubtel Style */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">No matter your event size or type, we can help grow your attendance</h2>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* QR Code Registration */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
              <div className="bg-orange-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <QrCode className="h-6 w-6 text-orange-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2 text-lg">QR Code Registration</h3>
              <p className="text-gray-600 text-sm mb-4">Generate QR codes for instant registration. It's quick, easy, and no internet is needed for scanning.</p>
              <Link href="/events" className="text-orange-600 text-sm font-medium hover:underline">Learn more</Link>
            </div>

            {/* Online Registration */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
              <div className="bg-blue-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2 text-lg">Online Registration</h3>
              <p className="text-gray-600 text-sm mb-4">Accept registrations directly on your website via multiple payment methods and instant confirmations.</p>
              <Link href="/events" className="text-orange-600 text-sm font-medium hover:underline">Learn more</Link>
            </div>

            {/* Event Analytics */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
              <div className="bg-green-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2 text-lg">Event Analytics</h3>
              <p className="text-gray-600 text-sm mb-4">Get real-time insights into registrations, attendance, and revenue with comprehensive dashboards.</p>
              <Link href="/events" className="text-orange-600 text-sm font-medium hover:underline">Learn more</Link>
            </div>

            {/* Meal Management */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
              <div className="bg-purple-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <Zap className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2 text-lg">Meal Management</h3>
              <p className="text-gray-600 text-sm mb-4">Track meal preferences and attendance with QR code scanning for efficient catering management.</p>
              <Link href="/events" className="text-orange-600 text-sm font-medium hover:underline">Learn more</Link>
            </div>

            {/* Check-in System */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
              <div className="bg-red-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2 text-lg">Secure Check-in</h3>
              <p className="text-gray-600 text-sm mb-4">Secure, fast check-in process with QR code verification and real-time attendance tracking.</p>
              <Link href="/events" className="text-orange-600 text-sm font-medium hover:underline">Learn more</Link>
            </div>

            {/* Multi-Event Management */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
              <div className="bg-indigo-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <Clock className="h-6 w-6 text-indigo-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2 text-lg">Multi-Event Management</h3>
              <p className="text-gray-600 text-sm mb-4">Manage multiple events from one dashboard with comprehensive reporting and analytics.</p>
              <Link href="/events" className="text-orange-600 text-sm font-medium hover:underline">Learn more</Link>
            </div>
          </div>
        </div>

        {/* Why Choose Us - Hubtel Style */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Why choose EventReg</h2>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="text-center">
              <div className="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-orange-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Accept all registration types</h3>
              <p className="text-gray-600 text-sm">Handle individual, group, and corporate registrations with flexible payment options.</p>
            </div>

            <div className="text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Real-time updates</h3>
              <p className="text-gray-600 text-sm">Get instant notifications and updates as registrations come in and attendees check in.</p>
            </div>

            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Comprehensive analytics</h3>
              <p className="text-gray-600 text-sm">Access detailed dashboards to monitor registrations, attendance, and event performance.</p>
            </div>

            <div className="text-center">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">No setup fees</h3>
              <p className="text-gray-600 text-sm">Getting started is free. No hidden charges. Pay only for premium features as you grow.</p>
            </div>

            <div className="text-center">
              <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">24/7 Support</h3>
              <p className="text-gray-600 text-sm">Need help? Text, email or call our support team anytime for assistance with your events.</p>
            </div>

            <div className="text-center">
              <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="h-8 w-8 text-indigo-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Easy integration</h3>
              <p className="text-gray-600 text-sm">Integrate with your existing systems and workflows with our simple APIs and webhooks.</p>
            </div>
          </div>
        </div>

        {/* Simple Pricing - Hubtel Style */}
        <div className="text-center bg-gray-50 rounded-2xl p-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Simple & Transparent Pricing</h2>
          <p className="text-xl text-gray-600 mb-8">Start free and scale as you grow. No hidden fees, no surprises.</p>
          
          <div className="flex flex-wrap justify-center items-center gap-8 mb-8 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>Get started for free</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>No setup fees</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>No hidden charges</span>
            </div>
          </div>

          <Button size="lg" className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-4 text-lg font-semibold rounded-lg" asChild>
            <Link href="/auth/register">Get started for free</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
