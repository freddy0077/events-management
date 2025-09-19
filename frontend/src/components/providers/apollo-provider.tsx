'use client'

import { ApolloProvider } from '@apollo/client/react'
import apolloClient from '@/lib/apollo-client'

interface ApolloProviderWrapperProps {
  children: React.ReactNode
}

export default function ApolloProviderWrapper({ children }: ApolloProviderWrapperProps) {
  return (
    <ApolloProvider client={apolloClient}>
      {children}
    </ApolloProvider>
  )
}
