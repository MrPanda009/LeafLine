"use client";
import { useRef } from 'react';
import Link from 'next/link';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import LoginToggle from './Loginbutton';

gsap.registerPlugin(ScrollTrigger);

export interface HeaderProps {
  initialLogoColor?: string;
  initialTextColor?: string;
  scrolledBgColor?: string;
  scrolledAccentColor?: string;
  initialNavColor?: string;
  scrolledNavColor?: string;
}

export default function Header({
  initialLogoColor = "#000000",
  initialTextColor = "#000000",
  scrolledBgColor = "#032221",
  scrolledAccentColor = "#00DF81",
  initialNavColor = "#000000",
  scrolledNavColor = "#FFFFFF"
}: HeaderProps) {
  const container = useRef(null);

  const navColorStart = initialNavColor || initialTextColor;
  const navColorEnd = scrolledNavColor || navColorStart;

  useGSAP(() => {
    // 1. Entrance: Logo slides in, links stagger up
    const tl = gsap.timeline();
    tl.from(".logo", { x: -50, opacity: 0, duration: 0.8, ease: "power3.out" })
      .from(".nav-item", { y: 20, opacity: 0, stagger: 0.1, duration: 0.5, ease: "power2.out" }, "-=0.4");

    // 2. Scroll Effect: Header darkens and shrinks
    const scrollTl = gsap.timeline({
      scrollTrigger: {
        trigger: "body",
        start: "top -10%",
        end: "top -20%",
        scrub: true,
      },
    });

    scrollTl.to(container.current, {
      backgroundColor: scrolledBgColor,
      height: "70px",
      borderBottom: `1px solid ${scrolledAccentColor}`,
    })
    .to(".logo", {
      color: scrolledAccentColor,
    }, "<")
    .to(".nav-item", {
      color: navColorEnd,
    }, "<");
  }, { scope: container, dependencies: [scrolledBgColor, scrolledAccentColor, navColorEnd] });

  return (
    <header 
      ref={container} 
      className="fixed top-0 w-full h-24 flex items-center justify-between px-12 z-50 font-axiforma transition-all duration-300"
      style={{ color: initialTextColor }}
    >
      <Link href="/" className="logo text-2xl font-bold tracking-tighter" style={{ color: initialLogoColor }}>
        LeafLine.
      </Link>

      <nav className="flex gap-6 font-medium items-center">
        {['About', 'Contact'].map((item) => (
          <Link 
            key={item} 
            href={`${item.toLowerCase()}`} 
            style={{ color: navColorStart }}
            className="nav-item hover:text-caribbean-green transition-colors duration-200"
          >
            {item}
          </Link>
        ))}
        <div className="nav-item scale-[0.35] origin-center -ml-16">
          <LoginToggle />
        </div>
      </nav>
    </header>
  );
}