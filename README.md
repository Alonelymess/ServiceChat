# ServiceChat 🏛️

[![GovHack 2025](https://img.shields.io/badge/GovHack_2025-National_Runner--Up_🏆-gold)](https://govhack.org)
[![Next.js](https://img.shields.io/badge/Next.js_15-black?logo=next.js)](https://nextjs.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Gemini](https://img.shields.io/badge/Gemini_2.5_Flash-4285F4?logo=google&logoColor=white)](https://ai.google.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)

> **🏆 GovHack 2025 — National Runner-Up**

An AI-powered chatbot that helps NSW residents navigate government services. Instead of searching across dozens of agency websites, users describe their situation and ServiceChat routes them into a structured guided form — with a real-time AI assistant built into the side panel that answers questions as they go.

---

## Demo

![ServiceChat Demo](docs/demo.gif)

> **Scenario shown:** Starting a business in NSW — the app identifies required industry licences, surfaces a compliance checklist with direct links to ASIC / ATO / council registration, and answers questions about business structure in the side panel.

---

## Features

- **5 life-event scenarios** — each with a dedicated structured form and embedded AI assistant
- **Streaming chat** — responses stream token-by-token via Server-Sent Events
- **Form assistant** — context-aware AI answers based on the user's current form state
- **AI-generated roadmap** — personalised action plan based on the conversation history
- **Free-text chat** — ask anything about NSW government services without picking a scenario
- **Gemini 2.5 Flash** with thinking mode, Google Search grounding, and URL Context tools
- **Per-user, per-scenario conversation memory** with automatic history trimming

---

## Scenarios

Each scenario opens a dedicated structured form with an AI chat assistant in the side panel.

| Scenario | Form | Description |
|---|---|---|
| `new-arrival` | `NewArrivalForm` | 3-step checklist — visa info, TFN/Medicare/licence setup, local services directory |
| `new-baby` | `BirthRegistrationForm` | Full NSW BDM birth registration form — conditional fields, identity document guidance |
| `storm-damage` | `StormDamageForm` | 4-step incident report — property, damage types, emergency services, insurance |
| `change-address` | `ChangeAddressForm` | Address update across 12 services — Service NSW, ATO, Medicare, electoral roll, utilities |
| `business-registration` | `BusinessRegistrationForm` | Business structure picker, industry licence warnings, ABN/GST/TFN compliance checklist |

---

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 15, TypeScript, Tailwind CSS, shadcn/ui |
| Backend | FastAPI (Python), Uvicorn |
| AI | Google Gemini 2.5 Flash (`google-genai` SDK) |
| Streaming | Server-Sent Events (SSE) via `StreamingResponse` |
| Infrastructure | Docker Compose (Weaviate for future vector search) |

---

## Architecture

```
Browser (Next.js 15)
    │
    │  POST /chat/stream  ← SSE — tokens stream in real time
    │  POST /chat         ← standard JSON (form side-chat)
    │  POST /roadmap      ← AI-generated personalised action plan
    ▼
FastAPI backend
    │
    ├── utils/chat.py         per-user, per-scenario conversation history
    ├── utils/prompt.py       scenario-specific system prompts
    └── api/chat_api.py       SSE + JSON + roadmap endpoints
    │
    ▼
Gemini 2.5 Flash
    ├── GoogleSearch tool     → live NSW government service data
    └── UrlContext tool       → real-time content from official URLs
```

**Conversation memory:** each `(user_id, scenario)` pair maintains its own history, capped at 20 messages (oldest trimmed first, initial system prompt always preserved). History is stored server-side per session; UUID-based user IDs are generated and persisted in `localStorage` on the frontend.

---

## Project Structure

```
ServiceChat/
├── backend/
│   ├── api/
│   │   └── chat_api.py           # POST /chat, /chat/stream, /roadmap
│   ├── utils/
│   │   ├── chat.py               # Gemini logic, streaming, history management
│   │   └── prompt.py             # Per-scenario system prompts
│   ├── docker-compose.yml        # Weaviate (optional)
│   ├── main.py                   # FastAPI app, CORS, health endpoint
│   └── requirements.txt
└── frontend/
    ├── app/
    │   └── page.tsx
    ├── components/
    │   ├── service-scenarios.tsx          # Scenario picker + free-text entry
    │   ├── conversational_chatbot.tsx     # Routes to form or free chat
    │   ├── birth-registration-form.tsx    # new-baby
    │   ├── new-arrival-form.tsx           # new-arrival
    │   ├── change-address-form.tsx        # change-address
    │   ├── storm-damage-form.tsx          # storm-damage
    │   ├── business-registration-form.tsx # business-registration
    │   ├── roadmap-view.tsx               # AI-generated roadmap
    │   └── chat-history.tsx
    └── lib/
        └── api.tsx                        # streamMessageToApi, fetchRoadmap
```

---

## Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18+

### 1. Backend

```bash
cd backend
pip install -r requirements.txt
```

Create a `.env` file (see `.env.example`):

```
model_key=YOUR_GOOGLE_GENAI_API_KEY
```

Run the server:

```bash
uvicorn main:app --reload
```

Backend runs at `http://localhost:8000`. Check `GET /health` to confirm.

### 2. Frontend

```bash
cd frontend
cp .env.local.example .env.local
npm install
npm run dev
```

Frontend runs at `http://localhost:3000`.

---

## API Reference

### `POST /chat/stream`
Streams a response via Server-Sent Events.

**Request:**
```json
{ "message": "How do I get a TFN?", "user_id": "abc123" }
```

**SSE events:**
```
data: {"token": "To "}
data: {"token": "apply "}
...
data: [DONE]
```

---

### `POST /chat`
Standard JSON response. Used by the form side-chat panels where streaming isn't needed.

**Request:**
```json
{ "message": "User question about birth registration form: ...", "user_id": "abc123" }
```

**Response:**
```json
{ "user_id": "abc123", "message": "..." }
```

---

### `POST /roadmap`
Generates a personalised action plan based on the user's conversation history.

**Request:**
```json
{ "user_id": "abc123", "scenario": "new-arrival" }
```

**Response:**
```json
{
  "steps": [
    {
      "title": "Apply for a Tax File Number",
      "description": "Required before starting work or opening a bank account.",
      "link": "https://www.ato.gov.au/...",
      "priority": "high",
      "estimatedTime": "15 min"
    }
  ]
}
```

---

### `GET /health`
```json
{ "status": "ok", "service": "ServiceChat API" }
```

---

## Environment Variables

| Variable | Where | Description |
|---|---|---|
| `model_key` | `backend/.env` | Google Generative AI API key |
| `NEXT_PUBLIC_API_URL` | `frontend/.env.local` | Backend base URL (default: `http://127.0.0.1:8000`) |
| `ALLOWED_ORIGINS` | `backend/.env` | Comma-separated CORS origins for production |

---

## Acknowledgements

Built for **GovHack 2025** — a national hackathon focused on using open government data to solve real problems for Australians.
