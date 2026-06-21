from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy.sql import func
from typing import List
from datetime import datetime

from database import get_db
from models import Supplier, PurchaseOrder, Product, StockMovement
from schemas import (
    SupplierCreate, SupplierUpdate, SupplierResponse,
    PurchaseOrderCreate, PurchaseOrderStatusUpdate, PurchaseOrderResponse,
    StockMovementResponse,
)

router = APIRouter(tags=["Suppliers"])

# Valid purchase order status transitions
PO_VALID_TRANSITIONS = {
    "pending":   ["ordered", "cancelled"],
    "ordered":   ["received", "cancelled"],
    "received":  [],
    "cancelled": [],
}


# ─── Suppliers ────────────────────────────────────────────────────────────────

@router.post("/suppliers", response_model=SupplierResponse, status_code=status.HTTP_201_CREATED)
def create_supplier(supplier: SupplierCreate, db: Session = Depends(get_db)):
    db_supplier = Supplier(**supplier.model_dump())
    db.add(db_supplier)
    db.commit()
    db.refresh(db_supplier)
    return db_supplier


@router.get("/suppliers", response_model=List[SupplierResponse])
def get_suppliers(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(Supplier).order_by(Supplier.name).offset(skip).limit(limit).all()


@router.get("/suppliers/{supplier_id}", response_model=SupplierResponse)
def get_supplier(supplier_id: int, db: Session = Depends(get_db)):
    supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()
    if not supplier:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Supplier not found")
    return supplier


@router.put("/suppliers/{supplier_id}", response_model=SupplierResponse)
def update_supplier(supplier_id: int, supplier_update: SupplierUpdate, db: Session = Depends(get_db)):
    supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()
    if not supplier:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Supplier not found")

    update_data = supplier_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(supplier, key, value)

    db.commit()
    db.refresh(supplier)
    return supplier


@router.delete("/suppliers/{supplier_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_supplier(supplier_id: int, db: Session = Depends(get_db)):
    supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()
    if not supplier:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Supplier not found")
    db.delete(supplier)
    db.commit()


# ─── Purchase Orders ──────────────────────────────────────────────────────────

@router.post("/purchase-orders", response_model=PurchaseOrderResponse, status_code=status.HTTP_201_CREATED)
def create_purchase_order(po: PurchaseOrderCreate, db: Session = Depends(get_db)):
    # Validate supplier
    supplier = db.query(Supplier).filter(Supplier.id == po.supplier_id).first()
    if not supplier:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Supplier not found")

    # Validate product
    product = db.query(Product).filter(Product.id == po.product_id).first()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    total_cost = round(po.quantity * po.unit_cost, 2)
    db_po = PurchaseOrder(
        supplier_id=po.supplier_id,
        product_id=po.product_id,
        quantity=po.quantity,
        unit_cost=po.unit_cost,
        total_cost=total_cost,
        expected_date=po.expected_date,
        notes=po.notes,
        status="pending",
    )
    db.add(db_po)
    db.commit()
    db.refresh(db_po)

    db_po = (
        db.query(PurchaseOrder)
        .options(joinedload(PurchaseOrder.supplier), joinedload(PurchaseOrder.product))
        .filter(PurchaseOrder.id == db_po.id)
        .first()
    )
    return db_po


@router.get("/purchase-orders", response_model=List[PurchaseOrderResponse])
def get_purchase_orders(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return (
        db.query(PurchaseOrder)
        .options(joinedload(PurchaseOrder.supplier), joinedload(PurchaseOrder.product))
        .order_by(PurchaseOrder.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


@router.get("/purchase-orders/{po_id}", response_model=PurchaseOrderResponse)
def get_purchase_order(po_id: int, db: Session = Depends(get_db)):
    po = (
        db.query(PurchaseOrder)
        .options(joinedload(PurchaseOrder.supplier), joinedload(PurchaseOrder.product))
        .filter(PurchaseOrder.id == po_id)
        .first()
    )
    if not po:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Purchase order not found")
    return po


@router.patch("/purchase-orders/{po_id}/status", response_model=PurchaseOrderResponse)
def update_purchase_order_status(
    po_id: int,
    status_update: PurchaseOrderStatusUpdate,
    db: Session = Depends(get_db),
):
    po = db.query(PurchaseOrder).filter(PurchaseOrder.id == po_id).first()
    if not po:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Purchase order not found")

    new_status = status_update.status
    allowed = PO_VALID_TRANSITIONS.get(po.status, [])

    if new_status not in allowed:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=(
                f"Cannot transition from '{po.status}' to '{new_status}'. "
                f"Allowed: {allowed if allowed else 'none (terminal state)'}"
            ),
        )

    # When received: add stock to product + log movement
    if new_status == "received":
        product = db.query(Product).filter(Product.id == po.product_id).with_for_update().first()
        if product:
            product.quantity += po.quantity
            movement = StockMovement(
                product_id=po.product_id,
                change_qty=po.quantity,
                movement_type="purchase_received",
                reference_id=po_id,
                reference_type="purchase_order",
                notes=f"Stock received via Purchase Order #{po_id} from supplier #{po.supplier_id}",
            )
            db.add(movement)
        po.received_date = datetime.utcnow()

    po.status = new_status
    db.commit()

    po = (
        db.query(PurchaseOrder)
        .options(joinedload(PurchaseOrder.supplier), joinedload(PurchaseOrder.product))
        .filter(PurchaseOrder.id == po_id)
        .first()
    )
    return po


# ─── Stock Movements (Audit Log) ──────────────────────────────────────────────

@router.get("/stock-movements", response_model=List[StockMovementResponse])
def get_stock_movements(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return (
        db.query(StockMovement)
        .options(joinedload(StockMovement.product))
        .order_by(StockMovement.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
