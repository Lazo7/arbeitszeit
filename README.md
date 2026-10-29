# Arbeitszeit-App – Stand & Regeln

Repo: https://github.com/Lazo7/arbeitszeit (GitHub Pages, PWA). Dateien: index.html, sw.js, manifest.webmanifest, icon-180/192/512.png. Versionen werden als GitHub-Release geführt (Tag z. B. `v2.1`, `v2.5`).

## Datenhaltung (Bestehendes nicht ändern, Neues nur ergänzen!)
- localStorage-Schlüssel `azb.local` = { months: { "YYYY-MM": { "YYYY-MM-DD": { b:[[start,ende(,modus)]], art, w, n, g } } }, cfg }
- `azb.wish` = Wunsch-Plus. Sicherheitskopien vor Updates (je einmalig): `azb.pre-v2` (v1-Stand), `azb.pre-v2.1` (v2-Stand), `azb.pre-v2.5` (v2.1-Stand). Der Button „Stand vor dem Update wiederherstellen“ nimmt die neueste Kopie.
- Seit v2.1: `azb.showPlan` = Stellung des Schalters „Geplante Tage zeigen“ (true/false). Reine Anzeige.
- Seit v2.5:
  - Block-Modus als drittes Element: `["07:30","12:00","b"]` (b = Büro, h = Homeoffice). Fehlt es, gilt der Tages-Schalter (w > 0 → Büro). Wird nur an gemischten Tagen gespeichert.
  - Tagesfeld `g` = Datum der Genehmigung (YYYY-MM-DD) für geplante TAZ/Urlaub. Entfällt, wenn die Art des Tages geändert wird.
  - `azb.ideas` = Text der Ideen-Notiz (auch als Feld `ideas` in der JSON-Sicherung; ältere Sicherungen ohne `ideas` lassen die Notiz unverändert).
  - `azb.lastBackup` = Zeitpunkt der letzten JSON-Sicherung (für die Erinnerung nach 30 Tagen).
- Neue Felder dürfen nur ergänzt werden. Alte Einträge ohne die neuen Felder bleiben ohne Umwandlung gültig.
- Repo-Name/Pfad nicht ändern, sonst sind die Daten auf dem Handy nicht mehr sichtbar (anderer Origin/Pfad).

## Fachregeln
- Sollzeit 7:36/Tag, max. 10 h, Pausen ab 15 min zählen (ArbZG 30/45 min).
- TAZ: max. 6 pro Kalenderjahr (cfg.tazMax). „TAZ möglich“ = min(Saldo/Soll, Restkontingent). Danach nur Gleitzeit.
- Wegezeit („Im Büro“): fester Wert (cfg.wege, 10 min) pro Tag für Weg im Gebäude + Laptop-Aufbau am Shared Desk – NICHT externe Termine. Wird beim Einschalten pro Tag in `w` gespeichert. Mixed Mode ändert die Berechnung nicht.
- Feiertage Hessen automatisch.
- Verlauf: „gebucht“ = bis einschließlich heute, „geplant“ = nach heute. Monatskopf und CSV-Spalte „Saldo“ rechnen nur mit gebuchten Tagen.

## Versionen
- v1 (Sept 2026): Grundversion, Teal-Farbschema.
- v2 (19.10.2026): TAZ-Kontingent 6/Jahr, Wegezeit = Büro, Farbkonzept Sparkassenrot (#E60000), rote Icons, Cache arbeitszeit-v2. Upgrade getestet: Daten und Saldo identisch.
- v2.1 (29.10.2026, Minor Release, GitHub-Release v2.1): Cache arbeitszeit-v2.1. Feste Datumsnavigation `‹ · Datum · Kalender · Heute · ›`; Verlauf-Schalter „Geplante Tage zeigen“; Fehlerbehebungen (geplante Tage im Monatskopf, Gleitzeitkonto-Breite).
- v2.5 (29.10.2026, Cache arbeitszeit-v2.5). Upgrade von v2.1 getestet: gespeicherte Daten byte-identisch, Saldo/TAZ/Monatsköpfe/Verlaufszeilen identisch.
  1. Zeitraum eintragen: Im Verlauf „+ Zeitraum eintragen (Urlaub / TAZ)“, von–bis; Wochenenden und Feiertage werden übersprungen, Tage mit Zeiten bleiben unverändert, Vorschau mit TAZ-Kontingent-Warnung. Schaltet „Geplante Tage zeigen“ ein, wenn künftige Tage eingetragen wurden.
  2. CSV-Export: Spalten Status (gebucht/geplant), Saldo (nur gebucht), Saldo voraussichtlich (geplant), Genehmigt. An gemischten Tagen Ort je Block (Büro/HO).
  3. Sicherungs-Erinnerung: roter Punkt am Tab „Einstellungen“ und Hinweis im Sicherungsbereich, wenn die letzte JSON-Sicherung > 30 Tage her ist (oder mit v2.5 noch keine gespeichert wurde). Anzeige „Letzte Sicherung: …“.
  4. Aufräumen: Reste der nie aktiven Cloud-Speicherung („Gespeichert in deinem Claude-Konto“, Firestore-Code) entfernt; Speichern nur noch lokal, mit Hinweis, falls das Speichern fehlschlägt.
  5. Ideen-Notiz: Link rechts neben dem Versionshinweis, öffnet Textfeld; Als .txt, Kopieren, Liste leeren (mit Rückfrage); Zähler der Zeilen.
  6. Genehmigung: Chip „geplant“ bei TAZ/Urlaub antippen → grünes „✓ genehmigt“ (eigene Tippfläche, Zeile öffnet weiter den Tag); Zurücknehmen mit Rückfrage. Tag-Seite zeigt „Genehmigung Führungskraft: noch offen / genehmigt“.
  7. Mixed Mode: Blocknummer im Symbol (Haus = Homeoffice, Gebäude = Büro), Antippen wechselt, gekoppelt an „Im Büro“ (an → alle Büro, aus → alle HO; erster Büro-Block schaltet ein, letzter schaltet aus – auch beim Löschen eines Blocks an gemischten Tagen).

## Sammlung für die nächste Version (noch nicht umsetzen – Lazo gibt den Startschuss)
- noch leer
