"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Building2,
  CheckCircle2,
  CircleDot,
  Users,
} from "lucide-react";
import StatCard from "@/components/dashboard/stat-card";
import { api } from "@/lib/api";
import type { DashboardStats } from "@/types/dashboard";

async function getDashboardStats(): Promise<DashboardStats> {
  const response = await api.get<DashboardStats>("/dashboard");
  return response.data;
}

export default function DashboardPage() {
  const dashboardQuery = useQuery({
    queryKey: ["dashboard"],
    queryFn: getDashboardStats,
  });

  if (dashboardQuery.isLoading) {
    return <p className="text-sm text-slate-500">Dashboard wird geladen …</p>;
  }

  if (dashboardQuery.isError || !dashboardQuery.data) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-5">
        <h1 className="font-semibold text-red-900">
          Dashboard konnte nicht geladen werden
        </h1>
        <p className="mt-1 text-sm text-red-700">
          Prüfe, ob das Express-Backend läuft und unter
          {" "}http://localhost:5000 erreichbar ist.
        </p>
      </div>
    );
  }

  const stats = dashboardQuery.data;

  return (
    <div>
      <div className="mb-8">
        <p className="text-sm font-medium text-blue-600">Übersicht</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">
          Dashboard
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Die aktuellen Kennzahlen deines Betriebs.
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Kunden"
          value={stats.customers}
          description="Gespeicherte Kunden"
          icon={Users}
        />
        <StatCard
          title="Baustellen"
          value={stats.projects}
          description="Alle Projekte"
          icon={Building2}
        />
        <StatCard
          title="Aktive Baustellen"
          value={stats.activeProjects}
          description="Derzeit in Bearbeitung"
          icon={CircleDot}
        />
        <StatCard
          title="Abgeschlossen"
          value={stats.completedProjects}
          description="Fertiggestellte Projekte"
          icon={CheckCircle2}
        />
      </div>
    </div>
  );
}
