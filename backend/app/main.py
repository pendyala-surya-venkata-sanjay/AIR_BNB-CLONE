import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.database import engine, Base
from backend.app.routers import auth, listings, bookings, host, wishlist

# Initialize database tables on application startup
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="StayNest API",
    description="Backend API for StayNest marketplace containing Listings CRUD, Bookings availability and User authentication",
    version="1.0.0"
)

# Configure CORS for Next.js frontend connectivity
frontend_url = os.getenv("FRONTEND_URL")
origins = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
]
if frontend_url:
    origins.append(frontend_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Routers
app.include_router(auth.router)
app.include_router(listings.router)
app.include_router(bookings.router)
app.include_router(host.router)
app.include_router(wishlist.router)

@app.get("/")
def read_root():
    return {
        "status": "online",
        "service": "StayNest API",
        "documentation": "/docs"
    }
