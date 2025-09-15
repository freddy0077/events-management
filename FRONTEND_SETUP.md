# Frontend Setup Guide

## 1. Install Dependencies

```bash
cd frontend
npm install
```

## 2. Create Environment File

Copy the `.env.example` to `.env.local` in the frontend directory:

```bash
cp .env.example .env.local
```

## 3. Update Environment Variables

Edit the `.env.local` file:

```env
# GraphQL API Configuration
NEXT_PUBLIC_GRAPHQL_URL=http://localhost:3001/graphql

# Application Configuration
NEXT_PUBLIC_APP_NAME="EventReg"
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Authentication Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET="your-nextauth-secret-key-change-in-production"

# Payment Configuration (Optional for now)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_your_stripe_publishable_key"
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY="pk_test_your_paystack_public_key"
```

## 4. Start Development Server

```bash
npm run dev
```

## 5. Verify Setup

- Frontend should start on http://localhost:3000
- Test pages:
  - Homepage: http://localhost:3000
  - Login: http://localhost:3000/login
  - Events: http://localhost:3000/events
  - Admin: http://localhost:3000/admin (requires login)

## 6. Test Authentication

Use these seeded accounts:

**Admin Access:**
- Email: admin@elira.com
- Password: admin123

**Moderator Access:**
- Email: moderator@elira.com  
- Password: moderator123

**User Access:**
- Email: user@elira.com
- Password: user123

## 7. Test QR Code and Badge Printing

1. Login as admin
2. Go to Admin → Registrations
3. Click on any registration
4. Generate QR code
5. Preview and print badge

## Troubleshooting

### GraphQL Connection Error
- Ensure backend is running on port 3001
- Check NEXT_PUBLIC_GRAPHQL_URL in .env.local
- Verify CORS_ORIGIN in backend .env matches frontend URL

### Authentication Issues
- Clear browser localStorage and cookies
- Check JWT_SECRET matches between frontend and backend
- Verify user exists in database (run seeder if needed)

### Build Errors
- Clear Next.js cache: `rm -rf .next`
- Reinstall dependencies: `rm -rf node_modules && npm install`
