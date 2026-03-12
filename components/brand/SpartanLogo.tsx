'use client'

import { cn } from '@/lib/utils'

interface SpartanLogoProps {
  className?: string
  size?: number
  color?: string
}

/**
 * SpartanLab Logo - Minimal Spartan Helmet Icon
 * 
 * A clean, geometric Spartan helmet silhouette designed for modern SaaS aesthetics.
 * Features a recognizable crest, eye slit with red accent, and chin guard.
 */
export function SpartanLogo({ 
  className, 
  size = 32, 
  color = 'currentColor' 
}: SpartanLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('flex-shrink-0', className)}
      aria-label="SpartanLab"
    >
      {/* Helmet base shape */}
      <path
        d="M16 2C16 2 8 4 8 12V20C8 24 10 28 16 30C22 28 24 24 24 20V12C24 4 16 2 16 2Z"
        fill={color}
      />
      {/* Crest */}
      <path
        d="M16 1L16 8"
        stroke={color}
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path
        d="M14 2.5C14 2.5 16 4 16 8"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M18 2.5C18 2.5 16 4 16 8"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
      />
      {/* Eye slit - red accent */}
      <rect
        x="10"
        y="14"
        width="12"
        height="3"
        rx="1"
        fill="#C1121F"
      />
      {/* Nose guard */}
      <path
        d="M16 17V24"
        stroke="#0F1115"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}

/**
 * Alternative cleaner version - more geometric and minimal
 */
export function SpartanLogoMinimal({ 
  className, 
  size = 32, 
  color = '#E6E9EF'
}: SpartanLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('flex-shrink-0', className)}
      aria-label="SpartanLab"
    >
      {/* Helmet outer shape - shield/helmet hybrid */}
      <path
        d="M16 3L7 8V18C7 23 10 27 16 29C22 27 25 23 25 18V8L16 3Z"
        fill={color}
        fillOpacity="0.1"
        stroke={color}
        strokeWidth="1.5"
      />
      {/* Crest - simplified mohawk shape */}
      <path
        d="M16 1V9"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
      />
      {/* Eye slit with red accent */}
      <rect
        x="9"
        y="13"
        width="14"
        height="2.5"
        rx="1.25"
        fill="#C1121F"
      />
      {/* Face plate / chin guard outline */}
      <path
        d="M11 18C11 18 13 22 16 22C19 22 21 18 21 18"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

/**
 * Primary brand logo - clean geometric Spartan helmet
 */
export function SpartanIcon({ 
  className, 
  size = 32
}: Omit<SpartanLogoProps, 'color'>) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('flex-shrink-0', className)}
      aria-label="SpartanLab"
    >
      {/* Helmet silhouette */}
      <path
        d="M16 4C10 4 8 8 8 13V19C8 24 11 28 16 28C21 28 24 24 24 19V13C24 8 22 4 16 4Z"
        fill="#E6E9EF"
      />
      {/* Crest */}
      <rect x="14" y="1" width="4" height="8" rx="2" fill="#E6E9EF" />
      {/* Eye slit - signature red */}
      <rect x="10" y="13" width="12" height="3" rx="1.5" fill="#C1121F" />
      {/* Vertical nose/face divide */}
      <rect x="15" y="16" width="2" height="8" fill="#1A1F26" />
    </svg>
  )
}

interface SpartanLogoWithTextProps {
  className?: string
  iconSize?: number
  showText?: boolean
  textClassName?: string
}

/**
 * Logo + Wordmark combination
 */
export function SpartanLogoWithText({ 
  className,
  iconSize = 28,
  showText = true,
  textClassName
}: SpartanLogoWithTextProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <SpartanIcon size={iconSize} />
      {showText && (
        <span className={cn('text-lg font-bold tracking-tight', textClassName)}>
          SpartanLab
        </span>
      )}
    </div>
  )
}

interface SpartanAppIconProps {
  className?: string
  size?: number
  variant?: 'dark' | 'light'
}

/**
 * App Icon - Helmet centered in a container
 * Suitable for favicons, app icons, and social sharing
 */
export function SpartanAppIcon({ 
  className, 
  size = 64,
  variant = 'dark'
}: SpartanAppIconProps) {
  const bgColor = variant === 'dark' ? '#0F1115' : '#E6E9EF'
  const helmetColor = variant === 'dark' ? '#E6E9EF' : '#0F1115'
  const dividerColor = variant === 'dark' ? '#0F1115' : '#E6E9EF'
  
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('flex-shrink-0', className)}
      aria-label="SpartanLab"
    >
      {/* Background */}
      <rect width="64" height="64" rx="14" fill={bgColor} />
      
      {/* Centered helmet */}
      <g transform="translate(16, 12)">
        {/* Helmet silhouette */}
        <path
          d="M16 6C10 6 8 10 8 15V21C8 26 11 30 16 32C21 30 24 26 24 21V15C24 10 22 6 16 6Z"
          fill={helmetColor}
        />
        {/* Crest */}
        <rect x="14" y="2" width="4" height="9" rx="2" fill={helmetColor} />
        {/* Eye slit - signature red */}
        <rect x="10" y="15" width="12" height="3.5" rx="1.75" fill="#C1121F" />
        {/* Vertical nose/face divide */}
        <rect x="15" y="18.5" width="2" height="9" fill={dividerColor} />
      </g>
    </svg>
  )
}

/**
 * Favicon variant - extra simplified for tiny sizes
 */
export function SpartanFavicon({ 
  className, 
  size = 32,
  variant = 'dark'
}: SpartanAppIconProps) {
  const bgColor = variant === 'dark' ? '#0F1115' : '#E6E9EF'
  const helmetColor = variant === 'dark' ? '#E6E9EF' : '#0F1115'
  
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('flex-shrink-0', className)}
      aria-label="SpartanLab"
    >
      {/* Background */}
      <rect width="32" height="32" rx="6" fill={bgColor} />
      
      {/* Simplified helmet for small sizes */}
      <g transform="translate(6, 4)">
        {/* Helmet body */}
        <path
          d="M10 4C6 4 5 7 5 10V14C5 17 7 20 10 21C13 20 15 17 15 14V10C15 7 14 4 10 4Z"
          fill={helmetColor}
        />
        {/* Crest */}
        <rect x="8" y="1" width="4" height="6" rx="2" fill={helmetColor} />
        {/* Eye slit */}
        <rect x="6" y="10" width="8" height="2.5" rx="1.25" fill="#C1121F" />
      </g>
    </svg>
  )
}

// Export a simple icon component that matches Lucide's interface
export function SpartanHelmetIcon({ 
  className, 
  size = 24 
}: { 
  className?: string
  size?: number 
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Helmet */}
      <path
        d="M12 3C7.5 3 6 6 6 9.5V14C6 17.5 8 21 12 21C16 21 18 17.5 18 14V9.5C18 6 16.5 3 12 3Z"
        fill="currentColor"
      />
      {/* Crest */}
      <rect x="10.5" y="1" width="3" height="6" rx="1.5" fill="currentColor" />
      {/* Eye slit */}
      <rect x="7.5" y="10" width="9" height="2" rx="1" fill="#C1121F" />
      {/* Face divide */}
      <rect x="11" y="12" width="2" height="6" fill="#0F1115" />
    </svg>
  )
}
