# 🔧 Environment Variables Setup

After deployment, follow these steps to configure Supabase:

## 1. Vercel Environment Variables

In your Vercel dashboard:

1. Go to your project settings
2. Navigate to "Environment Variables"
3. Add these variables:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 2. Supabase Project Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Settings → API
3. Copy your Project URL and anon key
4. Add them to Vercel environment variables

## 3. Authentication Configuration

In Supabase:
1. Go to Authentication → Settings
2. Set Site URL to your Vercel domain
3. Add redirect URLs:
   - `https://your-app.vercel.app/auth/callback`

## 4. Test Deployment

1. Visit your deployed app
2. Test the login page
3. Verify no blank screens
4. Check authentication flow

## 🎉 Success!

Your clean Civil Q application is now deployed with:
- ✅ No blank screen issues
- ✅ Robust error handling
- ✅ Professional UI
- ✅ Ready for Supabase auth