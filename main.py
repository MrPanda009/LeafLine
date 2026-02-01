import os
from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
from groq import AsyncGroq
from dotenv import load_dotenv

load_dotenv()
app = FastAPI()

# IMPORTANT: This allows your React app to talk to Python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_methods=["*"],
    allow_headers=["*"],
)

# Get Groq API key from environment or prompt user
groq_api_key = os.getenv("GROQ_API_KEY")
if not groq_api_key:
    print("\n⚠️  GROQ_API_KEY not found in environment variables")
    groq_api_key = input("Please enter your Groq API key: ").strip()
    if not groq_api_key:
        print("❌ API key is required to run the server.")
        exit(1)
    print("✅ API key received!\n")

client = AsyncGroq(api_key=groq_api_key)

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]

# Seva's Personality System Prompt
SYSTEM_PROMPT = {
    "role": "system",
    "content": "You are Seva, a friendly civic assistant for Delhi. Help with waste, water, and roads. Be concise and empathetic."
}

async def stream_seva(history: List[dict]):
    # We combine the system prompt + the history from the frontend
    full_conversation = [SYSTEM_PROMPT] + history
    
    completion = await client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=full_conversation,
        stream=True,
    )
    async for chunk in completion:
        if chunk.choices[0].delta.content:
            yield chunk.choices[0].delta.content

@app.post("/chat")
async def chat(request: ChatRequest):
    history = [m.model_dump() for m in request.messages]
    return StreamingResponse(stream_seva(history), media_type="text/plain")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)