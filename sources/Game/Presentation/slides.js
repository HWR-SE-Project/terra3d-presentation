/**
 * Slide content — pure data, decoupled from SlideRenderer and PresentationController.
 *
 * 20-slide corporate-editorial academic presentation across 4 stations
 * (+ 1 optional Q&A appendix slide A1), strictly aligned with SWE Kurs B 2026
 * assessment rules (Gruppe D: Maksym, Linus, Yevhen, Isabelle · 30-Minuten-Slot):
 *
 *   01 — Konzept            | Maksym   (Slides 01–04, 4:00 Min.)
 *   02 — Team & Produkt     | Linus    (Slides 05–09, 4:00 Min. · inkl. Divider)
 *   03 — Engineering        | Yevhen   (Slides 10–13, 4:00 Min. · inkl. Divider)
 *   04 — Aufwand & Qualität | Isabelle (Slides 14–18, 4:00 Min. · inkl. Divider)
 *   Live-Demo               | Team     (Slide  19,    5–10 Min., Richtwert ~8:00 Min.)
 *   Fragerunde (Q&A)        | Team     (Slide  20,    4:00 Min. = 1 Min./Person)
 *
 * Visual-first, sparse copy: headlines, numbers, diagrams, and large current
 * screenshots carry each slide; detailed verbal narration lives strictly in
 * speaker `notes` (never rendered in the audience DOM).
 *
 * Every technical claim, version, requirement status, and test count is verified
 * directly against TerraGuessr repository HEAD `b877221` (27.11.2026). Missing
 * team data (working hours, unconfirmed individual roles) is explicitly marked
 * rather than invented.
 */
