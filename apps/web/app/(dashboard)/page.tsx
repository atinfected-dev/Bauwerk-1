import StatCard from "@/components/dashboard/stat-card";

export default function DashboardPage() {
  return (
    <div>

      <h1 className="mb-8 text-3xl font-bold">
        Dashboard
      </h1>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">

        <StatCard
          title="Baustellen"
          value="12"
        />

        <StatCard
          title="Kunden"
          value="124"
        />

        <StatCard
          title="Mitarbeiter"
          value="9"
        />

        <StatCard
          title="Stunden heute"
          value="71 h"
        />

      </div>

    </div>
  );
}