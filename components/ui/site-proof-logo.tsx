import React from 'react'
import { Check } from 'lucide-react'
import { cn } from '../../lib/utils'

interface SiteProofLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showText?: boolean
  className?: string
  variant?: 'default' | 'white' | 'dark'
}

const sizeClasses = {
  sm: {
    container: 'h-8',
    diamond: 'w-6 h-6',
    check: 'w-3 h-3',
    text: 'text-sm',
    tagline: 'text-xs'
  },
  md: {
    container: 'h-10',
    diamond: 'w-8 h-8',
    check: 'w-4 h-4',
    text: 'text-base',
    tagline: 'text-sm'
  },
  lg: {
    container: 'h-16',
    diamond: 'w-12 h-12',
    check: 'w-6 h-6',
    text: 'text-xl',
    tagline: 'text-base'
  },
  xl: {
    container: 'h-24',
    diamond: 'w-20 h-20',
    check: 'w-10 h-10',
    text: 'text-3xl',
    tagline: 'text-lg'
  }
}

export function SiteProofLogo({ 
  size = 'md', 
  showText = true, 
  className,
  variant = 'default'
}: SiteProofLogoProps) {
  const sizes = sizeClasses[size]
  
  const getTextColor = () => {
    switch (variant) {
      case 'white':
        return 'text-white'
      case 'dark':
        return 'text-slate-900'
      default:
        return 'text-slate-900'
    }
  }

  return (
    <div className={cn('flex items-center gap-3', sizes.container, className)}>
      {/* Diamond Logo with Checkmark */}
      <div className="relative">
        {/* Outer Diamond Border */}
        <div 
          className={cn(
            'relative transform rotate-45 border-2 border-yellow-400 bg-gradient-to-br from-yellow-400 to-yellow-500',
            sizes.diamond
          )}
          style={{
            borderRadius: '4px'
          }}
        >
          {/* Inner Diamond */}
          <div 
            className="absolute inset-1 bg-gradient-to-br from-blue-800 to-blue-900 flex items-center justify-center"
            style={{
              borderRadius: '2px'
            }}
          >
            {/* Checkmark - Counter-rotate to keep it upright */}
            <Check 
              className={cn(
                'text-yellow-400 transform -rotate-45 stroke-[3]',
                sizes.check
              )}
            />
          </div>
        </div>
      </div>

      {/* Text */}
      {showText && (
        <div className="flex flex-col">
          <div className={cn(
            'font-bold tracking-wide font-heading',
            sizes.text,
            getTextColor()
          )}>
            SITE PROOF
          </div>
          {size !== 'sm' && (
            <div className={cn(
              'font-medium tracking-wider opacity-80 font-primary',
              sizes.tagline,
              getTextColor()
            )}>
              CONSTRUCTION QA SOFTWARE
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Alternative simplified version for very small spaces
export function SiteProofMark({ 
  size = 'md',
  className 
}: { 
  size?: 'xs' | 'sm' | 'md' | 'lg'
  className?: string 
}) {
  const markSizes = {
    xs: 'w-4 h-4',
    sm: 'w-6 h-6', 
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  }

  const checkSizes = {
    xs: 'w-2 h-2',
    sm: 'w-3 h-3',
    md: 'w-4 h-4', 
    lg: 'w-6 h-6'
  }

  return (
    <div className={cn('relative', className)}>
      <div 
        className={cn(
          'relative transform rotate-45 border-2 border-yellow-400 bg-gradient-to-br from-yellow-400 to-yellow-500',
          markSizes[size]
        )}
        style={{
          borderRadius: '4px'
        }}
      >
        <div 
          className="absolute inset-1 bg-gradient-to-br from-blue-800 to-blue-900 flex items-center justify-center"
          style={{
            borderRadius: '2px'
          }}
        >
          <Check 
            className={cn(
              'text-yellow-400 transform -rotate-45 stroke-[3]',
              checkSizes[size]
            )}
          />
        </div>
      </div>
    </div>
  )
}