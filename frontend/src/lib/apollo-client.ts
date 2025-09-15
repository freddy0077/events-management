import { ApolloClient, InMemoryCache, createHttpLink, from } from '@apollo/client'
import { setContext } from '@apollo/client/link/context'
import { onError } from '@apollo/client/link/error'

// HTTP Link to GraphQL endpoint
const graphqlUrl = process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:3001/graphql'
console.log('🔗 Apollo Client GraphQL URL:', graphqlUrl)

const httpLink = createHttpLink({
  uri: graphqlUrl,
})

// Auth Link - Add JWT token to requests
const authLink = setContext((_, { headers }) => {
  // Get the authentication token from local storage if it exists
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
  
  // Return the headers to the context so httpLink can read them
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    }
  }
})

// Error Link - Handle GraphQL and network errors
const errorLink = onError((errorResponse: any) => {
  const { graphQLErrors, networkError } = errorResponse
  if (graphQLErrors) {
    graphQLErrors.forEach((error: any) => {
      console.error(
        `GraphQL error: Message: ${error.message}, Location: ${error.locations}, Path: ${error.path}`
      )
      
      // Handle authentication errors from GraphQL
      if (error.extensions?.code === 'UNAUTHENTICATED' || error.message === 'Unauthorized') {
        // Clear invalid token and redirect to login
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          window.location.href = '/login'
        }
      }
    })
  }

  if (networkError) {
    console.error(`Network error: ${networkError}`)
    
    // Handle authentication errors from network
    if ('statusCode' in networkError && networkError.statusCode === 401) {
      // Clear invalid token
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        // Redirect to login if needed
        window.location.href = '/login'
      }
    }
  }
})

// Create Apollo Client instance
export const apolloClient = new ApolloClient({
  link: from([errorLink, authLink, httpLink]),
  cache: new InMemoryCache({
    typePolicies: {
      Event: {
        fields: {
          categories: {
            merge(existing = [], incoming) {
              return incoming
            }
          },
          meals: {
            merge(existing = [], incoming) {
              return incoming
            }
          },
          registrations: {
            merge(existing = [], incoming) {
              return incoming
            }
          }
        }
      },
      Registration: {
        fields: {
          mealAttendances: {
            merge(existing = [], incoming) {
              return incoming
            }
          }
        }
      }
    }
  }),
  defaultOptions: {
    watchQuery: {
      errorPolicy: 'all',
      notifyOnNetworkStatusChange: true,
    },
    query: {
      errorPolicy: 'all',
    },
    mutate: {
      errorPolicy: 'all',
    },
  },
})

export default apolloClient
