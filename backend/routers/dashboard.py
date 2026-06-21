from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from database import get_db
from models import Product, Customer, Order, PurchaseOrder
from schemas import DashboardResponse, ProductResponse

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

LOW_STOCK_THRESHOLD = 10


@router.get("", response_model=DashboardResponse)
def get_dashboard(db: Session = Depends(get_db)):
    total_products = db.query(func.count(Product.id)).scalar()
    total_customers = db.query(func.count(Customer.id)).scalar()
    total_orders = db.query(func.count(Order.id)).scalar()
    total_revenue = db.query(func.coalesce(func.sum(Order.total_amount), 0.0)).scalar()

    pending_purchase_orders = (
        db.query(func.count(PurchaseOrder.id))
        .filter(PurchaseOrder.status.in_(["pending", "ordered"]))
        .scalar()
    )

    low_stock = (
        db.query(Product)
        .filter(Product.quantity <= LOW_STOCK_THRESHOLD)
        .order_by(Product.quantity.asc())
        .all()
    )

    return DashboardResponse(
        total_products=total_products or 0,
        total_customers=total_customers or 0,
        total_orders=total_orders or 0,
        total_revenue=float(total_revenue or 0),
        low_stock_products=[ProductResponse.model_validate(p) for p in low_stock],
        pending_purchase_orders=pending_purchase_orders or 0,
    )
