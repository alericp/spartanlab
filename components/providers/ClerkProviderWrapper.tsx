'use client'

/**
 * ClerkProviderWrapper - Production-safe Clerk integration
 * 
 * Architecture:
 * 1. Check domain SYNCHRONOUSLY before any effect runs
 * 2. If not on production domain, never attempt to load Clerk
 * 3. Use static import with error boundary for production safety
 * 4. Provide context for child components to check auth availability
 * 
 * CRITICAL: Uses try/catch error boundary to prevent auth failures from crashing the app
 */

import { ReactNode, createContext, useContext, useState, useEffect, Component, ErrorInfo } from 'react'

// Type for auth mode - defined here to avoid import issues
type AuthMode = 'preview' | 'production'

// Lazy-loaded auth environment functions
// These are loaded dynamically in useEffect to prevent module-level crashes
let authEnvModule: typeof import('@/lib/auth-environment') | null = null

async function loadAuthEnv() {
  if (authEnvModule) return authEnvModule
  try {
    authEnvModule = await import('@/lib/auth-environment')
    return authEnvModule
  } catch {
    return null
  }
}

// ============================================================================
// ERROR BOUNDARY
// ============================================================================

interface ErrorBoundaryProps {
  children: ReactNode
  fallback: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

class ClerkErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ClerkErrorBoundary] Auth error caught:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback
    }
    return this.props.children
  }
}

// ============================================================================
// CONTEXT - Single source of truth for Clerk state and components
// ============================================================================

// Type for Clerk components we expose via context
type ClerkComponentType<P = object> = React.ComponentType<P> | null

interface ClerkAvailabilityContextValue {
  /**
   * True only when Clerk is loaded and ready on a production domain
   */
  isClerkAvailable: boolean
  /**
   * True when we're in preview mode (non-production domain with prod keys)
   */
  isPreviewMode: boolean
  /**
   * True while determining auth availability
   */
  isLoading: boolean
  /**
   * Current auth mode
   */
  authMode: AuthMode
  /**
   * True if there was an error loading Clerk
   */
  hasError: boolean
  /**
   * Clerk components - only available when isClerkAvailable is true
   * These are the ONLY source for Clerk components in the app
   */
  components: {
    SignIn: ClerkComponentType<{
      appearance?: Record<string, unknown>
      fallbackRedirectUrl?: string
      signUpUrl?: string
    }>
    SignUp: ClerkComponentType<{
      appearance?: Record<string, unknown>
      fallbackRedirectUrl?: string
      signInUrl?: string
    }>
    SignedIn: ClerkComponentType<{ children: React.ReactNode }>
    SignedOut: ClerkComponentType<{ children: React.ReactNode }>
    UserButton: ClerkComponentType<{ afterSignOutUrl?: string }>
  }
}

const defaultContextValue: ClerkAvailabilityContextValue = {
  isClerkAvailable: false,
  isPreviewMode: true,
  isLoading: true,
  authMode: 'preview',
  hasError: false,
  components: {
    SignIn: null,
    SignUp: null,
    SignedIn: null,
    SignedOut: null,
    UserButton: null,
  },
}

const ClerkAvailabilityContext = createContext<ClerkAvailabilityContextValue>(defaultContextValue)

/**
 * Hook to check Clerk availability status and access Clerk components
 * This is the ONLY way to access Clerk components in the app
 */
export function useClerkAvailability() {
  return useContext(ClerkAvailabilityContext)
}

// ============================================================================
// CLERK MODULE LOADER - Safe dynamic import
// ============================================================================

// Module cache to prevent multiple imports
let clerkModuleCache: Promise<typeof import('@clerk/nextjs') | null> | null = null

/**
 * Safely load Clerk module with proper error handling
 */
async function loadClerkModule(): Promise<typeof import('@clerk/nextjs') | null> {
  if (clerkModuleCache) {
    return clerkModuleCache
  }

  clerkModuleCache = (async () => {
    try {
      // Direct dynamic import - Next.js handles this properly
      const mod = await import('@clerk/nextjs')
      return mod
    } catch (error) {
      console.error('[ClerkProviderWrapper] Failed to load Clerk module:', error)
      return null
    }
  })()

  return clerkModuleCache
}

