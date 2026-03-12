import { type LucideIcon } from 'lucide-react'

interface UtilityItem {
  icon: LucideIcon
  title: string
  description: string
}

interface QuickUtilityCardProps {
  items: UtilityItem[]
}

export function QuickUtilityCard({ items }: QuickUtilityCardProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <div
          key={item.title}
          className="p-5 bg-[#1A1A1A] rounded-xl border border-[#2A2A2A] hover:border-[#3A3A3A] transition-colors"
        >
          <div className="w-10 h-10 rounded-lg bg-[#2A2A2A] flex items-center justify-center mb-4">
            <item.icon className="w-5 h-5 text-[#E63946]" />
          </div>
          <h3 className="font-semibold mb-2">{item.title}</h3>
          <p className="text-sm text-[#A5A5A5]">{item.description}</p>
        </div>
      ))}
    </div>
  )
}
