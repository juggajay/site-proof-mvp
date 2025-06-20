# Site Proof MVP - Authentication System

A complete authentication system built with Next.js 14, TypeScript, and Tailwind CSS.

## Features

- ✅ User registration and login
- ✅ JWT-based authentication
- ✅ Password hashing with bcrypt
- ✅ Protected routes
- ✅ Session management
- ✅ Form validation
- ✅ Responsive UI with Tailwind CSS
- ✅ TypeScript support
- ✅ Server actions for form handling
- ✅ API routes for client-side authentication
- ✅ Comprehensive testing suite (Unit, Integration, E2E)
- ✅ Performance and accessibility testing
- ✅ Test automation and CI/CD ready

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd site-proof-mvp
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```
Edit `.env.local` and update the `JWT_SECRET` with a secure random string.

4. Start the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
├── app/
│   ├── auth/
│   │   ├── login/page.tsx          # Login page
│   │   └── signup/page.tsx         # Signup page
│   ├── api/
│   │   └── auth/
│   │       ├── login/route.ts      # Login API endpoint
│   │       ├── signup/route.ts     # Signup API endpoint
│   │       ├── me/route.ts         # Get current user endpoint
│   │       └── logout/route.ts     # Logout API endpoint
│   ├── dashboard/page.tsx          # Protected dashboard page
│   ├── layout.tsx                  # Root layout with AuthProvider
│   ├── page.tsx                    # Home page (redirects)
│   └── globals.css                 # Global styles
├── contexts/
│   └── auth-context.tsx            # Authentication context
├── lib/
│   └── actions.ts                  # Server actions
├── database-schema.sql             # Database schema
└── [config files]
```

## Authentication Flow

1. **Registration**: Users can create accounts with email/password
2. **Login**: Users authenticate with email/password
3. **Session Management**: JWT tokens stored in HTTP-only cookies
4. **Protected Routes**: Dashboard requires authentication
5. **Logout**: Clears authentication tokens

## Database Integration

Currently uses in-memory mock data. To integrate with a real database:

1. Install your preferred database library (e.g., `pg` for PostgreSQL)
2. Replace mock functions in `lib/actions.ts` with actual database calls
3. Run the SQL schema from `database-schema.sql`
4. Update environment variables with database connection details

## Security Features

- ✅ Password hashing with bcrypt (12 rounds)
- ✅ JWT tokens with expiration
- ✅ HTTP-only cookies
- ✅ CSRF protection via SameSite cookies
- ✅ Input validation and sanitization
- ✅ Secure headers in production

## API Endpoints

- `POST /api/auth/signup` - Create new user account
- `POST /api/auth/login` - Authenticate user
- `GET /api/auth/me` - Get current user info
- `POST /api/auth/logout` - Clear authentication

## Technologies Used

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first CSS framework
- **bcryptjs** - Password hashing
- **jsonwebtoken** - JWT token generation/verification
- **React Context** - State management
- **Jest** - Testing framework
- **React Testing Library** - Component testing
- **Playwright** - End-to-end testing

## Development Notes

### Current Implementation Status

✅ **Complete and Working:**
- User registration and login forms
- Password hashing and validation
- JWT token generation and verification
- Authentication context and state management
- Protected routes and redirects
- Form validation and error handling
- Responsive UI components
- Comprehensive testing suite (Unit, Integration, E2E)
- Performance and accessibility testing
- Test automation and CI/CD setup

⚠️ **Mock Implementation (Ready for Database Integration):**
- User data storage (currently in-memory)
- Profile management
- Organization relationships

### Next Steps for Production

1. **Database Integration**: Replace mock storage with PostgreSQL/MySQL
2. **Email Verification**: Add email confirmation flow
3. **Password Reset**: Implement forgot password functionality
4. **Rate Limiting**: Add authentication attempt limits
5. **Social Login**: Add Google/GitHub OAuth
6. **Monitoring**: Add error tracking and analytics
7. **Performance Optimization**: Implement caching and optimization strategies

## Testing

This project includes a comprehensive testing suite covering unit tests, integration tests, and end-to-end tests.

### Quick Start

```bash
# Setup test environment
node scripts/test-runner.js setup

# Run all tests
node scripts/test-runner.js all

# Run unit tests only
npm run test

# Run E2E tests only
npm run test:e2e

# Run tests with coverage
npm run test:coverage
```

### Test Categories

- **Unit Tests**: Component and function testing with Jest and React Testing Library
- **Integration Tests**: API routes and server actions testing
- **End-to-End Tests**: Complete user workflows with Playwright
- **Accessibility Tests**: WCAG compliance and accessibility testing
- **Performance Tests**: Component rendering and interaction performance

### Coverage

Current test coverage includes:
- Authentication system (100% critical paths)
- Form components and validation
- Modal interactions and state management
- API routes and error handling
- User workflows and navigation

For detailed testing documentation, see [TESTING.md](./TESTING.md).

## License

MIT License