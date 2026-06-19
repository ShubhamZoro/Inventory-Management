import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Search, Package } from 'lucide-react';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';
import { getProducts, createProduct, updateProduct, deleteProduct } from '../api';

const EMPTY_FORM = { name: '', sku: '', description: '', price: '', quantity: '', category: '' };

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [modal, setModal]       = useState(null); // 'add' | 'edit' | 'delete'
  const [selected, setSelected] = useState(null);
  const [form, setForm]         = useState(EMPTY_FORM);
  const [errors, setErrors]     = useState({});
  const [saving, setSaving]     = useState(false);

  const load = () =>
    getProducts().then((r) => setProducts(r.data)).finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const openAdd  = () => { setForm(EMPTY_FORM); setErrors({}); setModal('add'); };
  const openEdit = (p) => {
    setSelected(p);
    setForm({ name: p.name, sku: p.sku, description: p.description || '', price: p.price, quantity: p.quantity, category: p.category || '' });
    setErrors({});
    setModal('edit');
  };
  const openDel  = (p) => { setSelected(p); setModal('delete'); };
  const close    = () => { setModal(null); setSelected(null); };

  const validate = () => {
    const e = {};
    if (!form.name.trim())   e.name = 'Name is required';
    if (!form.sku.trim())    e.sku  = 'SKU is required';
    if (form.price === '' || isNaN(form.price) || Number(form.price) < 0) e.price = 'Valid price required';
    if (form.quantity === '' || isNaN(form.quantity) || Number(form.quantity) < 0) e.quantity = 'Valid quantity (≥ 0) required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSaving(true);
    const payload = { ...form, price: Number(form.price), quantity: Number(form.quantity) };
    try {
      if (modal === 'add') {
        await createProduct(payload);
        toast.success('Product created!');
      } else {
        const { sku, ...updatePayload } = payload;
        await updateProduct(selected.id, updatePayload);
        toast.success('Product updated!');
      }
      load(); close();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      await deleteProduct(selected.id);
      toast.success('Product deleted');
      load(); close();
    } catch {
      toast.error('Failed to delete product');
    } finally { setSaving(false); }
  };

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase()) ||
      (p.category || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Products</h2>
          <p>Manage your product catalogue and inventory</p>
        </div>
        <button id="add-product-btn" className="btn btn-primary" onClick={openAdd}>
          <Plus size={16} /> Add Product
        </button>
      </div>

      <div className="search-bar">
        <div className="search-input-wrap">
          <Search size={16} />
          <input
            id="product-search"
            placeholder="Search by name, SKU, category…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <span className="count-badge">{filtered.length} product{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      <div className="card">
        {loading ? (
          <div className="loading-center"><div className="spinner" /></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon"><Package size={48} opacity={0.3} /></div>
            <p>No products found. Add your first product!</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th>SKU</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id}>
                    <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{p.id}</td>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{p.name}</td>
                    <td><span className="badge badge-default">{p.sku}</span></td>
                    <td>{p.category || <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                    <td style={{ color: 'var(--accent-light)', fontWeight: 600 }}>₹{Number(p.price).toFixed(2)}</td>
                    <td>
                      <span className={`badge ${p.quantity === 0 ? 'badge-danger' : p.quantity <= 10 ? 'badge-warning' : 'badge-success'}`}>
                        {p.quantity}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button id={`edit-product-${p.id}`} className="btn btn-ghost btn-sm btn-icon" onClick={() => openEdit(p)} title="Edit">
                          <Pencil size={14} />
                        </button>
                        <button id={`delete-product-${p.id}`} className="btn btn-danger btn-sm btn-icon" onClick={() => openDel(p)} title="Delete">
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

      {/* Add / Edit Modal */}
      <Modal isOpen={modal === 'add' || modal === 'edit'} onClose={close} title={modal === 'add' ? 'Add New Product' : 'Edit Product'}>
        <div className="modal-body">
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Product Name <span className="form-required">*</span></label>
              <input id="product-name" className={`form-control ${errors.name ? 'error' : ''}`} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Laptop Pro X" />
              {errors.name && <div className="form-error">{errors.name}</div>}
            </div>
            <div className="form-group">
              <label className="form-label">SKU <span className="form-required">*</span></label>
              <input id="product-sku" className={`form-control ${errors.sku ? 'error' : ''}`} value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} placeholder="e.g. LAP-001" disabled={modal === 'edit'} />
              {errors.sku && <div className="form-error">{errors.sku}</div>}
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Price (₹) <span className="form-required">*</span></label>
              <input id="product-price" type="number" min="0" step="0.01" className={`form-control ${errors.price ? 'error' : ''}`} value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="0.00" />
              {errors.price && <div className="form-error">{errors.price}</div>}
            </div>
            <div className="form-group">
              <label className="form-label">Quantity <span className="form-required">*</span></label>
              <input id="product-quantity" type="number" min="0" className={`form-control ${errors.quantity ? 'error' : ''}`} value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} placeholder="0" />
              {errors.quantity && <div className="form-error">{errors.quantity}</div>}
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Category</label>
            <input id="product-category" className="form-control" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="e.g. Electronics" />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea id="product-description" className="form-control" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Optional product description…" />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={close}>Cancel</button>
          <button id="save-product-btn" className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
            {saving ? 'Saving…' : modal === 'add' ? 'Create Product' : 'Save Changes'}
          </button>
        </div>
      </Modal>

      {/* Delete Confirm */}
      <Modal isOpen={modal === 'delete'} onClose={close} title="Delete Product">
        <div className="modal-body">
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
            Are you sure you want to delete <strong style={{ color: 'var(--text-primary)' }}>{selected?.name}</strong>? This action cannot be undone.
          </p>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={close}>Cancel</button>
          <button id="confirm-delete-product" className="btn btn-danger" onClick={handleDelete} disabled={saving}>
            {saving ? 'Deleting…' : 'Delete Product'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
