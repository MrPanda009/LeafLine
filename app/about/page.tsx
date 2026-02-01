'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Header from "@/components/Header"
import PinnedHorizontalScroll from "@/components/InfiniteLoopPanels"
import { useRole } from '@/hooks/useRole'

export default function Home() {
  const router = useRouter()
  const { role, loading } = useRole()

  useEffect(() => {
    // Redirect logged-in users to their respective dashboards
    if (!loading && role) {
      if (role === 'admin' || role === 'authority') {
        router.push('/authority-dashboard')
      } else if (role === 'citizen') {
        router.push('/citizen-app')
      }
    }
  }, [role, loading, router])

  return (
    <>
      <Header />
      <PinnedHorizontalScroll />
    </>
  )
}
