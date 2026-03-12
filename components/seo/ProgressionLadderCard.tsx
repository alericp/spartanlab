import { CheckCircle2 } from 'lucide-react'

interface ProgressionStep {
  name: string
  description: string
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'elite'
}

interface ProgressionLadderCardProps {
  title: string
  steps: ProgressionStep[]
}

const difficultyColors = {
  beginner: 'bg-green-500/20 text-green-400 border-green-500/30',
  intermediate: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  advanced: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  elite: 'bg-[#E63946]/20 text-[#E63946] border-[#E63946]/30',
}

export function ProgressionLadderCard({ title, steps }: ProgressionLadderCardProps) {
  return (
    <div className="bg-[#1A1A1A] rounded-xl border border-[#2A2A2A] p-6 sm:p-8">
      <h2 className="text-xl sm:text-2xl font-bold mb-6">{title}</h2>
      <div className="space-y-4">
        {steps.map((step, index) => (
          <div
            key={step.name}
            className="flex items-start gap-4 p-4 bg-[#121212] rounded-lg border border-[#2A2A2A]"
          >
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#2A2A2A] flex items-center justify-center text-sm font-bold">
              {index + 1}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h3 className="font-semibold">{step.name}</h3>
                <span className={`text-xs px-2 py-0.5 rounded-full border ${difficultyColors[step.difficulty]}`}>
                  {step.difficulty}
                </span>
              </div>
              <p className="text-sm text-[#A5A5A5]">{step.description}</p>
            </div>
            <CheckCircle2 className="w-5 h-5 text-[#3A3A3A] flex-shrink-0" />
          </div>
        ))}
      </div>
    </div>
  )
}
