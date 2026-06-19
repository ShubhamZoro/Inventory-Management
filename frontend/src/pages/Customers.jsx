import { useEffect, useState } from 'react';
import { Plus, Trash2, Search, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';
import { getCustomers, createCustomer, deleteCustomer } from '../api';

const EMPTY_FORM = { full_name: '', email: '', phone: '', address: '' };

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [modal, setModal]         = useState(null);
  const [selected, setSelected]   = useState(null);
  const [form, setForm]           = useState(EMPTY_FORM);
  const [errors, setErrors]       = useState({});
  const [saving, setSaving]       = useState(false);

  const load = () =>
    getCustomers().then((r) => setCustomers(r.data)).finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const openAdd  = () => { setForm(EMPTY_FORM); setErrors({}); setModal('add'); };
  const openDel  = (c) => { setSelected(c); setModal('delete'); };
  const close    = () => { setModal(null); setSelected(null); };

  const validate = () => {
    const e = {};
    if (!form.full_name.trim()) e.full_name = 'Full name is required';
    if (!form.email.trim())     e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      await createCustomer(form);
      toast.success('Customer added!');
      load(); close();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Something went wrong');
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      await deleteCustomer(selected.id);
      toast.success('Customer deleted');
      load(); close();
    } catch {
      toast.error('Failed to delete customer');
    } finally { setSaving(false); }
  };

  const filtered = customers.filter((c) =>
    c.full_name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase()) ||
    (c.phone || '').includes(search)
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Customers</h2>
          <p>Manage your customer database</p>
        </div>
        <button id="add-customer-btn" className="btn btn-primary" onClick={openAdd}>
          <Plus size={16} /> Add Customer
        </button>
      </div>

      <div className="search-bar">
        <div className="search-input-wrap">
          <Search size={16} />
          <input
            id="customer-search"
            placeholder="Search by name, email, phone…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <span className="count-badge">{filtered.length} customer{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      <div className="card">
        {loading ? (
          <div className="loading-center"><div className="spinner" /></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon"><Users size={48} opacity={0.3} /></div>
            <p>No customers found. Add your first customer!</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Full Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Address</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id}>
                    <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{c.id}</td>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{c.full_name}</td>
                    <td style={{ color: 'var(--accent-light)' }}>{c.email}</td>
                    <td>{c.phone || <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                    <td>{c.address ? c.address.substring(0, 30) + (c.address.length > 30 ? '…' : '') : <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                      {c.created_at ? new Date(c.created_at).toLocaleDateString() : '—'}
                    </td>
                    <td>
                      <button id={`delete-customer-${c.id}`} className="btn btn-danger btn-sm btn-icon" onClick={() => openDel(c)} title="Delete">
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Customer Modal */}
      <Modal isOpen={modal === 'add'} onClose={close} title="Add New Customer">
        <div className="modal-body">
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Full Name <span className="form-required">*</span></label>
              <input id="customer-name" className={`form-control ${errors.full_name ? 'error' : ''}`} value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} placeholder="e.g. Rahul Sharma" />
              {errors.full_name && <div className="form-error">{errors.full_name}</div>}
            </div>
            <div className="form-group">
              <label className="form-label">Email <span className="form-required">*</span></label>
              <input id="customer-email" type="email" className={`form-control ${errors.email ? 'error' : ''}`} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="rahul@example.com" />
              {errors.email && <div className="form-error">{errors.email}</div>}
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input id="customer-phone" className="form-control" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+91 98765 43210" />
            </div>
            <div className="form-group">
              <label className="form-label">Address</label>
              <input id="customer-address" className="form-control" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="City, State" />
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={close}>Cancel</button>
          <button id="save-customer-btn" className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
            {saving ? 'Saving…' : 'Add Customer'}
          </button>
        </div>
      </Modal>

      {/* Delete Confirm */}
      <Modal isOpen={modal === 'delete'} onClose={close} title="Delete Customer">
        <div className="modal-body">
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
            Are you sure you want to delete <strong style={{ color: 'var(--text-primary)' }}>{selected?.full_name}</strong>? All associated orders may also be affected.
          </p>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={close}>Cancel</button>
          <button id="confirm-delete-customer" className="btn btn-danger" onClick={handleDelete} disabled={saving}>
            {saving ? 'Deleting…' : 'Delete Customer'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
