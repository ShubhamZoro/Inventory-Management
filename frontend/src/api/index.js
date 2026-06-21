import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

// ─── Products ────────────────────────────────────────────────────────────────
export const getProducts = (q = '') => api.get('/products', { params: q ? { q } : {} });
export const getProduct  = (id)     => api.get(`/products/${id}`);
export const createProduct = (data) => api.post('/products', data);
export const updateProduct = (id, data) => api.put(`/products/${id}`, data);
export const deleteProduct = (id)   => api.delete(`/products/${id}`);

// ─── Customers ───────────────────────────────────────────────────────────────
export const getCustomers    = ()       => api.get('/customers');
export const getCustomer     = (id)     => api.get(`/customers/${id}`);
export const createCustomer  = (data)   => api.post('/customers', data);
export const deleteCustomer  = (id)     => api.delete(`/customers/${id}`);

// ─── Orders ──────────────────────────────────────────────────────────────────
export const getOrders       = ()             => api.get('/orders');
export const getOrder        = (id)           => api.get(`/orders/${id}`);
export const createOrder     = (data)         => api.post('/orders', data);
export const updateOrderStatus = (id, status) => api.patch(`/orders/${id}/status`, { status });
export const deleteOrder     = (id)           => api.delete(`/orders/${id}`);

// ─── Suppliers ────────────────────────────────────────────────────────────────
export const getSuppliers    = ()         => api.get('/suppliers');
export const getSupplier     = (id)       => api.get(`/suppliers/${id}`);
export const createSupplier  = (data)     => api.post('/suppliers', data);
export const updateSupplier  = (id, data) => api.put(`/suppliers/${id}`, data);
export const deleteSupplier  = (id)       => api.delete(`/suppliers/${id}`);

// ─── Purchase Orders ──────────────────────────────────────────────────────────
export const getPurchaseOrders      = ()           => api.get('/purchase-orders');
export const getPurchaseOrder       = (id)         => api.get(`/purchase-orders/${id}`);
export const createPurchaseOrder    = (data)       => api.post('/purchase-orders', data);
export const updatePurchaseOrderStatus = (id, status) => api.patch(`/purchase-orders/${id}/status`, { status });

// ─── Stock Movements (Audit Log) ─────────────────────────────────────────────
export const getStockMovements = () => api.get('/stock-movements');

// ─── Dashboard ───────────────────────────────────────────────────────────────
export const getDashboard = () => api.get('/dashboard');

export default api;
