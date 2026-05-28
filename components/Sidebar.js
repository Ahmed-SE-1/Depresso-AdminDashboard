"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Tag,
  Users,
  History,
  LogOut,
  Coffee,
} from "lucide-react";

const menuItems = [
  { name: "Dashboard",    path: "/dashboard",            icon: LayoutDashboard },
  { name: "POS / Billing",path: "/dashboard/pos",        icon: ShoppingCart },
  { name: "Products",     path: "/dashboard/products",   icon: Package },
  { name: "Categories",   path: "/dashboard/categories", icon: Tag },
  { name: "Workers",      path: "/dashboard/workers",    icon: Users },
  { name: "Sales History",path: "/dashboard/sales",      icon: History },
];

export default function Sidebar() {
  const pathname = usePathname();

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@400;500;600&display=swap');

        .dh-sidebar {
          --espresso: #1a0f0a;
          --roast:    #2e1608;
          --caramel:  #c8834a;
          --cream:    #f5f0e8;
          --muted:    rgba(245, 240, 232, 0.45);
          --border:   rgba(245, 240, 232, 0.1);

          width: 210px;
          background: var(--espresso);
          height: 100vh;
          display: flex;
          flex-direction: column;
          position: fixed;
          left: 0; top: 0;
          font-family: 'DM Sans', sans-serif;
          border-right: 1px solid var(--border);
          z-index: 40;
        }

        /* Brand */
        .dh-brand {
          padding: 28px 20px 22px;
          display: flex;
          align-items: center;
          gap: 10px;
          border-bottom: 1px solid var(--border);
        }
        .dh-brand-icon {
          width: 34px; height: 34px;
          background: var(--caramel);
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .dh-brand-name {
          font-family: 'Playfair Display', serif;
          font-size: 17px;
          font-weight: 700;
          color: var(--cream);
          letter-spacing: 0.01em;
          line-height: 1;
        }
        .dh-brand-sub {
          font-size: 9px;
          font-weight: 600;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--caramel);
          margin-top: 2px;
        }

        /* Nav */
        .dh-nav {
          flex: 1;
          padding: 16px 12px;
          display: flex;
          flex-direction: column;
          gap: 2px;
          overflow-y: auto;
        }

        .dh-nav-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          border-radius: 11px;
          font-size: 13px;
          font-weight: 500;
          color: var(--muted);
          text-decoration: none;
          transition: background 0.18s, color 0.18s;
          position: relative;
        }
        .dh-nav-item:hover {
          background: rgba(245, 240, 232, 0.07);
          color: var(--cream);
        }
        .dh-nav-item.active {
          background: var(--caramel);
          color: #fff;
          font-weight: 600;
          box-shadow: 0 4px 14px rgba(200, 131, 74, 0.35);
        }
        .dh-nav-item.active svg { opacity: 1; }
        .dh-nav-item svg { opacity: 0.7; transition: opacity 0.18s; flex-shrink: 0; }
        .dh-nav-item:hover svg { opacity: 1; }

        /* Section label */
        .dh-nav-section {
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: rgba(245,240,232,0.25);
          padding: 14px 12px 6px;
        }

        /* Bottom */
        .dh-sidebar-footer {
          padding: 12px;
          border-top: 1px solid var(--border);
        }
        .dh-logout-btn {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          width: 100%;
          background: transparent;
          border: none;
          border-radius: 11px;
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          font-weight: 500;
          color: rgba(220, 100, 80, 0.7);
          cursor: pointer;
          transition: background 0.18s, color 0.18s;
        }
        .dh-logout-btn:hover {
          background: rgba(220, 80, 60, 0.12);
          color: #ef4444;
        }
      `}</style>

      <aside className="dh-sidebar">
        {/* Brand */}
        <div className="dh-brand">
          <div className="dh-brand-icon">
            <Coffee size={16} color="#fff" />
          </div>
          <div>
            <div className="dh-brand-name">Depresso</div>
            <div className="dh-brand-sub">Admin</div>
          </div>
        </div>

        {/* Nav */}
        <nav className="dh-nav">
          <div className="dh-nav-section">Main</div>
          {menuItems.slice(0, 2).map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path;
            return (
              <Link key={item.path} href={item.path} className={`dh-nav-item ${isActive ? "active" : ""}`}>
                <Icon size={16} />
                {item.name}
              </Link>
            );
          })}

          <div className="dh-nav-section">Inventory</div>
          {menuItems.slice(2, 4).map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path;
            return (
              <Link key={item.path} href={item.path} className={`dh-nav-item ${isActive ? "active" : ""}`}>
                <Icon size={16} />
                {item.name}
              </Link>
            );
          })}

          <div className="dh-nav-section">Staff & Reports</div>
          {menuItems.slice(4).map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path;
            return (
              <Link key={item.path} href={item.path} className={`dh-nav-item ${isActive ? "active" : ""}`}>
                <Icon size={16} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="dh-sidebar-footer">
          <button className="dh-logout-btn" onClick={handleLogout}>
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}