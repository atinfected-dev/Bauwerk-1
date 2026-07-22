'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Clock3, Pause, Pencil, Play, Plus, Square, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ManualTimeForm } from '@/components/time/manual-time-form';
import { getProject } from '@/services/projects';
import { createManualTimeEntry, deleteTimeEntry, getCurrentTimeEntry, getProjectTimeEntries, pauseTimeEntry, resumeTimeEntry, startTimeEntry, stopTimeEntry, updateTimeEntry } from '@/services/time';
import type { ManualTimePayload, TimeEntry, TimeEntryType } from '@/types/time';

const typeLabels: Record<TimeEntryType, string> = { WORK: 'Arbeitszeit', TRAVEL: 'Fahrzeit', TRAINING: 'Schulung', OFFICE: 'Bürozeit', OTHER: 'Sonstiges' };
const dateTimeFormatter = new Intl.DateTimeFormat('de-DE', { dateStyle: 'medium', timeStyle: 'short' });

function duration(minutes: number) {
  const safe = Math.max(0, minutes);
  return `${Math.floor(safe / 60)}:${String(safe % 60).padStart(2, '0')} Std.`;
}

function liveNetMinutes(entry: TimeEntry, tick: number) {
  void tick;
  if (entry.status === 'COMPLETED') return entry.netMinutes;
  const gross = Math.floor((Date.now() - new Date(entry.startTime).getTime()) / 60000);
  const pauses = entry.breaks.reduce((sum, item) => sum + Math.max(0, Math.floor(((item.endTime ? new Date(item.endTime).getTime() : Date.now()) - new Date(item.startTime).getTime()) / 60000)), 0);
  return Math.max(0, gross - pauses);
}

