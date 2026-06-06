from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from api.chat_api import router as chat_router
import os

app = FastAPI(
    title="ServiceChat API",
    description="AI-powered NSW Government Services assistant",
    version="1.0.0",
)

# CORS — allow localhost dev origins; set ALLOWED_ORIGINS env var in production
_origins_env = os.getenv("ALLOWED_ORIGINS", "")
ALLOWED_ORIGINS = [o.strip() for o in _origins_env.split(",") if o.strip()] or [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "skip_zrok_interstitial"],
)

# Register routes at module level so `uvicorn main:app` works
app.include_router(chat_router)


@app.get("/health")
async def health():
    return {"status": "ok", "service": "ServiceChat API"}


def main():
    uvicorn.run(app, host="0.0.0.0", port=8000)


if __name__ == "__main__":
    main()
