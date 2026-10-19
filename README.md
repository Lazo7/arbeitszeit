# Arbeitszeit-App – Stand & Regeln

Repo: https://github.com/Lazo7/arbeitszeit (GitHub Pages, PWA). Dateien: index.html, sw.js, manifest.webmanifest, icon-180/192/512.png.

## Datenhaltung (nicht ändern!)
- localStorage-Schlüssel `azb.local` = { months: { "YYYY-MM": { "YYYY-MM-DD": { b:[[start,ende]], art, w, n } } }, cfg }
- `azb.wish` = Wunsch-Plus. Seit v2: `azb.pre-v2` = einmalige Kopie des v1-Stands.
- Repo-Name/Pfad nicht ändern, sonst sind die Daten auf dem Handy nicht mehr sichtbar (anderer Origin/Pfad).

## Fachregeln
- Sollzeit 7:36/Tag, max. 10 h, Pausen ab 15 min zählen (ArbZG 30/45 min).
- TAZ: max. 6 pro Kalenderjahr (cfg.tazMax). „TAZ möglich“ = min(Saldo/Soll, Restkontingent). Danach nur Gleitzeit.
- Wegezeit („Im Büro“): fester Wert (cfg.wege, 10 min) für Weg im Gebäude + Laptop-Aufbau am Shared Desk – NICHT externe Termine. Wird beim Einschalten pro Tag in `w` gespeichert.
- Feiertage Hessen automatisch.

## Versionen
- v1 (Sept 2026): Grundversion, Teal-Farbschema.
- v2 (19.10.2026): TAZ-Kontingent 6/Jahr, Wegezeit = Büro, Farbkonzept Sparkassenrot (#E60000), rote Icons, Cache arbeitszeit-v2. Upgrade getestet: Daten und Saldo identisch.
