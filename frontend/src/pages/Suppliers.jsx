import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Search, Truck, ShoppingBag, ChevronDown, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';
import {
  getSuppliers, createSupplier, updateSupplier, deleteSupplier,
  getPurchaseOrders, createPurchaseOrder, updatePurchaseOrderStatus,
  getProducts,
} from '../api';

const EMPTY_SUPPLIER = { name: '', contact_person: '', email: '', phone: '', address: '' };
const EMPTY_PO = { supplier_id: '', product_id: '', quantity: '', unit_cost: '', expected_date: '', notes: '' };

const PO_STATUS_COLORS = {
  pending:   'badge-warning',
  ordered:   'badge-accent',
  received:  'badge-success',
  cancelled: 'badge-danger',
};

const PO_TRANSITIONS = {
  pending:   ['ordered', 'cancelled'],
  ordered:   ['received', 'cancelled'],
  received:  [],
  cancelled: [],
};

export default function Suppliers() {
  const [suppliers, setSuppliers]   = useState([]);
  const [pos, setPOs]               = useState([]);
  const [products, setProducts]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [modal, setModal]           = useState(null);
  const [selected, setSelected]     = useState(null);
  const [form, setForm]             = useState(EMPTY_SUPPLIER);
  const [poForm, setPoForm]         = useState(EMPTY_PO);
  const [errors, setErrors]         = useState({});
  const [saving, setSaving]         = useState(false);
  const [expanded, setExpanded]     = useState(null); // expanded supplier id

  const load = async () => {
    try {
      const [sRes, poRes, pRes] = await Promise.all([
        getSuppliers(), getPurchaseOrders(), getProducts(),
      ]);
      setSuppliers(sRes.data);
      setPOs(poRes.data);
      setProducts(pRes.data);
    } catch {
      toast.error('Failed to load suppliers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openAdd  = () => { setForm(EMPTY_SUPPLIER); setErrors({}); setModal('add'); };
  const openEdit = (s) => {
    setSelected(s);
    setForm({ name: s.name, contact_person: s.contact_person || '', email: s.email || '', phone: s.phone || '', address: s.address || '' });
    setErrors({}); setModal('edit');
  };
  const openDel  = (s) => { setSelected(s); setModal('delete'); };
  const openPO   = (s) => {
    setSelected(s);
    setPoForm({ ...EMPTY_PO, supplier_id: s.id });
    setErrors({}); setModal('po');
  };
  const close    = () => { setModal(null); setSelected(null); };

  const validateSupplier = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Supplier name is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validatePO = () => {
    const e = {};
    if (!poForm.product_id) e.product_id = 'Select a product';
    if (!poForm.quantity || Number(poForm.quantity) <= 0) e.quantity = 'Valid quantity required';
    if (!poForm.unit_cost || Number(poForm.unit_cost) < 0)  e.unit_cost = 'Valid cost required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSupplierSubmit = async () => {
    if (!validateSupplier()) return;
    setSaving(true);
    try {
      if (modal === 'add') {
        await createSupplier(form);
        toast.success('Supplier added!');
      } else {
        await updateSupplier(selected.id, form);
        toast.success('Supplier updated!');
      }
      load(); close();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Something went wrong');
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      await deleteSupplier(selected.id);
      toast.success('Supplier deleted');
      load(); close();
    } catch {
      toast.error('Failed to delete supplier');
    } finally { setSaving(false); }
  };

  const handlePOSubmit = async () => {
    if (!validatePO()) return;
    setSaving(true);
    try {
      await createPurchaseOrder({
        supplier_id: Number(poForm.supplier_id),
        product_id:  Number(poForm.product_id),
        quantity:    Number(poForm.quantity),
        unit_cost:   Number(poForm.unit_cost),
        expected_date: poForm.expected_date || null,
        notes:       poForm.notes || null,
      });
      toast.success('Purchase order created!');
      load(); close();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to create purchase order');
    } finally { setSaving(false); }
  };

  const handlePOStatus = async (poId, newStatus) => {
    try {
      await updatePurchaseOrderStatus(poId, newStatus);
      toast.success(`Purchase order marked as "${newStatus}"`);
      if (newStatus === 'received') toast.success('Stock has been updated!');
      load();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to update status');
    }
  };

  const filtered = suppliers.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.email || '').toLowerCase().includes(search.toLowerCase()) ||
    (s.contact_person || '').toLowerCase().includes(search.toLowerCase())
  );

  const supplierPOs = (supplierId) => pos.filter((p) => p.supplier_id === supplierId);

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Suppliers</h2>
          <p>Manage suppliers and purchase orders</p>
        </div>
        <button id="add-supplier-btn" className="btn btn-primary" onClick={openAdd}>
          <Plus size={16} /> Add Supplier
        </button>
      </div>

      <div className="search-bar">
        <div className="search-input-wrap">
          <Search size={16} />
          <input
            id="supplier-search"
            placeholder="Search by name, email, contact…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <span className="count-badge">{filtered.length} supplier{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      <div className="card">
        {loading ? (
          <div className="loading-center"><div className="spinner" /></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon"><Truck size={48} opacity={0.3} /></div>
            <p>No suppliers yet. Add your first supplier!</p>
          </div>
        ) : (
          <div>
            {filtered.map((s) => {
              const sPos = supplierPOs(s.id);
              const isExpanded = expanded === s.id;
              return (
                <div key={s.id} className="supplier-row">
                  {/* Supplier header */}
                  <div className="supplier-header" onClick={() => setExpanded(isExpanded ? null : s.id)}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div className="supplier-avatar">
                        {s.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 15 }}>{s.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                          {s.contact_person && <span>{s.contact_person} · </span>}
                          {s.email || <span style={{ color: 'var(--text-muted)' }}>No email</span>}
                          {s.phone && <span> · {s.phone}</span>}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span className="badge badge-default">{sPos.length} PO{sPos.length !== 1 ? 's' : ''}</span>
                      <button id={`edit-supplier-${s.id}`} className="btn btn-ghost btn-sm btn-icon"
                        onClick={(e) => { e.stopPropagation(); openEdit(s); }} title="Edit">
                        <Pencil size={14} />
                      </button>
                      <button id={`po-supplier-${s.id}`} className="btn btn-primary btn-sm"
                        onClick={(e) => { e.stopPropagation(); openPO(s); }} title="New PO">
                        <ShoppingBag size={14} /> New PO
                      </button>
                      <button id={`delete-supplier-${s.id}`} className="btn btn-danger btn-sm btn-icon"
                        onClick={(e) => { e.stopPropagation(); openDel(s); }} title="Delete">
                        <Trash2 size={14} />
                      </button>
                      {isExpanded ? <ChevronDown size={16} color="var(--text-muted)" /> : <ChevronRight size={16} color="var(--text-muted)" />}
                    </div>
                  </div>

                  {/* Purchase Orders sub-table */}
                  {isExpanded && (
                    <div className="po-subtable">
                      {sPos.length === 0 ? (
                        <p style={{ color: 'var(--text-muted)', fontSize: 13, padding: '12px 24px' }}>
                          No purchase orders for this supplier yet.
                        </p>
                      ) : (
                        <table>
                          <thead>
                            <tr>
                              <th>PO #</th>
                              <th>Product</th>
                              <th>Qty</th>
                              <th>Unit Cost</th>
                              <th>Total</th>
                              <th>Expected</th>
                              <th>Status</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {sPos.map((po) => {
                              const nextStates = PO_TRANSITIONS[po.status] || [];
                              return (
                                <tr key={po.id}>
                                  <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>#{po.id}</td>
                                  <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                                    {po.product?.name || `Product #${po.product_id}`}
                                  </td>
                                  <td>{po.quantity}</td>
                                  <td>₹{Number(po.unit_cost).toFixed(2)}</td>
                                  <td style={{ fontWeight: 700, color: 'var(--success)' }}>₹{Number(po.total_cost).toFixed(2)}</td>
                                  <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                                    {po.expected_date ? new Date(po.expected_date).toLocaleDateString() : '—'}
                                  </td>
                                  <td>
                                    <span className={`badge ${PO_STATUS_COLORS[po.status] || 'badge-default'}`}>
                                      {po.status}
                                    </span>
                                  </td>
                                  <td>
                                    <div style={{ display: 'flex', gap: 6 }}>
                                      {nextStates.map((ns) => (
                                        <button
                                          key={ns}
                                          id={`po-status-${po.id}-${ns}`}
                                          className={`btn btn-sm ${ns === 'cancelled' ? 'btn-danger' : ns === 'received' ? 'btn-primary' : 'btn-ghost'}`}
                                          onClick={() => handlePOStatus(po.id, ns)}
                                        >
                                          {ns === 'received' ? '✓ Receive' : ns === 'ordered' ? 'Mark Ordered' : 'Cancel'}
                                        </button>
                                      ))}
                                      {nextStates.length === 0 && (
                                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>—</span>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add / Edit Supplier Modal */}
      <Modal isOpen={modal === 'add' || modal === 'edit'} onClose={close}
        title={modal === 'add' ? 'Add New Supplier' : 'Edit Supplier'}>
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Supplier Name <span className="form-required">*</span></label>
            <input id="supplier-name" className={`form-control ${errors.name ? 'error' : ''}`}
              value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. TechParts India Ltd." />
            {errors.name && <div className="form-error">{errors.name}</div>}
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Contact Person</label>
              <input id="supplier-contact" className="form-control"
                value={form.contact_person} onChange={(e) => setForm({ ...form, contact_person: e.target.value })}
                placeholder="e.g. Rajesh Kumar" />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input id="supplier-email" type="email" className="form-control"
                value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="supplier@example.com" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input id="supplier-phone" className="form-control"
                value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+91 98765 43210" />
            </div>
            <div className="form-group">
              <label className="form-label">Address</label>
              <input id="supplier-address" className="form-control"
                value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="City, State" />
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={close}>Cancel</button>
          <button id="save-supplier-btn" className="btn btn-primary" onClick={handleSupplierSubmit} disabled={saving}>
            {saving ? 'Saving…' : modal === 'add' ? 'Add Supplier' : 'Save Changes'}
          </button>
        </div>
      </Modal>

      {/* Delete Supplier Modal */}
      <Modal isOpen={modal === 'delete'} onClose={close} title="Delete Supplier">
        <div className="modal-body">
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
            Are you sure you want to delete <strong style={{ color: 'var(--text-primary)' }}>{selected?.name}</strong>?
            All associated purchase orders will also be removed.
          </p>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={close}>Cancel</button>
          <button id="confirm-delete-supplier" className="btn btn-danger" onClick={handleDelete} disabled={saving}>
            {saving ? 'Deleting…' : 'Delete Supplier'}
          </button>
        </div>
      </Modal>

      {/* Create Purchase Order Modal */}
      <Modal isOpen={modal === 'po'} onClose={close} title={`New Purchase Order — ${selected?.name}`}>
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Product <span className="form-required">*</span></label>
            <select id="po-product" className={`form-control ${errors.product_id ? 'error' : ''}`}
              value={poForm.product_id} onChange={(e) => setPoForm({ ...poForm, product_id: e.target.value })}>
              <option value="">— Select Product —</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} (SKU: {p.sku} · Stock: {p.quantity})
                </option>
              ))}
            </select>
            {errors.product_id && <div className="form-error">{errors.product_id}</div>}
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Quantity <span className="form-required">*</span></label>
              <input id="po-quantity" type="number" min="1" className={`form-control ${errors.quantity ? 'error' : ''}`}
                value={poForm.quantity} onChange={(e) => setPoForm({ ...poForm, quantity: e.target.value })}
                placeholder="e.g. 50" />
              {errors.quantity && <div className="form-error">{errors.quantity}</div>}
            </div>
            <div className="form-group">
              <label className="form-label">Unit Cost (₹) <span className="form-required">*</span></label>
              <input id="po-cost" type="number" min="0" step="0.01" className={`form-control ${errors.unit_cost ? 'error' : ''}`}
                value={poForm.unit_cost} onChange={(e) => setPoForm({ ...poForm, unit_cost: e.target.value })}
                placeholder="0.00" />
              {errors.unit_cost && <div className="form-error">{errors.unit_cost}</div>}
            </div>
          </div>
          {poForm.quantity && poForm.unit_cost && (
            <div className="po-total-preview">
              <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>Estimated Total</span>
              <span style={{ fontWeight: 800, fontSize: 18, color: 'var(--success)' }}>
                ₹{(Number(poForm.quantity) * Number(poForm.unit_cost)).toFixed(2)}
              </span>
            </div>
          )}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Expected Delivery Date</label>
              <input id="po-date" type="date" className="form-control"
                value={poForm.expected_date} onChange={(e) => setPoForm({ ...poForm, expected_date: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Notes</label>
              <input id="po-notes" className="form-control"
                value={poForm.notes} onChange={(e) => setPoForm({ ...poForm, notes: e.target.value })}
                placeholder="Optional notes…" />
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={close}>Cancel</button>
          <button id="save-po-btn" className="btn btn-primary" onClick={handlePOSubmit} disabled={saving}>
            {saving ? 'Creating…' : 'Create Purchase Order'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
