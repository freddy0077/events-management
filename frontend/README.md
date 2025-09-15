# Event Registration System - Frontend

## 🚀 Overview

Modern Next.js frontend application for the Event Registration System with Apollo Client for GraphQL integration, real-time updates, and responsive design optimized for both desktop and mobile devices.

## 🏗️ Architecture

```
Frontend (Next.js + Apollo Client)
├── App Router (Next.js 14+)
├── Apollo Client (GraphQL)
├── Real-time Subscriptions
├── PWA Capabilities
├── Responsive UI Components
└── Offline Support
```

## 🛠️ Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **GraphQL Client**: Apollo Client
- **UI Framework**: React 18+
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui + Radix UI
- **State Management**: Apollo Client Cache + Zustand
- **Forms**: React Hook Form + Zod validation
- **QR Code**: react-qr-code, @zxing/library
- **Real-time**: GraphQL Subscriptions
- **PWA**: next-pwa
- **Testing**: Jest + React Testing Library
- **Linting**: ESLint + Prettier

## 📁 Project Structure

```
frontend/
├── app/                          # App Router (Next.js 14+)
│   ├── (auth)/                  # Authentication routes
│   │   ├── login/
│   │   └── layout.tsx
│   ├── (dashboard)/             # Admin dashboard
│   │   ├── events/
│   │   │   ├── [id]/
│   │   │   │   ├── registrations/
│   │   │   │   ├── meals/
│   │   │   │   └── reports/
│   │   │   └── page.tsx
│   │   ├── analytics/
│   │   └── layout.tsx
│   ├── registration/            # Public registration
│   │   ├── [eventId]/
│   │   │   ├── online/
│   │   │   └── onsite/
│   │   └── success/
│   ├── scanner/                 # QR Scanner for meals
│   │   └── [eventId]/
│   ├── api/                     # API routes (if needed)
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/                   # Reusable components
│   ├── ui/                      # Base UI components (shadcn/ui)
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── dialog.tsx
│   │   ├── table.tsx
│   │   └── ...
│   ├── forms/                   # Form components
│   │   ├── registration-form.tsx
│   │   ├── event-form.tsx
│   │   └── meal-form.tsx
│   ├── layouts/                 # Layout components
│   │   ├── dashboard-layout.tsx
│   │   ├── auth-layout.tsx
│   │   └── public-layout.tsx
│   ├── charts/                  # Data visualization
│   │   ├── registration-chart.tsx
│   │   └── meal-attendance-chart.tsx
│   ├── qr/                      # QR Code components
│   │   ├── qr-generator.tsx
│   │   ├── qr-scanner.tsx
│   │   └── qr-display.tsx
│   └── common/                  # Common components
│       ├── loading.tsx
│       ├── error-boundary.tsx
│       └── offline-indicator.tsx
├── lib/                         # Utilities and configurations
│   ├── apollo/                  # Apollo Client setup
│   │   ├── client.ts
│   │   ├── queries.ts
│   │   ├── mutations.ts
│   │   └── subscriptions.ts
│   ├── auth/                    # Authentication utilities
│   │   ├── auth-context.tsx
│   │   └── auth-utils.ts
│   ├── utils/                   # General utilities
│   │   ├── cn.ts
│   │   ├── date.ts
│   │   └── qr-utils.ts
│   ├── validations/             # Zod schemas
│   │   ├── registration.ts
│   │   ├── event.ts
│   │   └── meal.ts
│   └── constants/
│       ├── routes.ts
│       └── config.ts
├── hooks/                       # Custom React hooks
│   ├── use-auth.ts
│   ├── use-registration.ts
│   ├── use-qr-scanner.ts
│   └── use-offline.ts
├── store/                       # State management
│   ├── auth-store.ts
│   ├── registration-store.ts
│   └── ui-store.ts
├── types/                       # TypeScript definitions
│   ├── auth.ts
│   ├── event.ts
│   ├── registration.ts
│   └── graphql.ts
├── public/                      # Static assets
│   ├── icons/
│   ├── images/
│   └── manifest.json
├── __tests__/                   # Test files
├── next.config.js
├── tailwind.config.js
├── codegen.yml                  # GraphQL Code Generator
└── package.json
```

## 🔧 Installation & Setup

### Prerequisites
- Node.js 18+
- npm/pnpm/yarn

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Configuration
```bash
cp .env.example .env.local
```

Edit `.env.local`:
```env
# GraphQL API
NEXT_PUBLIC_GRAPHQL_URL=http://localhost:3001/graphql
NEXT_PUBLIC_GRAPHQL_WS_URL=ws://localhost:3001/graphql

# Authentication
NEXTAUTH_SECRET=your-nextauth-secret
NEXTAUTH_URL=http://localhost:3000

# Payment Gateway
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_...

# Features
NEXT_PUBLIC_ENABLE_PWA=true
NEXT_PUBLIC_ENABLE_OFFLINE=true
NEXT_PUBLIC_ENABLE_ANALYTICS=true

# App Configuration
NEXT_PUBLIC_APP_NAME="Event Registration System"
NEXT_PUBLIC_APP_VERSION=1.0.0
```

