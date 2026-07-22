# BauWerk Sprint 3.2 – Bautagebuch

## Enthalten
- Prisma-Modell `DiaryEntry`
- Wetterzustände
- Mandanten- und Projektzuordnung
- Autor des Eintrags
- REST-API für Auflisten, Anlegen, Bearbeiten und Löschen
- Bautagebuchseite pro Baustelle
- Arbeitsbeschreibung, Vorkommnisse, Mitarbeiterzahl, Stunden, Wetter und Temperatur
- Bearbeiten und Löschen
- Verlinkung aus dem Baustellen-Workspace

## Installation
1. Inhalt dieses Ordners nach `C:\Bauwerk` kopieren und vorhandene Dateien ersetzen.
2. Datenbankmigration ausführen:

```powershell
cd C:\Bauwerk
npx prisma migrate dev --name add_diary_entries
npx prisma generate
```

3. Backend starten:

```powershell
npm run dev
```

4. Frontend starten:

```powershell
cd C:\Bauwerk\apps\web
npm run dev
```

5. Eine Baustelle öffnen und im Workspace `Bautagebuch` anklicken.

## API
- `GET /api/diary/projects/:projectId`
- `POST /api/diary/projects/:projectId`
- `PUT /api/diary/:id`
- `DELETE /api/diary/:id`

## Git Commit
```powershell
git add .
git commit -m "feat(diary): add project construction diary"
```
