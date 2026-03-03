import os
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import StreamingResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
from groq import AsyncGroq
from dotenv import load_dotenv

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
load_dotenv()

# Logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
logger = logging.getLogger("seva")

# Environment
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
PORT = int(os.getenv("PORT", 8000))

# CORS – restrict in production, open in development
ALLOWED_ORIGINS = (
    [
        "https://leafline.perkkk.dev",
        "https://www.leafline.perkkk.dev",
    ]
    if ENVIRONMENT == "production"
    else ["*"]
)

# Groq API key – required, no interactive prompt in production
groq_api_key = os.getenv("GROQ_API_KEY")
if not groq_api_key:
    if ENVIRONMENT == "production":
        logger.critical("GROQ_API_KEY is not set. Server cannot start.")
        raise SystemExit(1)
    else:
        logger.warning("GROQ_API_KEY not found – prompting for key (dev mode only)")
        groq_api_key = input("Enter your Groq API key: ").strip()
        if not groq_api_key:
            logger.critical("API key is required to run the server.")
            raise SystemExit(1)
        logger.info("API key received.")

client = AsyncGroq(api_key=groq_api_key)

# ---------------------------------------------------------------------------
# Rate limiting (simple in-memory, per-IP)
# ---------------------------------------------------------------------------
from collections import defaultdict
import time

_rate_store: dict[str, list[float]] = defaultdict(list)
RATE_LIMIT = int(os.getenv("RATE_LIMIT_PER_MINUTE", 30))


def _check_rate_limit(ip: str) -> bool:
    """Return True if rate limit exceeded."""
    now = time.time()
    timestamps = _rate_store[ip]
    # Purge older than 60 s
    _rate_store[ip] = [t for t in timestamps if now - t < 60]
    if len(_rate_store[ip]) >= RATE_LIMIT:
        return True
    _rate_store[ip].append(now)
    return False


# ---------------------------------------------------------------------------
# App lifecycle
# ---------------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Seva backend starting (env=%s, port=%s)", ENVIRONMENT, PORT)
    yield
    logger.info("Seva backend shutting down")


app = FastAPI(
    title="Seva – LeafLine Chatbot API",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Models
# ---------------------------------------------------------------------------

class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    messages: List[ChatMessage]


# ---------------------------------------------------------------------------
# Seva system prompt
# ---------------------------------------------------------------------------
SYSTEM_PROMPT = {
    "role": "system",
    "content": "You are Seva, a friendly civic assistant for Delhi. Help with waste, water, and roads. Be concise and empathetic.",
}


# ---------------------------------------------------------------------------
# Streaming helper
# ---------------------------------------------------------------------------
async def stream_seva(history: List[dict]):
    full_conversation = [SYSTEM_PROMPT] + history
    completion = await client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=full_conversation,
        stream=True,
    )
    async for chunk in completion:
        if chunk.choices[0].delta.content:
            yield chunk.choices[0].delta.content


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------
@app.get("/health")
async def health():
    """Simple health-check endpoint for uptime monitoring."""
    return {"status": "ok", "environment": ENVIRONMENT}


@app.post("/chat")
async def chat(request: ChatRequest, raw_request: Request):
    # Rate limiting
    client_ip = raw_request.client.host if raw_request.client else "unknown"
    if _check_rate_limit(client_ip):
        logger.warning("Rate limit exceeded for %s", client_ip)
        return JSONResponse(
            status_code=429,
            content={"detail": "Too many requests. Please wait a moment."},
        )

    logger.info("Chat request from %s (%d messages)", client_ip, len(request.messages))
    try:
        history = [m.model_dump() for m in request.messages]
        return StreamingResponse(stream_seva(history), media_type="text/plain")
    except Exception as exc:
        logger.exception("Error processing chat request")
        raise HTTPException(status_code=500, detail="Internal server error") from exc


# ---------------------------------------------------------------------------
# Entrypoint (local development)
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=PORT)