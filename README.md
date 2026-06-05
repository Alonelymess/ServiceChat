# ServiceChat 🏛️

> **🏆 GovHack 2025 — National Runner-Up**

An AI-powered chatbot that helps NSW residents navigate government services. Instead of searching across dozens of agency websites, users describe their situation and ServiceChat guides them through the right services, forms, and next steps — with a side-by-side assistant that answers questions as they go.

---

## Features

- **5 life-event scenarios** — new arrival in Australia, new baby, storm damage, address change, business registration
- **Free-text chat** — ask anything about NSW government services
- **Form assistant** — guides users through government forms field by field, with context-aware answers and official links
- **Gemini 2.5 Flash** with thinking mode, Google Search grounding, and URL context tools
- **Per-user, per-scenario conversation memory** with automatic history trimming
- **Weaviate vector DB** for semantic search over service content

---

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 15, TypeScript, Tailwind CSS, shadcn/ui |
| Backend | FastAPI (Python), Uvicorn |
| AI | Google Gemini 2.5 Flash (via `google-genai`) |
| Vector DB | Weaviate 1.28 |
| Infrastructure | Docker Compose |

---

## Architecture

```
User → Next.js frontend
          ↓ POST /chat
       FastAPI backend
          ↓
       Gemini 2.5 Flash
       (+ Google Search + URL Context tools)
          ↓
       Weaviate (vector search)
```

The backend maintains per-user, per-scenario conversation histories and passes them to Gemini on each turn, keeping the last 10 messages to stay within context limits.

---

## Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18+
- Docker & Docker Compose

### 1. Start Weaviate

```bash
cd backend
docker compose up -d
```

Weaviate will be available at `http://localhost:8080`.

### 2. Backend

```bash
cd backend
pip install -r requirements.txt
```

Create a `.env` file:

```env
model_key=YOUR_GOOGLE_GENAI_API_KEY
```

Run the server:

```bash
python main.py
```

Backend runs on `http://localhost:8000`.

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:3000`.

---

## Project Structure

```
ServiceChat/
├── backend/
│   ├── api/
│   │   └── chat_api.py        # POST /chat endpoint
│   ├── utils/
│   │   ├── chat.py            # Gemini chat logic, history management
│   │   └── prompt.py          # System prompts
│   ├── docker-compose.yml     # Weaviate setup
│   └── main.py                # FastAPI app entry point
└── frontend/
    ├── app/
    │   └── page.tsx            # Home page
    └── components/
        ├── service-scenarios.tsx      # Scenario picker + free-text chat
        └── conversational_chatbot.tsx # Chat UI
```

---

## Environment Variables

| Variable | Description |
|---|---|
| `model_key` | Google Generative AI API key (Gemini) |

---

## Scenarios

| Scenario | Description |
|---|---|
| `new-arrival` | Essential setup for new residents in Australia |
| `new-baby` | Newborn registration and family services |
| `storm-damage` | Damage reporting and emergency assistance |
| `change-address` | Update address across all government services |
| `business-registration` | Register a business and obtain required licences |

---

## API

### `POST /chat`

```json
{
  "message": "new-arrival\nUser: How do I get a Medicare card?",
  "user_id": "abc123",
  "role": "user"
}
```

**Response:**

```json
{
  "user_id": "abc123",
  "message": "To get a Medicare card as a new arrival..."
}
```

---

## Acknowledgements

Built for **GovHack 2025** — a national hackathon focused on using open government data to solve real problems for Australians.
