'use client'

import { PageContainer } from '@/components/layout'
import { AchievementsPageContent } from '@/components/achievements/achievements-panel'
import { AuthGuard } from '@/components/auth/AuthGuard'

export default function AchievementsPage() {
  return (
    <AuthGuard>
      <PageContainer>
        <div className="py-6">
          <AchievementsPageContent />
        </div>
      </PageContainer>
    </AuthGuard>
  )
}