### 3. Generate GraphQL Types
```bash
npm run codegen
```

### 4. Start Development Server
```bash
npm run dev
```

Application will be available at: `http://localhost:3000`

## 🔌 Apollo Client Configuration

### Client Setup
```typescript
// lib/apollo/client.ts
import { ApolloClient, InMemoryCache, createHttpLink, split } from '@apollo/client';
import { getMainDefinition } from '@apollo/client/utilities';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { createClient } from 'graphql-ws';
import { setContext } from '@apollo/client/link/context';

const httpLink = createHttpLink({
  uri: process.env.NEXT_PUBLIC_GRAPHQL_URL,
});

const wsLink = new GraphQLWsLink(
  createClient({
    url: process.env.NEXT_PUBLIC_GRAPHQL_WS_URL!,
    connectionParams: () => ({
      authorization: `Bearer ${localStorage.getItem('token')}`,
    }),
  })
);

const authLink = setContext((_, { headers }) => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    },
  };
});

const splitLink = split(
  ({ query }) => {
    const definition = getMainDefinition(query);
    return (
      definition.kind === 'OperationDefinition' &&
      definition.operation === 'subscription'
    );
  },
  wsLink,
  authLink.concat(httpLink)
);

export const apolloClient = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache({
    typePolicies: {
      Event: {
        fields: {
          registrations: {
            merge(existing = [], incoming) {
              return [...existing, ...incoming];
            },
          },
        },
      },
    },
  }),
  defaultOptions: {
    watchQuery: {
      errorPolicy: 'all',
    },
  },
});
```

### Provider Setup
```typescript
// app/providers.tsx
'use client';

import { ApolloProvider } from '@apollo/client';
import { apolloClient } from '@/lib/apollo/client';
import { AuthProvider } from '@/lib/auth/auth-context';
import { Toaster } from '@/components/ui/toaster';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ApolloProvider client={apolloClient}>
      <AuthProvider>
        {children}
        <Toaster />
      </AuthProvider>
    </ApolloProvider>
  );
}
```

## 📊 GraphQL Operations

### Queries
```typescript
// lib/apollo/queries.ts
import { gql } from '@apollo/client';

export const GET_EVENTS = gql`
  query GetEvents {
    events {
      id
      name
      date
      venue
      totalRegistrations
      categories {
        id
        name
        price
        currentCount
        maxCapacity
      }
    }
  }
`;

export const GET_EVENT_DETAILS = gql`
  query GetEventDetails($id: ID!) {
    event(id: $id) {
      id
      name
      date
      venue
      description
      categories {
        id
        name
        price
        maxCapacity
        currentCount
      }
      registrations {
        id
        fullName
        email
        paymentStatus
        checkedIn
        createdAt
      }
      meals {
        id
        sessionName
        startTime
        endTime
        currentAttendance
        maxCapacity
      }
    }
  }
`;

export const GET_REGISTRATION_BY_QR = gql`
  query GetRegistrationByQR($qrCode: String!) {
    registrationByQR(qrCode: $qrCode) {
      id
      fullName
      email
      paymentStatus
      checkedIn
      category {
        name
      }
      event {
        name
        date
      }
      mealAttendances {
        meal {
          sessionName
        }
        scannedAt
      }
    }
  }
`;
```

### Mutations
```typescript
// lib/apollo/mutations.ts
import { gql } from '@apollo/client';

export const REGISTER_ONLINE = gql`
  mutation RegisterOnline($input: OnlineRegistrationInput!) {
    registerOnline(input: $input) {
      id
      fullName
      email
      qrCode
      paymentStatus
      category {
        name
        price
      }
      event {
        name
        date
      }
    }
  }
`;

export const SCAN_MEAL_QR = gql`
  mutation ScanMealQR($qrCode: String!, $mealId: ID!) {
    scanMealQR(qrCode: $qrCode, mealId: $mealId) {
      success
      message
      attendance {
        id
        scannedAt
        registration {
          fullName
        }
        meal {
          sessionName
        }
      }
    }
  }
`;

export const APPROVE_PAYMENT = gql`
  mutation ApprovePayment($registrationId: ID!) {
    approvePayment(registrationId: $registrationId) {
      id
      paymentStatus
      qrCode
    }
  }
`;
```

### Subscriptions
```typescript
// lib/apollo/subscriptions.ts
import { gql } from '@apollo/client';

export const REGISTRATION_UPDATED = gql`
  subscription RegistrationUpdated($eventId: ID!) {
    registrationUpdated(eventId: $eventId) {
      id
      fullName
      paymentStatus
      checkedIn
      createdAt
    }
  }
`;

export const MEAL_SCANNED = gql`
  subscription MealScanned($eventId: ID!) {
    mealScanned(eventId: $eventId) {
      id
      scannedAt
      registration {
        fullName
      }
      meal {
        sessionName
      }
    }
  }
`;
```

## 🎨 UI Components & Styling

### Tailwind Configuration
```javascript
// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
```

### Key Components

