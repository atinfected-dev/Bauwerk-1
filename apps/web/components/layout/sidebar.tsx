"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Boxes,
  Building2,
  Clock3,
  FileText,
  LayoutDashboard,
  NotebookText,
  Ruler,
  Settings,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

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
  const pathname = usePathname();

  return (
    <aside className="hidden min-h-screen w-64 shrink-0 border-r bg-white lg:block">
      <div className="flex h-16 items-center border-b px-6">
        <Link href="/dashboard" className="text-xl font-bold tracking-tight">
          Bau<span className="text-blue-600">Werk</span>
        </Link>
      </div>

      <nav className="space-y-1 p-4">
        {items.map((item) => {
          const Icon = item.icon;
          const active =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-blue-50 text-blue-700"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-950",
              )}
            >
              <Icon className="size-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