// ============================================================================
// CLERK APPEARANCE
// ============================================================================

const clerkAppearance = {
  elements: {
    rootBox: 'font-sans',
    card: 'bg-[#1A1F26] border border-[#2B313A] shadow-xl',
    headerTitle: 'text-[#E6E9EF]',
    headerSubtitle: 'text-[#A4ACB8]',
    socialButtonsBlockButton: 'bg-[#2B313A] border-[#3A3A3A] text-[#E6E9EF] hover:bg-[#3A3A3A]',
    socialButtonsBlockButtonText: 'text-[#E6E9EF]',
    dividerLine: 'bg-[#2B313A]',
    dividerText: 'text-[#A4ACB8]',
    formFieldLabel: 'text-[#A4ACB8]',
    formFieldInput: 'bg-[#0F1115] border-[#2B313A] text-[#E6E9EF] focus:border-[#C1121F] focus:ring-[#C1121F]/20',
    formButtonPrimary: 'bg-[#C1121F] hover:bg-[#A30F1A] text-white',
    footerActionLink: 'text-[#C1121F] hover:text-[#A30F1A]',
    identityPreviewText: 'text-[#E6E9EF]',
    identityPreviewEditButton: 'text-[#C1121F]',
    userButtonPopoverCard: 'bg-[#1A1F26] border border-[#2B313A]',
    userButtonPopoverActionButton: 'text-[#E6E9EF] hover:bg-[#2B313A]',
    userButtonPopoverActionButtonText: 'text-[#E6E9EF]',
    userButtonPopoverActionButtonIcon: 'text-[#A4ACB8]',
    userButtonPopoverFooter: 'hidden',
    userPreviewMainIdentifier: 'text-[#E6E9EF]',
    userPreviewSecondaryIdentifier: 'text-[#A4ACB8]',
  },
}

// ============================================================================
// PROVIDER COMPONENT
// ============================================================================

interface Props {
  children: ReactNode
}

