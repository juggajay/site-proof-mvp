import Link from 'next/link'
import { SiteProofLogo } from '../components/ui/site-proof-logo'
import { Home, Search } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="max-w-md w-full bg-white shadow-lg rounded-xl p-8 text-center border border-slate-200">
        <div className="mb-6">
          <SiteProofLogo size="md" showText={true} className="mx-auto mb-6" />
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 mb-4">
            <Search className="h-8 w-8 text-blue-800" />
          </div>
        </div>
        <h2 className="text-xl font-semibold text-slate-900 mb-3 font-heading">
          Page Not Found
        </h2>
        <p className="text-slate-600 mb-6 font-primary">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center w-full bg-blue-800 text-white px-6 py-3 rounded-lg hover:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-800 focus:ring-offset-2 transition-colors font-medium"
        >
          <Home className="mr-2 h-4 w-4" />
          Return Home
        </Link>
        <p className="text-xs text-slate-500 mt-4">
          Need help? Contact our support team for assistance.
        </p>
      </div>
    </div>
  )
}