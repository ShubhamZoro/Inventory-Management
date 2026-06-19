import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Package, User, Calendar, StickyNote } from 'lucide-react';
import { getOrder } from '../api';

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getOrder(id)
      .then((r) => setOrder(r.data))
      .catch(() => setError('Order not found.'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;
  if (error)   return <p style={{ color: 'var(--danger)', padding: 24 }}>{error}</p>;

  const statusBadge = (s) => {
    if (s === 'completed') return 'badge-success';
    if (s === 'cancelled') return 'badge-danger';
    return 'badge-warning';
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/orders')} style={{ marginBottom: 12 }}>
            <ArrowLeft size={14} /> Back to Orders
          </button>
          <h2>Order #{order.id}</h2>
          <p>
            <span className={`badge ${statusBadge(order.status)}`} style={{ marginRight: 8 }}>{order.status}</span>
            Placed on {order.created_at ? new Date(order.created_at).toLocaleString() : '—'}
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24 }}>
        {/* Items Table */}
        <div className="card">
          <div className="card-header">
            <div className="card-title"><Package size={16} /> Order Items</div>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Unit Price</th>
                  <th>Qty</th>
                  <th>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item) => (
                  <tr key={item.id}>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      {item.product?.name || `Product #${item.product_id}`}
                    </td>
                    <td><span className="badge badge-default">{item.product?.sku || '—'}</span></td>
                    <td>₹{Number(item.unit_price).toFixed(2)}</td>
                    <td>{item.quantity}</td>
                    <td style={{ fontWeight: 600, color: 'var(--success)' }}>₹{Number(item.subtotal).toFixed(2)}</td>
                  </tr>
                ))}
                <tr className="total-row">
                  <td colSpan={4} style={{ textAlign: 'right' }}>Total Amount</td>
                  <td>₹{Number(order.total_amount).toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Order Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="card">
            <div className="card-header">
              <div className="card-title"><User size={16} /> Customer</div>
            </div>
            <div style={{ padding: '16px 24px' }}>
              {order.customer ? (
                <>
                  <p style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>{order.customer.full_name}</p>
                  <p style={{ fontSize: 13, color: 'var(--accent-light)' }}>{order.customer.email}</p>
                  {order.customer.phone && <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>{order.customer.phone}</p>}
                </>
              ) : (
                <p style={{ color: 'var(--text-muted)' }}>Customer #{order.customer_id}</p>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <div className="card-title"><Calendar size={16} /> Details</div>
            </div>
            <div style={{ padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="detail-field">
                <label>Order ID</label>
                <p>#{order.id}</p>
              </div>
              <div className="detail-field">
                <label>Status</label>
                <p><span className={`badge ${statusBadge(order.status)}`}>{order.status}</span></p>
              </div>
              <div className="detail-field">
                <label>Created</label>
                <p>{order.created_at ? new Date(order.created_at).toLocaleString() : '—'}</p>
              </div>
              <div className="detail-field">
                <label>Total</label>
                <p style={{ color: 'var(--success)', fontWeight: 700, fontSize: 20 }}>₹{Number(order.total_amount).toFixed(2)}</p>
              </div>
            </div>
          </div>

          {order.notes && (
            <div className="card">
              <div className="card-header">
                <div className="card-title"><StickyNote size={16} /> Notes</div>
              </div>
              <div style={{ padding: '16px 24px', fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                {order.notes}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
