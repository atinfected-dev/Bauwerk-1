# BauWerk Sprint 4.2 – Aufgaben & Kanban

## Enthalten
- Projektbezogenes Kanban-Board mit sechs Statusspalten
- Drag & Drop zwischen Offen, Geplant, In Arbeit, Warten, Erledigt und Abgenommen
- Aufgaben mit Priorität, Verantwortlichem, Fälligkeit und geplanten Stunden
- Checklisten und Kommentare
- Detailansicht als Seitenpanel
- Projektfortschritt und Überfällig-Auswertung
- Direkter Start der Zeiterfassung aus einer Aufgabe
- Erfasste Ist-Stunden je Aufgabe

## Installation
```powershell
npm install
npx prisma db push
npx prisma generate
npm run dev
```

Frontend:
```powershell
cd apps\web
npm install
npm run dev
```

Danach eine Baustelle öffnen und **Aufgaben** auswählen.

## Neue API-Endpunkte
- `GET /api/tasks/users`
- `GET /api/tasks/projects/:projectId`
- `POST /api/tasks/projects/:projectId`
- `PUT /api/tasks/:id`
- `PATCH /api/tasks/:id/status`
- `POST /api/tasks/:id/comments`
- `DELETE /api/tasks/:id`

## Datenbank
Neu: `Task`, `TaskChecklistItem`, `TaskComment`, `TaskStatus`, `TaskPriority` sowie die optionale `taskId` an `TimeEntry`.
