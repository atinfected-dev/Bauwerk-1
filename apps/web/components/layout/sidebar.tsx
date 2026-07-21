"use client";

import Link from "next/link";
import {
  LayoutDashboard,
  Users,
  Building2,
  Clock3,
  NotebookText,
  Boxes,
  Ruler,
  FileText,
  BarChart3,
  Settings,
} from "lucide-react";

const items = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/customers", icon: Users, label: "Kunden" },
  { href: "/projects", icon: Building2, label: "Baustellen" },
  { href: "/timesheets", icon: Clock3, label: "Stunden" },
  { href: "/diary", icon: NotebookText, label: "Bautagebuch" },
  { href: "/material", icon: Boxes, label: "Material" },
  { href: "/measurement", icon: Ruler, label: "Aufmaß" },
  { href: "/documents", icon: FileText, label: "Dokumente" },
  { href: "/reports", icon: BarChart3, label: "Auswertungen" },
  { href: "/settings", icon: Settings, label: "Einstellungen" },
];

export default function Sidebar() {
  return (
    <aside className="w-72 border-r bg-white h-screen p-6">
      <h1 className="text-3xl font-bold text-blue-600 mb-10">
        BauWerk
      </h1>

      <nav className="space-y-2">
        {items.map((item) => {
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-lg px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition"
            >
              <Icon size={20} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}