'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { ManualTimePayload, TimeEntry, TimeEntryType } from '@/types/time';

const typeOptions: Array<{ value: TimeEntryType; label: string }> = [
  { value: 'WORK', label: 'Arbeitszeit' },
  { value: 'TRAVEL', label: 'Fahrzeit' },
  { value: 'TRAINING', label: 'Schulung' },
  { value: 'OFFICE', label: 'Bürozeit' },
  { value: 'OTHER', label: 'Sonstiges' },
];

function localValue(value: Date) {
  const offset = value.getTimezoneOffset() * 60000;
  return new Date(value.getTime() - offset).toISOString().slice(0, 16);
}

export function ManualTimeForm({ entry, busy, onCancel, onSubmit }: {
  entry?: TimeEntry | null;
  busy: boolean;
  onCancel: () => void;
  onSubmit: (payload: ManualTimePayload) => Promise<void>;
}) {
  const now = new Date();
  const [startTime, setStartTime] = useState(localValue(new Date(now.getTime() - 60 * 60000)));
  const [endTime, setEndTime] = useState(localValue(now));
  const [breakMinutes, setBreakMinutes] = useState('0');
  const [type, setType] = useState<TimeEntryType>('WORK');
  const [note, setNote] = useState('');

  useEffect(() => {
    if (!entry) return;
    setStartTime(localValue(new Date(entry.startTime)));
    setEndTime(localValue(new Date(entry.endTime ?? entry.startTime)));
    setBreakMinutes(String(entry.breakMinutes));
    setType(entry.type);
    setNote(entry.note ?? '');
  }, [entry]);

  return (
    <form className="space-y-4" onSubmit={async (event) => {
      event.preventDefault();
      await onSubmit({
        startTime: new Date(startTime).toISOString(),
        endTime: new Date(endTime).toISOString(),
        breakMinutes: Number(breakMinutes),
        type,
        note,
      });
    }}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2"><Label htmlFor="startTime">Beginn</Label><Input id="startTime" type="datetime-local" value={startTime} onChange={(event) => setStartTime(event.target.value)} required /></div>
        <div className="space-y-2"><Label htmlFor="endTime">Ende</Label><Input id="endTime" type="datetime-local" value={endTime} onChange={(event) => setEndTime(event.target.value)} required /></div>
        <div className="space-y-2"><Label htmlFor="breakMinutes">Pause in Minuten</Label><Input id="breakMinutes" type="number" min="0" max="1440" value={breakMinutes} onChange={(event) => setBreakMinutes(event.target.value)} required /></div>
        <div className="space-y-2"><Label htmlFor="timeType">Stundenart</Label><select id="timeType" className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm" value={type} onChange={(event) => setType(event.target.value as TimeEntryType)}>{typeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></div>
      </div>
      <div className="space-y-2"><Label htmlFor="timeNote">Tätigkeit / Notiz</Label><textarea id="timeNote" className="min-h-24 w-full rounded-lg border border-slate-200 bg-white p-3 text-sm outline-none focus:border-blue-500" maxLength={1000} value={note} onChange={(event) => setNote(event.target.value)} placeholder="z. B. Unterverteilung montiert und Stromkreise geprüft" /></div>
      <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={onCancel}>Abbrechen</Button><Button type="submit" disabled={busy}>{busy ? 'Speichert …' : entry ? 'Änderungen speichern' : 'Zeit eintragen'}</Button></div>
    </form>
  );
}
