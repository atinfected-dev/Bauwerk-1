'use client';

import { useMemo, useState } from 'react';
import axios from 'axios';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Building2, LoaderCircle, Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ProjectForm } from '@/components/projects/project-form';
import { ProjectTable } from '@/components/projects/project-table';
import { useAuth } from '@/providers/auth-provider';
import { getCustomers } from '@/services/customers';
import {
  createProject,
  deleteProject,
  getProjects,
  updateProject,
} from '@/services/projects';
import type { Project, ProjectPayload, ProjectStatus } from '@/types/project';

const statusOptions: Array<{
  value: ProjectStatus | 'ALL';
  label: string;
}> = [
  { value: 'ALL', label: 'Alle Status' },
  { value: 'PLANNED', label: 'Geplant' },
  { value: 'ACTIVE', label: 'Aktiv' },
  { value: 'PAUSED', label: 'Pausiert' },
  { value: 'COMPLETED', label: 'Abgeschlossen' },
  { value: 'BILLED', label: 'Abgerechnet' },
];

function apiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { error?: string } | undefined;
    return data?.error ?? 'Aktion konnte nicht ausgeführt werden.';
  }

  return error instanceof Error
    ? error.message
    : 'Aktion konnte nicht ausgeführt werden.';
}

export default function ProjectsPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<ProjectStatus | 'ALL'>('ALL');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const projectsQuery = useQuery({
    queryKey: ['projects'],
    queryFn: () => getProjects(),
  });

  const customersQuery = useQuery({
    queryKey: ['customers'],
    queryFn: () => getCustomers(),
  });

  const saveMutation = useMutation({
    mutationFn: async (payload: ProjectPayload) => {
      if (selectedProject) {
        return updateProject(selectedProject.id, payload);
      }

      return createProject(payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['projects'] });
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      closeForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteProject,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['projects'] });
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  const filteredProjects = useMemo(() => {
    const value = search.trim().toLowerCase();

    return (projectsQuery.data ?? []).filter((project) => {
      const matchesStatus = status === 'ALL' || project.status === status;
      const matchesSearch =
        !value ||
        [
          project.projectNumber,
          project.name,
          project.address,
          project.customer.name,
          project.description,
        ]
          .filter(Boolean)
          .some((field) => String(field).toLowerCase().includes(value));

      return matchesStatus && matchesSearch;
    });
  }, [projectsQuery.data, search, status]);

  const canWrite =
    user?.role === 'ADMIN' ||
    user?.role === 'OFFICE' ||
    user?.role === 'PROJECT_MANAGER';
  const canDelete = user?.role === 'ADMIN';

  function openCreateForm() {
    if ((customersQuery.data?.length ?? 0) === 0) {
      window.alert('Bitte zuerst mindestens einen Kunden anlegen.');
      return;
    }

    setSelectedProject(null);
    setIsFormOpen(true);
  }

  function openEditForm(project: Project) {
    setSelectedProject(project);
    setIsFormOpen(true);
  }

  function closeForm() {
    setSelectedProject(null);
    setIsFormOpen(false);
  }

  async function handleSave(payload: ProjectPayload) {
    await saveMutation.mutateAsync(payload);
  }

  async function handleDelete(project: Project) {
    const confirmed = window.confirm(
      `Soll die Baustelle "${project.name}" wirklich gelöscht werden?`,
    );

    if (!confirmed) return;

    try {
      await deleteMutation.mutateAsync(project.id);
    } catch (error) {
      window.alert(apiErrorMessage(error));
    }
  }

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-blue-600">Projektverwaltung</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">
            Baustellen
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Aufträge, Kunden, Laufzeiten und Status zentral verwalten.
          </p>
        </div>

        {canWrite ? (
          <Button onClick={openCreateForm} disabled={customersQuery.isLoading}>
            <Plus className="mr-2 size-4" />
            Baustelle anlegen
          </Button>
        ) : null}
      </div>

      <div className="mb-5 flex flex-col gap-3 sm:flex-row">
        <div className="flex w-full max-w-lg items-center rounded-xl border bg-white px-3 shadow-sm">
          <Search className="size-5 text-slate-400" />
          <Input
            className="border-0 bg-transparent shadow-none focus-visible:ring-0"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Baustellen suchen …"
          />
        </div>

        <select
          value={status}
          onChange={(event) =>
            setStatus(event.target.value as ProjectStatus | 'ALL')
          }
          className="h-10 rounded-xl border bg-white px-3 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-slate-200"
        >
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {projectsQuery.isLoading ? (
        <div className="flex items-center gap-3 rounded-xl border bg-white p-6 text-sm text-slate-600">
          <LoaderCircle className="size-5 animate-spin" />
          Baustellen werden geladen …
        </div>
      ) : projectsQuery.isError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-800">
          Baustellen konnten nicht geladen werden.
        </div>
      ) : (
        <>
          <div className="mb-4 flex items-center gap-2 text-sm text-slate-500">
            <Building2 className="size-4" />
            {filteredProjects.length}{' '}
            {filteredProjects.length === 1 ? 'Baustelle' : 'Baustellen'}
          </div>

          <ProjectTable
            projects={filteredProjects}
            canEdit={Boolean(canWrite)}
            canDelete={Boolean(canDelete)}
            onEdit={openEditForm}
            onDelete={handleDelete}
          />
        </>
      )}

      {isFormOpen ? (
        <ProjectForm
          project={selectedProject}
          customers={customersQuery.data ?? []}
          isSaving={saveMutation.isPending}
          onCancel={closeForm}
          onSubmit={handleSave}
        />
      ) : null}
    </div>
  );
}
