'use client';
import { useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Download, Eye, File, FileImage, FileSpreadsheet, FileText, LoaderCircle, Plus, Search, Trash2, UploadCloud, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { deleteDocument, documentContentUrl, getProjectDocuments, uploadDocumentVersion, uploadProjectDocuments } from '@/services/documents';
import type { DocumentCategory, ProjectDocument } from '@/types/document';

const categories:{value:DocumentCategory|'',label:string}[]=[
  {value:'',label:'Alle Kategorien'},{value:'OFFER',label:'Angebote'},{value:'ORDER',label:'Aufträge'},{value:'INVOICE',label:'Rechnungen'},
  {value:'DELIVERY_NOTE',label:'Lieferscheine'},{value:'TEST_REPORT',label:'Prüfprotokolle'},{value:'PLAN',label:'Pläne'},
  {value:'PHOTO',label:'Fotos'},{value:'OTHER',label:'Sonstiges'},
];
const labels=Object.fromEntries(categories.filter(x=>x.value).map(x=>[x.value,x.label]));
const accepted='.pdf,.jpg,.jpeg,.png,.docx,.xlsx';
function fileIcon(doc:ProjectDocument){ if(doc.mimeType.startsWith('image/')) return FileImage; if(doc.mimeType.includes('sheet')) return FileSpreadsheet; if(doc.mimeType==='application/pdf') return FileText; return File; }
function formatSize(bytes:number){ if(bytes<1024)return `${bytes} B`; if(bytes<1024*1024)return `${(bytes/1024).toFixed(1)} KB`; return `${(bytes/1024/1024).toFixed(1)} MB`; }
function errorMessage(error:unknown){ const e=error as {response?:{data?:{error?:string}}}; return e.response?.data?.error ?? 'Aktion fehlgeschlagen.'; }

export default function DocumentsPage(){
  const params=useParams<{id:string}>(); const projectId=Array.isArray(params.id)?params.id[0]:params.id;
  const qc=useQueryClient(); const fileInput=useRef<HTMLInputElement>(null);
  const [search,setSearch]=useState(''); const [category,setCategory]=useState<DocumentCategory|''>('');
  const [uploadOpen,setUploadOpen]=useState(false); const [files,setFiles]=useState<File[]>([]); const [uploadCategory,setUploadCategory]=useState<DocumentCategory>('OTHER'); const [description,setDescription]=useState(''); const [dragging,setDragging]=useState(false); const [message,setMessage]=useState('');
  const query=useQuery({queryKey:['documents',projectId,search,category],queryFn:()=>getProjectDocuments(projectId,search,category),enabled:Boolean(projectId)});
  const upload=useMutation({mutationFn:()=>uploadProjectDocuments(projectId,files,uploadCategory,description),onSuccess:()=>{qc.invalidateQueries({queryKey:['documents',projectId]});setUploadOpen(false);setFiles([]);setDescription('');setMessage('Dokumente wurden hochgeladen.');},onError:e=>setMessage(errorMessage(e))});
  const remove=useMutation({mutationFn:deleteDocument,onSuccess:()=>qc.invalidateQueries({queryKey:['documents',projectId]}),onError:e=>setMessage(errorMessage(e))});
  const version=useMutation({mutationFn:({id,file}:{id:string,file:File})=>uploadDocumentVersion(id,file),onSuccess:()=>{qc.invalidateQueries({queryKey:['documents',projectId]});setMessage('Neue Version wurde gespeichert.');},onError:e=>setMessage(errorMessage(e))});
  const docs=query.data??[];
  const stats=useMemo(()=>({count:docs.length,size:docs.reduce((sum,d)=>sum+d.size,0),today:docs.filter(d=>new Date(d.createdAt).toDateString()===new Date().toDateString()).length}),[docs]);
  function addFiles(list:FileList|null){ if(!list)return; const valid=Array.from(list).filter(f=>f.size<=20*1024*1024); setFiles(old=>[...old,...valid].slice(0,10)); }
  return <div>
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div><Link href={`/projects/${projectId}`} className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-950"><ArrowLeft className="size-4"/>Zurück zur Baustelle</Link><h1 className="text-3xl font-semibold tracking-tight">Dokumente</h1><p className="mt-1 text-sm text-slate-500">Pläne, Protokolle, Lieferscheine und weitere Projektdateien.</p></div>
      <Button onClick={()=>{setMessage('');setUploadOpen(true)}}><Plus className="size-4"/>Dokument hochladen</Button>
    </div>
    {message?<div className="mb-4 rounded-xl border bg-white p-3 text-sm text-slate-700">{message}</div>:null}
    <div className="mb-6 grid gap-4 sm:grid-cols-3">
      <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-slate-500">Dokumente</CardTitle></CardHeader><CardContent className="text-2xl font-semibold">{stats.count}</CardContent></Card>
      <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-slate-500">Heute hochgeladen</CardTitle></CardHeader><CardContent className="text-2xl font-semibold">{stats.today}</CardContent></Card>
      <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-slate-500">Speicher</CardTitle></CardHeader><CardContent className="text-2xl font-semibold">{formatSize(stats.size)}</CardContent></Card>
    </div>
    <Card>
      <CardHeader><div className="flex flex-col gap-3 md:flex-row"><div className="relative flex-1"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"/><Input className="pl-9" placeholder="Dokumente durchsuchen …" value={search} onChange={e=>setSearch(e.target.value)}/></div><select className="h-9 rounded-md border bg-white px-3 text-sm" value={category} onChange={e=>setCategory(e.target.value as DocumentCategory|'')}>{categories.map(c=><option key={c.value} value={c.value}>{c.label}</option>)}</select></div></CardHeader>
      <CardContent>
        {query.isLoading?<div className="flex items-center gap-2 py-10 text-sm text-slate-500"><LoaderCircle className="size-5 animate-spin"/>Dokumente werden geladen …</div>:null}
        {query.isError?<div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">Dokumente konnten nicht geladen werden.</div>:null}
        {!query.isLoading&&!docs.length?<div className="rounded-xl border border-dashed p-10 text-center"><UploadCloud className="mx-auto mb-3 size-9 text-slate-400"/><p className="font-medium">Noch keine Dokumente</p><p className="mt-1 text-sm text-slate-500">Lade die ersten Projektunterlagen hoch.</p></div>:null}
        <div className="grid gap-3 lg:grid-cols-2">{docs.map(doc=>{const Icon=fileIcon(doc);return <div key={doc.id} className="flex gap-4 rounded-xl border p-4"><div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700"><Icon className="size-5"/></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-start justify-between gap-2"><div className="min-w-0"><p className="truncate font-medium">{doc.name}</p><p className="mt-0.5 text-xs text-slate-500">{labels[doc.category]} · {formatSize(doc.size)} · Version {doc.version}</p></div><span className="text-xs text-slate-400">{new Intl.DateTimeFormat('de-DE').format(new Date(doc.createdAt))}</span></div>{doc.description?<p className="mt-2 line-clamp-2 text-sm text-slate-600">{doc.description}</p>:null}<p className="mt-2 text-xs text-slate-500">Hochgeladen von {doc.uploadedBy.firstName} {doc.uploadedBy.lastName}</p><div className="mt-3 flex flex-wrap gap-2"><a href={documentContentUrl(doc.previewUrl)} target="_blank" rel="noreferrer"><Button size="sm" variant="outline"><Eye className="size-3.5"/>Vorschau</Button></a><a href={documentContentUrl(doc.downloadUrl)}><Button size="sm" variant="outline"><Download className="size-3.5"/>Download</Button></a><label className="inline-flex cursor-pointer items-center gap-2 rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-slate-50"><UploadCloud className="size-3.5"/>Neue Version<input type="file" className="hidden" accept={accepted} onChange={e=>{const f=e.target.files?.[0];if(f)version.mutate({id:doc.id,file:f});e.target.value='';}}/></label><Button size="sm" variant="outline" disabled={remove.isPending} onClick={()=>{if(confirm(`„${doc.name}“ löschen?`))remove.mutate(doc.id)}}><Trash2 className="size-3.5"/></Button></div></div></div>})}</div>
      </CardContent>
    </Card>
    {uploadOpen?<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"><div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-xl"><div className="mb-5 flex items-center justify-between"><div><h2 className="text-xl font-semibold">Dokumente hochladen</h2><p className="mt-1 text-sm text-slate-500">Bis zu 10 Dateien, jeweils maximal 20 MB.</p></div><button onClick={()=>setUploadOpen(false)}><X className="size-5"/></button></div><div onDragOver={e=>{e.preventDefault();setDragging(true)}} onDragLeave={()=>setDragging(false)} onDrop={e=>{e.preventDefault();setDragging(false);addFiles(e.dataTransfer.files)}} onClick={()=>fileInput.current?.click()} className={`cursor-pointer rounded-xl border-2 border-dashed p-8 text-center ${dragging?'border-blue-500 bg-blue-50':'border-slate-300'}`}><UploadCloud className="mx-auto mb-3 size-9 text-slate-400"/><p className="font-medium">Dateien hier ablegen oder auswählen</p><p className="mt-1 text-xs text-slate-500">PDF, JPG, PNG, DOCX oder XLSX</p><input ref={fileInput} type="file" multiple accept={accepted} className="hidden" onChange={e=>addFiles(e.target.files)}/></div>{files.length?<div className="mt-3 space-y-2">{files.map((f,i)=><div key={`${f.name}-${i}`} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm"><span className="truncate">{f.name} <span className="text-slate-400">({formatSize(f.size)})</span></span><button onClick={()=>setFiles(fs=>fs.filter((_,x)=>x!==i))}><X className="size-4"/></button></div>)}</div>:null}<div className="mt-4 grid gap-4 sm:grid-cols-2"><label className="text-sm font-medium">Kategorie<select value={uploadCategory} onChange={e=>setUploadCategory(e.target.value as DocumentCategory)} className="mt-1 block h-9 w-full rounded-md border bg-white px-3 text-sm">{categories.filter(c=>c.value).map(c=><option key={c.value} value={c.value}>{c.label}</option>)}</select></label><label className="text-sm font-medium">Beschreibung<Input className="mt-1" value={description} onChange={e=>setDescription(e.target.value)} placeholder="Optional"/></label></div><div className="mt-6 flex justify-end gap-2"><Button variant="outline" onClick={()=>setUploadOpen(false)}>Abbrechen</Button><Button disabled={!files.length||upload.isPending} onClick={()=>upload.mutate()}>{upload.isPending?<LoaderCircle className="size-4 animate-spin"/>:<UploadCloud className="size-4"/>}{upload.isPending?'Wird hochgeladen …':'Hochladen'}</Button></div></div></div>:null}
  </div>;
}
