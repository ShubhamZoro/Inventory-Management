from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List

from database import get_db
from models import Order, OrderItem, Product, Customer, StockMovement
from schemas import OrderCreate, OrderResponse, OrderStatusUpdate

router = APIRouter(prefix="/orders", tags=["Orders"])

# Valid order status transitions
VALID_TRANSITIONS = {
    "pending":   ["confirmed", "cancelled"],
    "confirmed": ["packed",    "cancelled"],
    "packed":    ["shipped",   "cancelled"],
    "shipped":   ["delivered", "cancelled"],
    "delivered": ["returned"],
    "cancelled": [],
    "returned":  [],
}


def _log_movement(db: Session, product_id: int, change_qty: int,
                  movement_type: str, reference_id: int, reference_type: str, notes: str):
    """Helper to record a StockMovement entry."""
    movement = StockMovement(
        product_id=product_id,
        change_qty=change_qty,
        movement_type=movement_type,
        reference_id=reference_id,
        reference_type=reference_type,
        notes=notes,
    )
    db.add(movement)


@router.post("", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
def create_order(order_in: OrderCreate, db: Session = Depends(get_db)):
    # Validate customer
    customer = db.query(Customer).filter(Customer.id == order_in.customer_id).first()
    if not customer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found")

    # Validate products & stock
    order_items_data = []
    total_amount = 0.0

    for item in order_in.items:
        product = db.query(Product).filter(Product.id == item.product_id).with_for_update().first()
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Product with ID {item.product_id} not found"
            )
        if product.quantity < item.quantity:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Insufficient stock for '{product.name}'. Available: {product.quantity}, Requested: {item.quantity}"
            )
        subtotal = product.price * item.quantity
        total_amount += subtotal
        order_items_data.append({
            "product": product,
            "quantity": item.quantity,
            "unit_price": product.price,
            "subtotal": subtotal,
        })

    # Create order
    db_order = Order(
        customer_id=order_in.customer_id,
        total_amount=round(total_amount, 2),
        notes=order_in.notes,
        status="pending",
    )
    db.add(db_order)
    db.flush()  # get order ID without committing

    # Create order items, deduct stock & log movements
    for item_data in order_items_data:
        db_item = OrderItem(
            order_id=db_order.id,
            product_id=item_data["product"].id,
            quantity=item_data["quantity"],
            unit_price=item_data["unit_price"],
            subtotal=item_data["subtotal"],
        )
        db.add(db_item)
        item_data["product"].quantity -= item_data["quantity"]
        _log_movement(
            db,
            product_id=item_data["product"].id,
            change_qty=-item_data["quantity"],
            movement_type="order_placed",
            reference_id=db_order.id,
            reference_type="order",
            notes=f"Stock deducted for Order #{db_order.id}",
        )

    db.commit()
    db.refresh(db_order)

    # Reload with relationships
    db_order = (
        db.query(Order)
        .options(
            joinedload(Order.customer),
            joinedload(Order.items).joinedload(OrderItem.product),
        )
        .filter(Order.id == db_order.id)
        .first()
    )
    return db_order


@router.get("", response_model=List[OrderResponse])
def get_orders(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    orders = (
        db.query(Order)
        .options(
            joinedload(Order.customer),
            joinedload(Order.items).joinedload(OrderItem.product),
        )
        .order_by(Order.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return orders


@router.get("/{order_id}", response_model=OrderResponse)
def get_order(order_id: int, db: Session = Depends(get_db)):
    order = (
        db.query(Order)
        .options(
            joinedload(Order.customer),
            joinedload(Order.items).joinedload(OrderItem.product),
        )
        .filter(Order.id == order_id)
        .first()
    )
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    return order


@router.patch("/{order_id}/status", response_model=OrderResponse)
def update_order_status(
    order_id: int,
    status_update: OrderStatusUpdate,
    db: Session = Depends(get_db),
):
    order = (
        db.query(Order)
        .options(joinedload(Order.items))
        .filter(Order.id == order_id)
        .first()
    )
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    new_status = status_update.status
    allowed = VALID_TRANSITIONS.get(order.status, [])

    if new_status not in allowed:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=(
                f"Cannot transition from '{order.status}' to '{new_status}'. "
                f"Allowed next statuses: {allowed if allowed else 'none (terminal state)'}"
            ),
        )

    # Restore stock when cancelling or marking as returned
    if new_status in ("cancelled", "returned"):
        for item in order.items:
            product = db.query(Product).filter(Product.id == item.product_id).first()
            if product:
                product.quantity += item.quantity
                _log_movement(
                    db,
                    product_id=item.product_id,
                    change_qty=item.quantity,
                    movement_type=f"order_{new_status}",
                    reference_id=order_id,
                    reference_type="order",
                    notes=f"Stock restored: Order #{order_id} marked as {new_status}",
                )

    order.status = new_status
    db.commit()

    # Reload with full relationships
    order = (
        db.query(Order)
        .options(
            joinedload(Order.customer),
            joinedload(Order.items).joinedload(OrderItem.product),
        )
        .filter(Order.id == order_id)
        .first()
    )
    return order


@router.delete("/{order_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_order(order_id: int, db: Session = Depends(get_db)):
    order = db.query(Order).options(joinedload(Order.items)).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    # Restore stock only if order was active (not already cancelled/returned)
    if order.status not in ("cancelled", "returned"):
        for item in order.items:
            product = db.query(Product).filter(Product.id == item.product_id).first()
            if product:
                product.quantity += item.quantity
                _log_movement(
                    db,
                    product_id=item.product_id,
                    change_qty=item.quantity,
                    movement_type="order_cancelled",
                    reference_id=order_id,
                    reference_type="order",
                    notes=f"Stock restored: Order #{order_id} deleted",
                )

    db.delete(order)
    db.commit()
