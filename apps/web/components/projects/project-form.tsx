'use client';

import { useEffect, useState, type FormEvent } from 'react';
import axios from 'axios';
import { LoaderCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Customer } from '@/types/customer';
import type { Project, ProjectPayload, ProjectStatus } from '@/types/project';

interface ProjectFormProps {
  project?: Project | null;
  customers: Customer[];
  isSaving: boolean;
  onCancel: () => void;
  onSubmit: (payload: ProjectPayload) => Promise<void>;
}

const emptyForm: ProjectPayload = {
  projectNumber: '',
  customerId: '',
  name: '',
  address: '',
  description: '',
  status: 'PLANNED',
  startDate: '',
  endDate: '',
};

const statuses: Array<{ value: ProjectStatus; label: string }> = [
  { value: 'PLANNED', label: 'Geplant' },
  { value: 'ACTIVE', label: 'Aktiv' },
  { value: 'PAUSED', label: 'Pausiert' },
  { value: 'COMPLETED', label: 'Abgeschlossen' },
  { value: 'BILLED', label: 'Abgerechnet' },
];

function dateInputValue(value: string | null): string {
  return value ? value.slice(0, 10) : '';
}

function errorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { error?: string } | undefined;
    return data?.error ?? 'Baustelle konnte nicht gespeichert werden.';
  }

  return error instanceof Error
    ? error.message
    : 'Baustelle konnte nicht gespeichert werden.';
}

export function ProjectForm({
  project,
  customers,
  isSaving,
  onCancel,
  onSubmit,
}: ProjectFormProps) {
  const [form, setForm] = useState<ProjectPayload>(emptyForm);
  const [error, setError] = useState('');

  useEffect(() => {
    if (project) {
      setForm({
        projectNumber: project.projectNumber,
        customerId: project.customerId,
        name: project.name,
        address: project.address,
        description: project.description ?? '',
        status: project.status,
        startDate: dateInputValue(project.startDate),
        endDate: dateInputValue(project.endDate),
      });
      return;
    }

    setForm({
      ...emptyForm,
      customerId: customers[0]?.id ?? '',
    });
  }, [customers, project]);

  function change<K extends keyof ProjectPayload>(
    field: K,
    value: ProjectPayload[K],
  ) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    if (
      !form.projectNumber.trim() ||
      !form.customerId ||
      !form.name.trim() ||
      !form.address.trim()
    ) {
      setError('Baustellennummer, Kunde, Name und Adresse sind Pflichtfelder.');
      return;
    }

    if (form.startDate && form.endDate && form.endDate < form.startDate) {
      setError('Das Enddatum darf nicht vor dem Startdatum liegen.');
      return;
    }

    try {
      await onSubmit({
        projectNumber: form.projectNumber.trim(),
        customerId: form.customerId,
        name: form.name.trim(),
        address: form.address.trim(),
        description: form.description?.trim(),
        status: form.status,
        startDate: form.startDate,
        endDate: form.endDate,
      });
    } catch (submitError) {
      setError(errorMessage(submitError));
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
      <div className="max-h-[92vh] w-full max-w-3xl overflow-auto rounded-2xl border bg-white shadow-xl">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold">
              {project ? 'Baustelle bearbeiten' : 'Baustelle anlegen'}
            </h2>
            <p className="text-sm text-slate-500">
              Auftrags- und Baustellendaten erfassen.
            </p>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onCancel}
            aria-label="Formular schließen"
          >
            <X className="size-5" />
          </Button>
        </div>

        <form className="grid gap-5 p-6 sm:grid-cols-2" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="projectNumber">Baustellennummer *</Label>
            <Input
              id="projectNumber"
              value={form.projectNumber}
              onChange={(event) => change('projectNumber', event.target.value)}
              placeholder="B-2026-001"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="customerId">Kunde *</Label>
            <select
              id="customerId"
              value={form.customerId}
              onChange={(event) => change('customerId', event.target.value)}
              className="flex h-9 w-full rounded-md border border-slate-200 bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-slate-400 focus-visible:ring-2 focus-visible:ring-slate-200"
              required
            >
              <option value="">Kunde auswählen</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.customerNumber} – {customer.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="name">Bezeichnung *</Label>
            <Input
              id="name"
              value={form.name}
              onChange={(event) => change('name', event.target.value)}
              placeholder="Elektroinstallation EFH Müller"
              required
            />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="address">Baustellenadresse *</Label>
            <Input
              id="address"
              value={form.address}
              onChange={(event) => change('address', event.target.value)}
              placeholder="Musterstraße 10, 66424 Homburg"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <select
              id="status"
              value={form.status}
              onChange={(event) =>
                change('status', event.target.value as ProjectStatus)
              }
              className="flex h-9 w-full rounded-md border border-slate-200 bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-slate-400 focus-visible:ring-2 focus-visible:ring-slate-200"
            >
              {statuses.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>

          <div />

          <div className="space-y-2">
            <Label htmlFor="startDate">Startdatum</Label>
            <Input
              id="startDate"
              type="date"
              value={form.startDate ?? ''}
              onChange={(event) => change('startDate', event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="endDate">Enddatum</Label>
            <Input
              id="endDate"
              type="date"
              value={form.endDate ?? ''}
              onChange={(event) => change('endDate', event.target.value)}
            />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="description">Beschreibung</Label>
            <textarea
              id="description"
              value={form.description ?? ''}
              onChange={(event) => change('description', event.target.value)}
              placeholder="Leistungsumfang, Besonderheiten oder interne Hinweise …"
              rows={4}
              maxLength={2000}
              className="flex w-full rounded-md border border-slate-200 bg-transparent px-3 py-2 text-sm shadow-xs outline-none placeholder:text-slate-400 focus-visible:border-slate-400 focus-visible:ring-2 focus-visible:ring-slate-200"
            />
          </div>

          {error ? (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 sm:col-span-2">
              {error}
            </p>
          ) : null}

          <div className="flex justify-end gap-3 border-t pt-5 sm:col-span-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              Abbrechen
            </Button>
            <Button type="submit" disabled={isSaving || customers.length === 0}>
              {isSaving ? (
                <>
                  <LoaderCircle className="mr-2 size-4 animate-spin" />
                  Speichern …
                </>
              ) : (
                'Speichern'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
