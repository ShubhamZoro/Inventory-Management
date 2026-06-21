# InvenTrack — Inventory & Order Management System

> A production-ready, full-stack Inventory and Order Management System built with **FastAPI**, **React**, and **PostgreSQL** — deployed live on Vercel + Render.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Vercel-black?logo=vercel)](https://inventory-management-steel-six-44.vercel.app/)
[![Backend](https://img.shields.io/badge/Backend-FastAPI-009688?logo=fastapi)](https://fastapi.tiangolo.com/)
[![Frontend](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-61dafb?logo=react)](https://vitejs.dev/)
[![Database](https://img.shields.io/badge/Database-PostgreSQL-336791?logo=postgresql)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Containerized-Docker-2496ed?logo=docker)](https://www.docker.com/)

---

## 🌐 Live Demo

**[https://inventory-management-steel-six-44.vercel.app/](https://inventory-management-steel-six-44.vercel.app/)**

---

## 📸 Screenshots

### Dashboard
![Dashboard](docs/screenshots/dashboard.png)

### Products
![Products](docs/screenshots/products.png)

### Customers
![Customers](docs/screenshots/customers.png)

### Orders
![Orders](docs/screenshots/orders.png)

---

## 🛠️ Tech Stack

| Layer            | Technology                                         |
|------------------|----------------------------------------------------|
| **Frontend**     | React 18 + Vite + TypeScript + Vanilla CSS         |
| **Backend**      | Python 3.11 + FastAPI 0.111 + Uvicorn              |
| **ORM**          | SQLAlchemy 2.0 + Alembic (migrations)              |
| **Database**     | PostgreSQL 15                                      |
| **HTTP Client**  | Axios 1.x                                          |
| **UI Utilities** | Lucide React (icons) · React Hot Toast             |
| **Routing**      | React Router DOM v7                                |
| **Validation**   | Pydantic v2                                        |
| **Containerization** | Docker + Docker Compose                        |
| **Frontend Host**| Vercel                                             |
| **Backend Host** | Render / Railway                                   |

---

## ✨ Features

### 📦 Product Management
- Full CRUD — create, read, update, delete products
- SKU uniqueness enforced at DB and API level (409 Conflict)
- Stock quantity tracking with low-stock alerts (≤ 10 units)
- Category organisation and price management
- Search by name, SKU, or category

### 👥 Customer Management
- Full CRUD with unique email validation
- Store full name, email, phone, and address
- Search by name, email, or phone

### 🧾 Order Management
- Create orders with multiple line items per order
- Auto stock deduction on order creation (atomic transaction)
- Stock restoration on order cancellation
- Auto-calculated order total (unit price × quantity)
- Order status tracking (Pending / Cancelled)
- View detailed order breakdown per order

### 📊 Dashboard
- Real-time summary stats: Total Products, Customers, Orders, Revenue, Pending POs
- Low-stock alert panel with direct links
- Live API connection status indicator

---

## 🚀 Quick Start (Docker)

### 1. Clone the repository
```bash
git clone https://github.com/ShubhamZoro/Inventory-Management.git
cd Inventory-Management
```

### 2. Set up environment variables
```bash
cp .env.example .env
# Edit .env with your preferred database credentials
```

### 3. Build and run with Docker Compose
```bash
docker compose up --build
```

### 4. Access the application

| Service  | URL                       |
|----------|---------------------------|
| Frontend | http://localhost:3000      |
| Backend  | http://localhost:8000      |
| API Docs | http://localhost:8000/docs |

---

## 💻 Local Development (without Docker)

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL 15

### Backend
```bash
cd backend
python -m venv venv

# Activate virtual environment
venv\Scripts\activate        # Windows
source venv/bin/activate     # macOS / Linux

pip install -r requirements.txt

# Set environment variable
set DATABASE_URL=postgresql://postgres:postgres@localhost:5432/inventory_db   # Windows
export DATABASE_URL=postgresql://postgres:postgres@localhost:5432/inventory_db # macOS/Linux

uvicorn main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install

# Create .env.local and add:
# VITE_API_URL=http://localhost:8000

npm run dev
```

---

## 📡 API Endpoints

Interactive docs available at `/docs` (Swagger UI) and `/redoc` when the backend is running.

### Products
| Method | Endpoint          | Description        |
|--------|-------------------|--------------------|
| `POST`   | `/products`       | Create product     |
| `GET`    | `/products`       | List all products  |
| `GET`    | `/products/{id}`  | Get product by ID  |
| `PUT`    | `/products/{id}`  | Update product     |
| `DELETE` | `/products/{id}`  | Delete product     |

### Customers
| Method | Endpoint           | Description         |
|--------|--------------------|---------------------|
| `POST`   | `/customers`       | Create customer     |
| `GET`    | `/customers`       | List all customers  |
| `GET`    | `/customers/{id}`  | Get customer by ID  |
| `DELETE` | `/customers/{id}`  | Delete customer     |

### Orders
| Method | Endpoint        | Description          |
|--------|-----------------|----------------------|
| `POST`   | `/orders`       | Create order         |
| `GET`    | `/orders`       | List all orders      |
| `GET`    | `/orders/{id}`  | Get order by ID      |
| `DELETE` | `/orders/{id}`  | Cancel / delete order|

### Dashboard
| Method | Endpoint      | Description       |
|--------|---------------|-------------------|
| `GET`    | `/dashboard`  | Get summary stats |

---

## 🧠 Business Logic

| Rule | Detail |
|------|--------|
| **SKU uniqueness** | Enforced at DB + API level — returns `409 Conflict` |
| **Email uniqueness** | Enforced per customer — returns `409 Conflict` |
| **Quantity validation** | Cannot be zero or negative |
| **Stock check** | Order rejected with `422` if stock is insufficient |
| **Auto stock deduction** | Deducted atomically when order is created |
| **Stock restoration** | Restored when order is cancelled/deleted |
| **Auto order total** | Calculated server-side: `unit_price × quantity` per line item |

---

## 🌍 Deployment

### Backend → Render / Railway
1. Push to GitHub
2. Connect repo to [Render](https://render.com) or [Railway](https://railway.app)
3. Set environment variable: `DATABASE_URL=<your-postgres-url>`
4. Start command: `uvicorn main:app --host 0.0.0.0 --port 8000`

### Frontend → Vercel
1. Connect the `frontend/` directory to [Vercel](https://vercel.com)
2. Set environment variable: `VITE_API_URL=<your-backend-url>`
3. Build command: `npm run build`
4. Publish directory: `dist`

### Docker Hub
```bash
# Build and push backend image
docker build -t <dockerhub-user>/inventory-backend:latest ./backend
docker push <dockerhub-user>/inventory-backend:latest

# Build and push frontend image
docker build -t <dockerhub-user>/inventory-frontend:latest ./frontend
docker push <dockerhub-user>/inventory-frontend:latest
```

---

## 📁 Project Structure

```
inventory-management/
├── backend/
│   ├── main.py              # FastAPI app entry point
│   ├── models.py            # SQLAlchemy ORM models
│   ├── schemas.py           # Pydantic v2 request/response schemas
│   ├── database.py          # DB connection & session factory
│   ├── runtime.txt          # Python version pin (for Render)
│   ├── routers/
│   │   ├── products.py      # Product CRUD endpoints
│   │   ├── customers.py     # Customer CRUD endpoints
│   │   ├── orders.py        # Order management endpoints
│   │   └── dashboard.py     # Summary stats endpoint
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .dockerignore
├── frontend/
│   ├── src/
│   │   ├── api/index.js     # Axios service layer
│   │   ├── components/
│   │   │   ├── Sidebar.jsx  # Navigation sidebar
│   │   │   ├── Modal.jsx    # Reusable modal component
│   │   │   └── StatCard.jsx # Dashboard stat cards
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Products.jsx
│   │   │   ├── Customers.jsx
│   │   │   ├── Orders.jsx
│   │   │   └── OrderDetail.jsx
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css        # Design system & global styles
│   ├── package.json
│   ├── tsconfig.json
│   ├── Dockerfile
│   └── .dockerignore
├── docs/
│   └── screenshots/         # App screenshots (used in README)
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## 🔧 Environment Variables

### Backend (`.env`)
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/inventory_db
```

### Frontend (`.env.local`)
```env
VITE_API_URL=http://localhost:8000
```

---

## 📦 Backend Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `fastapi` | 0.111.0 | Web framework |
| `uvicorn[standard]` | 0.29.0 | ASGI server |
| `sqlalchemy` | 2.0.30 | ORM |
| `psycopg2-binary` | 2.9.9 | PostgreSQL adapter |
| `pydantic` | 2.7.1 | Data validation |
| `pydantic-settings` | 2.2.1 | Settings management |
| `alembic` | 1.13.1 | Database migrations |
| `python-dotenv` | 1.0.1 | `.env` loading |
| `python-multipart` | 0.0.9 | Form data support |

---

*Built with ❤️ using FastAPI & React*
