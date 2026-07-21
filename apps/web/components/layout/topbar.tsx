"use client";

import { Bell, Moon, UserCircle2 } from "lucide-react";

export default function Topbar() {
  return (
    <header className="flex h-16 items-center justify-end border-b bg-white px-8">

      <button className="mr-6">
        <Bell />
      </button>

      <button className="mr-6">
        <Moon />
      </button>

      <div className="flex items-center gap-3">
        <UserCircle2 size={32} />
        <span className="font-medium">
          Frederik
        </span>
      </div>

    </header>
  );
}