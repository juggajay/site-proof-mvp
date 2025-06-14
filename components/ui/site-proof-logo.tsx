import { cn } from '@/lib/utils'
import { ShieldCheck } from 'lucide-react'

interface SiteProofLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showText?: boolean
  className?: string
}

const sizeConfig = {
  sm: {
    icon: 'h-6 w-6',
    text: 'text-lg',
    container: 'gap-2'
  },
  md: {
    icon: 'h-8 w-8',
    text: 'text-xl',
    container: 'gap-3'
  },
  lg: {
    icon: 'h-10 w-10',
    text: 'text-2xl',
    container: 'gap-3'
  },
  xl: {
    icon: 'h-12 w-12',
    text: 'text-3xl',
    container: 'gap-4'
  }
}

export function SiteProofLogo({ 
  size = 'md', 
  showText = true, 
  className 
}: SiteProofLogoProps) {
  const config = sizeConfig[size]
  
  return (
    <div className={cn(
      'flex items-center',
      config.container,
      className
    )}>
      {/* Site-Proof Logo Icon */}
      <div 
        className={cn(
          'rounded-lg flex items-center justify-center',
          config.icon
        )}
        style={{ 
          background: 'var(--site-proof-clarity-blue)',
          color: 'var(--site-proof-white)'
        }}
      >
        <ShieldCheck className={cn(config.icon, 'p-1')} />
      </div>
      
      {/* Site-Proof Brand Text */}
      {showText && (
        <div className="flex flex-col">
          <span 
            className={cn(
              'font-heading font-bold leading-none',
              config.text
            )}
            style={{ color: 'var(--site-proof-charcoal)' }}
          >
            Site-Proof
          </span>
          {(size === 'lg' || size === 'xl') && (
            <span 
              className="text-xs font-primary opacity-75 leading-none mt-1"
              style={{ color: 'var(--site-proof-charcoal)' }}
            >
              Quality Assurance Platform
            </span>
          )}
        </div>
      )}
    </div>
  )
}