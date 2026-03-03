# LeafLine Backend – Deployment Guide

> Deploy the Seva chatbot FastAPI backend to **Railway** and wire it up to the Vercel frontend via a custom domain.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Local Testing](#local-testing)
3. [Deploy to Railway](#deploy-to-railway)
4. [Custom Domain Setup](#custom-domain-setup)
5. [Update the Frontend on Vercel](#update-the-frontend-on-vercel)
6. [Environment Variables Reference](#environment-variables-reference)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

| Requirement | Where to get it |
|---|---|
| **Railway account** | <https://railway.app> (free tier works to start) |
| **Groq API key** | <https://console.groq.com/> |
| **GitHub repo** | Push your code to GitHub so Railway can auto-deploy |
| **Domain access** | DNS control for `perkkk.dev` (Google Domains / Cloudflare / etc.) |

Make sure your `.gitignore` contains:

```gitignore
.env
__pycache__/
```

---

## Local Testing

1. **Install Python dependencies:**

   ```bash
   pip install -r requirements.txt
   ```

2. **Create a `.env` file** (copy from `.env.example`):

   ```bash
   cp .env.example .env
   # Edit .env → add your GROQ_API_KEY
   ```

3. **Start the backend:**

   ```bash
   python main.py
   ```

4. **Run the test suite:**

   ```bash
   python test_backend.py
   # Expected output: 3/3 tests passed
   ```

5. **Start the Next.js frontend** (separate terminal):

   ```bash
   npm run dev
   ```

   The frontend will call `http://localhost:8000/chat` by default.

---

## Deploy to Railway

### Step 1 – Create a Railway Project

1. Go to <https://railway.app/dashboard> and click **"New Project"**.
2. Choose **"Deploy from GitHub Repo"**.
3. Select your **LeafLine** repository.
4. Railway will detect `requirements.txt` and use Nixpacks to build automatically.

### Step 2 – Set Environment Variables

In the Railway service dashboard, go to **Variables** and add:

| Variable | Value |
|---|---|
| `GROQ_API_KEY` | `gsk_…` (your Groq secret key) |
| `ENVIRONMENT` | `production` |
| `RATE_LIMIT_PER_MINUTE` | `30` (optional, default is 30) |

> **Note:** `PORT` is set automatically by Railway – do **not** add it manually.

### Step 3 – Configure the Start Command

Railway should pick up `railway.toml` automatically. If not, set the start command manually in **Settings → Deploy**:

```
uvicorn main:app --host 0.0.0.0 --port $PORT
```

### Step 4 – Deploy

Railway auto-deploys on every push to your default branch. You can also trigger a manual deploy from the dashboard.

### Step 5 – Verify

Once deployed, Railway gives you a URL like:

```
https://leafline-production-xxxx.up.railway.app
```

Test it:

```bash
curl https://leafline-production-xxxx.up.railway.app/health
# → {"status":"ok","environment":"production"}
```

Or use the test script:

```bash
python test_backend.py https://leafline-production-xxxx.up.railway.app
```

---

## Custom Domain Setup

### Step 1 – Add Domain in Railway

1. In your Railway service, go to **Settings → Networking → Custom Domain**.
2. Enter: `api.leafline.perkkk.dev`
3. Railway will display a **CNAME target** (e.g., `xxxx.up.railway.app`).

### Step 2 – Add DNS Record

In your domain registrar (Google Domains, Cloudflare, etc.), add:

| Type | Name | Target | TTL |
|---|---|---|---|
| **CNAME** | `api.leafline` | `xxxx.up.railway.app` | 300 |

> Replace `xxxx.up.railway.app` with the actual value Railway shows you.

### Step 3 – Wait for Propagation

- DNS changes can take **5–30 minutes** (sometimes up to 48 hours).
- Railway will automatically provision an SSL certificate once DNS resolves.

### Step 4 – Verify

```bash
curl https://api.leafline.perkkk.dev/health
# → {"status":"ok","environment":"production"}
```

---

## Update the Frontend on Vercel

### Step 1 – Set Environment Variable on Vercel

1. Go to your Vercel project dashboard → **Settings → Environment Variables**.
2. Add:

   | Variable | Value | Environments |
   |---|---|---|
   | `NEXT_PUBLIC_BACKEND_URL` | `https://api.leafline.perkkk.dev` | Production, Preview |

3. **Redeploy** the project (Vercel → Deployments → click "Redeploy" on latest).

### How It Works in Code

The `SevaChat.jsx` component uses this pattern:

```jsx
const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
const response = await fetch(`${backendUrl}/chat`, { ... });
```

- **Production (Vercel):** Uses `https://api.leafline.perkkk.dev`
- **Local development:** Falls back to `http://localhost:8000`

---

## Environment Variables Reference

### Backend (Railway)

| Variable | Required | Default | Description |
|---|---|---|---|
| `GROQ_API_KEY` | **Yes** | – | Groq API key for LLM |
| `ENVIRONMENT` | No | `development` | `production` or `development` |
| `PORT` | No | `8000` | Set automatically by Railway |
| `RATE_LIMIT_PER_MINUTE` | No | `30` | Max requests per IP per minute |

### Frontend (Vercel)

| Variable | Required | Default | Description |
|---|---|---|---|
| `NEXT_PUBLIC_BACKEND_URL` | No | `http://localhost:8000` | Seva backend URL |
| `NEXT_PUBLIC_SUPABASE_URL` | **Yes** | – | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | **Yes** | – | Supabase anon/public key |

---

## Troubleshooting

### Backend returns 500 or won't start

- Check Railway **Logs** tab for errors.
- Most common cause: `GROQ_API_KEY` not set → the server exits immediately in production.

### CORS errors in the browser

- Verify `ENVIRONMENT=production` is set on Railway.
- The allowed origins are `https://leafline.perkkk.dev` and `https://www.leafline.perkkk.dev`.
- If you use a different frontend domain, update `ALLOWED_ORIGINS` in `main.py`.

### Custom domain shows "DNS not configured"

- Double-check the CNAME record: `api.leafline` → Railway's target URL.
- Wait 15–30 minutes for propagation.
- Verify with: `dig api.leafline.perkkk.dev CNAME`

### 429 Too Many Requests

- Default rate limit is 30 requests per IP per minute.
- Increase by setting `RATE_LIMIT_PER_MINUTE` in Railway environment variables.

### Railway build fails

- Ensure `requirements.txt` is at the repo root.
- Check that `railway.toml` references the correct start command.
- Railway uses Nixpacks by default; it detects Python from `requirements.txt`.

### Streaming responses not working

- Ensure you're **not** behind a proxy that buffers responses.
- Cloudflare proxied (orange cloud) DNS records can buffer SSE; use DNS-only (grey cloud) if possible, or disable Cloudflare buffering.

---

## Architecture Overview

```
┌─────────────────────┐     HTTPS      ┌─────────────────────────────┐
│  Vercel (Frontend)  │ ──────────────► │  Railway (Backend)          │
│  leafline.perkkk.dev│                 │  api.leafline.perkkk.dev    │
│                     │                 │  FastAPI + Groq LLM         │
└─────────────────────┘                 └──────────────┬──────────────┘
                                                       │
                                                       ▼
                                               ┌──────────────┐
                                               │  Groq Cloud  │
                                               │  (LLM API)   │
                                               └──────────────┘
                                                       
┌─────────────────────┐
│  Supabase           │  ◄── Auth + Database (used by frontend directly)
│  (PostgreSQL)       │
└─────────────────────┘
```

---

## Quick Reference Commands

```bash
# Local development
python main.py                          # Start backend on :8000
npm run dev                             # Start Next.js frontend

# Test backend (local or remote)
python test_backend.py                  # defaults to localhost:8000
python test_backend.py https://api.leafline.perkkk.dev

# Check DNS propagation
dig api.leafline.perkkk.dev CNAME
nslookup api.leafline.perkkk.dev
```
