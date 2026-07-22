# BauWerk Sprint 4.1 – Zeiterfassung

## Enthalten

- Live-Stempeluhr pro Mitarbeiter
- Start, Pause, Fortsetzen und Beenden
- Schutz vor mehreren gleichzeitig laufenden Zeiterfassungen
- Manuelle Zeiteinträge und Korrekturen
- Mehrere Pausen je Eintrag
- Nettozeitberechnung im Backend
- Projektbezogene Liste mit Tages- und Gesamtsumme
- Mandantentrennung und rollenbasierte Sichtbarkeit

## Installation

Im Projektordner:

```powershell
npm install
npx prisma db push
npx prisma generate
npm run dev
```

In einem zweiten Terminal:

```powershell
cd apps\web
npm install
npm run dev
```

Danach eine Baustelle öffnen und im Workspace auf **Zeiten** klicken.

## API

- `GET /api/time/current`
- `GET /api/time/projects/:projectId`
- `POST /api/time/projects/:projectId/start`
- `POST /api/time/:id/pause`
- `POST /api/time/:id/resume`
- `POST /api/time/:id/stop`
- `POST /api/time/projects/:projectId/manual`
- `PUT /api/time/:id`
- `DELETE /api/time/:id`

## Hinweis zur Datenbank

Da bei diesem Projekt bereits Schema-Drift aufgetreten ist, wird für den lokalen Entwicklungsstand zunächst `prisma db push` empfohlen. Für ein späteres Produktionssystem sollte eine saubere Baseline-Migration angelegt werden.
