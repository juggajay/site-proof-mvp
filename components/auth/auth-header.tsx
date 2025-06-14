import { SiteProofLogo } from '../ui/site-proof-logo'

export function AuthHeader() {
  return (
    <div className="flex flex-col items-center justify-center space-y-6 bg-white border-b border-slate-200 py-8">
      <SiteProofLogo size="lg" showText={true} />
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-slate-900 font-heading">
          Welcome to Site-Proof
        </h1>
        <p className="text-slate-600 font-primary max-w-md">
          Professional construction quality assurance software for Australian building standards
        </p>
      </div>
    </div>
  )
}