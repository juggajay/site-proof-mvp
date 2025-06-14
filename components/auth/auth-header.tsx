import { SiteProofLogo } from '../ui/site-proof-logo'

export function AuthHeader() {
  return (
    <div className="flex flex-col items-center space-y-4 text-center">
      <SiteProofLogo size="xl" showText={true} className="mb-4" />
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight font-heading">
          Welcome to Site Proof
        </h1>
        <p className="text-sm text-muted-foreground font-primary">
          Professional construction quality assurance software
        </p>
      </div>
    </div>
  )
}