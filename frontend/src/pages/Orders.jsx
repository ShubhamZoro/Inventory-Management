import { useEffect, useState } from 'react';
import { Plus, Trash2, Eye, Search, ShoppingCart, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';
import { getOrders, createOrder, deleteOrder, getProducts, getCustomers } from '../api';

export default function Orders() {
  const navigate = useNavigate();
  const [orders, setOrders]       = useState([]);
  const [products, setProducts]   = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [modal, setModal]         = useState(null);
  const [selected, setSelected]   = useState(null);
  const [saving, setSaving]       = useState(false);

  // Form state
  const [customerId, setCustomerId] = useState('');
  const [notes, setNotes]           = useState('');
  const [items, setItems]           = useState([{ product_id: '', quantity: 1 }]);
  const [formError, setFormError]   = useState('');

  const load = () =>
    getOrders().then((r) => setOrders(r.data)).finally(() => setLoading(false));

  useEffect(() => {
    load();
    getProducts().then((r) => setProducts(r.data));
    getCustomers().then((r) => setCustomers(r.data));
  }, []);

  const openCreate = () => {
    setCustomerId(''); setNotes('');
    setItems([{ product_id: '', quantity: 1 }]);
    setFormError(''); setModal('create');
  };
  const openDel  = (o) => { setSelected(o); setModal('delete'); };
  const close    = () => { setModal(null); setSelected(null); };

  const addItem    = () => setItems([...items, { product_id: '', quantity: 1 }]);
  const removeItem = (i) => setItems(items.filter((_, idx) => idx !== i));
  const updateItem = (i, field, val) => {
    const updated = [...items];
    updated[i] = { ...updated[i], [field]: val };
    setItems(updated);
  };

  const getProductStock = (pid) => {
    const p = products.find((p) => p.id === Number(pid));
    return p ? p.quantity : null;
  };

  const calcTotal = () => {
    return items.reduce((sum, item) => {
      const p = products.find((p) => p.id === Number(item.product_id));
      return sum + (p ? p.price * Number(item.quantity || 0) : 0);
    }, 0);
  };

  const handleCreate = async () => {
    if (!customerId) { setFormError('Please select a customer'); return; }
    if (items.some((i) => !i.product_id || !i.quantity || Number(i.quantity) <= 0)) {
      setFormError('All order items need a product and valid quantity');
      return;
    }
    setFormError('');
    setSaving(true);
    try {
      await createOrder({
        customer_id: Number(customerId),
        notes,
        items: items.map((i) => ({ product_id: Number(i.product_id), quantity: Number(i.quantity) })),
      });
      toast.success('Order created successfully!');
      load(); close();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to create order');
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      await deleteOrder(selected.id);
      toast.success('Order cancelled and stock restored');
      load(); close();
    } catch {
      toast.error('Failed to cancel order');
    } finally { setSaving(false); }
  };

  const filtered = orders.filter((o) =>
    String(o.id).includes(search) ||
    (o.customer?.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
    o.status.toLowerCase().includes(search.toLowerCase())
  );

  const statusBadge = (s) => {
    if (s === 'completed') return 'badge-success';
    if (s === 'cancelled') return 'badge-danger';
    return 'badge-warning';
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Orders</h2>
          <p>Create and manage customer orders</p>
        </div>
        <button id="create-order-btn" className="btn btn-primary" onClick={openCreate}>
          <Plus size={16} /> Create Order
        </button>
      </div>

      <div className="search-bar">
        <div className="search-input-wrap">
          <Search size={16} />
          <input
            id="order-search"
            placeholder="Search by order ID, customer, status…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <span className="count-badge">{filtered.length} order{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      <div className="card">
        {loading ? (
          <div className="loading-center"><div className="spinner" /></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon"><ShoppingCart size={48} opacity={0.3} /></div>
            <p>No orders yet. Create your first order!</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Customer</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((o) => (
                  <tr key={o.id}>
                    <td style={{ fontWeight: 700, color: 'var(--accent-light)' }}>#{o.id}</td>
                    <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
                      {o.customer?.full_name || `Customer #${o.customer_id}`}
                    </td>
                    <td style={{ color: 'var(--text-muted)' }}>{o.items?.length || 0} item{(o.items?.length || 0) !== 1 ? 's' : ''}</td>
                    <td style={{ fontWeight: 700, color: 'var(--success)' }}>₹{Number(o.total_amount).toFixed(2)}</td>
                    <td><span className={`badge ${statusBadge(o.status)}`}>{o.status}</span></td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                      {o.created_at ? new Date(o.created_at).toLocaleDateString() : '—'}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button id={`view-order-${o.id}`} className="btn btn-ghost btn-sm btn-icon" onClick={() => navigate(`/orders/${o.id}`)} title="View">
                          <Eye size={14} />
                        </button>
                        <button id={`delete-order-${o.id}`} className="btn btn-danger btn-sm btn-icon" onClick={() => openDel(o)} title="Cancel">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Order Modal */}
      <Modal isOpen={modal === 'create'} onClose={close} title="Create New Order" size="lg">
        <div className="modal-body">
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Customer <span className="form-required">*</span></label>
              <select id="order-customer" className="form-control" value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
                <option value="">— Select Customer —</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>{c.full_name} ({c.email})</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Notes</label>
              <input id="order-notes" className="form-control" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes…" />
            </div>
          </div>

          <div style={{ marginBottom: 8 }}>
            <label className="form-label">Order Items <span className="form-required">*</span></label>
          </div>

          {items.map((item, i) => (
            <div key={i} className="order-item-row">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <select
                  id={`order-product-${i}`}
                  className="form-control"
                  value={item.product_id}
                  onChange={(e) => updateItem(i, 'product_id', e.target.value)}
                >
                  <option value="">— Select Product —</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id} disabled={p.quantity === 0}>
                      {p.name} (₹{p.price} · Stock: {p.quantity})
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <input
                  id={`order-qty-${i}`}
                  type="number"
                  min="1"
                  max={item.product_id ? getProductStock(item.product_id) : undefined}
                  className="form-control"
                  value={item.quantity}
                  onChange={(e) => updateItem(i, 'quantity', e.target.value)}
                  placeholder="Qty"
                />
              </div>
              <button className="btn btn-danger btn-icon btn-sm" onClick={() => removeItem(i)} disabled={items.length === 1}>
                <X size={14} />
              </button>
            </div>
          ))}

          <button className="add-item-btn" onClick={addItem}>
            <Plus size={14} /> Add Another Item
          </button>

          {formError && (
            <div className="form-error" style={{ marginTop: 12, fontSize: 13 }}>⚠ {formError}</div>
          )}

          <div style={{ marginTop: 20, padding: '12px 16px', background: 'var(--bg-card)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>Estimated Total</span>
            <span style={{ fontWeight: 800, fontSize: 20, color: 'var(--success)' }}>₹{calcTotal().toFixed(2)}</span>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={close}>Cancel</button>
          <button id="submit-order-btn" className="btn btn-primary" onClick={handleCreate} disabled={saving}>
            {saving ? 'Creating…' : 'Place Order'}
          </button>
        </div>
      </Modal>

      {/* Delete Confirm */}
      <Modal isOpen={modal === 'delete'} onClose={close} title="Cancel Order">
        <div className="modal-body">
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
            Cancel <strong style={{ color: 'var(--text-primary)' }}>Order #{selected?.id}</strong>?
            Stock will be <strong>restored</strong> for all items in this order.
          </p>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={close}>Keep Order</button>
          <button id="confirm-cancel-order" className="btn btn-danger" onClick={handleDelete} disabled={saving}>
            {saving ? 'Cancelling…' : 'Cancel Order'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