export const SLIDES = {

    // =========================================================================
    // Station 01 — Konzept | Maksym (01–04 · Zielzeit: 4:00 Min.)
    // =========================================================================

    1: {
        id: 1,
        stationId: 'konzept',
        theme: 'dark',
        layout: 'title',
        title: 'TerraGuessr',
        subtitle: 'Wo auf der Welt bist du?',
        byline: 'Maksym · Linus · Yevhen · Isabelle',
        academicLine: 'Abschlusspräsentation · SWE Kurs B · Gruppe D · 2026',
        durationSec: 35,
        notes: [
            'Zielzeit: ~35 Sek. | Pünktlicher Beginn, kurze Begrüßung von Prüfer:in und Kommiliton:innen.',
            'Einstieg & Publikumsaktivierung (Handzeichen): „Kurze Frage zum Einstieg — wer kennt Geo-Guessing-Spiele? Stellt euch vor, ihr landet nachts bei 20,6 °C im Regen auf einer kleinen 3D-Insel — ohne Ortsnamen, nur mit Biom, Live-Wetter und Weltkarte. Findet ihr heraus, wo ihr seid?“',
            'Überleitung: Genau aus dieser Frage entstand unser Software-Engineering-Projekt TerraGuessr.',
        ],
    },

    2: {
        id: 2,
        stationId: 'konzept',
        theme: 'light',
        layout: 'agenda',
        title: 'Aufbau der Präsentation',
        subtitle: 'Vier Stationen im 30-Minuten-Slot',
        items: [
            { number: '01', label: 'Konzept', speaker: 'Maksym · 4 Min.', topics: [ 'Ausgangslage & Idee', 'Projektziele', '20 Anforderungen' ] },
            { number: '02', label: 'Team & Produkt', speaker: 'Linus · 4 Min.', topics: [ 'Team & Rollen', 'Einstieg & Solo', 'Mehrspieler & Extras' ] },
            { number: '03', label: 'Engineering', speaker: 'Yevhen · 4 Min.', topics: [ 'Architektur & Stack', 'Runden-Datenfluss', 'Herausforderungen' ] },
            { number: '04', label: 'Aufwand & Qualität', speaker: 'Isabelle · 4 Min.', topics: [ 'Plan / Ist & Risiken', 'Reflexion & Tests', 'Fazit' ] },
        ],
        footerBar: 'Im Anschluss: Live-Demo mit dem Publikum (5–10 Min.) · Diskussion & Fragen (4 Min.)',
        durationSec: 25,
        notes: [
            'Zielzeit: ~25 Sek. | Vier gleichmäßige 4-Minuten-Blöcke knapp benennen: Maksym (Konzept), Linus (Team & Produkt), Yevhen (Engineering), Isabelle (Aufwand & Qualität).',
            'Zeitbudget transparent machen: 16 Min. Vortrag, 5–10 Min. Live-Demo mit Publikumsrunde, 4 Min. Diskussion & Q&A (1 Min. pro Person).',
        ],
    },

    3: {
        id: 3,
        stationId: 'konzept',
        theme: 'split',
        layout: 'split-idea',
        problemLabel: 'Ausgangssituation',
        problemHeadline: 'Geografie erleben statt nur auswendig lernen.',
        problemQuote: 'Beobachten. Kombinieren. Verorten.',
        clues: [ '3D-Biom-Diorama', 'Live-Wetter', 'Höhe & Tageszeit', 'Weltkarte' ],
        ideaTitle: 'Die Welt als Indizien-Spiel',
        steps: [
            { number: '01', title: 'Erkunden', text: '7 Biome · 140 globale Orte · Echtzeit-Wetter (MET Norway)' },
            { number: '02', title: 'Raten', text: 'Indizien kombinieren · Best-of-N auf Weltkarte oder aus 6 Städten' },
            { number: '03', title: 'Vergleichen', text: 'Haversine-Distanz (0,1 km) · 0–5.000 Punkte · Lobby-Rangliste' },
        ],
        durationSec: 90,
        notes: [
            'Zielzeit: ~1:30 Min. | Motivation sachlich einordnen: Reines Faktenpauken trennt geografisches Wissen oft von Klima, Landschaft und Wetter.',
            'Projektidee: TerraGuessr ist eine browserbasierte Geografie-App. Statt Fotos oder Koordinaten liefert jede Runde ein prozedurales 3D-Biom-Diorama (7 Biome wie Wüste, Tundra, Küste, Gebirge) kombiniert mit aktuellen MET-Norway-Wetterdaten.',
            'Spielprinzip in drei Schritten: Erkunden (3D-Insel + Wetter + optionale Zusatzdaten wie Höhe/UV), Raten (Best-of-N auf Leaflet-Weltkarte oder aus 6 Städten bei Easy), Vergleichen (Distanz auf 0,1 km, bis 5.000 Punkte, Solo oder in der Lobby).',
        ],
    },

    4: {
        id: 4,
        stationId: 'konzept',
        theme: 'light',
        layout: 'goals',
        title: 'Projektziele & Anforderungen',
        goals: [
            { index: '01', title: 'Indizien-Gameplay', text: '3D-Biome & Echtzeit-Wetter statt Auswendiglernen' },
            { index: '02', title: 'Niedrige Hürde', text: 'Direkt im Browser · Gastmodus, optionales Konto & Tutorial' },
            { index: '03', title: 'Fairer Wettbewerb', text: 'Einheitliches Scoring im Einzel- & Mehrspieler (2–16)' },
        ],
        kpi: {
            value: '20',
            label: 'Anforderungen',
            sub: '16 Pflicht · 4 Soll',
            segments: [
                { label: 'Basis', count: 13, tone: 'base' },
                { label: 'Leistung', count: 2, tone: 'perf' },
                { label: 'Begeisterung', count: 3, tone: 'delight' },
                { label: 'Unerheblich', count: 2, tone: 'indiff' },
            ],
        },
        footerBar: 'Kano-Priorisierung als roter Faden — die vollständige Umsetzungsbilanz folgt in Station 04',
        durationSec: 90,
        notes: [
            'Zielzeit: ~1:30 Min. | Ziele klar von empirischer Lernmessung abgrenzen — wir zeigen, was das Produkt konkret ermöglicht.',
            'Drei konkrete Projektziele: (1) Klimatische & landschaftliche Indizien spielerisch verknüpfen; (2) Sofort spielbar im Browser ohne Installation und ohne Karten-API-Key; (3) Einheitliche, serverseitig geprüfte Fairness im Einzel- und Mehrspieler.',
            'Kano-Modell kurz erklären: 20 dokumentierte Anforderungen (13 Basis-, 2 Leistungs-, 3 Begeisterungs-, 2 unerhebliche Merkmale; verbindlich 16 Pflicht- und 4 Soll-Anforderungen).',
            'Übergabe an Linus (Station 02): Wer steckt hinter dem Projekt und wie sieht das fertige Produkt aus?',
        ],
    },

    // =========================================================================
    // Station 02 — Team & Produkt | Linus (05–09 · Zielzeit: 4:00 Min.)
    // =========================================================================

    5: {
        id: 5,
        stationId: 'gameplay',
        theme: 'dark',
        layout: 'divider',
        sectionNumber: '02',
        kicker: 'Station 02 · Linus',
        title: 'Team & Produkt',
        subtitle: 'Rollenverteilung · Einzelspieler · Mehrspieler',
        durationSec: 10,
        notes: [
            'Kurzer Übergang (~5–10 Sek.) auf Station 02 — Linus übernimmt.',
        ],
    },

    6: {
        id: 6,
        stationId: 'gameplay',
        theme: 'light',
        layout: 'team',
        title: 'Projektteam & Rollenverteilung',
        subtitle: 'SWE Kurs B · Gruppe D',
        members: [
            {
                number: '01',
                name: 'Maksym',
                presentationRole: 'Konzept · 4 Min.',
                projectRole: 'Entwicklung (245 Commits belegt) · finale Rollenmatrix im Team bestätigen',
                verified: true,
            },
            {
                number: '02',
                name: 'Linus',
                presentationRole: 'Team & Produkt · 4 Min.',
                projectRole: 'Projektrolle im Team vor Abgabe ergänzen',
                pending: true,
            },
            {
                number: '03',
                name: 'Yevhen',
                presentationRole: 'Engineering · 4 Min.',
                projectRole: 'Entwicklung & Docs (102 Commits belegt) · finale Rollenmatrix im Team bestätigen',
                verified: true,
            },
            {
                number: '04',
                name: 'Isabelle',
                presentationRole: 'Aufwand & Qualität · 4 Min.',
                projectRole: 'Projektrolle im Team vor Abgabe ergänzen',
                pending: true,
            },
        ],
        footerBar: 'Transparenz: Git belegt 245 Commits (Maksym) und 102 Commits (Yevhen) — verbindliche Arbeitsverteilung für alle 4 Mitglieder vor Abgabe eintragen',
        durationSec: 50,
        notes: [
            'Zielzeit: ~50 Sek. | WICHTIG VOR ABGABE: Die tatsächlichen Projekt- und Arbeitspaket-Rollen aller vier Teammitglieder (z. B. Anforderungsanalyse, UI/UX, Frontend, Backend, QA, Dokumentation) gemeinsam abstimmen und in slides.js eintragen.',
            'Transparenzregel eingehalten: Nichts erfunden. Git-Historie belegt 245 Commits von Maksym und 102 Commits von Yevhen (Stand b877221); nicht im Repo sichtbare Beiträge (z. B. Analyse, Konzept, Testing, Doku) müssen explizit vom Team bestätigt werden.',
        ],
    },

    7: {
        id: 7,
        stationId: 'gameplay',
        theme: 'dark',
        layout: 'versus',
        title: 'Direkt im Browser starten',
        screenshots: [
            {
                src: '/presentation/screens/home-hero.webp',
                alt: 'TerraGuessr Startseite mit 3D-Globus, Explorer-Avatar und Einzel-/Mehrspieler-Auswahl',
                step: '01',
                label: 'Startseite & 3D-Avatar',
                text: 'Kein Download · Gastmodus · Avatar-Editor & Tutorial',
            },
            {
                src: '/presentation/screens/singleplayer-setup.webp',
                alt: 'Einzelspieler-Konfiguration mit Easy, Medium, Hard sowie Rundenwahl oder Endless-Modus',
                step: '02',
                label: 'Schwierigkeit & Runden',
                text: 'Easy (6 Städte) · Medium / Hard (Weltkarte) · 3–10 Runden oder Endless',
            },
        ],
        durationSec: 55,
        notes: [
            'Zielzeit: ~55 Sek. | Links: Echter Startbildschirm mit rotierendem Low-Poly-Globus und 3D-Explorer-Avatar (Head-Tracking, eigener Avatar-Editor unter /avatar). Spielbar als Gast oder mit optionalem Konto.',
            'Rechts: Einzelspieler-Setup (R5) — Easy: 7 Min., 3 Versuche, 6 markierte Städte auf der Karte, kostenlose Zusatzdaten; Medium: 4 Min., 2 Versuche, Weltkarte, Zusatzdaten −100 Pkt.; Hard: 2 Min., 1 Versuch, Weltkarte, Zusatzdaten −20 Sek.',
            'Feste Rundenzahl (3–10 Runden, Standard 5) oder Endless-Modus · WebGL-Fallback & Tastaturbedienung integriert.',
        ],
    },

    8: {
        id: 8,
        stationId: 'gameplay',
        theme: 'light',
        layout: 'product-mosaic',
        title: 'Einzelspieler: 3D-Diorama & Auswertung',
        primary: {
            src: '/presentation/screens/gameplay-diorama.webp',
            alt: 'Aktive 3D-Spielrunde mit Regen-Diorama, Geographic-Intelligence-Wetterpanel und Leaflet-Weltkarte',
            step: '01',
            label: '3D-Biom-Diorama, Live-Wetter & Leaflet-Karte',
            detail: 'Best-of-N Versuche · freischaltbare Zusatzdaten (Höhe, UV, 24h-Trend)',
        },
        secondary: [
            {
                src: '/presentation/screens/round-result.webp',
                alt: 'Runden-Auswertung für Cusco mit 10.515,0 km Distanz, +2.383 Punkten und Großkreislinie auf der Karte',
                step: '02',
                label: 'Runden-Auswertung · 0,1 km & 0–5.000 Pkt.',
            },
            {
                src: '/presentation/screens/session-summary.webp',
                alt: 'Spielabschluss-Übersicht mit Gesamtpunktzahl, bester Runde und Rundenliste',
                step: '03',
                label: 'Spielabschluss & Runden-Breakdown',
            },
        ],
        durationSec: 70,
        notes: [
            'Zielzeit: ~1:10 Min. | Links: Aktive Spielrunde — drehbares 3D-Biom-Diorama (hier Regen bei Nacht, 20,6 °C, Avatar mit Schirm, Kompass), links Geographic Intelligence (Temperatur, Niederschlag, Luftfeuchte, Wind + freischaltbares Station Dossier mit Höhe, 24h-Trend, UV, Taupunkt, Luftdruck), rechts Leaflet/Esri-Weltkarte mit „Submit guess“ (Versuch) und „Final submit“.',
            'Oben rechts: Runden-Auswertung (R9–R11) — exakter Zielort (Cusco), Haversine-Distanz auf eine Nachkommastelle (10.515,0 km), Punkte (+2.383) und Großkreislinie.',
            'Unten rechts: Abschlussübersicht („Well explored!“) mit Gesamtscore, bester Runde, Durchschnitt und Runden-Breakdown.',
        ],
    },

    9: {
        id: 9,
        stationId: 'gameplay',
        theme: 'dark',
        layout: 'showcase',
        title: 'Mehrspieler & Ökosystem',
        primaryShot: {
            src: '/presentation/screens/multiplayer-join.webp',
            alt: 'Mehrspieler-Lobby-Ansicht zum Erstellen oder Beitreten per 6-stelligem Code für 2 bis 16 Spieler',
            caption: 'Lobby-Hub · 2–16 Spieler · Beitritt per 6-stelligem Code',
        },
        points: [
            {
                tag: 'R16',
                label: 'Synchronisierte Partien',
                text: 'Identisches 3D-Diorama & Timer · 15-s-Review mit Early-Continue & Rematch',
            },
            {
                tag: 'R14',
                label: 'Tutorial & Field Guide',
                text: '2-Runden-Praxistutorial (wiederholbar) & Leitfaden unter /how-to-play',
            },
            {
                tag: 'R18',
                label: 'Statistiken & Konto',
                text: '6-Monats-Archiv & Karten-Replays (/stats) · E-Mail/Passwort & Google OAuth',
            },
        ],
        durationSec: 55,
        notes: [
            'Zielzeit: ~55 Sek. | Links: Der aktuelle Mehrspieler-Hub (/multiplayer) — Host erstellt eine Lobby für 2–16 Spieler mit Schwierigkeit & Rundenzahl (3–10) oder tritt per 6-stelligem Code bei.',
            'Rechts: (1) Synchronisierte Runden mit gemeinsamem 15-Sekunden-Review (alle Tipps auf der Karte, sofortiges Weiter sobald alle bereit sind) und Rematch; (2) 2-Runden-Praxistutorial & Ultimate Field Guide; (3) 6-Monats-Archiv, Biom-Quoten und interaktive Karten-Replays unter /stats plus Datenschutzseite (/privacy).',
            'Übergabe an Yevhen (Station 03): Wie ist TerraGuessr technisch aufgebaut, und wie wurden diese Anforderungen umgesetzt?',
        ],
    },

    // =========================================================================
    // Station 03 — Engineering | Yevhen (10–13 · Zielzeit: 4:00 Min.)
    // =========================================================================

    10: {
        id: 10,
        stationId: 'engineering',
        theme: 'light',
        layout: 'divider',
        sectionNumber: '03',
        kicker: 'Station 03 · Yevhen',
        title: 'Engineering',
        subtitle: 'Architektur · Datenfluss · Herausforderungen',
        durationSec: 10,
        notes: [
            'Kurzer Übergang (~5–10 Sek.) auf Station 03 — Yevhen übernimmt.',
        ],
    },

    11: {
        id: 11,
        stationId: 'engineering',
        theme: 'dark',
        layout: 'architecture',
        title: 'Schichtenarchitektur & Stack',
        layers: [
            {
                num: '01',
                name: 'Frontend SPA',
                role: '3D-Biom-Dioramen · Leaflet-Karte · zentrale Service-Grenze',
                stack: 'React 19 · TypeScript · Vite 8 · Tailwind 4 · R3F / Three.js · Leaflet 1.9',
            },
            {
                num: '02',
                name: 'Backend REST-API',
                role: 'TypeBox-Validierung · Rate-Limits · reine Domain-Module',
                stack: 'Fastify 5 · TypeScript 5 · Prisma 5 · TypeBox · Node 22',
            },
            {
                num: '03',
                name: 'Persistenz',
                role: 'Konten · Partien · Lobbys · 6-Monats-Archiv (Cron-Purge)',
                stack: 'PostgreSQL 16 · Neon (Prod)',
            },
        ],
        external: [ 'MET Norway (Wetter & Höhe · 0 Keys)', 'Esri ArcGIS Tiles (Karte · 0 Keys)', 'SMTP & Google OAuth (optional)' ],
        ops: 'Vitest 5 · Playwright · Docker · GitHub Actions · Render + Vercel',
        principle: 'R20: Frameworkfreie Domain-Module (Scoring, Haversine, Spielregeln, 3D-Szene) — identisch in Solo & Multiplayer.',
        footnote: 'Abgrenzung: Diese 3D-Präsentationswelt ist ein separates Vortragswerkzeug; die App rendert eigene R3F-Dioramen.',
        durationSec: 70,
        notes: [
            'Zielzeit: ~1:10 Min. | Dreischichtige Architektur verständlich erläutern:',
            '1) Frontend SPA (React 19, Vite 8, Tailwind 4, React Three Fiber für 3D-Dioramen, Leaflet für die Weltkarte): Alle API-Aufrufe laufen über genau eine Service-Grenze (src/services/index.ts).',
            '2) Backend REST-API (Fastify 5, TypeBox = typsichere Schema-Validierung, Prisma 5 = typsicheres ORM): Geschäftslogik (Haversine-Distanz, Punkteformel, Best-of-N, 3D-Szenenableitung) liegt frameworkfrei in backend/src/domain/.',
            '3) Persistenz (PostgreSQL 16, lokal per Docker, produktiv auf Neon) + node-cron (stündlicher Session-Cleanup, tägliche 6-Monats-Löschung um 03:00 UTC).',
            '4) Externe Dienste ohne Karten-API-Key: MET Norway Locationforecast 2.0 und Esri ArcGIS Kacheln; SMTP & Google OAuth optional und rein serverseitig.',
        ],
    },

    12: {
        id: 12,
        stationId: 'engineering',
        theme: 'light',
        layout: 'sequence',
        title: 'Datenfluss einer Spielrunde',
        lanes: [ 'Client (React + R3F)', 'Backend (Fastify)', 'MET Norway & Postgres' ],
        messages: [
            { id: 1, from: 0, to: 1, kind: 'req', label: '1 · Neue Runde anfordern' },
            { id: 2, from: 1, to: 2, kind: 'req', label: '2 · Ort wählen & Live-Wetter (≤ 3 s, max. 3×)' },
            { id: 3, from: 1, to: 0, kind: 'res', label: '3 · Anonymisierte 3D-Szene & Wetter (ohne Zielkoordinaten)' },
            { id: 4, from: 0, to: 1, kind: 'req', label: '4 · Tipp senden (Submit Guess / Final Submit)' },
            { id: 5, from: 1, to: 2, kind: 'req', label: '5 · Best-of-N · Haversine · 0–5.000 Pkt. · Archiv' },
            { id: 6, from: 1, to: 0, kind: 'res', label: '6 · Zielort, Distanz (0,1 km) & Punktzahl' },
        ],
        facts: [
            { label: 'Standortverbergung (R4)', text: 'Zielkoordinaten & Ortsname bleiben bis Rundenende strikt serverseitig' },
            { label: 'Latenz & Sync (R12 / R16)', text: 'Round-1-Warm-Pool & Prefetch · Multiplayer per HTTP-Polling (1 s)' },
        ],
        durationSec: 55,
        notes: [
            'Zielzeit: ~55 Sek. | Die sechs Schritte entlang der drei Lebenslinien zügig erklären:',
            '1–2: Server wählt per kryptografischem Zufall (randomInt) einen der 140 Landstandorte (≥ 400 km Abstand zur Vorrunde) und ruft MET Norway mit 3-Sekunden-Timeout & Circuit-Breaker ab (max. 3 Versuche, R13). Für Runde 1 greift ein Warm-Pool (bis 3 vorvalidierte Orte), für Folgerunden Prefetching (R12).',
            '3: Der Client erhält nur eine anonymisierte RoundScene + Wetterdaten — niemals Zielkoordinaten oder Ortsnamen (R4).',
            '4–6: Erst nach Finalisierung, letztem Versuch oder Timeout wertet das Backend den besten Versuch (Best-of-N) per Haversine aus, archiviert bei Konten in GameResult (R18) und gibt Zielort & Punkte frei.',
        ],
    },

    13: {
        id: 13,
        stationId: 'engineering',
        theme: 'split',
        layout: 'challenges',
        railLabel: 'Engineering',
        railHeadline: 'Drei zentrale Hürden — gelöst im Code.',
        railQuote: 'Stand Commit b877221',
        title: 'Herausforderungen & Lösungen',
        items: [
            {
                number: '01',
                challenge: 'Standortverbergung & API-Keys (R4 / R19)',
                problem: 'Street-View-SDK legte Koordinaten im Client offen & brauchte Keys',
                solution: 'Pivot auf 3D-Biom-Dioramen (140 Orte), MET Norway & Leaflet/Esri → 0 Karten-Keys',
            },
            {
                number: '02',
                challenge: 'Mehrspieler-Sync & Ladezeit (R12 / R16)',
                problem: 'Faire Runden (2–16 Spieler) ohne WebSocket-Overhead & Wetter-Latenzen',
                solution: 'Server-State-Machine, 1-s-Polling, 15-s-Review · Warm-Pool & Prefetching',
            },
            {
                number: '03',
                challenge: 'Zwischenaudit-Befunde (R2 / R9 / R15 / R17)',
                problem: 'Detailabweichungen bei Versuchen, Distanzformat, Label-Clipping & Deploy',
                solution: 'Best-of-N, 0,1-km-Format, wrap-anywhere & Backend-First-CI/CD umgesetzt',
            },
        ],
        durationSec: 105,
        notes: [
            'Zielzeit: ~1:45 Min. | Pflichtinhalt „Herausforderungen & Lösungen“ — direkt aus dem realen Projektverlauf belegt (Problem → Lösung):',
            '01 (Architektur-Pivot): Früher Prototyp nutzte Google Street View. Audit deckte kritisches Problem auf: Client-SDK löste Zielkoordinaten im Browser auf (R4) und brauchte Google-API-Keys (R19). Lösung: Vollständiger Wechsel auf eigene 3D-Biom-Dioramen (7 Biome × 20 Orte = 140 Standorte, inkl. Same-Biome-Distraktoren bei Easy) + MET Norway + Leaflet/Esri.',
            '02 (Multiplayer & Latenz): Bewusster Trade-off — serverseitige Lobby-State-Machine mit 1-Sekunden-HTTP-Polling vermeidet WebSocket-Betriebskomplexität; gemeinsames 15-s-Review mit Early-Continue hält alle synchron; Warm-Pool & Prefetching halten Rundenstarts schnell.',
            '03 (Zwischenaudit → Nachbesserung): Das Zwischenaudit vom 24.11. zeigte konkrete Detailabweichungen. Best-of-N vereinheitlicht, formatDistance auf 0,1 km angepasst, truncate durch wrap-anywhere ersetzt und Backend-First-CI/CD (Neon → Render → Vercel) eingerichtet.',
            'Übergabe an Isabelle (Station 04): Wie bewerten wir Aufwand, Erkenntnisse und Softwarequalität?',
        ],
    },

    // =========================================================================
    // Station 04 — Aufwand & Qualität | Isabelle (14–18 · Zielzeit: 4:00 Min.)
    // =========================================================================

    14: {
        id: 14,
        stationId: 'qualitaet',
        theme: 'dark',
        layout: 'divider',
        sectionNumber: '04',
        kicker: 'Station 04 · Isabelle',
        title: 'Aufwand & Qualität',
        subtitle: 'Plan / Ist · Erkenntnisse · Tests & Fazit',
        durationSec: 10,
        notes: [
            'Kurzer Übergang (~5–10 Sek.) auf Station 04 — Isabelle übernimmt.',
        ],
    },

    15: {
        id: 15,
        stationId: 'qualitaet',
        theme: 'light',
        layout: 'hours',
        title: 'Aufwandsvergleich Plan / Ist',
        subtitle: 'Personenstunden je Arbeitspaket · Expertenschätzung',
        items: [
            { code: 'AP 01', label: 'Anforderungsanalyse & Planung', plan: '—', actual: '—', delta: '—' },
            { code: 'AP 02', label: 'UI / UX, 3D-Dioramen & Frontend', plan: '—', actual: '—', delta: '—' },
            { code: 'AP 03', label: 'Backend, Domain-Logik & PostgreSQL', plan: '—', actual: '—', delta: '—' },
            { code: 'AP 04', label: 'MET Norway, Leaflet & Multiplayer', plan: '—', actual: '—', delta: '—' },
            { code: 'AP 05', label: 'Testing, CI/CD, Doku & Präsentation', plan: '—', actual: '—', delta: '—' },
        ],
        total: { code: 'Σ', label: 'Gesamt (PStd.)', plan: '—', actual: '—', delta: '—' },
        risks: [
            { index: 'R1', title: 'Architektur-Pivot (3D)', text: 'Wechsel von Street View auf R3F-Dioramen & Leaflet' },
            { index: 'R2', title: 'Externe APIs & Betrieb', text: 'MET-Norway-Caching, Warm-Pool & Deploy' },
            { index: 'R3', title: 'Detailregeln & QS', text: '20 Anforderungen & 3-stufige Test-Suite' },
        ],
        footerBar: 'Transparenz: Plan- & Ist-Personenstunden fehlen im Repository (nicht erfunden) — echte Teamwerte vor Abgabe eintragen',
        durationSec: 60,
        notes: [
            'Zielzeit: ~1:00 Min. | OFFENER PFLICHTPUNKT VOR PRÜFUNG: In den Projektdateien sind keine Plan- oder Ist-Personenstunden dokumentiert. Keine Zahlen erfinden — echte Werte aus der schriftlichen Aufwandsschätzung bzw. Zeiterfassung vor dem Vortrag in slides.js eintragen.',
            'Rechts die mindestens 3 Schätzrisiken gemäß Prüfungsanforderung knapp erläutern und 1:1 mit dem schriftlichen Portfolio abgleichen.',
        ],
    },

    16: {
        id: 16,
        stationId: 'qualitaet',
        theme: 'dark',
        layout: 'learnings',
        title: 'Erkenntnisse & Reflexion',
        items: [
            {
                tag: '#plan-ist',
                title: 'Schätzbarkeit & Tracking',
                text: 'Laufende Zeiterfassung je AP ist zentral — Abweichungen & Risiken direkt aus echten Ist-Stunden ableiten.',
            },
            {
                tag: '#architektur',
                title: 'Entkopplung zahlt sich aus',
                text: 'Service-Grenze & reine Domain-Module (R20) erlaubten den 3D-Pivot ohne Umbau der Spiel- und Scoring-Logik.',
            },
            {
                tag: '#qualität',
                title: 'Früher Spec-Abgleich',
                text: 'Zwischenaudit gegen alle 20 Anforderungen deckte reale Lücken (R4, R9, R15) frühzeitig und steuerbar auf.',
            },
        ],
        durationSec: 55,
        notes: [
            'Zielzeit: ~55 Sek. | Pflichtbestandteil („Aufwandsgegenüberstellung Plan/Ist & Erkenntnisse“).',
            'Punkt 01 (nach Stundeneintrag): Konkret beantworten: (a) Welche APs lagen nah am Plan, welche wichen ab und warum? (b) Welche Pakete waren besonders schwer zu schätzen?',
            'Punkt 02: Saubere Trennung zwischen UI, Service-Schicht und Domain-Logik (R20) machte den späten Wechsel von Street View auf 3D-Dioramen beherrschbar.',
            'Punkt 03: Unit-Tests allein hätten z. B. das Street-View-SDK-Leak oder abgeschnittene UI-Labels nicht verhindert — erst das Audit gegen alle 20 Anforderungen schloss diese Lücken.',
        ],
    },

    17: {
        id: 17,
        stationId: 'qualitaet',
        theme: 'light',
        layout: 'quality',
        title: 'Anforderungen, Tests & CI/CD',
        subtitle: 'Stand Commit b877221 · 27.11.2026',
        audit: {
            passed: 19,
            partial: 1,
            total: 20,
            mandatoryPassed: 15,
            mandatoryTotal: 16,
            progression: 'Zwischenaudit 24.11.: 8 / 20 → Stand b877221: 19 / 20',
            note: 'R17 (HTTPS-Deploy & Safari/Edge): Pipeline konfiguriert — Live-Check vor Abgabe',
        },
        testing: {
            total: 377,
            files: 62,
            bars: [
                { label: 'Backend Unit', count: 173, detail: '173/173 live grün (Vitest)', pct: 100 },
                { label: 'Frontend Unit', count: 112, detail: '86 lokal grün · 26 Leaflet CI', pct: 65 },
                { label: 'Integration (PG 16)', count: 86, detail: '5 DB-Specs (Vitest)', pct: 50 },
                { label: 'E2E (Playwright)', count: 6, detail: '4 Specs × 3 Browser', pct: 12 },
            ],
            ciSteps: [ 'Changes', 'Lint & Build', 'Tests & E2E', 'Migrate → Render → Vercel' ],
            caveat: 'Keine Code-Coverage-Quote erhoben · Anhang A1 (Taste A): 20-Zeilen-Matrix',
        },
        durationSec: 60,
        notes: [
            'Zielzeit: ~1:00 Min. | Faktenbasierte Qualitätsbilanz für Commit b877221:',
            'Links (Anforderungen): Von 8/20 im Zwischenaudit auf 19/20 direkt im Quellcode umgesetzt & getestet (15/16 Pflicht + R17 konfiguriert). R17: Vercel/Render/Neon-CI/CD ist angelegt; Live-Erreichbarkeit & native Safari/Edge-Prüfung vor Abgabe verifizieren.',
            'Rechts (Tests & CI/CD): 377 automatisierte Testfälle in 62 Dateien über 4 Ebenen (173 Backend Unit live grün; 112 Frontend Unit; 86 Backend-Integration gegen PostgreSQL 16; 6 Full-Stack-Playwright-E2E über Chromium/Firefox/WebKit).',
            'Backend-First-CI/CD verhindert Frontend/Backend-Versionskonflikte (Prisma Migrate → Render Health Check → Vercel).',
        ],
    },

    18: {
        id: 18,
        stationId: 'qualitaet',
        theme: 'split',
        layout: 'statement',
        statementLines: [ 'Entdecken.', 'Raten.', 'Dazulernen.' ],
        eyebrow: 'Fazit',
        achieved: [
            '3D-Biom-Dioramen (7 Biome · 140 Orte), MET Norway & Leaflet ohne Karten-Keys',
            'Einzel- & Mehrspieler (2–16), 2-Runden-Tutorial, 3D-Avatar & /stats-Replays',
            'Entkoppelte Architektur (R20), 377 Testfälle & Backend-First-CI/CD',
        ],
        open: [
            'Live-Deployment (Vercel/Render/Neon) & native Browser final prüfen (R17)',
            'Team-Rollenmatrix & echte Plan/Ist-Stunden ergänzen',
            'Optional: Coverage-Reporting & weitere Standorte',
        ],
        durationSec: 55,
        notes: [
            'Zielzeit: ~55 Sek. | Roter Faden zurück zu Station 01: Aus der Idee „Geografie über Indizien“ ist eine spielbare Full-Stack-Webanwendung geworden.',
            'Kurz bilanzieren, was läuft und welche Restpunkte sauber abgeschlossen werden.',
            'Überleitung zur Live-Demo: „Statt weiter über TerraGuessr zu sprechen, spielen wir jetzt gemeinsam eine Runde live.“',
        ],
    },

    // =========================================================================
    // Live-Demo & Q&A | Gesamtes Team (19–20)
    // =========================================================================

    19: {
        id: 19,
        stationId: 'qualitaet',
        theme: 'dark',
        layout: 'demo',
        title: 'TerraGuessr live',
        subtitle: 'Live-Demo · 5–10 Minuten',
        steps: [
            { number: '01', title: 'Start & 3D-Avatar', text: 'Globus, Explorer-Avatar & Direktstart' },
            { number: '02', title: 'Setup', text: 'Easy / Medium / Hard & Rundenwahl' },
            { number: '03', title: 'Publikumsrunde', text: 'Biom & Live-Wetter gemeinsam deuten' },
            { number: '04', title: 'Auswertung', text: 'Zielort, 0,1-km-Distanz & Punkte' },
            { number: '05', title: 'Mehrspieler-Lobby', text: '6-stelliger Code, 2 Clients & 15-s-Review' },
        ],
        prompt: {
            label: 'Publikumsrunde',
            question: 'Wo auf der Welt sind wir?',
            hint: 'Deuten Sie Biom, Wetter & Tageszeit — wir setzen den Tipp gemeinsam auf der Karte.',
            clues: [ '3D-Biom', 'Temperatur & Regen', 'Wind & Tageszeit', 'Höhe & UV' ],
        },
        durationSec: 480,
        notes: [
            'Zielzeit: 5–10 Min. (Richtwert ~8 Min.) | Pflichtbestandteil & zentrale Publikumsaktivierung.',
            'VORBEREITUNG VOR DEM VORTRAG: 1) `docker compose up -d` & `npm run dev --prefix frontend` (:8080) starten — ODER Live-URL prüfen. 2) Keine Google-Maps-API-Keys nötig. 3) Zweites Browserfenster für Mehrspieler-Beitritt bereithalten.',
            'Notfall-Backup bei Netzausfall: Aktuelle Screenshots auf Folien 07–09. Danach weiter zu Folie 20 („Vielen Dank. Fragen?“).',
        ],
    },

    20: {
        id: 20,
        stationId: 'qualitaet',
        theme: 'dark',
        layout: 'qa',
        title: 'Vielen Dank.',
        question: 'Fragen?',
        byline: 'Maksym · Linus · Yevhen · Isabelle',
        academicLine: 'TerraGuessr · SWE Kurs B · Gruppe D · 2026',
        hint: '4 Min. Diskussion & Q&A · Taste A für Anhang A1 (20 Anforderungen)',
        durationSec: 240,
        notes: [
            'Zielzeit: 4 Min. Q&A (1 Min. pro Teammitglied).',
            'Diese Folie erst NACH Abschluss der Live-Demo einblenden; Fragen fair im 4er-Team aufteilen.',
            'Bei Detailfragen zu einzelnen der 20 Anforderungen: Taste A öffnet Anhang A1 (Vollständige Anforderungsmatrix Stand b877221).',
        ],
    },
}

