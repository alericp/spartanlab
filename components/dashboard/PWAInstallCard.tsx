'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { usePWA } from '@/hooks/use-pwa'
import { Download, X, Smartphone, Share } from 'lucide-react'
import { SpartanIcon } from '@/components/brand/SpartanLogo'

export function PWAInstallCard() {
  const { isInstallable, isIOS, isInstalled, promptInstall, dismissInstallPrompt } = usePWA()
  const [isInstalling, setIsInstalling] = useState(false)
  const [showIOSInstructions, setShowIOSInstructions] = useState(false)

  // Don't show if already installed or not installable
  if (isInstalled || (!isInstallable && !isIOS)) {
    return null
  }

  const handleInstall = async () => {
    if (isIOS) {
      setShowIOSInstructions(true)
      return
    }

    setIsInstalling(true)
    const success = await promptInstall()
    setIsInstalling(false)
    
    if (!success) {
      // User declined, don't show again for a while
      dismissInstallPrompt()
    }
  }

  const handleDismiss = () => {
    dismissInstallPrompt()
    setShowIOSInstructions(false)
  }

  // iOS Instructions Modal
  if (showIOSInstructions) {
    return (
      <Card className="bg-[#1A1F26] border-[#2B313A] p-4 relative overflow-hidden">
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 p-1 text-[#6B7280] hover:text-[#A4ACB8] transition-colors"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>
        
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-[#C1121F]/10 flex items-center justify-center flex-shrink-0">
            <SpartanIcon size={24} color="#C1121F" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[#E6E9EF]">Install on iPhone/iPad</h3>
            <p className="text-xs text-[#6B7280] mt-0.5">Follow these steps to add SpartanLab to your home screen</p>
          </div>
        </div>
        
        <div className="space-y-3 text-sm">
          <div className="flex items-start gap-3 p-2.5 rounded-lg bg-[#0F1115] border border-[#2B313A]/50">
            <div className="w-6 h-6 rounded-full bg-[#C1121F]/20 text-[#C1121F] flex items-center justify-center text-xs font-bold flex-shrink-0">
              1
            </div>
            <div className="flex items-center gap-2 text-[#A4ACB8]">
              <span>Tap the</span>
              <Share className="w-4 h-4 text-[#3B82F6]" />
              <span>Share button in Safari</span>
            </div>
          </div>
          
          <div className="flex items-start gap-3 p-2.5 rounded-lg bg-[#0F1115] border border-[#2B313A]/50">
            <div className="w-6 h-6 rounded-full bg-[#C1121F]/20 text-[#C1121F] flex items-center justify-center text-xs font-bold flex-shrink-0">
              2
            </div>
            <span className="text-[#A4ACB8]">Scroll down and tap "Add to Home Screen"</span>
          </div>
          
          <div className="flex items-start gap-3 p-2.5 rounded-lg bg-[#0F1115] border border-[#2B313A]/50">
            <div className="w-6 h-6 rounded-full bg-[#C1121F]/20 text-[#C1121F] flex items-center justify-center text-xs font-bold flex-shrink-0">
              3
            </div>
            <span className="text-[#A4ACB8]">Tap "Add" to install SpartanLab</span>
          </div>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          className="w-full mt-4 border-[#2B313A] text-[#A4ACB8] hover:text-[#E6E9EF]"
          onClick={handleDismiss}
        >
          Got it
        </Button>
      </Card>
    )
  }

  return (
    <Card className="bg-gradient-to-br from-[#1A1F26] to-[#1A1F26]/80 border-[#2B313A] p-4 relative overflow-hidden">
      {/* Subtle accent line */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#C1121F]/50 to-transparent" />
      
      <button
        onClick={handleDismiss}
        className="absolute top-3 right-3 p-1 text-[#6B7280] hover:text-[#A4ACB8] transition-colors"
        aria-label="Dismiss"
      >
        <X className="w-4 h-4" />
      </button>
      
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-[#C1121F]/10 border border-[#C1121F]/20 flex items-center justify-center flex-shrink-0">
          <Smartphone className="w-5 h-5 text-[#C1121F]" />
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-[#E6E9EF]">Install SpartanLab</h3>
          <p className="text-xs text-[#6B7280] mt-0.5 mb-3">
            Add to your home screen for faster access and a native app experience.
          </p>
          
          <Button
            size="sm"
            className="bg-[#C1121F] hover:bg-[#A30F1A] text-white"
            onClick={handleInstall}
            disabled={isInstalling}
          >
            {isInstalling ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                Installing...
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5 mr-2" />
                Add to Home Screen
              </>
            )}
          </Button>
        </div>
      </div>
    </Card>
  )
}

// Compact version for sidebar or smaller spaces
export function PWAInstallBanner() {
  const { isInstallable, isIOS, isInstalled, promptInstall, dismissInstallPrompt } = usePWA()
  const [dismissed, setDismissed] = useState(false)

  if (isInstalled || (!isInstallable && !isIOS) || dismissed) {
    return null
  }

  const handleInstall = async () => {
    if (isIOS) {
      // For iOS, we'd show a modal with instructions
      alert('Tap the Share button in Safari, then "Add to Home Screen"')
      return
    }
    await promptInstall()
  }

  return (
    <div className="flex items-center justify-between p-3 bg-[#1A1F26] border border-[#2B313A] rounded-lg">
      <div className="flex items-center gap-2.5">
        <Smartphone className="w-4 h-4 text-[#C1121F]" />
        <span className="text-xs text-[#A4ACB8]">Install app for faster access</span>
      </div>
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="ghost"
          className="h-7 px-2 text-xs text-[#6B7280] hover:text-[#A4ACB8]"
          onClick={() => {
            setDismissed(true)
            dismissInstallPrompt()
          }}
        >
          Later
        </Button>
        <Button
          size="sm"
          className="h-7 px-2.5 text-xs bg-[#C1121F] hover:bg-[#A30F1A]"
          onClick={handleInstall}
        >
          Install
        </Button>
      </div>
    </div>
  )
}
