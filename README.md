# Civil Q - Site Proof MVP

A clean, modern Next.js 14 application with Supabase authentication for construction site quality assurance and project management.

## 🚀 Features

- **Clean Architecture**: Built from scratch with Next.js 14 App Router
- **TypeScript**: Full type safety throughout the application
- **Tailwind CSS**: Modern, responsive styling
- **Supabase Authentication**: Secure user authentication with SSR support
- **Robust Error Handling**: Graceful degradation when environment variables are missing
- **Vercel Ready**: Optimized for deployment on Vercel

## 🛠️ Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- A Supabase account (for authentication)

### Installation

1. **Clone and install dependencies:**
   ```bash
   cd civil-q-app
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.local.example .env.local
   ```
   
   Edit `.env.local` with your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

3. **Run the development server:**
   ```bash
   npm run dev
   ```

4. **Open [http://localhost:3000](http://localhost:3000)** in your browser.

## 🔧 Supabase Setup

1. **Create a new Supabase project** at [supabase.com](https://supabase.com)

2. **Get your project credentials:**
   - Go to Settings → API
   - Copy your Project URL and anon/public key
   - Add them to your `.env.local` file

3. **Set up authentication:**
   - Go to Authentication → Settings
   - Configure your site URL (e.g., `http://localhost:3000` for development)
   - Enable email authentication or other providers as needed

## 📁 Project Structure

```
civil-q-app/
├── app/                    # Next.js 14 App Router
│   ├── login/             # Authentication pages
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page
│   └── globals.css        # Global styles
├── lib/
│   └── supabase/          # Supabase client configurations
│       ├── client.ts      # Browser client
│       ├── server.ts      # Server client
│       └── middleware.ts  # Middleware client
├── middleware.ts          # Next.js middleware for auth
└── README.md
```

## 🔐 Authentication Flow

- **Middleware Protection**: Automatically redirects unauthenticated users to login
- **Graceful Degradation**: Works even when Supabase env vars are missing
- **SSR Support**: Full server-side rendering with authentication state
- **Clean Error Handling**: No blank screens or infinite redirects

## 🚀 Deployment

### Vercel (Recommended)

1. **Push to GitHub** (or your preferred Git provider)

2. **Connect to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Import your repository
   - Vercel will auto-detect Next.js settings

3. **Add environment variables in Vercel:**
   - Go to Project Settings → Environment Variables
   - Add your Supabase credentials:
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

4. **Update Supabase settings:**
   - Add your Vercel domain to Supabase Auth settings
   - Update site URL and redirect URLs

## 🧪 Development Notes

- **No Blank Screens**: The middleware gracefully handles missing environment variables
- **Clean Patterns**: Uses official Supabase SSR patterns for Next.js 14
- **Type Safety**: Full TypeScript support throughout
- **Modern Stack**: Latest versions of Next.js, React, and Supabase

## 📝 Next Steps

This is a clean foundation ready for:
- Adding your Site Proof MVP features
- Implementing project management functionality
- Adding construction site quality assurance tools
- Extending with additional Supabase features (database, storage, etc.)

## 🆘 Troubleshooting

**Blank Screen Issues:**
- Check that environment variables are properly set
- Verify Supabase project URL and keys are correct
- Check browser console for any errors

**Authentication Issues:**
- Ensure Supabase site URL matches your domain
- Check that email authentication is enabled in Supabase
- Verify redirect URLs are configured correctly

## 🤝 Contributing

This is a clean, well-structured foundation built with best practices. Feel free to extend it with your specific Site Proof MVP requirements.