#### Registration Form
```typescript
// components/forms/registration-form.tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@apollo/client';
import { registrationSchema } from '@/lib/validations/registration';
import { REGISTER_ONLINE } from '@/lib/apollo/mutations';

export function RegistrationForm({ eventId }: { eventId: string }) {
  const [registerOnline, { loading }] = useMutation(REGISTER_ONLINE);
  
  const form = useForm({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      eventId,
      fullName: '',
      email: '',
      phone: '',
      address: '',
      categoryId: '',
    },
  });

  const onSubmit = async (data: any) => {
    try {
      const result = await registerOnline({
        variables: { input: data },
      });
      
      // Handle success - redirect to payment or success page
      router.push(`/registration/success?id=${result.data.registerOnline.id}`);
    } catch (error) {
      // Handle error
      toast.error('Registration failed. Please try again.');
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Form fields */}
      </form>
    </Form>
  );
}
```

#### QR Scanner Component
```typescript
// components/qr/qr-scanner.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader } from '@zxing/library';
import { useMutation } from '@apollo/client';
import { SCAN_MEAL_QR } from '@/lib/apollo/mutations';

interface QRScannerProps {
  mealId: string;
  onScanSuccess: (result: any) => void;
}

export function QRScanner({ mealId, onScanSuccess }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanMealQR] = useMutation(SCAN_MEAL_QR);

  useEffect(() => {
    const codeReader = new BrowserMultiFormatReader();
    
    const startScanning = async () => {
      try {
        setIsScanning(true);
        const result = await codeReader.decodeOnceFromVideoDevice(
          undefined,
          videoRef.current!
        );
        
        // Process QR code
        const scanResult = await scanMealQR({
          variables: {
            qrCode: result.getText(),
            mealId,
          },
        });
        
        onScanSuccess(scanResult.data.scanMealQR);
      } catch (error) {
        console.error('Scanning error:', error);
      } finally {
        setIsScanning(false);
      }
    };

    if (videoRef.current) {
      startScanning();
    }

    return () => {
      codeReader.reset();
    };
  }, [mealId, scanMealQR, onScanSuccess]);

  return (
    <div className="relative">
      <video
        ref={videoRef}
        className="w-full h-64 bg-black rounded-lg"
        autoPlay
        playsInline
      />
      {isScanning && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="animate-pulse text-white">Scanning...</div>
        </div>
      )}
    </div>
  );
}
```

## 📱 PWA Configuration

### Next.js PWA Setup
```javascript
// next.config.js
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
});

module.exports = withPWA({
  experimental: {
    appDir: true,
  },
  images: {
    domains: ['localhost'],
  },
});
```

### Manifest
```json
// public/manifest.json
{
  "name": "Event Registration System",
  "short_name": "EventReg",
  "description": "Comprehensive event registration and meal attendance system",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#000000",
  "orientation": "portrait-primary",
  "icons": [
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

## 🧪 Testing

### Component Testing
```typescript
// __tests__/components/registration-form.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing';
import { RegistrationForm } from '@/components/forms/registration-form';

const mocks = [
  {
    request: {
      query: REGISTER_ONLINE,
      variables: {
        input: {
          eventId: '1',
          fullName: 'John Doe',
          email: 'john@example.com',
        },
      },
    },
    result: {
      data: {
        registerOnline: {
          id: '1',
          fullName: 'John Doe',
          qrCode: 'QR123',
        },
      },
    },
  },
];

test('renders registration form', () => {
  render(
    <MockedProvider mocks={mocks}>
      <RegistrationForm eventId="1" />
    </MockedProvider>
  );

  expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
});
```

### Run Tests
```bash
npm run test
npm run test:watch
npm run test:coverage
```

## 🚀 Build & Deployment

### Production Build
```bash
npm run build
npm run start
```

### Static Export (if needed)
```bash
npm run export
```

### Deployment Platforms
- **Vercel**: Recommended for Next.js apps
- **Netlify**: Alternative with good performance
- **AWS Amplify**: Enterprise solution
- **Docker**: Containerized deployment

### Docker Configuration
```dockerfile
# Dockerfile
FROM node:18-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:18-alpine AS builder
WORKDIR /app
COPY . .
COPY --from=deps /app/node_modules ./node_modules
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV production

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
CMD ["node", "server.js"]
```

## 📊 Performance Optimization

- **Code Splitting**: Automatic with Next.js App Router
- **Image Optimization**: Next.js Image component
- **Bundle Analysis**: `npm run analyze`
- **Caching**: Apollo Client cache + SWR patterns
- **Lazy Loading**: Dynamic imports for heavy components
- **Service Worker**: PWA caching strategies

## 🔒 Security

- **CSP Headers**: Content Security Policy
- **HTTPS Enforcement**: Production requirement
- **Input Sanitization**: Form validation with Zod
- **XSS Prevention**: React's built-in protection
- **Authentication**: JWT token management
- **Environment Variables**: Secure configuration

## 🤝 Contributing

1. Follow React/Next.js best practices
2. Use TypeScript for type safety
3. Write tests for new components
4. Follow the established folder structure
5. Use ESLint and Prettier for code formatting

## 📞 Support

For frontend-specific issues, contact the development team or create an issue in the repository.

---

© 2024 Elira Technologies. All rights reserved.