/**
 * Optional appendix slide — strictly outside the main timed presentation flow.
 * Accessible on demand during Q&A via key `A` and included as an appendix in the static PDF export.
 */
export const APPENDIX_SLIDES = [
    {
        id: 'A1',
        stationId: 'qualitaet',
        theme: 'light',
        layout: 'appendix-audit',
        title: 'Alle 20 Anforderungen im Überblick',
        subtitle: 'Anhang A1 · Abgleich docs/ruquirements.md gegen Commit b877221 (27.11.2026)',
        rows: [
            { nr: 1, text: 'Zufälliger Landstandort (140 Orte · 7 Biome · ≥ 400 km)', obligation: 'muss', kano: 'Basis', status: 'umgesetzt' },
            { nr: 2, text: 'Submit Guess / Final Submit · Best-of-N · Sperre', obligation: 'muss', kano: 'Basis', status: 'umgesetzt' },
            { nr: 3, text: 'Live-Wetterdaten via MET Norway (≤ 120 Min.)', obligation: 'muss', kano: 'Basis', status: 'umgesetzt' },
            { nr: 4, text: 'Zielort bis Rundenende serverseitig verborgen', obligation: 'muss', kano: 'Basis', status: 'umgesetzt' },
            { nr: 5, text: 'Easy (6 Städte) · Medium (−100 Pkt.) · Hard (−20 s)', obligation: 'sollte', kano: 'Begeisterung', status: 'umgesetzt' },
            { nr: 6, text: 'Kern-Wetterdaten mit Einheiten bei Rundenstart', obligation: 'muss', kano: 'Basis', status: 'umgesetzt' },
            { nr: 7, text: 'Tipp über 6-Städte-Auswahl oder Leaflet-Weltkarte', obligation: 'muss', kano: 'Basis', status: 'umgesetzt' },
            { nr: 8, text: 'Beliebiges Ändern vor Bestätigung · Timeout-Wertung', obligation: 'muss', kano: 'Basis', status: 'umgesetzt' },
            { nr: 9, text: 'Haversine-Distanz in km (1 Dezimalstelle)', obligation: 'muss', kano: 'Basis', status: 'umgesetzt' },
            { nr: 10, text: 'Punkteformel (0–5.000 · ≤ 100 km = 5.000 · monoton)', obligation: 'muss', kano: 'Leistung', status: 'umgesetzt' },
            { nr: 11, text: 'Zielort, bester Tipp & alle Versuche auf Karte', obligation: 'muss', kano: 'Basis', status: 'umgesetzt' },
            { nr: 12, text: 'Nächste Runde ≤ 2 s (Warm-Pool & Prefetching)', obligation: 'muss', kano: 'Leistung', status: 'umgesetzt' },
            { nr: 13, text: 'Wetter-Timeout 3 s · max. 3 Orte · sauberer Abbruch', obligation: 'muss', kano: 'Basis', status: 'umgesetzt' },
            { nr: 14, text: 'Interaktives 2-Runden-Tutorial & Field Guide', obligation: 'sollte', kano: 'Begeisterung', status: 'umgesetzt' },
            { nr: 15, text: 'Einheitliche, responsive Wetteranzeige (ohne Clipping)', obligation: 'muss', kano: 'Basis', status: 'umgesetzt' },
            { nr: 16, text: 'Mehrspieler (2–16) · 15-s-Review · Rangliste & Rematch', obligation: 'sollte', kano: 'Begeisterung', status: 'umgesetzt' },
            { nr: 17, text: 'Öffentliches HTTPS-Deployment & Browser-Kompatibilität', obligation: 'muss', kano: 'Basis', status: 'konfiguriert' },
            { nr: 18, text: '6-Monats-Archivierung (Konten) & täglicher Cron-Purge', obligation: 'sollte', kano: 'Unerheblich', status: 'umgesetzt' },
            { nr: 19, text: 'Geheime Keys nur serverseitig (0 Karten-/Wetter-Keys)', obligation: 'muss', kano: 'Basis', status: 'umgesetzt' },
            { nr: 20, text: 'Trennung UI (services/index.ts) & reine Domain-Logik', obligation: 'muss', kano: 'Unerheblich', status: 'umgesetzt' },
        ],
        footnote: 'Gesamt: 19/20 direkt im Code umgesetzt & getestet · R17 als Vercel/Render/Neon-CI/CD + Playwright (Chromium/Firefox/WebKit) konfiguriert.',
    },
]

export function getSlide(id)
{
    return SLIDES[id] ?? null
}

export function getDefinedSlideIds()
{
    return Object.keys(SLIDES).map(Number).sort((a, b) => a - b)
}
