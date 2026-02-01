'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { UserRole } from '@/types/database'
import { User } from '@supabase/supabase-js'

interface UseRoleReturn {
  role: UserRole | null
  loading: boolean
  error: Error | null
  user: User | null
}

export function useRole(): UseRoleReturn {
  const [role, setRole] = useState<UserRole | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        setLoading(true)
        setError(null)

        // Get current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()

        if (sessionError) throw sessionError
        
        if (!session?.user) {
          setRole(null)
          setUser(null)
          setLoading(false)
          return
        }

        setUser(session.user)

        // Query profiles table for user role
        const { data, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single()

        if (profileError) {
          // If profile doesn't exist, create it with default role
          if (profileError.code === 'PGRST116') {
            console.log('Profile not found, creating default profile...')
            const { error: insertError } = await supabase
              .from('profiles')
              .insert({
                id: session.user.id,
                email: session.user.email,
                role: 'citizen'
              })
            
            if (insertError) {
              console.error('Error creating profile:', insertError)
              throw insertError
            }
            
            setRole('citizen')
          } else {
            throw profileError
          }
        } else {
          setRole(data?.role as UserRole || 'citizen')
        }
      } catch (err) {
        console.error('Error fetching user role:', err)
        setError(err instanceof Error ? err : new Error('Failed to fetch user role'))
        setRole('citizen') // Default to citizen on error
      } finally {
        setLoading(false)
      }
    }

    fetchUserRole()

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchUserRole()
      } else {
        setRole(null)
        setUser(null)
        setLoading(false)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return { role, loading, error, user }
}
