"use client";

import { useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

gsap.registerPlugin(ScrollTrigger);

export default function ContactPage() {
  const container = useRef<HTMLElement>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);

  useGSAP(
    () => {
      const tl = gsap.timeline();
      
      // Header animation
      tl.from(".contact-title", {
        y: 100,
        opacity: 0,
        duration: 1,
        ease: "power4.out",
        delay: 0.2,
      })
      .from(".contact-subtitle", {
        y: 30,
        opacity: 0,
        duration: 0.8,
        ease: "power2.out",
      }, "-=0.5");

      // Form animation
      gsap.from(".contact-form-container", {
        scrollTrigger: {
          trigger: ".contact-form-container",
          start: "top 80%",
          toggleActions: "play none none reverse",
        },
        y: 50,
        opacity: 0,
        duration: 1,
        ease: "power3.out",
      });

      // Contact info animation
      gsap.utils.toArray<HTMLElement>(".contact-info-item").forEach((item, index) => {
        gsap.from(item, {
          scrollTrigger: {
            trigger: item,
            start: "top 80%",
            toggleActions: "play none none reverse",
          },
          x: -50,
          opacity: 0,
          duration: 0.8,
          delay: index * 0.1,
          ease: "power2.out",
        });
      });
    },
    { scope: container }
  );

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Handle form submission
    console.log("Form submitted:", formData);
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setFormData({ name: "", email: "", subject: "", message: "" });
    }, 3000);
  };

  return (
    <main ref={container} className="bg-gradient-to-br from-dark-bg to-dark-secondary text-white min-h-screen">
      <Header />

      {/* Hero Section */}
      <section className="pt-40 pb-20 px-12">
        <div className="max-w-6xl mx-auto">
          <h1 className="contact-title text-6xl md:text-7xl font-bold mb-6 tracking-tighter">
            Get in Touch
          </h1>
          <p className="contact-subtitle text-xl text-gray-300 max-w-2xl">
            Have questions or feedback? We'd love to hear from you. Reach out and let's start a conversation.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-20 px-12">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16">
          {/* Contact Form */}
          <div className="contact-form-container">
            <h2 className="text-3xl font-bold mb-8">Send us a Message</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium mb-2">
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-dark-secondary border border-gray-600 rounded-lg focus:outline-none focus:border-caribbean-green transition-colors"
                  placeholder="Your name"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-2">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-dark-secondary border border-gray-600 rounded-lg focus:outline-none focus:border-caribbean-green transition-colors"
                  placeholder="your@email.com"
                />
              </div>

              <div>
                <label htmlFor="subject" className="block text-sm font-medium mb-2">
                  Subject
                </label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-dark-secondary border border-gray-600 rounded-lg focus:outline-none focus:border-caribbean-green transition-colors"
                  placeholder="What is this about?"
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium mb-2">
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={6}
                  className="w-full px-4 py-3 bg-dark-secondary border border-gray-600 rounded-lg focus:outline-none focus:border-caribbean-green transition-colors resize-none"
                  placeholder="Tell us more..."
                />
              </div>

              <button
                type="submit"
                className="w-full bg-caribbean-green text-dark-bg font-bold py-3 px-6 rounded-lg hover:bg-opacity-90 transition-all duration-200 transform hover:scale-105"
              >
                {submitted ? "Message Sent! ✓" : "Send Message"}
              </button>
            </form>
          </div>

          {/* Contact Information */}
          <div className="space-y-12">
            <h2 className="text-3xl font-bold mb-8">Other Ways to Connect</h2>

            <div className="contact-info-item">
              <h3 className="text-lg font-semibold mb-2">Email</h3>
              <p className="text-gray-300">contact@leafline.com</p>
            </div>

            <div className="contact-info-item">
              <h3 className="text-lg font-semibold mb-2">Phone</h3>
              <p className="text-gray-300">+1 (555) 123-4567</p>
            </div>

            <div className="contact-info-item">
              <h3 className="text-lg font-semibold mb-2">Address</h3>
              <p className="text-gray-300">
                123 Green Street<br />
                Environmental City, EC 12345<br />
                United States
              </p>
            </div>

            <div className="contact-info-item">
              <h3 className="text-lg font-semibold mb-2">Office Hours</h3>
              <p className="text-gray-300">
                Monday - Friday: 9:00 AM - 6:00 PM<br />
                Saturday: 10:00 AM - 4:00 PM<br />
                Sunday: Closed
              </p>
            </div>

            <div className="contact-info-item">
              <h3 className="text-lg font-semibold mb-2">Follow Us</h3>
              <div className="flex gap-4">
                <a href="#" className="text-caribbean-green hover:text-opacity-80 transition-colors">
                  Twitter
                </a>
                <a href="#" className="text-caribbean-green hover:text-opacity-80 transition-colors">
                  LinkedIn
                </a>
                <a href="#" className="text-caribbean-green hover:text-opacity-80 transition-colors">
                  Instagram
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}