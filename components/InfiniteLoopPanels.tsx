"use client";
import React, { useLayoutEffect, useRef } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export interface PanelData {
  title: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
  image: string;
  description: string;
}

const defaultPanels: PanelData[] = [
  { 
    title: "Leaf-Line", 
    bgColor: "bg-rich-black", 
    textColor: "text-anti-flash", 
    borderColor: "border-bangladesh-green", 
    image: "/Homepage.jpeg",
    description: "Empowering Citizens for a Sustainable Delhi."
  },
  { 
    title: "Why Delhi Needs CSA", 
    bgColor: "bg-dark-green", 
    textColor: "text-mountain-meadow", 
    borderColor: "border-caribbean-green", 
    image: "/homepage-2.jpeg",
    description: "Delhi is currently grappling with severe civic challenges, most notably widespread waste mismanagement and rising pollution levels. This struggle is exacerbated by a critical gap in infrastructure: existing complaint redressal systems are fragmented, slow, and fundamentally lack transparency or reliable feedback mechanisms. To bridge this divide, our mission is to replace these inefficient systems with a unified, AI-powered platform for real-time civic engagement, empowering citizens to take an active role in Delhi's sustainable future."
  },
  { 
    title: "The Impact: Driving a Smarter Delhi", 
    bgColor: "bg-bangladesh-green", 
    textColor: "text-caribbean-green", 
    borderColor: "border-anti-flash", 
    image: "/homepage-1.jpeg",
    description: "Our platform is built on proven feasibility to deliver tangible results for the city, starting with a goal of 40% faster issue resolution by streamlining the communication path from the citizen's report to the authority's repair. By providing data-driven insights, we empower local authorities with real-time analytics that allow for more proactive and sustainable urban management interventions. Ultimately, the Civic Sustainability Assistant fosters a Sustainable Delhi by encouraging active citizen participation, transforming the capital into a cleaner, smarter, and more accountable urban center for everyone.."
  },
];

const StackedSections = ({ panels = defaultPanels }: { panels?: PanelData[] }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const context = gsap.context(() => {
      const panels = gsap.utils.toArray(".panel");
      
      panels.forEach((panel: any, i) => {
        ScrollTrigger.create({
          trigger: panel,
          start: "top top",
          pin: i !== panels.length - 1,
          pinSpacing: false, // This allows the next panel to overlap
          snap: 1 / (panels.length - 1), // Optional: snaps to the panel
        });

        if (i < panels.length - 1) {
          gsap.to(panel.querySelector(".panel-content"), {
            y: -50,
            opacity: 0,
            scale: 0.9,
            ease: "none",
            scrollTrigger: {
              trigger: panel,
              start: "top top",
              end: "bottom top",
              scrub: true,
            },
          });
        }
      });
    }, containerRef);

    return () => context.revert();
  }, []);

  return (
    <main ref={containerRef} className="bg-rich-black">
      {panels.map((section, index) => (
        <section
          key={index}
          className={`panel h-screen w-full flex items-center justify-center border-b ${section.bgColor} ${section.borderColor}`}
          style={{ zIndex: index, position: "relative" }}
        >
          <div className="absolute inset-0 z-0">
            <Image
              src={section.image}
              alt={section.title}
              fill
              className="object-cover opacity-70"
            />
          </div>
          <div className="panel-content text-center px-10 relative z-10">
            <h1 className={`text-6xl md:text-8xl font-bold mb-4 ${section.textColor}`}>
              {section.title}
            </h1>
            <div className={`h-1 w-24 mx-auto bg-caribbean-green`} />
            <p className="mt-8 text-anti-flash/70 max-w-md mx-auto">
              {section.description}
            </p>
          </div>
        </section>
      ))}
    </main>
  );
};

export default StackedSections;