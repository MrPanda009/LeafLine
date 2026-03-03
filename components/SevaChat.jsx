"use client";

import React, { useState, useRef, useEffect } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

export default function SevaAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  
  // Initial messages
  const [messages, setMessages] = useState([
    { id: 1, text: "Hello! How can I help you today?", sender: "bot" },
  ]);

  const widgetRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const chatBodyRef = useRef(null);

  // 1. Toggle Animation (Open/Close Widget)
  useGSAP(() => {
    if (isOpen) {
      gsap.fromTo(
        widgetRef.current,
        { scale: 0.8, opacity: 0, transformOrigin: "bottom right", display: "none" },
        { scale: 1, opacity: 1, display: "flex", duration: 0.4, ease: "back.out(1.7)" }
      );
      
      gsap.from(".message-bubble", {
        y: 20,
        opacity: 0,
        duration: 0.4,
        stagger: 0.1,
        delay: 0.2,
      });
      
    } else {
      gsap.to(widgetRef.current, {
        scale: 0.8,
        opacity: 0,
        display: "none",
        duration: 0.3,
      });
    }
  }, [isOpen]);

  // 2. Auto-scroll and animate new messages
  useEffect(() => {
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
    }
    
    if (messages.length > 0 && isOpen) {
       const lastMessage = messagesContainerRef.current?.lastElementChild;
       if(lastMessage) {
           gsap.fromTo(lastMessage, 
             { y: 20, opacity: 0, scale: 0.95 },
             { y: 0, opacity: 1, scale: 1, duration: 0.3, ease: "power2.out" }
           );
       }
    }
  }, [messages, isOpen]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userMessage = inputValue.trim();
    const newUserMsg = { id: Date.now(), text: userMessage, sender: "user" };
    setMessages((prev) => [...prev, newUserMsg]);
    setInputValue("");

    try {
      // Build conversation history for context
      const conversationHistory = messages
        .filter(msg => msg.sender !== 'bot' || msg.id !== 1) // Exclude initial greeting
        .map(msg => ({
          role: msg.sender === 'user' ? 'user' : 'assistant',
          content: msg.text
        }));
      
      // Add the new user message
      conversationHistory.push({
        role: 'user',
        content: userMessage
      });

      // Call the backend API
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
      const response = await fetch(`${backendUrl}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages: conversationHistory }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response from server');
      }

      // Read the streaming response
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let botResponse = '';
      const botMsgId = Date.now() + 1;

      // Add empty bot message that will be updated
      setMessages((prev) => [...prev, { id: botMsgId, text: '', sender: 'bot' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        botResponse += chunk;
        
        // Update the bot message with streaming content
        setMessages((prev) => 
          prev.map((msg) => 
            msg.id === botMsgId 
              ? { ...msg, text: botResponse } 
              : msg
          )
        );
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorMsg = { 
        id: Date.now() + 1, 
        text: "Sorry, I'm having trouble connecting to the backend. Please try again later.", 
        sender: "bot" 
      };
      setMessages((prev) => [...prev, errorMsg]);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans text-[#020F12]">
      
      {/* --- Main Chat Widget --- */}
      <div
        ref={widgetRef}
        className="w-[360px] h-[520px] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-100 hidden origin-bottom-right"
        style={{ fontFamily: "'Axiforma', 'Inter', sans-serif" }} 
      >
        
        {/* Header - Using 'Bangladesh Green' */}
        <div className="bg-[#005F52] p-5 flex items-center justify-between text-white shadow-md shrink-0">
          <div className="flex items-center gap-3">
             {/* Status Dot - Using 'Mountain Meadow' for pop */}
            <span className="w-2.5 h-2.5 bg-[#1CC596] rounded-full animate-pulse shadow-[0_0_8px_rgba(28,197,150,0.6)]"></span>
            <div>
              <h3 className="font-bold text-lg tracking-wide leading-tight">Seva Assistant</h3>
              <p className="text-[10px] uppercase tracking-wider text-green-100 opacity-80 font-medium">Online</p>
            </div>
          </div>
          <button 
            onClick={() => setIsOpen(false)}
            className="hover:bg-[#004d42] p-1.5 rounded-full transition-colors opacity-80 hover:opacity-100"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {/* Chat Body - Using 'Anti-Flash White' Background */}
        <div ref={chatBodyRef} className="flex-1 bg-[#F1F5F9] p-5 overflow-y-auto">
          <div ref={messagesContainerRef} className="flex flex-col gap-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`message-bubble max-w-[80%] px-4 py-3 text-sm font-medium leading-relaxed shadow-sm relative
                  ${msg.sender === "user" 
                    ? "self-end bg-[#005F52] text-white rounded-t-2xl rounded-bl-2xl rounded-br-sm" 
                    : "self-start bg-white text-[#020F12] border border-gray-200 rounded-t-2xl rounded-br-2xl rounded-bl-sm"
                  }`}
              >
                {msg.text}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <form onSubmit={handleSend} className="p-4 bg-white border-t border-gray-100 flex gap-2 shrink-0 items-center">
          <input
            type="text"
            className="flex-1 bg-[#F1F5F9] text-[#020F12] px-5 py-3 rounded-full outline-none focus:ring-2 focus:ring-[#1CC596] transition-all text-sm placeholder-gray-400 font-medium"
            placeholder="Ask Seva..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
          />
          <button 
            type="submit"
            className="w-11 h-11 bg-[#1CC596] hover:bg-[#15a37c] text-white rounded-full flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-md group"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-0.5 group-hover:translate-x-0.5 transition-transform" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
            </svg>
          </button>
        </form>

      </div>

      {/* --- Floating Launcher Button --- */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 bg-[#005F52] hover:bg-[#004d42] text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110 active:scale-90"
        >
           {/* Chat Icon */}
          <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        </button>
      )}
    </div>
  );
}