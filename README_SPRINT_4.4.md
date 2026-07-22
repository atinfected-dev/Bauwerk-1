# Sprint 4.4 – Materialverwaltung

Enthalten:
- Materialstamm mit Artikelnummer, Hersteller, Einheit, EK/VK, Bestand und Mindestbestand
- Verbrauchs- und Rückgabebuchungen pro Baustelle
- automatische Lagerbestandsführung
- Schutz vor negativem Bestand
- Projektwert der Materialbuchungen
- Warnung bei erreichtem Mindestbestand
- Stornierung von Buchungen mit automatischer Bestandskorrektur

## Installation

```powershell
cd C:\Bauwerk
npx prisma db push
npx prisma generate
npm run dev
```

Frontend:

```powershell
cd C:\Bauwerk\apps\web
npm run dev
```

Für diesen Sprint wurden keine neuen npm-Pakete hinzugefügt. Ein erneutes `npm install` ist normalerweise nicht nötig.
