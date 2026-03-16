'use client'

import { useState } from 'react'
import { Swords, Users, Trophy, Clock, User, Plus } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
  type H2HChallengeType,
  H2H_CHALLENGE_CONFIGS,
  createFriendChallenge,
  getFriends,
  addFriend,
  type Friend,
} from '@/lib/h2h/h2h-service'

interface CreateChallengeModalProps {
  open: boolean
  onClose: () => void
}

type Step = 'type' | 'opponent' | 'confirm'

export function CreateChallengeModal({ open, onClose }: CreateChallengeModalProps) {
  const [step, setStep] = useState<Step>('type')
  const [selectedType, setSelectedType] = useState<H2HChallengeType | null>(null)
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null)
  const [newFriendName, setNewFriendName] = useState('')
  const [friends, setFriends] = useState<Friend[]>([])
  const [creating, setCreating] = useState(false)
  
  const resetModal = () => {
    setStep('type')
    setSelectedType(null)
    setSelectedFriend(null)
    setNewFriendName('')
    setCreating(false)
  }
  
  const handleClose = () => {
    resetModal()
    onClose()
  }
  
  const handleSelectType = (type: H2HChallengeType) => {
    setSelectedType(type)
    setFriends(getFriends())
    setStep('opponent')
  }
  
  const handleAddFriend = () => {
    if (!newFriendName.trim()) return
    
    const friendId = `friend_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`
    const friend = addFriend(friendId, newFriendName.trim())
    setFriends(getFriends())
    setSelectedFriend(friend)
    setNewFriendName('')
  }
  
  const handleCreate = () => {
    if (!selectedType || !selectedFriend) return
    
    setCreating(true)
    
    try {
      createFriendChallenge(
        selectedFriend.friendId,
        selectedFriend.friendName,
        selectedType
      )
      handleClose()
    } catch (error) {
      console.error('Failed to create challenge:', error)
    } finally {
      setCreating(false)
    }
  }
  
  return (
    <Dialog open={open} onOpenChange={() => handleClose()}>
      <DialogContent className="bg-[#12151A] border-[#2A2F36] max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[#E6E9EF]">
            <Swords className="w-5 h-5 text-[#C1121F]" />
            {step === 'type' && 'Choose Challenge Type'}
            {step === 'opponent' && 'Select Opponent'}
            {step === 'confirm' && 'Confirm Challenge'}
          </DialogTitle>
        </DialogHeader>
        
        {/* Step 1: Challenge Type */}
        {step === 'type' && (
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
            {Object.entries(H2H_CHALLENGE_CONFIGS).map(([type, config]) => (
              <button
                key={type}
                onClick={() => handleSelectType(type as H2HChallengeType)}
                className={cn(
                  'w-full p-4 rounded-lg border text-left transition-all',
                  'hover:border-[#C1121F]/50 hover:bg-[#1A1F26]',
                  'border-[#2A2F36] bg-[#0F1115]'
                )}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-[#E6E9EF] mb-1">{config.name}</h3>
                    <p className="text-sm text-[#6B7280]">{config.description}</p>
                  </div>
                  {config.timeLimit && (
                    <Badge variant="outline" className="text-[#6B7280] border-[#2A2F36]">
                      <Clock className="w-3 h-3 mr-1" />
                      {config.timeLimit}s
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-4 mt-3 text-xs text-[#6B7280]">
                  <span className="text-amber-400">Win: +{config.winnerReward} pts</span>
                  <span>Participate: +{config.participationReward} pts</span>
                </div>
              </button>
            ))}
          </div>
        )}
        
        {/* Step 2: Select Opponent */}
        {step === 'opponent' && (
          <div className="space-y-4">
            {/* Add new friend */}
            <div className="p-4 rounded-lg border border-[#2A2F36] bg-[#0F1115]">
              <Label className="text-[#A4ACB8] text-sm mb-2 block">
                Challenge a friend by name
              </Label>
              <div className="flex gap-2">
                <Input
                  value={newFriendName}
                  onChange={(e) => setNewFriendName(e.target.value)}
                  placeholder="Enter friend's name..."
                  className="bg-[#1A1F26] border-[#2A2F36] text-[#E6E9EF]"
                  onKeyDown={(e) => e.key === 'Enter' && handleAddFriend()}
                />
                <Button
                  onClick={handleAddFriend}
                  disabled={!newFriendName.trim()}
                  className="bg-[#C1121F] hover:bg-[#A30F1A]"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            {/* Existing friends */}
            {friends.length > 0 && (
              <div className="space-y-2">
                <Label className="text-[#A4ACB8] text-sm">Or select from friends</Label>
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {friends.map(friend => (
                    <button
                      key={friend.friendId}
                      onClick={() => setSelectedFriend(friend)}
                      className={cn(
                        'w-full p-3 rounded-lg border text-left transition-all flex items-center gap-3',
                        selectedFriend?.friendId === friend.friendId
                          ? 'border-[#C1121F] bg-[#C1121F]/10'
                          : 'border-[#2A2F36] bg-[#0F1115] hover:border-[#3A3F46]'
                      )}
                    >
                      <div className="w-8 h-8 rounded-full bg-[#1A1F26] flex items-center justify-center">
                        <User className="w-4 h-4 text-[#6B7280]" />
                      </div>
                      <span className="text-[#E6E9EF]">{friend.friendName}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setStep('type')}
                className="flex-1 border-[#2A2F36] text-[#A4ACB8]"
              >
                Back
              </Button>
              <Button
                onClick={() => setStep('confirm')}
                disabled={!selectedFriend}
                className="flex-1 bg-[#C1121F] hover:bg-[#A30F1A]"
              >
                Continue
              </Button>
            </div>
          </div>
        )}
        
        {/* Step 3: Confirm */}
        {step === 'confirm' && selectedType && selectedFriend && (
          <div className="space-y-4">
            <div className="p-4 rounded-lg border border-[#2A2F36] bg-[#0F1115]">
              <h3 className="font-semibold text-[#E6E9EF] mb-3">Challenge Summary</h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[#6B7280]">Challenge</span>
                  <span className="text-[#E6E9EF]">{H2H_CHALLENGE_CONFIGS[selectedType].name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#6B7280]">Opponent</span>
                  <span className="text-[#E6E9EF]">{selectedFriend.friendName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#6B7280]">Duration</span>
                  <span className="text-[#E6E9EF]">7 days</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#6B7280]">Winner Reward</span>
                  <span className="text-amber-400">+{H2H_CHALLENGE_CONFIGS[selectedType].winnerReward} pts</span>
                </div>
              </div>
            </div>
            
            <p className="text-sm text-[#6B7280] text-center">
              Your opponent will need to accept this challenge before competing.
            </p>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setStep('opponent')}
                className="flex-1 border-[#2A2F36] text-[#A4ACB8]"
              >
                Back
              </Button>
              <Button
                onClick={handleCreate}
                disabled={creating}
                className="flex-1 bg-[#C1121F] hover:bg-[#A30F1A]"
              >
                {creating ? 'Creating...' : 'Send Challenge'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
