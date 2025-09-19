'use client'

import { forwardRef } from 'react'
import { QrCode, Calendar, MapPin, User, Award } from 'lucide-react'
import { BadgeUtils } from '@/lib/utils/qr-badge-utils'
import { getAppShortName, getAppName } from '@/lib/app-config'

interface BadgeTemplateProps {
  participantName: string
  eventName: string
  eventDate: string
  venue: string
  category: string
  categoryColor?: string
  qrCodeImage?: string
  registrationNumber?: string
  eventLogo?: string
  className?: string
}

export const BadgeTemplate = forwardRef<HTMLDivElement, BadgeTemplateProps>(
  ({
    participantName,
    eventName,
    eventDate,
    venue,
    category,
    categoryColor = BadgeUtils.getCategoryColor(category),
    qrCodeImage,
    registrationNumber,
    eventLogo,
    className = ''
  }, ref) => {
    return (
      <div 
        ref={ref}
        className={`badge-template bg-white border-2 border-gray-200 shadow-lg ${className}`}
        style={{
          width: '4in',
          height: '6in',
          padding: '0.25in',
          fontFamily: 'Inter, system-ui, sans-serif'
        }}
      >
        {/* Header Section */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {eventLogo ? (
              <img src={eventLogo} alt="Event Logo" className="w-12 h-12 object-contain" />
            ) : (
              <div 
                className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-lg"
                style={{ backgroundColor: categoryColor }}
              >
                <Award className="w-6 h-6" />
              </div>
            )}
            <div>
              <h1 className="text-lg font-bold text-gray-900 leading-tight">{getAppShortName()}</h1>
              <p className="text-xs text-gray-500">{getAppName()}</p>
            </div>
          </div>
          {registrationNumber && (
            <div className="text-right">
              <p className="text-xs text-gray-500">REG #</p>
              <p className="text-sm font-mono font-semibold text-gray-900">{registrationNumber}</p>
            </div>
          )}
        </div>

        {/* Event Information */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h2 className="text-xl font-bold text-gray-900 mb-3 leading-tight">{eventName}</h2>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <Calendar className="w-4 h-4 text-gray-500" />
              <span>{eventDate}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <MapPin className="w-4 h-4 text-gray-500" />
              <span>{venue}</span>
            </div>
          </div>
        </div>

        {/* Participant Information */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <User className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">Participant</h3>
          </div>
          
          <div 
            className="p-4 rounded-lg text-center"
            style={{ backgroundColor: `${categoryColor}10` }}
          >
            <h4 className="text-2xl font-bold text-gray-900 mb-1">{participantName}</h4>
            <div 
              className="inline-block px-3 py-1 rounded-full text-sm font-medium text-white"
              style={{ backgroundColor: categoryColor }}
            >
              {category}
            </div>
          </div>
        </div>

        {/* QR Code Section */}
        <div className="flex-1 flex flex-col items-center justify-center">
          {qrCodeImage ? (
            <div className="text-center">
              <div className="mb-2">
                {/* Wrap QR image in container div to avoid rendering artifacts */}
                <div className="p-2 bg-white rounded-lg mx-auto w-fit">
                  <img 
                    src={qrCodeImage} 
                    alt="QR Code" 
                    className="w-32 h-32 block"
                    style={{ 
                      imageRendering: 'pixelated', // Avoid interpolation lines for bitmap QR codes
                      imageRendering: '-webkit-optimize-contrast', // WebKit optimization
                      imageRendering: 'crisp-edges' // Modern browsers
                    }}
                  />
                </div>
              </div>
              <div className="flex items-center justify-center gap-1 text-xs text-gray-600">
                <QrCode className="w-3 h-3" />
                <span>Scan for check-in</span>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-400">
              <div className="w-32 h-32 mx-auto border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center mb-2">
                <QrCode className="w-12 h-12" />
              </div>
              <p className="text-xs">QR Code will appear here</p>
            </div>
          )}
        </div>

        {/* Footer */}
        {/*<div className="mt-4 pt-4 border-t border-gray-200 text-center">*/}
          {/*<p className="text-xs text-gray-500">*/}
          {/*  Present this badge for event entry and meal service*/}
          {/*</p>*/}
          {/*<p className="text-xs text-gray-400 mt-1">*/}
          {/*  Powered by {getAppShortName()} • eventregistration.com*/}
          {/*</p>*/}
        {/*</div>*/}

        {/* Print Styles */}
        <style jsx>{`
          @media print {
            .badge-template {
              width: 4in !important;
              height: 6in !important;
              margin: 0 !important;
              padding: 0.25in !important;
              box-shadow: none !important;
              border: 2px solid #e5e7eb !important;
              page-break-inside: avoid;
              -webkit-print-color-adjust: exact;
              color-adjust: exact;
            }
            
            .badge-template * {
              -webkit-print-color-adjust: exact;
              color-adjust: exact;
            }
            
            @page {
              size: 4.5in 6.5in;
              margin: 0.25in;
            }
          }
        `}</style>
      </div>
    )
  }
)

BadgeTemplate.displayName = 'BadgeTemplate'
