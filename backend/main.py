from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from api.chat_api import router as chat_router

app = FastAPI()
# Add the CORSMiddleware to your application
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Or use the `origins` list for more security
    allow_credentials=True,
    allow_methods=["*"], # Allows all methods, including POST and OPTIONS
    allow_headers=["*"], # Allows all headers
)
def main():
    app.include_router(chat_router)
    uvicorn.run(app, host="0.0.0.0", port=8000)


if __name__ == "__main__":
    main()
