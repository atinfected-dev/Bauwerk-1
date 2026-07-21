# BauWerk Elektro v0.4

Diese Version verbindet die Oberfläche erstmals vollständig mit PostgreSQL.

## Neu
- echter Login über API und HttpOnly-Cookie
- Dashboard-Kennzahlen aus PostgreSQL
- Kunden laden, suchen und anlegen
- Baustellen laden und anlegen
- Rollenprüfung: Monteure dürfen lesen, aber nicht anlegen
- Mandantentrennung auf jeder Abfrage
- korrigierte Prisma-Enums
- korrigierte Express-5-Fallback-Route

## Installation unter Windows
```powershell
Copy-Item .env.example .env
docker compose up -d
npm install
npm run prisma:generate
npm run db:migrate -- --name v04
npm run db:seed
npm run dev
```
Dann http://localhost:3000 öffnen.

## Demo
admin@ertz-demo.de / demo1234
buero@ertz-demo.de / demo1234
monteur@ertz-demo.de / demo1234
