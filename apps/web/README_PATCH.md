# BauWerk v0.2 – Auth-Patch

## Installation

1. Den Inhalt dieses ZIP-Archivs in `C:\Bauwerk\apps\web` kopieren.
2. Vorhandene Dateien bei Nachfrage ersetzen.
3. In `C:\Bauwerk\apps\web` eine Datei `.env.local` anlegen:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

4. Falls die UI-Komponenten noch fehlen:

```powershell
npx shadcn@latest add card input label
```

5. Frontend starten:

```powershell
npm run dev
```

6. Backend separat starten und anschließend öffnen:

```text
http://localhost:3000/login
```

## Erwartetes Verhalten

- `/dashboard` leitet ohne Sitzung nach `/login`.
- Login setzt das HttpOnly-Cookie über das Express-Backend.
- Nach erfolgreichem Login öffnet sich `/dashboard`.
- Die vier Dashboard-Karten laden echte Werte aus `/api/dashboard`.
- Das Logout-Symbol oben rechts meldet den Benutzer ab.

## Seed-Zugang

Die Login-Seite ist mit folgenden Beispielwerten vorbelegt:

- E-Mail: `admin@bauwerk.local`
- Passwort: `Admin123!`

Passe die Werte an, falls dein Seed andere Zugangsdaten verwendet.
