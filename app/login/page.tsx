'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Header from '@/components/Header'
import gsap from 'gsap'

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Refs for GSAP
  const containerRef = useRef<HTMLDivElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  const bgTimeline = useRef<gsap.core.Timeline | null>(null)

  useEffect(() => {
    // GSAP Animations
    const ctx = gsap.context(() => {
      bgTimeline.current = gsap.timeline();

      // 1. Animate background organic shapes sliding up like a landscape
      bgTimeline.current.from('.bg-shape', {
        y: '100%',
        opacity: 0,
        duration: 1.2,
        stagger: 0.2,
        ease: "power4.out",
      })
      // 2. Drop the card in with a physical bounce
      .from(cardRef.current, {
        y: -200,
        opacity: 0,
        duration: 1,
        ease: "bounce.out"
      }, "-=0.5") // Overlap slightly with background animation

      // 3. Fade in content
      .from('.animate-content', {
        opacity: 0,
        y: 20,
        stagger: 0.1,
        duration: 0.5
      }, "-=0.5")

    }, containerRef)

    return () => ctx.revert()
  }, [])

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        router.push('/')
      }
    }
    checkSession()
  }, [router])

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true)
      setError(null)

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      })

      if (error) throw error
    } catch (err) {
      console.error('Error signing in:', err)
      setError(err instanceof Error ? err.message : 'Failed to sign in')
      setLoading(false)
    }
  }

  return (
    // Base background is Rich Black
    <div ref={containerRef} className="relative min-h-screen bg-[#000B01] overflow-hidden font-sans selection:bg-[#00CC99] selection:text-white">
      <div className="relative z-20">
        <Header 
          initialLogoColor="#FFFFFF"
          initialTextColor="#FFFFFF"
          scrolledBgColor="#000B01"
          scrolledAccentColor="#00CC99"
          initialNavColor="#FFFFFF"
          scrolledNavColor="#00CC99"
         />
      </div>

      {/* --- Illustrative Background Layers --- */}
      {/* Layer 1: Dark Green Swoosh */}
      <div className="bg-shape absolute bottom-0 left-[-20%] w-[140%] h-[50vh] bg-[#002221] rounded-[100%] rotate-[-5deg] z-0 pointer-events-none"></div>
      
      {/* Layer 2: Bangladesh Green Swoosh */}
      <div className="bg-shape absolute bottom-[-10%] right-[-30%] w-[140%] h-[45vh] bg-[#006A4E] rounded-[100%] rotate-[8deg] z-1 pointer-events-none"></div>
       
      {/* Layer 3: Forest Green Accent */}
      <div className="bg-shape absolute top-[15%] right-[-10%] w-[300px] h-[300px] bg-[#0B5544] rounded-full z-0 pointer-events-none opacity-60"></div>


      {/* --- Main Content Area --- */}
      <div className="relative z-10 flex items-center justify-center min-h-screen px-4 sm:px-6 lg:px-8">
        <div 
          ref={cardRef}
          // Solid white card with a solid "hard" shadow for an illustrative feel
          className="w-full max-w-md p-8 space-y-8 bg-[#F5F7F6] rounded-3xl shadow-[8px_8px_0px_0px_rgba(0,34,33,1)] border-2 border-[#002221]"
        >
          {/* Header Section */}
          <div className="text-center space-y-2 animate-content">
             {/* A little illustrative icon area */}
            <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-[#E2F8F0] rounded-2xl flex items-center justify-center border-2 border-[#00CC99] rotate-[-10deg]">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-[#00CC99] rotate-[10deg]">
                      <path fillRule="evenodd" d="M12 2.25a.75.75 0 01.75.75v.756a49.106 49.106 0 019.152 1.356.75.75 0 01.018 1.485 47.65 47.65 0 00-1.12 3.684c-.118.454-.242.912-.372 1.374-.13.462-.266.929-.406 1.402-.14.473-.286.952-.435 1.436-.15.485-.304.974-.463 1.468-.16.493-.325.993-.493 1.496-.168.503-.342 1.01-.52 1.521-.177.51-.36 1.027-.547 1.546-.187.52-.379 1.044-.575 1.574-.197.531-.4 1.063-.606 1.597-.205.537-.416 1.079-.63 1.623a.75.75 0 01-1.408-.536c.212-.539.419-1.075.622-1.606.2-.529.397-1.055.59-1.58.193-.526.383-1.047.569-1.564.185-.518.365-1.029.54-1.537.175-.509.345-1.011.511-1.508.165-.497.325-.99.482-1.478.156-.486.307-.968.454-1.448.147-.479.29-.952.427-1.419.136-.467.268-.927.396-1.38.126-.451.248-.902.364-1.349a49.202 49.202 0 00-8.248-1.152V21a.75.75 0 01-1.5 0v-.756a49.106 49.106 0 01-9.152-1.356.75.75 0 01-.018-1.485 47.65 47.65 0 001.12-3.684c.118-.454.242-.912.372-1.374.13-.462.266-.929.406-1.402.14-.473.286-.952.435-1.436.15-.485.304-.974.463-1.468.16-.493.325-.993.493-1.496.168-.503.342-1.01.52-1.521.177-.51.36-1.027.547-1.546.187-.52.379-1.044.575-1.574.197-.531.4-1.063.606-1.597.205-.537.416-1.079.63-1.623a.75.75 0 011.408.536c-.212.539-.419 1.075-.622-1.606-.2-.529-.397-1.055-.59-1.58-.193-.526-.383-1.047-.569-1.564-.185-.518-.365-1.029-.54-1.537-.175-.509-.345-1.011-.511-1.508-.165-.497-.325-.99-.482-1.478-.156-.486-.307-.968-.454-1.448-.147-.479-.29-.952-.427-1.419-.136-.467-.268-.927-.396-1.38-.126-.451-.248-.902-.364-1.349a49.202 49.202 0 008.248 1.152V3a.75.75 0 01.75-.75z" clipRule="evenodd" />
                    </svg>
                </div>
            </div>
            <h1 className="text-3xl font-black text-[#002221]">
              Welcome Back!
            </h1>
            <p className="text-sm font-medium text-[#006A4E]">
              Let's get you signed in.
            </p>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border-2 border-red-200 rounded-xl animate-content">
              <p className="text-sm font-bold text-red-800 text-center">{error}</p>
            </div>
          )}

          <div className="space-y-4 animate-content">
            {/* Primary Google Button - Solid and Punchy */}
            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="group relative flex items-center justify-center w-full px-4 py-4 space-x-3 text-white transition-all duration-200 bg-[#00CC99] border-2 border-[#006A4E] rounded-xl hover:bg-[#00A37A] hover:shadow-[4px_4px_0px_0px_#006A4E] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_#006A4E] disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="w-6 h-6 border-4 border-[#006A4E]/30 border-t-white rounded-full animate-spin"></div>
                  <span className="font-bold text-lg">Signing in...</span>
                </>
              ) : (
                <>
                 <div className="bg-white p-1 rounded-full">
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="#000"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  </div>
                  <span className="font-bold text-lg">Continue with Google</span>
                </>
              )}
            </button>

            {/* Divider with a stylized look */}
            <div className="relative py-3 animate-content">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t-2 border-[#002221]/10" border-dashed></div>
              </div>
              <div className="relative flex justify-center text-sm font-bold">
                <span className="px-4 text-[#006A4E] bg-[#F5F7F6]">Alternate Portals</span>
              </div>
            </div>

            {/* Secondary Buttons - Solid and Friendly */}
            <div className="grid grid-cols-2 gap-4 animate-content">
              <button
                onClick={() => router.push('/citizen-app')}
                 className="flex flex-col items-center justify-center px-4 py-4 space-y-2 transition-all duration-200 bg-white border-2 border-[#006A4E]/30 rounded-xl hover:border-[#006A4E] hover:bg-[#E2F8F0] hover:shadow-[3px_3px_0px_0px_#006A4E] active:translate-y-[2px] active:shadow-none group"
              >
                <span className="p-2 rounded-xl bg-[#006A4E] text-white group-hover:scale-110 transition-transform">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                </span>
                <span className="text-sm font-bold text-[#002221]">Citizen Folder</span>
              </button>

              <button
                onClick={() => router.push('/authority-dashboard')}
                 className="flex flex-col items-center justify-center px-4 py-4 space-y-2 transition-all duration-200 bg-white border-2 border-[#006A4E]/30 rounded-xl hover:border-[#006A4E] hover:bg-[#E2F8F0] hover:shadow-[3px_3px_0px_0px_#006A4E] active:translate-y-[2px] active:shadow-none group"
              >
                <span className="p-2 rounded-xl bg-[#002221] text-white group-hover:scale-110 transition-transform">
                     <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                </span>
                <span className="text-sm font-bold text-[#002221]">Authority</span>
              </button>
            </div>
          </div>
          
          {/* Footer Link */}
          <div className="pt-4 text-center animate-content">
            <button className="text-sm font-bold text-[#00CC99] hover:underline hover:text-[#00A37A] transition-colors">
              Need help signing in?
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}