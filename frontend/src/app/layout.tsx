import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/sonner'
import ApolloProviderWrapper from '@/components/providers/apollo-provider'
import { AuthProvider } from '@/hooks/use-auth-simple'
import FirstTimeLoginWrapper from '@/components/auth/FirstTimeLoginWrapper'
import { getAppName, getAppDescription } from '@/lib/app-config'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: getAppName(),
  description: getAppDescription(),
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ApolloProviderWrapper>
          <AuthProvider>
            <FirstTimeLoginWrapper>
              {children}
            </FirstTimeLoginWrapper>
            <Toaster />
          </AuthProvider>
        </ApolloProviderWrapper>
      </body>
    </html>
  )
}
