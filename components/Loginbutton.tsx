"use client";
import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import gsap from "gsap";
import { supabase } from "@/lib/supabase";

const LoginToggle = () => {
  const router = useRouter();
  const [isLocked, setIsLocked] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  // Refs for GSAP targets
  const containerRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const lockClosedRef = useRef<SVGSVGElement>(null);
  const lockOpenRef = useRef<SVGSVGElement>(null);
  const textRef = useRef<HTMLHeadingElement>(null);
  const tl = useRef<gsap.core.Timeline | null>(null);

  useEffect(() => {
    // Check if user is logged in
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsLoggedIn(!!session);
    };
    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    // Initial timeline for the toggle animation
    tl.current = gsap.timeline({ 
      paused: true, 
      defaults: { ease: "power3.inOut", duration: 0.4 } 
    });

    tl.current
      .to(knobRef.current, { x: -116 }, 0)
      .to(trackRef.current, { backgroundColor: "#00F196", borderColor: "#022221" }, 0)
      .to(lockClosedRef.current, { opacity: 0, scale: 0.5 }, 0)
      .fromTo(lockOpenRef.current, { opacity: 0, scale: 0.5 }, { opacity: 1, scale: 1 }, 0.1)
      .to(textRef.current, { textShadow: "0px 0px 20px rgba(0, 241, 150, 0.8)", color: "#F0F1F0" }, 0);
  }, []);

  const handleSuccess = () => {
    // 1. Create a "Success" sequence
    const successTl = gsap.timeline({
      onComplete: () => {
        // 2. Redirect after animation completes
        router.push("/login"); 
      }
    });

    successTl
      .to(containerRef.current, { 
        scale: 0.9, 
        duration: 0.2, 
        ease: "power2.in" 
      })
      .to(containerRef.current, { 
        scale: 20, 
        opacity: 0, 
        duration: 0.6, 
        ease: "power4.inOut" 
      });
  };

  const handleToggle = () => {
    if (isLocked) {
      tl.current?.play();
      setIsLocked(false);
      // Trigger success after a short delay so the user sees the lock open
      setTimeout(handleSuccess, 600);
    } else {
      tl.current?.reverse();
      setIsLocked(true);
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await supabase.auth.signOut();
      router.push('/');
    } catch (error) {
      console.error('Error logging out:', error);
      setIsLoggingOut(false);
    }
  };

  // If user is logged in, show logout button
  if (isLoggedIn) {
    return (
      <button
        onClick={handleLogout}
        disabled={isLoggingOut}
        className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
      >
        {isLoggingOut ? 'Logging out...' : 'LOGOUT'}
      </button>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="flex flex-row items-center gap-6 p-6 bg-dark-green/20 rounded-[30px] border border-bangladesh-green/30 shadow-2xl"
    >
      <h1 
          ref={textRef}
          className="text-5xl font-black tracking-tighter text-caribbean-green select-none"
          style={{ fontFamily: 'var(--font-axiforma), sans-serif' }}
        >
          LOGIN
        </h1>

        <div 
          ref={trackRef}
          onClick={handleToggle}
          className="relative w-[180px] h-[64px] bg-bangladesh-green border-[4px] border-dark-green rounded-full cursor-pointer shadow-inner"
        >
          <div 
            ref={knobRef}
            className="absolute top-1 right-1 w-[48px] h-[48px] bg-anti-flash rounded-full flex items-center justify-center shadow-xl z-10"
          >
            <div className="relative w-6 h-6">
              <svg 
                ref={lockClosedRef}
                className="absolute inset-0 text-rich-black" 
                viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
              >
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
              
              <svg 
                ref={lockOpenRef}
                className="absolute inset-0 text-rich-black opacity-0" 
                viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
              >
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 9.9-1"></path>
              </svg>
            </div>
          </div>
          <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent pointer-events-none" />
        </div>
      </div>
  );
};

export default LoginToggle;