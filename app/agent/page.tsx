'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth/auth-context'
import { firstTabHref } from '@/lib/access'

// Redirect tới tab hợp lệ đầu tiên theo agentFunction.
export default function AgentIndex() {
  const { user } = useAuth()
  const router = useRouter()
  useEffect(() => {
    if (user) router.replace(firstTabHref(user.agentFunction))
  }, [user, router])
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <span className="size-6 animate-spin rounded-full border-2 border-border border-t-brand" />
    </div>
  )
}
