import React from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { FileText, BarChart3, History, Building2, Home, Tag } from "lucide-react";
import Logo from "../assets/logo.png"; // Updated logo path to src/assets

const Layout = () => {
  const location = useLocation();

  const navItems = [
    { path: "/", label: "Dashboard", icon: Home },
    { path: "/module-a", label: "Módulo A: Facturación", icon: FileText },
    { path: "/module-b", label: "Módulo B: Análisis Esp.", icon: BarChart3 },
    { path: "/history", label: "Historial", icon: History },
    { path: "/cost-centers", label: "Centros de Costo", icon: Building2 },
    { path: "/categories", label: "Categorías", icon: Tag },
  ];

  return (
    <div className="flex min-h-screen bg-[#F4F4F5]">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-zinc-200">
        <div className="p-6 border-b border-zinc-200">
          <img src={Logo} alt="Logo" className="h-12 w-auto" />
        </div>
        <nav className="p-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                data-testid={`nav-${item.path.replace('/', '') || 'home'}`}
                className={`flex items-center gap-3 px-4 py-3 mb-1 rounded-none transition-colors ${isActive
                    ? "bg-[#0033CC] text-white"
                    : "text-zinc-700 hover:bg-zinc-100"
                  }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
