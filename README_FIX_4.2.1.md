# BauWerk Sprint 4.2.1 – Aufgaben speichern

Fehlerbehebung: Der Speichern-Button im Aufgabenformular war kein expliziter Submit-Button. Bei der verwendeten Base-UI-Button-Komponente wurde deshalb das `onSubmit` des Formulars nicht ausgelöst.

Geändert:
- `apps/web/app/(dashboard)/projects/[id]/tasks/page.tsx`
- `type="submit"` am Speichern-Button ergänzt
- Ladeanzeige während des Speicherns ergänzt

Nach Einspielen des Patches das Frontend neu starten:

```powershell
cd apps\web
npm run dev
```
