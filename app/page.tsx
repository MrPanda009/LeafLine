"use client";

import { useRef } from "react";
import Image from "next/image";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Header from "@/components/Header";


// Register GSAP plugins
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export default function AboutPage() {
  const container = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      // 1. Initial Reveal (Title & Text only)
      const tl = gsap.timeline();
      tl.from(".main-title", {
        y: 100,
        opacity: 0,
        duration: 1,
        ease: "power4.out",
        delay: 0.2,
      })
      .from(".intro-text", {
        y: 30,
        opacity: 0,
        duration: 0.8,
        stagger: 0.1,
        ease: "power2.out",
      }, "-=0.5");

      // 2. Parallax Image Reveal
      gsap.utils.toArray<HTMLElement>(".reveal-image").forEach((section) => {
        gsap.from(section, {
          scrollTrigger: {
            trigger: section,
            start: "top 80%",
            toggleActions: "play none none reverse",
          },
          y: 50,
          opacity: 0,
          duration: 1.2,
          ease: "power3.out",
        });
      });

      // 3. Quote Animation
      gsap.from(".quote-text", {
        scrollTrigger: {
          trigger: ".quote-section",
          start: "top 70%",
        },
        opacity: 0,
        x: -50,
        duration: 1,
        ease: "power3.out",
      });

      // 4. Stats Counter Animation
      gsap.utils.toArray<HTMLElement>(".stat-number").forEach((stat) => {
        const targetValue = parseInt(stat.getAttribute("data-target") || "0");
        
        gsap.to(stat, {
          scrollTrigger: {
            trigger: stat,
            start: "top 85%",
          },
          innerText: targetValue,
          duration: 2,
          snap: { innerText: 1 },
          ease: "power1.out",
          onUpdate: function () {
            stat.innerText = Math.ceil(this.targets()[0].innerText).toString();
          },
        });
      });
    },
    { scope: container }
  );

  return (
    <>
      <Header />
      <main ref={container} className="min-h-screen bg-[#FDFBD4] text-[#829c86] overflow-hidden selection:bg-caribbeanGreen selection:text-richBlack">
      
      <div className="max-w-7xl mx-auto px-6 md:px-12 pt-32 pb-20">
        
        {/* --- Section 1: Intro (Full Width) --- */}
        <section className="mb-32">
          <div>
            <h1 className="main-title text-[#829c86] text-7xl md:text-9xl font-bold uppercase tracking-tighter mb-16">
              Leaf-Live.
            </h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 text-lg leading-relaxed text-[#829c86] font-axiforma">
              <p className="intro-text">
                Delhi is a city full of energy, but it struggles daily with waste, pollution, and broken civic systems that leave citizens feeling unheard.
              </p>
              <p className="intro-text">
                LeafLine was created to change that. We believe every resident deserves a cleaner, smarter, and more sustainable city, one where reporting civic issues is simple, transparent, and accessible to all.
              </p>
            </div>
          </div>
        </section>


        {/* --- Section 2: Hero Image --- */}
        <section className="reveal-image w-full h-[60vh] relative mb-32 overflow-hidden rounded-sm bg-pine">
            <Image 
                src="/About-1.jpeg"
                alt="Team working"
                fill
                className="object-cover opacity-80 hover:scale-105 transition-transform duration-700 ease-out"
            />
        </section>


        {/* --- Section 3: Quote --- */}
        <section className="quote-section grid grid-cols-1 md:grid-cols-2 gap-16 items-center mb-32">
            <div className="relative">
                <span className="text-8xl text-basil absolute -top-10 -left-6 font-serif opacity-50">“</span>
                <blockquote className="quote-text text-3xl md:text-4xl font-serif text-[#829c86] italic leading-snug mb-6 relative z-10">
                    "There is no such thing as 'away.' When we throw anything away, it must go somewhere."
                </blockquote>
                <cite className="quote-text not-italic text-mountainMeadow font-medium block">
                   -- Annie Leonard

                </cite>
                <span className="text-8xl text-basil absolute -bottom-16 right-10 font-serif opacity-50">”</span>
            </div>
            
            <div className="reveal-image relative h-[400px] bg-pine">
                <Image 
                    src="/About-5.jpeg"
                    alt="Man creating moodboard"
                    fill
                    className="object-cover opacity-90"
                />
            </div>
        </section>


        {/* --- Section 4: The Team --- */}
        <section className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-20">
            {/* Team Grid */}
            <div className="md:col-span-5 grid grid-cols-2 gap-4 h-fit">
               <div className="reveal-image relative h-48 md:h-64 bg-pine">
                   <Image src="/About-4.jpeg" alt="Team member" fill className="object-contain"  />
               </div>
               <div className="reveal-image relative h-48 md:h-64 bg-pine translate-y-12">
                   <Image src="/About-3.jpeg" alt="Team member" fill className="object-contain" />
               </div>
               <div className="reveal-image relative h-48 md:h-64 bg-pine col-span-2 mt-12">
                   <Image src="/About-2.jpeg" alt="Team member" fill className="object-contain" />
               </div>
            </div>

            {/* Team Text & Stats */}
            <div className="md:col-span-7 flex flex-col justify-between">
                <div>
                    <h2 className="reveal-image text-[#829c86] text-6xl md:text-8xl font-bold uppercase tracking-tighter mb-10">
                        The Team.
                    </h2>
                    <p className="reveal-image text-lg text-[#829c86] mb-6 max-w-xl">
                       The name CLOVER is our identity as a team of four — like a four‑leaf clover, rare and lucky, something people are always searching for with hope. It reflects resilience and community, thriving even in tough conditions. 

                    </p>
                    <p className="reveal-image text-lg text-[#829c86] mb-16 max-w-xl">
                        That’s what we believe Delhi can be: a city that flourishes when citizens and systems work together, with CLOVER as that rare solution people have been waiting to find
                    </p>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 border-t border-basil pt-10">
                    <div className="stat-box">
                        <div className="text-4xl font-bold text-[#829c86] mb-2">
                           <span className="stat-number" data-target="600">0</span>
                        </div>
                        <div className="text-xs uppercase tracking-wide text-pistachio">Million sq ft of sustainable work</div>
                    </div>
                    <div className="stat-box">
                        <div className="text-4xl font-bold text-[#829c86] mb-2">
                            <span className="stat-number" data-target="700">0</span>
                        </div>
                        <div className="text-xs uppercase tracking-wide text-pistachio">Billion gallons of water saved</div>
                    </div>
                    <div className="stat-box">
                        <div className="text-4xl font-bold text-[#829c86] mb-2">
                            <span className="stat-number" data-target="98">0</span>%
                        </div>
                        <div className="text-xs uppercase tracking-wide text-pistachio">Client Satisfaction Rate</div>
                    </div>
                    <div className="stat-box">
                        <div className="text-4xl font-bold text-[#829c86] mb-2">
                            <span className="stat-number" data-target="110">0</span>
                        </div>
                        <div className="text-xs uppercase tracking-wide text-pistachio">USGBC Certified Projects</div>
                    </div>
                </div>
            </div>
        </section>

      </div>
    </main>
    </>
  );
}