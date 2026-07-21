'use client';

import Link from 'next/link';
import {
  CalendarDays,
  Eye,
  MapPin,
  Pencil,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProjectStatusBadge } from '@/components/projects/project-status-badge';
import type { Project } from '@/types/project';

interface ProjectTableProps {
  projects: Project[];
  canEdit: boolean;
  canDelete: boolean;
  onEdit: (project: Project) => void;
  onDelete: (project: Project) => void;
}

function formatDate(value: string | null): string {
  if (!value) return '–';

  return new Intl.DateTimeFormat('de-DE').format(new Date(value));
}

export function ProjectTable({
  projects,
  canEdit,
  canDelete,
  onEdit,
  onDelete,
}: ProjectTableProps) {
  if (projects.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed bg-white p-12 text-center">
        <h2 className="font-semibold">Keine Baustellen gefunden</h2>
        <p className="mt-1 text-sm text-slate-500">
          Lege eine Baustelle an oder ändere Suche und Filter.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1050px] text-left">
          <thead className="border-b bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-5 py-3">Nummer</th>
              <th className="px-5 py-3">Baustelle</th>
              <th className="px-5 py-3">Kunde</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">Zeitraum</th>
              <th className="w-36 px-5 py-3 text-right">Aktionen</th>
            </tr>
          </thead>

          <tbody className="divide-y">
            {projects.map((project) => (
              <tr key={project.id} className="hover:bg-slate-50/70">
                <td className="px-5 py-4 text-sm font-medium text-blue-700">
                  {project.projectNumber}
                </td>
                <td className="px-5 py-4">
                  <p className="font-medium text-slate-950">{project.name}</p>
                  <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                    <MapPin className="size-3.5" />
                    {project.address}
                  </p>
                </td>
                <td className="px-5 py-4 text-sm text-slate-700">
                  {project.customer.name}
                </td>
                <td className="px-5 py-4">
                  <ProjectStatusBadge status={project.status} />
                </td>
                <td className="px-5 py-4 text-sm text-slate-600">
                  <span className="flex items-center gap-1.5">
                    <CalendarDays className="size-4 text-slate-400" />
                    {formatDate(project.startDate)} – {formatDate(project.endDate)}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <div className="flex justify-end gap-1">
                    <Link
                      href={`/projects/${project.id}`}
                      className="inline-flex size-9 items-center justify-center rounded-md hover:bg-slate-100"
                      aria-label={`${project.name} öffnen`}
                    >
                      <Eye className="size-4" />
                    </Link>

                    {canEdit ? (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEdit(project)}
                        aria-label={`${project.name} bearbeiten`}
                      >
                        <Pencil className="size-4" />
                      </Button>
                    ) : null}

                    {canDelete ? (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-600 hover:bg-red-50 hover:text-red-700"
                        onClick={() => onDelete(project)}
                        aria-label={`${project.name} löschen`}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
