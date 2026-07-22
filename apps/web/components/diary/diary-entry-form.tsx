'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { DiaryEntry, DiaryEntryPayload, WeatherCondition } from '@/types/diary';

interface Props {
  entry?: DiaryEntry | null;
  busy?: boolean;
  onCancel: () => void;
  onSubmit: (payload: DiaryEntryPayload) => Promise<void>;
}

const weatherOptions: Array<{ value: WeatherCondition; label: string }> = [
  { value: 'SUNNY', label: 'Sonnig' },
  { value: 'CLOUDY', label: 'Bewölkt' },
  { value: 'RAIN', label: 'Regen' },
  { value: 'SNOW', label: 'Schnee' },
  { value: 'STORM', label: 'Sturm' },
  { value: 'MIXED', label: 'Wechselhaft' },
  { value: 'UNKNOWN', label: 'Keine Angabe' },
];

function toDateInput(value?: string): string {
  return value ? value.slice(0, 10) : new Date().toISOString().slice(0, 10);
}

export function DiaryEntryForm({ entry, busy, onCancel, onSubmit }: Props) {
  const [form, setForm] = useState({
    entryDate: toDateInput(entry?.entryDate),
    title: entry?.title ?? '',
    workDone: entry?.workDone ?? '',
    incidents: entry?.incidents ?? '',
    staffCount: String(entry?.staffCount ?? 1),
    hoursWorked: entry?.hoursWorked == null ? '' : String(entry.hoursWorked),
    weather: entry?.weather ?? ('UNKNOWN' as WeatherCondition),
    temperature: entry?.temperature == null ? '' : String(entry.temperature),
  });

  useEffect(() => {
    setForm({
      entryDate: toDateInput(entry?.entryDate),
      title: entry?.title ?? '',
      workDone: entry?.workDone ?? '',
      incidents: entry?.incidents ?? '',
      staffCount: String(entry?.staffCount ?? 1),
      hoursWorked: entry?.hoursWorked == null ? '' : String(entry.hoursWorked),
      weather: entry?.weather ?? 'UNKNOWN',
      temperature: entry?.temperature == null ? '' : String(entry.temperature),
    });
  }, [entry]);

  return (
    <form
      className="space-y-4"
      onSubmit={async (event) => {
        event.preventDefault();
        await onSubmit({
          entryDate: form.entryDate,
          title: form.title.trim(),
          workDone: form.workDone.trim(),
          incidents: form.incidents.trim() || null,
          staffCount: Number(form.staffCount),
          hoursWorked: form.hoursWorked ? Number(form.hoursWorked) : null,
          weather: form.weather,
          temperature: form.temperature ? Number(form.temperature) : null,
        });
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2"><Label>Datum</Label><Input type="date" required value={form.entryDate} onChange={(e) => setForm({ ...form, entryDate: e.target.value })} /></div>
        <div className="space-y-2"><Label>Titel</Label><Input required minLength={2} placeholder="z. B. Unterverteilung EG montiert" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
      </div>
      <div className="space-y-2"><Label>Ausgeführte Arbeiten</Label><textarea className="min-h-32 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300" required value={form.workDone} onChange={(e) => setForm({ ...form, workDone: e.target.value })} /></div>
      <div className="space-y-2"><Label>Besondere Vorkommnisse / Behinderungen</Label><textarea className="min-h-24 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300" value={form.incidents} onChange={(e) => setForm({ ...form, incidents: e.target.value })} /></div>
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="space-y-2"><Label>Mitarbeiter</Label><Input type="number" min={1} required value={form.staffCount} onChange={(e) => setForm({ ...form, staffCount: e.target.value })} /></div>
        <div className="space-y-2"><Label>Arbeitsstunden</Label><Input type="number" min={0} max={24} step="0.25" value={form.hoursWorked} onChange={(e) => setForm({ ...form, hoursWorked: e.target.value })} /></div>
        <div className="space-y-2"><Label>Wetter</Label><select className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm" value={form.weather} onChange={(e) => setForm({ ...form, weather: e.target.value as WeatherCondition })}>{weatherOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></div>
        <div className="space-y-2"><Label>Temperatur °C</Label><Input type="number" step="0.5" value={form.temperature} onChange={(e) => setForm({ ...form, temperature: e.target.value })} /></div>
      </div>
      <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={onCancel}>Abbrechen</Button><Button disabled={busy} type="submit">{busy ? 'Speichert …' : entry ? 'Änderungen speichern' : 'Eintrag speichern'}</Button></div>
    </form>
  );
}
