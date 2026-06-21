from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import create_tables
from routers import products, customers, orders, dashboard, suppliers

app = FastAPI(
    title="Inventory & Order Management API",
    description="Production-ready API for managing products, customers, orders, suppliers, and audit logs.",
    version="2.0.0",
)

# CORS — allow all origins for development; restrict in production
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(products.router)
app.include_router(customers.router)
app.include_router(orders.router)
app.include_router(dashboard.router)
app.include_router(suppliers.router)


@app.on_event("startup")
def on_startup():
    create_tables()


@app.get("/", tags=["Health"])
def root():
    return {"status": "ok", "message": "Inventory & Order Management API v2.0 is running."}


@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "healthy"}