export function ClerkProviderWrapper({ children }: Props) {
  // Track hydration and initialization decision
  const [initDecision, setInitDecision] = useState<{
    decided: boolean
    shouldInit: boolean
    authMode: AuthMode
  }>({ decided: false, shouldInit: false, authMode: 'preview' })
  
  const [state, setState] = useState<ClerkAvailabilityContextValue>(() => ({
    isClerkAvailable: false,
    isPreviewMode: false, // Don't assume preview until we check on client
    isLoading: true, // Start loading until we determine mode
    authMode: 'preview',
    hasError: false,
    components: {
      SignIn: null,
      SignUp: null,
      SignedIn: null,
      SignedOut: null,
      UserButton: null,
    },
  }))
  
  const [ClerkProvider, setClerkProvider] = useState<React.ComponentType<{
    children: ReactNode
    appearance?: Record<string, unknown>
    signInUrl?: string
    signUpUrl?: string
    signInFallbackRedirectUrl?: string
    signUpFallbackRedirectUrl?: string
  }> | null>(null)

  // Effect 1: Determine if we should initialize Clerk (runs once on hydration)
  useEffect(() => {
    console.log('[v0] ClerkProvider: 1. init effect running')
    loadAuthEnv().then(authEnv => {
      const shouldInit = authEnv?.shouldInitializeClerk?.() ?? false
      const authMode = authEnv?.getAuthMode?.() ?? 'preview'
      console.log('[v0] ClerkProvider: 2. auth decision:', { shouldInit, authMode })
      
      setInitDecision({ decided: true, shouldInit, authMode })
      
      // If we shouldn't init, immediately set to preview mode
      if (!shouldInit) {
        setState({
          isClerkAvailable: false,
          isPreviewMode: true,
          isLoading: false,
          authMode: authMode,
          hasError: false,
          components: {
            SignIn: null,
            SignUp: null,
            SignedIn: null,
            SignedOut: null,
            UserButton: null,
          },
        })
      }
    }).catch(() => {
      // Auth env failed to load - default to preview mode
      setInitDecision({ decided: true, shouldInit: false, authMode: 'preview' })
      setState({
        isClerkAvailable: false,
        isPreviewMode: true,
        isLoading: false,
        authMode: 'preview',
        hasError: false,
        components: {
          SignIn: null,
          SignUp: null,
          SignedIn: null,
          SignedOut: null,
          UserButton: null,
        },
      })
    })
  }, [])

  // Effect 2: Load Clerk if we should initialize it
  useEffect(() => {
    // Wait for init decision
    if (!initDecision.decided) return
    
    // Don't load if we shouldn't init
    if (!initDecision.shouldInit) return

    let cancelled = false

    console.log('[v0] ClerkProvider: 3. loading Clerk module...')
    loadClerkModule()
      .then(mod => {
        if (cancelled) return
        console.log('[v0] ClerkProvider: 4. Clerk module loaded:', { hasProvider: !!mod?.ClerkProvider, hasSignUp: !!mod?.SignUp })
        
        if (mod?.ClerkProvider) {
          setClerkProvider(() => mod.ClerkProvider)
          console.log('[v0] ClerkProvider: 5. Clerk ready, setting state')
          setState({
            isClerkAvailable: true,
            isPreviewMode: false,
            isLoading: false,
            authMode: 'production',
            hasError: false,
            components: {
              SignIn: mod.SignIn || null,
              SignUp: mod.SignUp || null,
              SignedIn: mod.SignedIn || null,
              SignedOut: mod.SignedOut || null,
              UserButton: mod.UserButton || null,
            },
          })
        } else {
          // Clerk module failed to load - fallback to preview mode gracefully
          setState({
            isClerkAvailable: false,
            isPreviewMode: true,
            isLoading: false,
            authMode: 'preview',
            hasError: true,
            components: {
              SignIn: null,
              SignUp: null,
              SignedIn: null,
              SignedOut: null,
              UserButton: null,
            },
          })
        }
      })
      .catch(error => {
        if (cancelled) return
        console.error('[ClerkProviderWrapper] Error loading Clerk:', error)
        setState({
          isClerkAvailable: false,
          isPreviewMode: true,
          isLoading: false,
          authMode: 'preview',
          hasError: true,
          components: {
            SignIn: null,
            SignUp: null,
            SignedIn: null,
            SignedOut: null,
            UserButton: null,
          },
        })
      })

    return () => {
      cancelled = true
    }
  }, [initDecision])

  // Still determining mode or loading Clerk
  if (!initDecision.decided || (initDecision.shouldInit && !ClerkProvider && !state.hasError)) {
    return (
      <ClerkAvailabilityContext.Provider value={state}>
        {children}
      </ClerkAvailabilityContext.Provider>
    )
  }

  // Preview mode - render children without Clerk
  if (!initDecision.shouldInit || !ClerkProvider) {
    return (
      <ClerkAvailabilityContext.Provider value={state}>
        {children}
      </ClerkAvailabilityContext.Provider>
    )
  }

  // Fallback content for error boundary - allows app to work without auth
  const errorFallback = (
    <ClerkAvailabilityContext.Provider value={{
      isClerkAvailable: false,
      isPreviewMode: true,
      isLoading: false,
      authMode: 'preview',
      hasError: true,
      components: {
        SignIn: null,
        SignUp: null,
        SignedIn: null,
        SignedOut: null,
        UserButton: null,
      },
    }}>
      {children}
    </ClerkAvailabilityContext.Provider>
  )

  // Production mode with Clerk loaded - wrapped in error boundary for safety
  return (
    <ClerkErrorBoundary fallback={errorFallback}>
      <ClerkAvailabilityContext.Provider value={state}>
        <ClerkProvider
          appearance={clerkAppearance}
          signInUrl="/sign-in"
          signUpUrl="/sign-up"
          signInFallbackRedirectUrl="/dashboard"
          signUpFallbackRedirectUrl="/onboarding"
        >
          {children}
        </ClerkProvider>
      </ClerkAvailabilityContext.Provider>
    </ClerkErrorBoundary>
  )
}
