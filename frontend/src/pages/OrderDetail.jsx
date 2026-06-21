import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Package, User, Calendar, StickyNote, CheckCircle2, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { getOrder, updateOrderStatus } from '../api';

// Valid next statuses for each state
const VALID_TRANSITIONS = {
  pending:   ['confirmed', 'cancelled'],
  confirmed: ['packed',    'cancelled'],
  packed:    ['shipped',   'cancelled'],
  shipped:   ['delivered', 'cancelled'],
  delivered: ['returned'],
  cancelled: [],
  returned:  [],
};

// The linear "forward" progression steps
const STATUS_STEPS = ['pending', 'confirmed', 'packed', 'shipped', 'delivered'];

const STATUS_LABELS = {
  pending:   'Pending',
  confirmed: 'Confirmed',
  packed:    'Packed',
  shipped:   'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  returned:  'Returned',
};

function StatusStepper({ currentStatus }) {
  const isTerminalAlt = currentStatus === 'cancelled' || currentStatus === 'returned';

  if (isTerminalAlt) {
    return (
      <div className="status-stepper">
        {STATUS_STEPS.map((step) => (
          <div key={step} className="step step-skipped">
            <div className="step-dot">—</div>
            <div className="step-label">{STATUS_LABELS[step]}</div>
          </div>
        ))}
        <div className="step-terminal">
          <span className={`badge ${currentStatus === 'cancelled' ? 'badge-danger' : 'badge-warning'}`}>
            {STATUS_LABELS[currentStatus]}
          </span>
        </div>
      </div>
    );
  }

  const currentIdx = STATUS_STEPS.indexOf(currentStatus);

  return (
    <div className="status-stepper">
      {STATUS_STEPS.map((step, idx) => {
        const isDone   = idx < currentIdx;
        const isActive = idx === currentIdx;
        return (
          <div key={step} className={`step ${isDone ? 'step-done' : ''} ${isActive ? 'step-active' : ''}`}>
            {idx < STATUS_STEPS.length - 1 && <div className={`step-connector ${isDone ? 'connector-done' : ''}`} />}
            <div className="step-dot">
              {isDone ? <CheckCircle2 size={14} /> : isActive ? <Clock size={13} /> : idx + 1}
            </div>
            <div className="step-label">{STATUS_LABELS[step]}</div>
          </div>
        );
      })}
    </div>
  );
}

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError]     = useState('');

  const fetchOrder = () => {
    setLoading(true);
    getOrder(id)
      .then((r) => setOrder(r.data))
      .catch(() => setError('Order not found.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchOrder(); }, [id]);

  const handleStatusUpdate = async (newStatus) => {
    setUpdating(true);
    try {
      await updateOrderStatus(id, newStatus);
      toast.success(`Order marked as "${STATUS_LABELS[newStatus]}"`);
      fetchOrder();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;
  if (error)   return <p style={{ color: 'var(--danger)', padding: 24 }}>{error}</p>;

  const statusBadge = (s) => {
    if (s === 'completed' || s === 'delivered') return 'badge-success';
    if (s === 'cancelled' || s === 'returned')  return 'badge-danger';
    return 'badge-warning';
  };

  const nextStatuses = VALID_TRANSITIONS[order.status] || [];
  const forwardNext  = nextStatuses.filter((s) => s !== 'cancelled' && s !== 'returned');
  const altNext      = nextStatuses.filter((s) => s === 'cancelled' || s === 'returned');

  return (
    <div>
      <div className="page-header">
        <div>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/orders')} style={{ marginBottom: 12 }}>
            <ArrowLeft size={14} /> Back to Orders
          </button>
          <h2>Order #{order.id}</h2>
          <p>
            <span className={`badge ${statusBadge(order.status)}`} style={{ marginRight: 8 }}>
              {STATUS_LABELS[order.status] || order.status}
            </span>
            Placed on {order.created_at ? new Date(order.created_at).toLocaleString() : '—'}
          </p>
        </div>

        {/* Status action buttons */}
        {nextStatuses.length > 0 && (
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            {forwardNext.map((s) => (
              <button
                key={s}
                id={`status-btn-${s}`}
                className="btn btn-primary btn-sm"
                onClick={() => handleStatusUpdate(s)}
                disabled={updating}
              >
                {updating ? '…' : `Mark as ${STATUS_LABELS[s]}`}
              </button>
            ))}
            {altNext.map((s) => (
              <button
                key={s}
                id={`status-btn-${s}`}
                className="btn btn-danger btn-sm"
                onClick={() => handleStatusUpdate(s)}
                disabled={updating}
              >
                {updating ? '…' : STATUS_LABELS[s] === 'Cancelled' ? 'Cancel Order' : 'Mark Returned'}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Status Stepper */}
      <div className="card" style={{ marginBottom: 24, padding: '20px 28px' }}>
        <div className="card-title" style={{ marginBottom: 20 }}>Order Progress</div>
        <StatusStepper currentStatus={order.status} />
        {(order.status === 'cancelled' || order.status === 'returned') && (
          <p style={{ marginTop: 14, fontSize: 13, color: 'var(--success)' }}>
            ✓ Stock has been restored for all items in this order.
          </p>
        )}
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
                <p><span className={`badge ${statusBadge(order.status)}`}>{STATUS_LABELS[order.status] || order.status}</span></p>
              </div>
              <div className="detail-field">
                <label>Created</label>
                <p>{order.created_at ? new Date(order.created_at).toLocaleString() : '—'}</p>
              </div>
              {order.updated_at && (
                <div className="detail-field">
                  <label>Last Updated</label>
                  <p>{new Date(order.updated_at).toLocaleString()}</p>
                </div>
              )}
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