export default function ProjectTimePage() {
  const params = useParams<{ id: string }>();
  const projectId = Array.isArray(params.id) ? params.id[0] : params.id;
  const queryClient = useQueryClient();
  const [tick, setTick] = useState(0);
  const [showManual, setShowManual] = useState(false);
  const [editing, setEditing] = useState<TimeEntry | null>(null);
  const [note, setNote] = useState('');
  const [type, setType] = useState<TimeEntryType>('WORK');
  const [error, setError] = useState('');

  useEffect(() => { const timer = window.setInterval(() => setTick((value) => value + 1), 1000); return () => window.clearInterval(timer); }, []);

  const projectQuery = useQuery({ queryKey: ['projects', projectId], queryFn: () => getProject(projectId), enabled: Boolean(projectId) });
  const entriesQuery = useQuery({ queryKey: ['time', projectId], queryFn: () => getProjectTimeEntries(projectId), enabled: Boolean(projectId) });
  const currentQuery = useQuery({ queryKey: ['time', 'current'], queryFn: getCurrentTimeEntry, refetchInterval: 30000 });

  async function refresh() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['time', projectId] }),
      queryClient.invalidateQueries({ queryKey: ['time', 'current'] }),
    ]);
  }

  const actionMutation = useMutation({ mutationFn: async (action: 'start' | 'pause' | 'resume' | 'stop') => {
    const current = currentQuery.data;
    if (action === 'start') return startTimeEntry(projectId, { type, note });
    if (!current) throw new Error('Keine laufende Zeiterfassung.');
    if (action === 'pause') return pauseTimeEntry(current.id);
    if (action === 'resume') return resumeTimeEntry(current.id);
    return stopTimeEntry(current.id);
  }, onSuccess: async () => { setError(''); await refresh(); }, onError: (reason: any) => setError(reason?.response?.data?.error ?? 'Aktion konnte nicht ausgeführt werden.') });

  const saveMutation = useMutation({ mutationFn: (payload: ManualTimePayload) => editing ? updateTimeEntry(editing.id, payload) : createManualTimeEntry(projectId, payload), onSuccess: async () => { setEditing(null); setShowManual(false); setError(''); await refresh(); }, onError: (reason: any) => setError(reason?.response?.data?.error ?? 'Zeiteintrag konnte nicht gespeichert werden.') });
  const deleteMutation = useMutation({ mutationFn: deleteTimeEntry, onSuccess: refresh, onError: (reason: any) => setError(reason?.response?.data?.error ?? 'Zeiteintrag konnte nicht gelöscht werden.') });

  const current = currentQuery.data;
  const currentBelongsHere = current?.projectId === projectId;
  const currentMinutes = current ? liveNetMinutes(current, tick) : 0;
  const todayMinutes = useMemo(() => entriesQuery.data?.filter((entry) => new Date(entry.startTime).toDateString() === new Date().toDateString()).reduce((sum, entry) => sum + (entry.id === current?.id ? currentMinutes : entry.netMinutes), 0) ?? 0, [entriesQuery.data, current, currentMinutes]);
  const totalMinutes = entriesQuery.data?.reduce((sum, entry) => sum + (entry.id === current?.id ? currentMinutes : entry.netMinutes), 0) ?? 0;

  return <div className="space-y-6">
    <div><Link href={`/projects/${projectId}`} className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-950"><ArrowLeft className="size-4" />Zurück zur Baustelle</Link><div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-medium text-blue-600">{projectQuery.data?.projectNumber}</p><h1 className="text-3xl font-semibold tracking-tight">Zeiterfassung</h1><p className="mt-1 text-sm text-slate-500">{projectQuery.data?.name ?? 'Baustelle wird geladen …'}</p></div><Button variant="outline" onClick={() => { setEditing(null); setShowManual(true); }}><Plus className="mr-2 size-4" />Manuell eintragen</Button></div></div>

    {error ? <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div> : null}

    <div className="grid gap-4 md:grid-cols-3"><Card><CardHeader className="pb-2"><CardTitle className="text-sm text-slate-500">Heute</CardTitle></CardHeader><CardContent><p className="text-2xl font-semibold">{duration(todayMinutes)}</p></CardContent></Card><Card><CardHeader className="pb-2"><CardTitle className="text-sm text-slate-500">Projekt gesamt</CardTitle></CardHeader><CardContent><p className="text-2xl font-semibold">{duration(totalMinutes)}</p></CardContent></Card><Card><CardHeader className="pb-2"><CardTitle className="text-sm text-slate-500">Einträge</CardTitle></CardHeader><CardContent><p className="text-2xl font-semibold">{entriesQuery.data?.length ?? 0}</p></CardContent></Card></div>

    <Card className={current ? 'border-blue-200 bg-blue-50/30' : ''}><CardHeader><CardTitle className="flex items-center gap-2"><Clock3 className="size-5" />Live-Stempeluhr</CardTitle></CardHeader><CardContent className="space-y-5">{current ? <><div><p className="text-sm text-slate-500">{current.project.projectNumber} · {current.project.name}</p><p className="mt-1 text-4xl font-semibold tabular-nums">{duration(currentMinutes)}</p><p className="mt-2 text-sm font-medium text-slate-600">{current.status === 'PAUSED' ? 'Pause läuft' : 'Arbeitszeit läuft'} · Start {dateTimeFormatter.format(new Date(current.startTime))}</p></div>{currentBelongsHere ? <div className="flex flex-wrap gap-2">{current.status === 'RUNNING' ? <Button onClick={() => actionMutation.mutate('pause')} disabled={actionMutation.isPending}><Pause className="mr-2 size-4" />Pause</Button> : <Button onClick={() => actionMutation.mutate('resume')} disabled={actionMutation.isPending}><Play className="mr-2 size-4" />Fortsetzen</Button>}<Button variant="outline" onClick={() => actionMutation.mutate('stop')} disabled={actionMutation.isPending}><Square className="mr-2 size-4" />Beenden</Button></div> : <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">Die laufende Zeiterfassung gehört zu einer anderen Baustelle. Beende sie dort, bevor du hier startest.</p>}</> : <><div className="grid gap-4 md:grid-cols-[220px_1fr]"><div><label className="mb-2 block text-sm font-medium">Stundenart</label><select className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm" value={type} onChange={(event) => setType(event.target.value as TimeEntryType)}>{Object.entries(typeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div><div><label className="mb-2 block text-sm font-medium">Tätigkeit / Notiz</label><input className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm" value={note} onChange={(event) => setNote(event.target.value)} placeholder="Was wird gearbeitet?" /></div></div><Button size="lg" onClick={() => actionMutation.mutate('start')} disabled={actionMutation.isPending}><Play className="mr-2 size-4" />Arbeitszeit starten</Button></>}</CardContent></Card>

    {showManual ? <Card><CardHeader><CardTitle>{editing ? 'Zeiteintrag bearbeiten' : 'Zeit manuell eintragen'}</CardTitle></CardHeader><CardContent><ManualTimeForm entry={editing} busy={saveMutation.isPending} onCancel={() => { setShowManual(false); setEditing(null); }} onSubmit={async (payload) => { await saveMutation.mutateAsync(payload); }} /></CardContent></Card> : null}

    <Card><CardHeader><CardTitle>Erfasste Zeiten</CardTitle></CardHeader><CardContent>{entriesQuery.isLoading ? <p className="text-sm text-slate-500">Zeiten werden geladen …</p> : entriesQuery.data?.length === 0 ? <div className="py-10 text-center"><Clock3 className="mx-auto mb-3 size-9 text-slate-400" /><p className="font-medium">Noch keine Zeiten erfasst</p><p className="mt-1 text-sm text-slate-500">Starte die Stempeluhr oder trage eine Zeit manuell ein.</p></div> : <div className="divide-y">{entriesQuery.data?.map((entry) => <div key={entry.id} className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-medium">{dateTimeFormatter.format(new Date(entry.startTime))}{entry.endTime ? ` – ${new Intl.DateTimeFormat('de-DE', { timeStyle: 'short' }).format(new Date(entry.endTime))}` : ''}</p><p className="mt-1 text-sm text-slate-500">{entry.user.firstName} {entry.user.lastName} · {typeLabels[entry.type]} · Pause {entry.breakMinutes} Min.{entry.note ? ` · ${entry.note}` : ''}</p></div><div className="flex items-center gap-2"><span className="min-w-24 text-right font-semibold tabular-nums">{duration(entry.id === current?.id ? currentMinutes : entry.netMinutes)}</span>{entry.status === 'COMPLETED' ? <Button size="icon-sm" variant="outline" aria-label="Bearbeiten" onClick={() => { setEditing(entry); setShowManual(true); }}><Pencil className="size-3.5" /></Button> : null}<Button size="icon-sm" variant="outline" aria-label="Löschen" disabled={entry.status !== 'COMPLETED'} onClick={() => { if (window.confirm('Zeiteintrag wirklich löschen?')) deleteMutation.mutate(entry.id); }}><Trash2 className="size-3.5" /></Button></div></div>)}</div>}</CardContent></Card>
  </div>;
}
