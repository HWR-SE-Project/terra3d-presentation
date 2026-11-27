# PRESENTATION_COMPLIANCE — Final Audit & Verification

Stand: 2026-11-28. Vollständige Rückverfolgbarkeit der finalen 20-Folien-Hauptpräsentation (inkl. 3 Kapitel-Trennfolien + 1 optionale Q&A-Anhangsfolie A1) für die Abschlusspräsentation **TerraGuessr** (Software Engineering Kurs B 2026, Gruppe D), vollständig abgeglichen gegen den aktuellen Quellcode-Stand **Commit `b877221`** (27.11.2026).

---

## 1. Struktur & Zeitbudget (30-Minuten-Slot)

| Station | Vortragende:r | Folien | Zielzeit | Inhalt |
|---|---|---|---|---|
| **01 · Konzept** | Maksym | 01–04 | 4:00 Min. | Titelfolie + Publikums-Hook, Agenda, Ausgangssituation & Projektidee, Projektziele & 20 Anforderungen |
| **02 · Team & Produkt** | Linus | 05–09 | 4:00 Min. | Kapitel-Divider, Projektteam & Rollenverteilung, Einstieg & Setup, Einzelspieler (3D-Diorama & Auswertung), Mehrspieler & Ökosystem |
| **03 · Engineering** | Yevhen | 10–13 | 4:00 Min. | Kapitel-Divider, Architektur & Stack, Datenfluss einer Spielrunde (6 Schritte), Herausforderungen & Lösungen |
| **04 · Aufwand & Qualität** | Isabelle | 14–18 | 4:00 Min. | Kapitel-Divider, Plan/Ist-Vergleich & Schätzrisiken, Erkenntnisse & Reflexion, Anforderungen/Tests/CI, Fazit |
| **Live-Demo** | Team | 19 | ~8:00 Min. (5–10 Min.) | Start & Avatar, Einzelspieler-Setup, Publikumsrunde (3D-Diorama + Wetter), Auswertung, Mehrspieler-Lobby |
| **Fragerunde (Q&A)** | Team | 20 | 4:00 Min. (1 Min./Person) | Dedizierte Abschlussfolie nach der Demo (`Vielen Dank. Fragen?`) |
| **Puffer / Wechsel** | — | — | ~2:00 Min. | Übergänge zwischen Stationen & Demo-Fenster |

**Optionaler Anhang (außerhalb des Hauptvortrags, Taste `A` oder PDF-Anhang):**
- **A1:** Vollständige 20-Zeilen-Anforderungsmatrix (Abgleich `docs/ruquirements.md` vs. Commit `b877221`, inkl. Verbindlichkeit, Kano-Klassifikation & Umsetzungsstatus).

---

## 2. Verifizierte Fakten (Quellcode-Stand `b877221`, 27./28.11.2026)

- **Architektur & Kernkonzept:**
  - Interaktive **3D-Low-Poly-Biom-Dioramen** (`@react-three/fiber` 9.8, `Three.js` 0.187, `@react-three/drei`) statt Google Street View — 7 Biome (`desert`, `forest`, `mountains`, `tundra`, `coast`, `grasslands`, `urban`) × 20 Orte = **140 globale Landstandorte** (`backend/src/modules/singleplayer/locations.ts`).
  - Live-Wetter & Höhe via **MET Norway Locationforecast 2.0** (`backend/src/modules/intelligence/service.ts`: 3-s-Timeout, max. 3 Orte, 120-Min.-Aktualität, In-Memory-Cache, Circuit-Breaker, kein API-Key).
  - Interaktive Weltkarte via **Leaflet 1.9.4 + Esri ArcGIS Online Tiles** (`frontend/src/components/game/GuessMap.tsx`, kein API-Key).
  - **Standortverbergung (R4) & API-Sicherheit (R19) gelöst:** Zielkoordinaten und Ortsname verlassen das Backend erst nach Rundenende; der Client erhält nur eine anonymisierte `RoundScene` + Wetterwerte + (bei Easy) 6 Kandidatenstädte inkl. Same-Biome-Distraktoren.
  - **Gameplay & Scoring:** Easy (7 Min., 3 Versuche, 6 Städte, kostenlose Zusatzdaten), Medium (4 Min., 2 Versuche, Weltkarte, −100 Pkt.), Hard (2 Min., 1 Versuch, Weltkarte, −20 s); 3–10 Runden oder Endless; Best-of-N-Wertung; Haversine-Distanz auf 0,1 km; 0–5.000 Punkte (≤ 100 km = 5.000, ≥ 20.000 km = 0).
  - **Mehrspieler (R16):** 2–16 Spieler, 6-stelliger Beitrittscode, identische 3D-Runden, privates In-Round-HUD, HTTP-Polling (1 s), gemeinsames 15-s-Review (`LOBBY_ROUND_REVIEW_MS = 15_000`) mit Early-Continue, Rangliste & Rematch.
  - **Zusatzfunktionen:** 2-Runden-Praxistutorial & Ultimate Field Guide (`/how-to-play`), 3D-Avatar-Editor (`/avatar`), 6-Monats-Statistiken & Karten-Replays (`/stats`, täglicher `node-cron`-Purge um 03:00 UTC), Kontoverwaltung & Privacy-Seite (`/account`, `/privacy`), optionale Google-OAuth- & SMTP-Anbindung.
