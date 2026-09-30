import React, { useState } from "react";
import { NavLink, Outlet, useNavigate, Link } from "react-router-dom";
import {
  LayoutDashboard,
  FileText,
  Building2,
  LogOut,
  Menu,
  X,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";
import Stamp from "../../assets/stamp.png";
import { useAuth } from "../../Hooks/useAuth";

const NAV_ITEMS = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/admin/reports", label: "Reports", icon: FileText },
  { to: "/admin/departments", label: "Departments", icon: Building2 },
];

// Chrome for the whole admin area. The public Navbar and Footer are not used
// here, an admin tool has its own navigation.
const AdminLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate("/admin/login", { replace: true });
  };

  // The sidebar and the backdrop share the same open state
  const sidebarClasses = isSidebarOpen
    ? "translate-x-0"
    : "-translate-x-full lg:translate-x-0";

  return (
    <div className="min-h-screen bg-gray-50 lg:flex">
      {/* Backdrop, only on mobile and only while the sidebar is out */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ==================== SIDEBAR ==================== */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-64 shrink-0 bg-[#264F8B] text-white flex flex-col transition-transform duration-200 ${sidebarClasses}`}
      >
        <div className="flex items-center gap-3 px-5 py-5 border-b border-white/15">
          <img
            src={Stamp}
            alt=""
            className="w-10 h-10 object-contain bg-white/95 rounded-full p-1"
          />

          <div className="min-w-0">
            <p className="text-sm font-bold leading-tight truncate">
              Hamro Samadhan
            </p>

            <p className="text-[11px] text-blue-200 flex items-center gap-1">
              <ShieldCheck size={12} />
              Admin Portal
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsSidebarOpen(false)}
            className="ml-auto lg:hidden text-white/80 hover:text-white cursor-pointer"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-blue-200">
            Manage
          </p>

          <ul className="flex flex-col gap-1">
            {NAV_ITEMS.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.end}
                  onClick={() => setIsSidebarOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition ${
                      isActive
                        ? "bg-white text-blue-800 shadow-sm"
                        : "text-blue-50 hover:bg-white/10"
                    }`
                  }
                >
                  <item.icon size={18} />
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* Account block, pinned to the bottom */}
        <div className="border-t border-white/15 p-3">
          <div className="px-3 py-2 mb-2 min-w-0">
            <p className="text-sm font-semibold truncate">{user?.name}</p>

            <p className="text-xs text-blue-200 truncate">{user?.email}</p>
          </div>

          <Link
            to="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold text-blue-50 hover:bg-white/10 transition"
          >
            <ExternalLink size={18} />
            Public site
          </Link>

          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold text-blue-50 hover:bg-red-500/25 transition cursor-pointer"
          >
            <LogOut size={18} />
            Sign out
          </button>
        </div>
      </aside>

      {/* ==================== MAIN ==================== */}
      <div className="flex-1 min-w-0">
        {/* Mobile top bar, the sidebar is off screen below lg */}
        <div className="lg:hidden sticky top-0 z-30 bg-[#264F8B] text-white flex items-center gap-3 px-4 py-3">
          <button
            type="button"
            onClick={() => setIsSidebarOpen(true)}
            className="cursor-pointer"
            aria-label="Open menu"
          >
            <Menu size={22} />
          </button>

          <span className="font-bold text-sm">Hamro Samadhan Admin</span>
        </div>

        <main className="p-4 sm:p-6 lg:p-8 max-w-7xl">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
