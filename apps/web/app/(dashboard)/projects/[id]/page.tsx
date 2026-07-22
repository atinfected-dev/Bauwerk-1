'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  Boxes,
  CalendarDays,
  Clock3,
  FileText,
  Images,
  LoaderCircle,
  MapPin,
  NotebookText,
  ReceiptText,
  ListChecks,
  Ruler,
  UserRound,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ProjectStatusBadge } from '@/components/projects/project-status-badge';
import { getProject } from '@/services/projects';

const modules = [
  { label: 'Bautagebuch', icon: NotebookText, description: 'Tagesberichte und Vorkommnisse', href: 'diary' },
  { label: 'Zeiten', icon: Clock3, description: 'Arbeits- und Einsatzzeiten', href: 'time' },
  { label: 'Aufgaben', icon: ListChecks, description: 'Kanban, Checklisten und Zuständigkeiten', href: 'tasks' },
  { label: 'Material', icon: Boxes, description: 'Verbrauch und Lagerbestand', href: 'material' },
  { label: 'Aufmaß', icon: Ruler, description: 'Positionen und Mengen', href: null },
  { label: 'Fotos', icon: Images, description: 'Baustellendokumentation', href: null },
  { label: 'Dokumente', icon: FileText, description: 'Pläne, Protokolle und Dateien', href: 'documents' },
  { label: 'Rechnungen', icon: ReceiptText, description: 'Abschläge und Schlussrechnung', href: null },
];

function formatDate(value: string | null): string {
  if (!value) return 'Nicht festgelegt';
  return new Intl.DateTimeFormat('de-DE').format(new Date(value));
}

export default function ProjectDetailPage() {
  const params = useParams<{ id: string }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  const projectQuery = useQuery({
    queryKey: ['projects', id],
    queryFn: () => getProject(id),
    enabled: Boolean(id),
  });

  if (projectQuery.isLoading) {
    return (
      <div className="flex items-center gap-3 rounded-xl border bg-white p-6 text-sm text-slate-600">
        <LoaderCircle className="size-5 animate-spin" />
        Baustelle wird geladen …
      </div>
    );
  }

  if (projectQuery.isError || !projectQuery.data) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-800">
        Baustelle konnte nicht geladen werden.
      </div>
    );
  }

  const project = projectQuery.data;

  return (
    <div>
      <Link
        href="/projects"
        className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-950"
      >
        <ArrowLeft className="size-4" />
        Zurück zu den Baustellen
      </Link>

      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-medium text-blue-600">
            {project.projectNumber}
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">
            {project.name}
          </h1>
          <p className="mt-2 flex items-center gap-1.5 text-sm text-slate-500">
            <MapPin className="size-4" />
            {project.address}
          </p>
        </div>
        <ProjectStatusBadge status={project.status} />
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm text-slate-500">
              <UserRound className="size-4" />
              Kunde
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-medium">{project.customer.name}</p>
            <p className="mt-1 text-sm text-slate-500">
              {project.customer.customerNumber}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm text-slate-500">
              <CalendarDays className="size-4" />
              Start
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-medium">{formatDate(project.startDate)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm text-slate-500">
              <CalendarDays className="size-4" />
              Geplantes Ende
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-medium">{formatDate(project.endDate)}</p>
          </CardContent>
        </Card>
      </div>

      {project.description ? (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">Beschreibung</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm leading-6 text-slate-600">
              {project.description}
            </p>
          </CardContent>
        </Card>
      ) : null}

      <div>
        <h2 className="mb-4 text-lg font-semibold">Baustellen-Workspace</h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {modules.map((module) => {
            const Icon = module.icon;
            return (
              <Link
                key={module.label}
                href={module.href ? `/projects/${project.id}/${module.href}` : '#'}
                aria-disabled={!module.href}
                className={`rounded-2xl border bg-white p-5 shadow-sm transition ${module.href ? 'hover:-translate-y-0.5 hover:shadow-md' : 'cursor-default opacity-70'}`}
              >
                <div className="mb-4 flex size-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                  <Icon className="size-5" />
                </div>
                <h3 className="font-medium">{module.label}</h3>
                <p className="mt-1 text-sm text-slate-500">
                  {module.description}
                </p>
                <p className="mt-4 text-xs font-medium uppercase tracking-wide text-slate-400">
                  {module.href ? 'Öffnen' : 'Folgt in einem späteren Sprint'}
                </p>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
