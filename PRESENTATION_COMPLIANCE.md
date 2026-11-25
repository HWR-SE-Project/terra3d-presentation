# PRESENTATION_COMPLIANCE — Rückverfolgbarkeit Phase 5

Stand: 2026-11-25. Dieses Dokument ordnet jede verpflichtende Vorgabe und jede
inhaltliche Behauptung der 21 Folien (verteilt auf vier begehbare Stationen:
Konzept, Gameplay, Engineering, Qualität) einer Quelle zu. Es ist **getrennt
von den Folieninhalten** zu lesen — keine der hier gelisteten TODOs oder
Unsicherheiten erscheint auf den sichtbaren Folien selbst, nur in
Sprechernotizen (`notes` in `slides.js`) und hier.

Dieses Dokument baut direkt auf einer bereits existierenden, separat
geprüften Quelle auf (siehe §0) und wiederholt deren Prüfarbeit nicht
unnötig, verifiziert aber die wichtigsten Fakten erneut gegenstandsbezogen
(Stack-Versionen, Commit-Historie, Screenshot-Herkunft, exakter Wortlaut der
Prüfungsvorgabe).

## 0. Quellenlage

| Quelle | Pfad | Status |
|---|---|---|
| Bereits auditierte React-Referenzpräsentation (21 Folien, identischer Foliensatz) | `/Users/maxim/WebstormProjects/TerraGuessr-presentation` (`src/config/presentation.config.ts`, `CONTENT_AUDIT.md`) | Vollständig gelesen. Diese Phase portiert ihren Inhalt in die 3D-Umgebung, statt ihn neu zu recherchieren — siehe Begründung unten. |
| Prüfungsvorgabe („Vorgabe Prüfungsleistungen SWE Kurs B 2026 V1.2") | — | **Weiterhin nicht im Dateisystem auffindbar** (erneut geprüft: `~/Downloads`, `~/Documents`, Spotlight-Begriffe „Prüfung"/„SWE"/„Vorgabe" — kein Treffer). Einzige Quelle bleibt die sekundäre Zitierung in `/Users/maxim/Downloads/TerraGuessr_React_Presentation_Prompt.md:67-79` (datiert, mit Seitenangabe „S. 2–3"). Dort erneut im Volltext gelesen und mit `CONTENT_AUDIT.md` §1 abgeglichen — deckungsgleich. **TODO — Verifizierung erforderlich:** Original vor der Abgabe besorgen und Wortlaut/Seitenzahlen direkt verifizieren. |
| Anforderungsanalyse (Spezifikation, 20 nummerierte Anforderungen) | `/Users/maxim/Documents/Kopie von Software Engineering_ Anforderungsanalyse (3).pdf` | Nicht erneut Seite für Seite gelesen in dieser Phase; übernommen aus der bereits vollständig geprüften Quelle (s. o.), deren Nummerierung 1:1 mit `REQUIREMENTS_AUDIT.md`s R-Präfixen übereinstimmt. |
| Anforderungsaudit (aktuellster Stand) | `/Users/maxim/WebstormProjects/terraguessr/REQUIREMENTS_AUDIT.md` | Stichprobenartig gegengeprüft: HEAD-Commit `4bee821` (2026-11-21, „feat: add tutorial flow, avatar customize menu, and home scene polish") erneut per `git log` bestätigt — identisch mit dem im Audit zitierten Stand. |
| Quellcode & Stack-Versionen | `terraguessr/frontend/package.json`, `terraguessr/backend/package.json`, `terraguessr/docker-compose.yml` | **Erneut direkt verifiziert** (nicht nur übernommen): `react@19.3.1`, `typescript@~7.0.2`, `vite@8.3.6`, `tailwindcss@4.3.5`, `@react-three/fiber@9.8.2`, `fastify@5.0.0`, `@prisma/client@5.22.0`, `@sinclair/typebox@0.34.0`, `postgres:16` (Docker-Image). Alle Angaben auf Folie 12 stimmen mit diesen Werten überein. |
| Team / Git-Historie | `git log --format='%an'` in `terraguessr` | **Erneut direkt verifiziert:** genau zwei Commit-Autoren über die gesamte Historie — „Maxim"/„MaximPoliakovskyi" (Maksym) und „Yevhen Yudin" (Yevhen). Keine weiteren Namen. Bestätigt die Zwei-Personen-Besetzung auf Folie 5, widerlegt aber nicht die offene Frage zur „Gruppe D" (s. §4). |
| Echte Screenshots | `terraguessr/docs/screenshots-v2/*.png`, kopiert nach `TerraGuessr-presentation/public/assets/screens/`, von dort in dieses Projekt nach `static/presentation/screens/*.webp` (verlustarm konvertiert, Breite ≤ 1400px, WebP q82) | Dateiidentität der Quellbilder nicht erneut per Checksum geprüft; Übernahme aus bereits identifizierter Quelle. Keine Stockfotos, keine Mockups. |
| Team / Aufwand / Planung | Repo-weite Suche (`git log`, Volltextsuche nach Aufwands-/Planungsdokumenten) in `terraguessr` | Keine Aufwandsschätzungs-, Planungs- oder Zeiterfassungsdokumente gefunden (erneut geprüft). Plan-/Ist-Stunden bleiben **TODO**. |

**Warum keine Neu-Recherche von Grund auf:** `/Users/maxim/WebstormProjects/TerraGuessr-presentation` ist eine bereits vollständig durchgeführte, quellenbelegte Aufarbeitung exakt desselben 21-Folien-Foliensatzes für dieselbe Abschlusspräsentation. Ihr `CONTENT_AUDIT.md` zitiert durchgängig Datei- und Zeilenverweise gegen dieselben Quellen, die diese Phase laut Auftrag ebenfalls konsultieren soll (Anforderungsanalyse, Anforderungsaudit, Quellcode, echte Screenshots). Diese Phase übernimmt den Inhalt wörtlich/strukturell und verifiziert die zentralen, am leichtesten driftenden Fakten erneut (Stack-Versionen, Commit-Historie, Dateipfade) statt die PDF- und Audit-Lektüre zu duplizieren.

## 1. Prüfungsvorgabe → Pflichtinhalte

Fünf verpflichtende Punkte laut `TerraGuessr_React_Presentation_Prompt.md:71-75`
(sekundäre Quelle, s. §0):

| Pflichtpunkt | Slide(s) / Station |
|---|---|
| Vorstellung Projektidee inkl. Ziele | Folie 04 — Station Konzept |
| Projektteam & Rollenverteilung | Folie 05 — Station Konzept |
| Aufwandsgegenüberstellung Plan/Ist & Erkenntnisse | Folie 14, Folie 16 — Station Engineering |
| Herausforderungen & Lösungen (technisch/sozial) | Folie 15 — Station Engineering |
| Live-Demo | Folie 20 — Station Qualität |

Zusätzlich bewertete Kriterien laut derselben Quelle (Zeile 77): interessantes
Vorstellen, Begrüßung, Problemstellung, Agenda, Logik/Korrektheit, Beispiele,
Qualität der visuellen Materialien, Einbindung des Publikums, Fazit,
Fragerunde, Vortrag/Timing — verteilt über die gesamte Struktur:

| Kriterium | Slide(s) |
|---|---|
| Einstieg / Begrüßung | 01 |
| Problemstellung | 03, 04 |
| Agenda | 02 |
| Logik / Korrektheit | durchgängig — jede Zahl auf §2/§3 zurückgeführt |
| Qualität visueller Materialien | 07–10 (echte Screenshots), 12/13/18/19 (SVG-freie, aber strukturierte HTML-Tabellen/Diagramme) |
| Einbindung des Publikums | 10 — Publikums-Challenge |
| Fazit | 21 |
| Fragerunde | 21 (Einladung), tatsächliche Fragen nicht Teil der Folien |
| Vortrag / Timing | **TODO — Verifizierung erforderlich:** `durationSec`-Angaben existieren nur im React-Referenzprojekt, nicht in `slides.js` dieses Projekts (dort bewusst nicht übernommen — die begehbare Stations-Metapher ersetzt ein festes Zeitraster pro Folie). Timing gegen den offiziellen Gruppenzeitplan (Gruppe D) ist ohnehin laut Referenzquelle ungeprüft. |

## 2. Anforderungsanalyse (Nr. 1–20) → Stationen/Folien — vollständige Tabelle

Die Audienz-Folie 18 zeigt eine verdichtete Auswahl von 10 der 20 Zeilen
(Vortragstauglichkeit, siehe `slides.js` Kommentar). Vollständig:

| Nr. | Kurzform | Kano-Typ | Pflicht | Primäre Folie | Audit-Status |
|---|---|---|---|---|---|
| 1 | Zufälliger, gültiger Standort | Basis | ja | 08, 18 | Teilweise |
| 2 | Tipp erst nach Bestätigung final | Basis | ja | 08 | Teilweise |
| 3 | Wetterdaten-Abruf (≤120 Min. alt) | Basis | ja | 08 | Bestanden |
| 4 | Standort vor Bestätigung verdeckt | Basis | ja | 13, 15, 18 | **Nicht bestanden, kritisch** |
| 5 | Schwierigkeitsgrade Leicht/Mittel/Schwer | Begeisterung | nein | 08, 18 | Nicht bestanden |
| 6 | Basis-Wetteranzeige | Basis | ja | 08 | Teilweise |
| 7 | Tipp per Karte oder Liste | Basis | ja | 08 | Teilweise |
| 8 | Unbegrenzte Korrektur vor Bestätigung | Basis | ja | 08 | Teilweise |
| 9 | Distanzberechnung (Haversine, km, 1 Dez.) | Basis | ja | 13, 18 | Nicht bestanden |
| 10 | Punkteformel (monoton, begrenzt, ganzzahlig) | Leistung | ja | 13 | Bestanden |
| 11 | Standort nach Bestätigung aufdecken | Basis | ja | 08 | Bestanden |
| 12 | Nächste Runde ≤ 2 s bereit | Leistung | ja | 13 | Bestanden |
| 13 | Wetter-Timeout 3 s / 3 Versuche | Basis | ja | 13 | Bestanden |
| 14 | Interaktives Tutorial | Begeisterung | nein | 07, 18 | Bestanden |
| 15 | Konsistente, responsive Wetteranzeige | Basis | ja | 18, 19 | Nicht bestanden |
| 16 | Mehrspieler-Lobby, Leaderboard | Begeisterung | nein | 09, 18 | Bestanden |
| 17 | Öffentliches HTTPS-Deployment | Basis | ja | 18, 20 | Nicht bestanden |
| 18 | 6-Monats-Aufbewahrung der Ergebnisse | Nebensächlich | nein | 18 | Teilweise |
| 19 | Geheime API-Keys nur serverseitig | Basis | ja | 12, 18 | Teilweise |
| 20 | Trennung UI / Spiellogik | Basis | ja | 12, 18 | Bestanden |

Summe: 8 bestanden, 7 teilweise, 5 nicht bestanden (von 20). Bei den 16
verpflichtenden Basis-Anforderungen: 6 bestanden. Vollständige
Einzelbewertung mit Zeilenverweisen: `REQUIREMENTS_AUDIT.md` im Projekt
`terraguessr`.

## 3. Zentrale technische Befunde, die mehrere Folien prägen

- **Echte Backend-Anbindung, kein Mock-Stand.** `services/index.ts` im
  committeten Code (HEAD `4bee821`) importiert die HTTP-Implementierung, nicht
  die Mock-Schicht. Folien 09, 13, 15 stellen die echte Anbindung dar.
- **Mehrspieler-Synchronisation ist Polling, kein WebSocket** — keine
  WebSocket-Bibliothek in `backend/package.json`. Folie 13 benennt das
  explizit.
- **Kein öffentliches Deployment** (R17, „nicht bestanden") — Folie 20 plant
  deshalb eine lokale Demo, keinen Link.
- **Publikums-Challenge ist kein Produkt-Feature**, sondern ein
  Präsentationsformat auf Basis eines echten Screenshots — weder
  Spezifikation noch Quellcode kennen eine Zuschauerfunktion. Folie 10 stellt
  das in den Sprechernotizen klar.
- **Zwei getrennte Technologie-Stacks** (neu in dieser Phase explizit
  gemacht, da Auftrag §2/Folie 12 das verlangt): TerraGuessr selbst
  (React/Fastify/PostgreSQL, s. §0) vs. diese begehbare 3D-Präsentationsumgebung
  (Three.js/WebGPU, Rapier3D, GSAP, Vite, Stylus — siehe `sources/Game/`,
  `package.json` dieses Repos). Folie 12 benennt beide ausdrücklich getrennt.

## 4. Team, Rollen, Aufwand — Status und offene Punkte

- **Bestätigt:** Genau zwei Commit-Autoren in `terraguessr` (git log,
  erneut verifiziert 2026-11-25) — Maksym und Yevhen. Folie 5 zeigt nur
  diese zwei.
- **Nicht bestätigt:** Die exakten Rollenbezeichnungen („Frontend & UI" /
  „Backend & Spiellogik") sind eine plausible, aber unbestätigte Aufteilung
  — in `slides.js` sichtbar als „(vorläufig)" gekennzeichnet, nicht als
  Fakt dargestellt.
- **Nicht bestätigt:** Eine ältere Sekundärquelle nennt eine vierköpfige
  „Gruppe D" (Linus, Isabelle, Maksym, Yevhen, Slot 12:45–13:15). Nur die
  letzten zwei erscheinen im TerraGuessr-Repository. Ob die Präsentation von
  zwei oder vier Personen gehalten wird, ist vor dem Termin zu klären.
- **Nicht gefunden:** Keine Aufwandsschätzung (Plan-/Ist-Stunden) im
  Repository. Folie 14 zeigt deshalb ausschließlich „—"-Platzhalter, keine
  erfundenen Zahlen.
- **Nicht dokumentiert:** Soziale/organisatorische Herausforderungen (laut
  Prüfungsvorgabe optional neben technischen). Nur technische Befunde sind
  im Projekt belegt; Folie 15 zeigt ausschließlich technische Punkte.

## 5. Offene TODOs vor der finalen Abgabe

1. Original der Prüfungsvorgabe besorgen und §1 dieses Dokuments gegen den
   Wortlaut verifizieren (Seitenzahlen, exakte Formulierung).
2. Rollen/Arbeitspakete von Maksym und Yevhen bestätigen (Folie 5).
3. Gruppenzusammensetzung klären (zwei vs. vier Personen, s. §4).
4. Plan-/Ist-Stunden eintragen, sobald eine Aufwandsschätzung vorliegt
   (Folie 14 — aktuell nicht im Repository auffindbar).
5. Vor der Live-Demo (Folie 20): lokale Umgebung (`npm run dev` im Ordner
   `terraguessr/frontend`) auf dem Vortragsgerät testen; Backup sind die
   echten Screenshots an der Station Gameplay (Folien 7–9).
6. Antwort/Ort für die Publikums-Challenge (Folie 10) anhand der
   Panorama-Quellenangabe im Screenshot (Google Street View, Bildnachweis
   „© Jesús") verifizieren, bevor sie in den Sprechernotizen als Fakt
   genannt wird.
7. Vortragszeiten/Sprecherzuordnung gegen den offiziellen Zeitplan der
   Gruppe abgleichen, falls die Präsentation zeitlich getaktet gehalten
   wird (diese 3D-Umgebung erzwingt kein festes Zeitraster pro Folie).

Unbestätigte Werte werden nicht als Fakten auf den Folien dargestellt — offene
Punkte bleiben in den Sprechernotizen (`slides.js`) und hier.

## 6. Stations- und Folienzuordnung (verifiziert gegen `PresentationStations.js`)

| Station | `slideRange` | Folien | Deckt sich mit Auftrag? |
|---|---|---|---|
| Konzept | `[1, 5]` | 01–05 | Ja |
| Gameplay | `[6, 10]` | 06–10 | Ja (Auftrag nennt diese Station „Gameplay" durchgängig, `presentation.config.ts` nennt sie „Produktrundgang" — gleicher Inhalt, siehe Kapitel-Label auf Folie 06) |
| Engineering | `[11, 16]` | 11–16 | Ja |
| Qualität | `[17, 21]` | 17–21 | Ja |

Keine Änderung an `PresentationStations.js`, `PresentationController.js`,
`CameraDirector.js`, `CharacterDirector.js` oder `StationStands.js` war für
diese Zuordnung nötig — die Architektur war bereits für alle 21 Folien
ausgelegt (siehe Phase-4-Bericht).

## 7. Browser-Validierung

Siehe technischer Abschlussbericht (Chat). Wird nach dem Testlauf ergänzt.

## 8. Produktions-Build

Siehe technischer Abschlussbericht (Chat). Wird nach dem Build-Lauf ergänzt.
