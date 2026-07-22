# Sprint 4.3 – Dokumentenmanagement

## Enthalten
- Projektbezogene Dokumentenablage mit Drag & Drop und Mehrfachupload
- Kategorien, Suche, Dateigröße und Upload-Metadaten
- PDF-/Bild-Vorschau und geschützter Download
- Versionierung: neue Fassung hochladen, alte Fassungen bleiben gespeichert
- Rollenbasierte Löschung für Admin, Büro und Projektleitung
- Unterstützte Formate: PDF, JPG, PNG, DOCX, XLSX (maximal 20 MB je Datei)

## Installation
```powershell
npm install
npx prisma db push
npx prisma generate
npm run dev
```
Frontend separat starten:
```powershell
cd apps\web
npm install
npm run dev
```

Die Dateien werden lokal unter `uploads/documents` gespeichert. Für den späteren Produktivbetrieb ist ein S3-kompatibler Objektspeicher vorgesehen.
