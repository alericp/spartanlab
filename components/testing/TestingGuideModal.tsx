'use client'

import { useState } from 'react'
import Link from 'next/link'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription 
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { 
  Dumbbell, 
  Target, 
  Flame, 
  CheckCircle2, 
  AlertTriangle,
  Info,
  ChevronRight,
  ExternalLink,
  HelpCircle,
  Thermometer
} from 'lucide-react'
import { 
  type TestingGuide, 
  type TestCategory,
  getTestingGuide,
  getGuideForMetric 
} from '@/lib/testing-guides'
import { cn } from '@/lib/utils'

// =============================================================================
// TESTING GUIDE MODAL
// =============================================================================

interface TestingGuideModalProps {
  guideId?: string
  metricKey?: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TestingGuideModal({ 
  guideId, 
  metricKey, 
  open, 
  onOpenChange 
}: TestingGuideModalProps) {
  // Get guide by ID or by metric key
  const guide = guideId 
    ? getTestingGuide(guideId) 
    : metricKey 
      ? getGuideForMetric(metricKey)
      : undefined

  if (!guide) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="bg-[#1A1F26] border-[#2B313A] max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-[#E6E9EF]">Guide Not Found</DialogTitle>
          </DialogHeader>
          <p className="text-[#A4ACB8]">No testing guide available for this metric.</p>
        </DialogContent>
      </Dialog>
    )
  }

  const categoryIcons: Record<TestCategory, typeof Dumbbell> = {
    strength: Dumbbell,
    skill: Target,
    flexibility: Flame
  }

  const Icon = categoryIcons[guide.category]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#1A1F26] border-[#2B313A] max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-[#C1121F]/10 flex items-center justify-center">
              <Icon className="w-5 h-5 text-[#C1121F]" />
            </div>
            <div>
              <p className="text-xs text-[#C1121F] font-medium capitalize">{guide.category} Test</p>
              <DialogTitle className="text-xl text-[#E6E9EF]">{guide.name}</DialogTitle>
            </div>
          </div>
          <DialogDescription className="text-[#A4ACB8]">
            {guide.shortDescription}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Warm-Up Section */}
          <GuideSection 
            icon={Thermometer} 
            title="Warm-Up First" 
            iconColor="text-amber-400"
          >
            <ul className="space-y-2">
              {guide.warmUp.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-[#A4ACB8]">
                  <span className="w-5 h-5 rounded-full bg-amber-500/10 text-amber-400 text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </GuideSection>

          {/* How to Test */}
          <GuideSection 
            icon={Target} 
            title="How to Test" 
            iconColor="text-[#C1121F]"
          >
            <ul className="space-y-2">
              {guide.howToTest.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-[#A4ACB8]">
                  <ChevronRight className="w-4 h-4 text-[#C1121F] flex-shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
          </GuideSection>

          {/* What Counts */}
          <GuideSection 
            icon={CheckCircle2} 
            title="What Counts as a Good Rep/Hold" 
            iconColor="text-emerald-400"
          >
            <ul className="space-y-2">
              {guide.whatCounts.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-[#A4ACB8]">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
          </GuideSection>

          {/* How to Record */}
          <GuideSection 
            icon={Info} 
            title="Recording Your Result" 
            iconColor="text-[#4F6D8A]"
          >
            <p className="text-sm text-[#A4ACB8]">{guide.howToRecord}</p>
          </GuideSection>

          {/* Safety Notes */}
          {guide.safetyNotes && guide.safetyNotes.length > 0 && (
            <Card className="bg-amber-500/5 border-amber-500/20 p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-400 mb-2">Safety Notes</p>
                  <ul className="space-y-1">
                    {guide.safetyNotes.map((note, i) => (
                      <li key={i} className="text-sm text-[#A4ACB8]">• {note}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-[#2B313A]">
          <Link 
            href="/guides/testing" 
            className="text-sm text-[#6B7280] hover:text-[#A4ACB8] flex items-center gap-1"
          >
            View all testing guides
            <ExternalLink className="w-3 h-3" />
          </Link>
          <Button 
            onClick={() => onOpenChange(false)}
            className="bg-[#C1121F] hover:bg-[#A30F1A]"
          >
            Got it
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// =============================================================================
// GUIDE SECTION COMPONENT
// =============================================================================

interface GuideSectionProps {
  icon: typeof Dumbbell
  title: string
  iconColor?: string
  children: React.ReactNode
}

function GuideSection({ icon: Icon, title, iconColor = "text-[#C1121F]", children }: GuideSectionProps) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Icon className={cn("w-4 h-4", iconColor)} />
        <h3 className="text-sm font-semibold text-[#E6E9EF]">{title}</h3>
      </div>
      {children}
    </div>
  )
}

// =============================================================================
// "DON'T KNOW" HELPER COMPONENT
// =============================================================================

interface DontKnowHelperProps {
  metricKey: string
  className?: string
}

export function DontKnowHelper({ metricKey, className }: DontKnowHelperProps) {
  const [showGuide, setShowGuide] = useState(false)
  const guide = getGuideForMetric(metricKey)

  if (!guide) return null

  return (
    <>
      <div className={cn(
        "flex items-start gap-2 p-3 rounded-lg bg-[#4F6D8A]/10 border border-[#4F6D8A]/20",
        className
      )}>
        <HelpCircle className="w-4 h-4 text-[#4F6D8A] flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-xs text-[#A4ACB8]">
            Not sure yet? Test this after a proper warm-up. You can update your numbers anytime.
          </p>
          <button
            onClick={() => setShowGuide(true)}
            className="text-xs text-[#4F6D8A] hover:text-[#6B8FAD] mt-1 flex items-center gap-1"
          >
            How to test {guide.name.toLowerCase()}
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      </div>
      <TestingGuideModal 
        metricKey={metricKey}
        open={showGuide}
        onOpenChange={setShowGuide}
      />
    </>
  )
}

// =============================================================================
// TESTING GUIDE LINK BUTTON
// =============================================================================

interface TestingGuideLinkProps {
  metricKey?: string
  guideId?: string
  label?: string
  variant?: 'button' | 'link' | 'icon'
  className?: string
}

export function TestingGuideLink({ 
  metricKey, 
  guideId, 
  label,
  variant = 'link',
  className 
}: TestingGuideLinkProps) {
  const [showGuide, setShowGuide] = useState(false)
  const guide = guideId 
    ? getTestingGuide(guideId) 
    : metricKey 
      ? getGuideForMetric(metricKey)
      : undefined

  if (!guide) return null

  const displayLabel = label || `How to test`

  if (variant === 'icon') {
    return (
      <>
        <button
          onClick={() => setShowGuide(true)}
          className={cn(
            "w-6 h-6 rounded-full bg-[#4F6D8A]/10 flex items-center justify-center",
            "hover:bg-[#4F6D8A]/20 transition-colors",
            className
          )}
          title={`How to test ${guide.name}`}
        >
          <HelpCircle className="w-3.5 h-3.5 text-[#4F6D8A]" />
        </button>
        <TestingGuideModal 
          guideId={guideId}
          metricKey={metricKey}
          open={showGuide}
          onOpenChange={setShowGuide}
        />
      </>
    )
  }

  if (variant === 'button') {
    return (
      <>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowGuide(true)}
          className={cn(
            "border-[#4F6D8A]/30 text-[#4F6D8A] hover:bg-[#4F6D8A]/10",
            className
          )}
        >
          <HelpCircle className="w-4 h-4 mr-1.5" />
          {displayLabel}
        </Button>
        <TestingGuideModal 
          guideId={guideId}
          metricKey={metricKey}
          open={showGuide}
          onOpenChange={setShowGuide}
        />
      </>
    )
  }

  return (
    <>
      <button
        onClick={() => setShowGuide(true)}
        className={cn(
          "text-xs text-[#4F6D8A] hover:text-[#6B8FAD] flex items-center gap-1 transition-colors",
          className
        )}
      >
        <HelpCircle className="w-3 h-3" />
        {displayLabel}
      </button>
      <TestingGuideModal 
        guideId={guideId}
        metricKey={metricKey}
        open={showGuide}
        onOpenChange={setShowGuide}
      />
    </>
  )
}
