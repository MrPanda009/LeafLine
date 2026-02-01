"use client";

import React, { useState, useRef, useEffect } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

export default function SevaChat() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]); // This stores the conversation history
  const chatEndRef = useRef(null);

  // Auto-scroll to the bottom of the chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    // 1. Create the new user message
    const userMessage = { role: 'user', content: input };
    
    // 2. Update local state with user message
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');

    try {
      // 3. Send the ENTIRE history to FastAPI
      const response = await fetch('http://localhost:8000/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updatedMessages }),
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      
      // 4. Prepare a placeholder for Seva's response
      let sevaContent = "";
      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        sevaContent += chunk;
        
        // 5. Update the last message (Seva's) in real-time
        setMessages(prev => {
          const newHistory = [...prev];
          newHistory[newHistory.length - 1].content = sevaContent;
          return newHistory;
        });
      }
    } catch (error) {
      console.error("Seva Connection Error:", error);
    }
  };

  return (
    <div className="flex flex-col w-80 h-96 bg-white border border-gray-300 rounded-lg shadow-xl overflow-hidden">
      <div className="bg-blue-600 p-3 text-white font-bold text-center">Seva Assistant</div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {messages.map((msg, i) => (
          <div key={i} className={`p-2 rounded-lg text-sm ${msg.role === 'user' ? 'bg-blue-100 ml-auto' : 'bg-gray-100 mr-auto'}`}>
            {msg.content}
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>
      <div className="p-2 border-t flex">
        <input 
          className="flex-1 border rounded px-2 py-1 text-sm outline-none"
          value={input} 
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Ask Seva..."
        />
        <button onClick={sendMessage} className="ml-2 bg-blue-600 text-white px-3 py-1 rounded text-sm">Send</button>
      </div>
    </div>
  );
}