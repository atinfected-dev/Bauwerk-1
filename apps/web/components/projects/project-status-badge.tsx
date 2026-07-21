import { Badge } from '@/components/ui/badge';
import type { ProjectStatus } from '@/types/project';

const statusConfig: Record<
  ProjectStatus,
  { label: string; className: string }
> = {
  PLANNED: {
    label: 'Geplant',
    className: 'border-slate-200 bg-slate-100 text-slate-700',
  },
  ACTIVE: {
    label: 'Aktiv',
    className: 'border-blue-200 bg-blue-50 text-blue-700',
  },
  PAUSED: {
    label: 'Pausiert',
    className: 'border-amber-200 bg-amber-50 text-amber-700',
  },
  COMPLETED: {
    label: 'Abgeschlossen',
    className: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  },
  BILLED: {
    label: 'Abgerechnet',
    className: 'border-violet-200 bg-violet-50 text-violet-700',
  },
};

export function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  const config = statusConfig[status];

  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  );
}
