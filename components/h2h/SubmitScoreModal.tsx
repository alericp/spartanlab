'use client'

import { useState } from 'react'
import { Target, Clock, Trophy } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  type H2HChallenge,
  H2H_CHALLENGE_CONFIGS,
  submitChallengeResult,
} from '@/lib/h2h/h2h-service'

interface SubmitScoreModalProps {
  open: boolean
  challenge: H2HChallenge
  onClose: () => void
}

export function SubmitScoreModal({ open, challenge, onClose }: SubmitScoreModalProps) {
  const [score, setScore] = useState('')
  const [submitting, setSubmitting] = useState(false)
  
  const config = H2H_CHALLENGE_CONFIGS[challenge.challengeType]
  
  const handleSubmit = () => {
    const numScore = parseInt(score)
    if (isNaN(numScore) || numScore < 0) return
    
    setSubmitting(true)
    
    try {
      submitChallengeResult(challenge.id, numScore)
      onClose()
    } catch (error) {
      console.error('Failed to submit score:', error)
    } finally {
      setSubmitting(false)
    }
  }
  
  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="bg-[#12151A] border-[#2A2F36] max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[#E6E9EF]">
            <Target className="w-5 h-5 text-[#C1121F]" />
            Submit Your Score
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Challenge info */}
          <div className="p-4 rounded-lg border border-[#2A2F36] bg-[#0F1115]">
            <h3 className="font-semibold text-[#E6E9EF] mb-2">{config.name}</h3>
            <p className="text-sm text-[#6B7280] mb-3">{config.description}</p>
            
            {config.timeLimit && (
              <div className="flex items-center gap-2 text-sm text-[#A4ACB8]">
                <Clock className="w-4 h-4" />
                <span>Time limit: {config.timeLimit} seconds</span>
              </div>
            )}
          </div>
          
          {/* Score input */}
          <div className="space-y-2">
            <Label className="text-[#A4ACB8]">
              Your {config.metric} ({config.unit})
            </Label>
            <Input
              type="number"
              min="0"
              value={score}
              onChange={(e) => setScore(e.target.value)}
              placeholder={`Enter your ${config.metric}...`}
              className="bg-[#1A1F26] border-[#2A2F36] text-[#E6E9EF] text-lg h-12"
              autoFocus
            />
          </div>
          
          {/* Rewards info */}
          <div className="flex items-center justify-center gap-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
            <Trophy className="w-5 h-5 text-amber-400" />
            <span className="text-sm text-amber-400">
              Win reward: +{challenge.winnerReward} Spartan Score
            </span>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 border-[#2A2F36] text-[#A4ACB8]"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!score || submitting}
              className="flex-1 bg-[#C1121F] hover:bg-[#A30F1A]"
            >
              {submitting ? 'Submitting...' : 'Submit Score'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
