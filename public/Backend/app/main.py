# backend/app/main.py
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base
from .routes import admin, users, roles
from app.routes import superset
import logging

logger = logging.getLogger("uvicorn.error")

app = FastAPI(title="Advanced Admin Panel")

# ✅ IMPORTANT: Add all frontend URLs here
FRONTEND_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=FRONTEND_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("✅ Startup complete")

# ✅ Stable preflight (fixes random fetch issues)
@app.options("/{rest_of_path:path}")
async def preflight(rest_of_path: str, request: Request):
    return Response(status_code=200)

# Routers
app.include_router(admin.router)
app.include_router(users.router)
app.include_router(roles.router)
app.include_router(superset.router)