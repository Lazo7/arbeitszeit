# Arbeitszeit-App – Stand & Regeln

Repo: https://github.com/Lazo7/arbeitszeit (GitHub Pages, PWA). Dateien: index.html, sw.js, manifest.webmanifest, icon-180/192/512.png.

## Datenhaltung (nicht ändern!)
- localStorage-Schlüssel `azb.local` = { months: { "YYYY-MM": { "YYYY-MM-DD": { b:[[start,ende]], art, w, n } } }, cfg }
- `azb.wish` = Wunsch-Plus. Seit v2: `azb.pre-v2` = einmalige Kopie des v1-Stands. Seit v2.1: `azb.pre-v2.1` = einmalige Kopie des v2-Stands (der Button „Stand vor dem Update wiederherstellen“ nimmt die neueste Kopie).
- Seit v2.1: `azb.showPlan` = Stellung des Schalters „Geplante Tage zeigen“ (true/false). Reine Anzeige, keine Zeitdaten.
- Repo-Name/Pfad nicht ändern, sonst sind die Daten auf dem Handy nicht mehr sichtbar (anderer Origin/Pfad).

## Fachregeln
- Sollzeit 7:36/Tag, max. 10 h, Pausen ab 15 min zählen (ArbZG 30/45 min).
- TAZ: max. 6 pro Kalenderjahr (cfg.tazMax). „TAZ möglich“ = min(Saldo/Soll, Restkontingent). Danach nur Gleitzeit.
- Wegezeit („Im Büro“): fester Wert (cfg.wege, 10 min) für Weg im Gebäude + Laptop-Aufbau am Shared Desk – NICHT externe Termine. Wird beim Einschalten pro Tag in `w` gespeichert.
- Feiertage Hessen automatisch.
- Verlauf: „gebucht“ = bis einschließlich heute, „geplant“ = nach heute. Der Monatskopf (Ist/Soll/Diff/Saldo) rechnet nur mit gebuchten Tagen.

## Versionen
- v1 (Sept 2026): Grundversion, Teal-Farbschema.
- v2 (19.10.2026): TAZ-Kontingent 6/Jahr, Wegezeit = Büro, Farbkonzept Sparkassenrot (#E60000), rote Icons, Cache arbeitszeit-v2. Upgrade getestet: Daten und Saldo identisch.
- v2.1 (29.10.2026, Minor Release): Cache arbeitszeit-v2.1. Upgrade getestet: Daten und Saldo identisch.
  - Tag-Seite: feste Navigation `‹ · Datum · Kalender · Heute · ›`. „Heute“ immer sichtbar, auf dem heutigen Tag ausgegraut. Kalender-Button öffnet die Datumsauswahl und springt zum gewählten Tag.
  - Verlauf: Schalter „Geplante Tage zeigen“ (Standard aus). Geplante Tage mit gestricheltem roten Rand und Chip „geplant“, Saldo als „voraussichtlich“; im Monat getrennt in „Geplant“ und „Gebucht“.
  - Fehlerbehebung: Geplante Tage (z. B. künftige TAZ) zählten in v2 schon in Diff und Saldo des Monatskopfs mit.
  - Fehlerbehebung: Das Gleitzeitkonto-Raster machte die Tag-Seite bei großen Zahlen breiter als den Bildschirm (rechter Rand zu schmal).

## Sammlung für v3 (noch nicht umsetzen – Lazo gibt den Startschuss)
- noch leer (Punkte 1 und 2 der bisherigen Sammlung sind in v2.1 umgesetzt)
