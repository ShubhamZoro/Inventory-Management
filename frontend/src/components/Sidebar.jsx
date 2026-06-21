import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Users,
  ShoppingCart,
  Box,
  Truck,
  Zap,
} from 'lucide-react';

const mainNav = [
  { to: '/',          icon: LayoutDashboard, label: 'Dashboard'  },
  { to: '/products',  icon: Package,         label: 'Products'   },
  { to: '/customers', icon: Users,           label: 'Customers'  },
  { to: '/orders',    icon: ShoppingCart,    label: 'Orders'     },
];

const operationsNav = [
  { to: '/suppliers', icon: Truck,           label: 'Suppliers'  },
];

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-icon">
          <Box size={22} color="#fff" />
        </div>
        <div>
          <h1>InvenTrack<span>Inventory & Orders</span></h1>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="sidebar-section-label">Main</div>
        {mainNav.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
          >
            <Icon size={18} className="nav-icon" />
            {label}
          </NavLink>
        ))}

        <div className="sidebar-section-label" style={{ marginTop: 12 }}>Operations</div>
        {operationsNav.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
          >
            <Icon size={18} className="nav-icon" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="api-badge">
          <div className="api-dot" />
          <span>API Connected</span>
          <Zap size={12} style={{ marginLeft: 'auto', opacity: 0.5 }} />
        </div>
      </div>
    </aside>
  );
}
