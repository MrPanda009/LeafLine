'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AuthCallback() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get the session from the URL hash
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()

        if (sessionError) {
          throw sessionError
        }

        if (!session) {
          throw new Error('No session found')
        }

        console.log('Auth callback - User logged in:', session.user.id)

        // Check if profile exists
        let { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single()

        // If profile doesn't exist, create it with default citizen role
        if (profileError?.code === 'PGRST116') {
          console.log('Profile not found, creating new profile...')
          
          const { data: newProfile, error: insertError } = await supabase
            .from('profiles')
            .insert({
              id: session.user.id,
              email: session.user.email || '',
              role: 'citizen'
            })
            .select('role')
            .single()

          if (insertError) {
            console.error('Error creating profile:', insertError)
            throw insertError
          }

          profile = newProfile
        } else if (profileError) {
          throw profileError
        }

        // Redirect based on role
        const userRole = profile?.role || 'citizen'
        console.log('User role:', userRole)

        if (userRole === 'admin' || userRole === 'authority') {
          console.log('Redirecting to authority dashboard')
          router.push('/authority-dashboard')
        } else {
          console.log('Redirecting to citizen app')
          router.push('/citizen-app')
        }
      } catch (err) {
        console.error('Auth callback error:', err)
        setError(err instanceof Error ? err.message : 'Authentication failed')
        
        // Redirect to login on error after 3 seconds
        setTimeout(() => {
          router.push('/login')
        }, 3000)
      }
    }

    handleAuthCallback()
  }, [router])

  if (error) {
    return (
      <div className="min-h-screen bg-[#FDFBD4] flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md">
          <div className="text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Authentication Error</h2>
            <p className="text-red-600 mb-4">{error}</p>
            <p className="text-sm text-gray-600">Redirecting to login...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FDFBD4] flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-4 border-[#00DF81] mb-4"></div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Completing Sign In...</h2>
        <p className="text-gray-600">Please wait while we set up your account</p>
      </div>
    </div>
  )
}
