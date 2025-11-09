import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from mypy_extensions import TypedDict

class Settings(TypedDict):
    ALLOWED_ORIGINS: str

settings = Settings(
    ALLOWED_ORIGINS=os.getenv("ALLOWED_ORIGINS", "http://localhost:8080")
)

app = FastAPI()

ALLOWED_ORIGINS = settings["ALLOWED_ORIGINS"].split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

export default defineConfig({
  server: {
    host: "::",
    port: 8080,
  }
})