- **Automatisierte Tests & CI/CD (`.github/workflows/ci.yml`):**
  - **Backend Unit & Domain (Vitest):** **173 / 173 bestanden** (26 Testdateien, live ausgeführt am 28.11.2026 via `npx vitest run test/ --exclude '**/integration/**'`).
  - **Frontend Unit & Component (Vitest + Testing Library):** **112 Testfälle** in 27 Testdateien (86 Tests in 23 Dateien lokal live grün; 4 Leaflet-Dateien mit 26 Tests benötigen lokales `npm install --prefix frontend` und laufen in CI).
  - **Backend Integration (Vitest + PostgreSQL 16):** **86 Testfälle** in 5 Dateien (`auth`, `lobbies`, `rate-limit`, `results`, `singleplayer`).
  - **E2E (Playwright + `docker-compose.test.yml`):** **6 Szenarien** in 4 Dateien (`home`, `auth`, `singleplayer`, `multiplayer`) über 3 Browser-Engines (Chromium, Firefox, WebKit).
  - **Gesamt:** **377 automatisierte Testfälle** in 62 Dateien (keine Code-Coverage-Quote erhoben — explizit vermerkt).
  - **CI/CD-Pipeline:** Change-Detection → Lint/Typecheck/Build/Tests/E2E → Backend-First-Deploy (`prisma migrate deploy` auf Neon → Render-Health-Commit-Check → Vercel-Frontend).
- **Screenshots (alle 6 aktualisiert, 0 veraltete Street-View-Bilder):**
  - `home-hero.webp` → Folie 07 (Startseite & 3D-Avatar)
  - `singleplayer-setup.webp` → Folie 07 (Schwierigkeit & Rundenwahl)
  - `gameplay-diorama.webp` → Folie 08 (Aktive 3D-Spielrunde, Wetterpanel & Leaflet-Karte)
  - `round-result.webp` → Folie 08 (Runden-Auswertung mit Cusco, 10.515,0 km & +2.383 Pkt.)
  - `session-summary.webp` → Folie 08 (Spielabschluss & Runden-Breakdown)
  - `multiplayer-join.webp` → Folie 09 (Mehrspieler-Hub 2–16 Spieler & Beitrittscode)

---

## 3. Verbleibende offene Punkte (Team-Eingabe / Live-Prüfung — nichts erfunden)

1. **Verbindliche Team-Rollenmatrix (Folie 06):** Im Git-Verlauf sind Commits von Maksym (245) und Yevhen (102) belegt; die vollständige Arbeitspaket-Zuordnung für alle vier Mitglieder (insbesondere Linus und Isabelle) liegt in den bereitgestellten Unterlagen nicht vor und ist vor der Abgabe vom Team einzutragen.
2. **Plan/Ist-Aufwand in Personenstunden (Folien 15 & 16):** Im Repository existieren keine Dokumente zur Aufwandsschätzung oder Zeiterfassung. Folie 15 markiert alle Plan-/Ist-Werte transparent als offen (`—`); nach Eintrag der echten Werte sollten die Abweichungsgründe auf Folie 16 konkretisiert werden.
3. **Produkt-Deployment & native Browser (R17, Folie 17):** Vercel-, Render-, Neon- und GitHub-Actions-Konfigurationen sind im Repository vollständig angelegt (`docs/production.md`), aber die aktive Live-Erreichbarkeit sowie Tests in nativen Safari/Edge-Installationen (über Playwright Chromium/Firefox/WebKit hinaus) müssen vor der Prüfung direkt überprüft werden.
