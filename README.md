# InvenTrack — Inventory & Order Management System

A production-ready, fully containerized Inventory and Order Management System built with **FastAPI**, **React**, and **PostgreSQL**.

## Tech Stack

| Layer           | Technology              |
|-----------------|-------------------------|
| Frontend        | React 18 + Vite + Vanilla CSS |
| Backend         | Python 3.11 + FastAPI   |
| Database        | PostgreSQL 15           |
| Containerization| Docker + Docker Compose |

## Features

- **Product Management** — Full CRUD, SKU uniqueness, stock tracking, category
- **Customer Management** — CRUD with unique email validation
- **Order Management** — Create orders with auto stock deduction & total calculation
- **Dashboard** — Summary stats + low-stock alerts (≤10 units)
- **Business Logic** — Stock checked before order, restored on cancellation, total auto-calculated

## Quick Start (Docker)

### 1. Clone the repository
```bash
git clone <your-repo-url>
cd inventory-management
```

### 2. Set up environment variables
```bash
cp .env.example .env
# Edit .env with your preferred passwords
```

### 3. Build and run with Docker Compose
```bash
docker compose up --build
```

### 4. Access the application
| Service  | URL                        |
|----------|----------------------------|
| Frontend | http://localhost:3000       |
| Backend  | http://localhost:8000       |
| API Docs | http://localhost:8000/docs  |

## Local Development (without Docker)

### Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate      # Windows
pip install -r requirements.txt

# Set environment variable
set DATABASE_URL=postgresql://postgres:postgres@localhost:5432/inventory_db

uvicorn main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
# Create .env.local with:
# VITE_API_URL=http://localhost:8000
npm run dev
```

## API Endpoints

### Products
| Method | Endpoint            | Description          |
|--------|---------------------|----------------------|
| POST   | /products           | Create product       |
| GET    | /products           | List all products    |
| GET    | /products/{id}      | Get product by ID    |
| PUT    | /products/{id}      | Update product       |
| DELETE | /products/{id}      | Delete product       |

### Customers
| Method | Endpoint            | Description          |
|--------|---------------------|----------------------|
| POST   | /customers          | Create customer      |
| GET    | /customers          | List all customers   |
| GET    | /customers/{id}     | Get customer by ID   |
| DELETE | /customers/{id}     | Delete customer      |

### Orders
| Method | Endpoint            | Description          |
|--------|---------------------|----------------------|
| POST   | /orders             | Create order         |
| GET    | /orders             | List all orders      |
| GET    | /orders/{id}        | Get order by ID      |
| DELETE | /orders/{id}        | Cancel/delete order  |

### Dashboard
| Method | Endpoint            | Description          |
|--------|---------------------|----------------------|
| GET    | /dashboard          | Get summary stats    |

## Business Logic

- **SKU uniqueness** — Enforced at DB and API level (409 Conflict)
- **Email uniqueness** — Enforced for customers (409 Conflict)
- **Quantity validation** — Cannot be negative
- **Insufficient stock** — Returns 422 with clear error message
- **Auto stock deduction** — On order creation (atomic transaction)
- **Stock restoration** — On order cancellation
- **Auto total** — Backend calculates order total from unit prices × quantities

## Deployment

### Backend → Render/Railway
1. Push to GitHub
2. Connect repo to Render/Railway
3. Set environment variable: `DATABASE_URL=<your-postgres-url>`
4. Deploy

### Frontend → Vercel/Netlify
1. Connect `frontend/` directory
2. Set environment variable: `VITE_API_URL=<your-backend-url>`
3. Build command: `npm run build`
4. Publish directory: `dist`

## Docker Hub

```bash
# Build and push backend image
docker build -t yourdockerhubuser/inventory-backend:latest ./backend
docker push yourdockerhubuser/inventory-backend:latest
```

## Project Structure

```
inventory-management/
├── backend/
│   ├── main.py              # FastAPI app entry
│   ├── models.py            # SQLAlchemy ORM models
│   ├── schemas.py           # Pydantic schemas
│   ├── database.py          # DB connection & session
│   ├── routers/
│   │   ├── products.py
│   │   ├── customers.py
│   │   ├── orders.py
│   │   └── dashboard.py
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .dockerignore
├── frontend/
│   ├── src/
│   │   ├── api/index.js     # Axios service layer
│   │   ├── components/
│   │   │   ├── Sidebar.jsx
│   │   │   ├── Modal.jsx
│   │   │   └── StatCard.jsx
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Products.jsx
│   │   │   ├── Customers.jsx
│   │   │   ├── Orders.jsx
│   │   │   └── OrderDetail.jsx
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css        # Design system
│   ├── Dockerfile
│   └── .dockerignore
├── docker-compose.yml
├── .env.example
└── README.md
```
