'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, CalendarDays, Clock3, CloudSun, Pencil, Plus, Trash2, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DiaryEntryForm } from '@/components/diary/diary-entry-form';
import { createDiaryEntry, deleteDiaryEntry, getDiaryEntries, updateDiaryEntry } from '@/services/diary';
import { getProject } from '@/services/projects';
import type { DiaryEntry, DiaryEntryPayload, WeatherCondition } from '@/types/diary';

const weatherLabels: Record<WeatherCondition, string> = { SUNNY: 'Sonnig', CLOUDY: 'Bewölkt', RAIN: 'Regen', SNOW: 'Schnee', STORM: 'Sturm', MIXED: 'Wechselhaft', UNKNOWN: 'Keine Angabe' };
const dateFormatter = new Intl.DateTimeFormat('de-DE', { dateStyle: 'long' });

export default function ProjectDiaryPage() {
  const params = useParams<{ id: string }>();
  const projectId = Array.isArray(params.id) ? params.id[0] : params.id;
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<DiaryEntry | null>(null);
  const [error, setError] = useState('');

  const projectQuery = useQuery({ queryKey: ['projects', projectId], queryFn: () => getProject(projectId), enabled: Boolean(projectId) });
  const entriesQuery = useQuery({ queryKey: ['diary', projectId], queryFn: () => getDiaryEntries(projectId), enabled: Boolean(projectId) });

  const saveMutation = useMutation({
    mutationFn: (payload: DiaryEntryPayload) => editing ? updateDiaryEntry(editing.id, payload) : createDiaryEntry(projectId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['diary', projectId] });
      setShowForm(false); setEditing(null); setError('');
    },
    onError: () => setError('Der Bautagebucheintrag konnte nicht gespeichert werden.'),
  });

  const removeMutation = useMutation({
    mutationFn: deleteDiaryEntry,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['diary', projectId] }),
    onError: () => setError('Der Eintrag konnte nicht gelöscht werden.'),
  });

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/projects/${projectId}`} className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-950"><ArrowLeft className="size-4" />Zurück zur Baustelle</Link>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div><p className="text-sm font-medium text-blue-600">{projectQuery.data?.projectNumber}</p><h1 className="text-3xl font-semibold tracking-tight">Bautagebuch</h1><p className="mt-1 text-sm text-slate-500">{projectQuery.data?.name ?? 'Baustelle wird geladen …'}</p></div>
          <Button onClick={() => { setEditing(null); setShowForm(true); }}><Plus className="mr-2 size-4" />Neuer Eintrag</Button>
        </div>
      </div>

      {error ? <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div> : null}

      {showForm ? <Card><CardHeader><CardTitle>{editing ? 'Eintrag bearbeiten' : 'Neuer Bautagebucheintrag'}</CardTitle></CardHeader><CardContent><DiaryEntryForm entry={editing} busy={saveMutation.isPending} onCancel={() => { setShowForm(false); setEditing(null); }} onSubmit={async (payload) => { setError(''); await saveMutation.mutateAsync(payload); }} /></CardContent></Card> : null}

      {entriesQuery.isLoading ? <div className="rounded-xl border bg-white p-6 text-sm text-slate-500">Bautagebuch wird geladen …</div> : null}
      {entriesQuery.isError ? <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-800">Bautagebuch konnte nicht geladen werden.</div> : null}
      {entriesQuery.data?.length === 0 ? <div className="rounded-2xl border border-dashed bg-white p-12 text-center"><CalendarDays className="mx-auto mb-3 size-9 text-slate-400" /><h2 className="font-semibold">Noch keine Einträge</h2><p className="mt-1 text-sm text-slate-500">Dokumentiere den ersten Arbeitstag auf dieser Baustelle.</p></div> : null}

      <div className="space-y-4">
        {entriesQuery.data?.map((entry) => (
          <Card key={entry.id}>
            <CardHeader className="pb-3"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-sm font-medium text-blue-600">{dateFormatter.format(new Date(entry.entryDate))}</p><CardTitle className="mt-1 text-lg">{entry.title}</CardTitle><p className="mt-1 text-xs text-slate-500">Erfasst von {entry.author.firstName} {entry.author.lastName}</p></div><div className="flex gap-2"><Button size="sm" variant="outline" onClick={() => { setEditing(entry); setShowForm(true); }}><Pencil className="mr-1.5 size-3.5" />Bearbeiten</Button><Button size="sm" variant="outline" onClick={() => { if (window.confirm('Bautagebucheintrag wirklich löschen?')) removeMutation.mutate(entry.id); }}><Trash2 className="mr-1.5 size-3.5" />Löschen</Button></div></div></CardHeader>
            <CardContent className="space-y-4"><div><h3 className="mb-1 text-sm font-semibold">Ausgeführte Arbeiten</h3><p className="whitespace-pre-wrap text-sm leading-6 text-slate-600">{entry.workDone}</p></div>{entry.incidents ? <div className="rounded-lg border border-amber-200 bg-amber-50 p-3"><h3 className="mb-1 text-sm font-semibold text-amber-900">Vorkommnisse / Behinderungen</h3><p className="whitespace-pre-wrap text-sm text-amber-900">{entry.incidents}</p></div> : null}<div className="flex flex-wrap gap-x-5 gap-y-2 border-t pt-4 text-sm text-slate-600"><span className="inline-flex items-center gap-1.5"><Users className="size-4" />{entry.staffCount} Mitarbeiter</span>{entry.hoursWorked != null ? <span className="inline-flex items-center gap-1.5"><Clock3 className="size-4" />{entry.hoursWorked} Std.</span> : null}<span className="inline-flex items-center gap-1.5"><CloudSun className="size-4" />{weatherLabels[entry.weather]}{entry.temperature != null ? `, ${entry.temperature} °C` : ''}</span></div></CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
