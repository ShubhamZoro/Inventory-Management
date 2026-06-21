import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, Users, ShoppingCart, DollarSign, AlertTriangle, ArrowRight, ShoppingBag } from 'lucide-react';
import StatCard from '../components/StatCard';
import { getDashboard } from '../api';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getDashboard()
      .then((r) => setData(r.data))
      .catch(() => setError('Failed to load dashboard data.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;
  if (error)   return <p style={{ color: 'var(--danger)', padding: 24 }}>{error}</p>;

  const fmt = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Dashboard</h2>
          <p>Overview of your inventory and orders</p>
        </div>
      </div>

      <div className="stat-grid">
        <StatCard
          value={data.total_products}
          label="Total Products"
          icon={Package}
          color="#6366f1"
          gradient="linear-gradient(90deg, #6366f1, #818cf8)"
        />
        <StatCard
          value={data.total_customers}
          label="Total Customers"
          icon={Users}
          color="#10b981"
          gradient="linear-gradient(90deg, #10b981, #34d399)"
        />
        <StatCard
          value={data.total_orders}
          label="Total Orders"
          icon={ShoppingCart}
          color="#f59e0b"
          gradient="linear-gradient(90deg, #f59e0b, #fbbf24)"
        />
        <StatCard
          value={fmt(data.total_revenue)}
          label="Total Revenue"
          icon={DollarSign}
          color="#ec4899"
          gradient="linear-gradient(90deg, #ec4899, #f472b6)"
        />
        <StatCard
          value={data.pending_purchase_orders ?? 0}
          label="Pending POs"
          icon={ShoppingBag}
          color="#38bdf8"
          gradient="linear-gradient(90deg, #38bdf8, #7dd3fc)"
        />
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <AlertTriangle size={18} color="var(--warning)" />
            Low Stock Alert
            {data.low_stock_products.length > 0 && (
              <span className="badge badge-warning" style={{ marginLeft: 8 }}>
                {data.low_stock_products.length} item{data.low_stock_products.length > 1 ? 's' : ''}
              </span>
            )}
          </div>
          <Link to="/products" className="btn btn-ghost btn-sm">
            View All <ArrowRight size={14} />
          </Link>
        </div>

        {data.low_stock_products.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">✅</div>
            <p>All products are well-stocked!</p>
          </div>
        ) : (
          <div className="low-stock-list">
            {data.low_stock_products.map((p) => (
              <div key={p.id} className="low-stock-item">
                <div>
                  <div className="low-stock-name">{p.name}</div>
                  <div className="low-stock-sku">SKU: {p.sku} · {p.category || 'No Category'}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span
                    className={`badge ${p.quantity === 0 ? 'badge-danger' : 'badge-warning'}`}
                  >
                    {p.quantity === 0 ? 'Out of Stock' : `${p.quantity} left`}
                  </span>
                  <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>
                    ₹{p.price.toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
