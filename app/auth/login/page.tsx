'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '../../../lib/supabase/client'
import { AuthHeader } from '../../../components/auth/auth-header'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Label } from '../../../components/ui/label'
import { Eye, EyeOff, Mail, Lock, AlertCircle } from 'lucide-react'

/* Site-Proof Professional B2B Login Page - Exact Landing Page Implementation */

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setError(error.message)
        setIsLoading(false)
        return
      }

      // Successful login - redirect to dashboard
      router.push('/dashboard')
    } catch (error) {
      setError('An unexpected error occurred. Please try again.')
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <AuthHeader />
      
      <div className="flex items-center justify-center py-6 sm:py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-6 sm:space-y-8">
          <div className="bg-white rounded-xl shadow-sm border border-[#DEE2E6] p-6 sm:p-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-[#2C3E50] font-heading">
                Sign In
              </h2>
              <p className="text-[#6C757D] mt-2 font-primary">
                Access your Site-Proof dashboard
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-[#FEF2F2] border border-[#FECACA] rounded-lg flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-[#DC3545] flex-shrink-0" />
                <p className="text-sm text-[#DC3545] font-primary">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="email" className="text-[#2C3E50] font-medium font-primary">
                  Email Address
                </Label>
                <div className="mt-2 relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[#6C757D]" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="pl-10 h-12 border-[#DEE2E6] focus:border-[#1B4F72] focus:ring-[#1B4F72] font-primary"
                    placeholder="Enter your email"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="password" className="text-[#2C3E50] font-medium font-primary">
                  Password
                </Label>
                <div className="mt-2 relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[#6C757D]" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pl-10 pr-10 h-12 border-[#DEE2E6] focus:border-[#1B4F72] focus:ring-[#1B4F72] font-primary"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#6C757D] hover:text-[#2C3E50] transition-colors duration-200"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-[#1B4F72] focus:ring-[#1B4F72] border-[#DEE2E6] rounded"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-[#2C3E50] font-primary">
                    Remember me
                  </label>
                </div>

                <div className="text-sm">
                  <Link
                    href="/auth/forgot-password"
                    className="font-medium text-[#1B4F72] hover:text-[#2C3E50] transition-colors duration-200 font-primary"
                  >
                    Forgot your password?
                  </Link>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 bg-[#1B4F72] hover:bg-[#2C3E50] text-white text-base font-semibold font-primary transition-colors duration-200"
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-[#6C757D] font-primary">
                Don't have an account?{' '}
                <Link
                  href="/auth/signup"
                  className="font-medium text-[#1B4F72] hover:text-[#2C3E50] transition-colors duration-200"
                >
                  Start your free trial
                </Link>
              </p>
            </div>

            <div className="mt-6 text-center">
              <p className="text-xs text-[#6C757D] font-primary">
                By signing in, you agree to our{' '}
                <Link href="/terms" className="text-[#1B4F72] hover:underline">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link href="/privacy" className="text-[#1B4F72] hover:underline">
                  Privacy Policy
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}