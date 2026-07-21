"use client";

import { Bell, LogOut, Moon, UserCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/providers/auth-provider";

export default function Topbar() {
  const router = useRouter();
  const { user, company, logout } = useAuth();

  async function handleLogout() {
    await logout();
    router.replace("/login");
  }

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b bg-white px-6">
      <div>
        <p className="text-sm font-medium text-slate-900">
          {company?.name ?? "BauWerk"}
        </p>
        <p className="text-xs text-slate-500">Betriebsübersicht</p>
      </div>

      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" aria-label="Benachrichtigungen">
          <Bell className="size-5" />
        </Button>

        <Button variant="ghost" size="icon" aria-label="Darstellung wechseln">
          <Moon className="size-5" />
        </Button>

        <div className="ml-2 flex items-center gap-2 border-l pl-4">
          <UserCircle2 className="size-8 text-slate-600" />

          <div className="hidden text-left sm:block">
            <p className="text-sm font-medium leading-none">
              {user ? `${user.firstName} ${user.lastName}` : "Benutzer"}
            </p>
            <p className="mt-1 text-xs text-slate-500">{user?.role}</p>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            aria-label="Abmelden"
            title="Abmelden"
          >
            <LogOut className="size-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
