/**
 * Slide content - pure data, decoupled from SlideRenderer (rendering) and
 * PresentationController (navigation).
 *
 * Phase 5: the full 21-slide academic deck, ported from the standalone,
 * source-audited presentation at
 * /Users/maxim/WebstormProjects/TerraGuessr-presentation
 * (src/config/presentation.config.ts + CONTENT_AUDIT.md), itself verified
 * against /Users/maxim/WebstormProjects/terraguessr's REQUIREMENTS_AUDIT.md,
 * the original Anforderungsanalyse PDF, package.json/Prisma stack, and git
 * history. See PRESENTATION_COMPLIANCE.md (repo root) for the full
 * requirement -> slide -> source traceability table and open TODOs.
 *
 * `notes` is speaker-only supplementary material - deliberately never read
 * by SlideRenderer/PresentationController. It exists purely as reference
 * data for whoever presents, kept out of the audience-facing DOM.
 *
 * Unconfirmed values (team roles, plan/ist hours) are carried over as
 * explicit placeholders/`null`, exactly as the audited source presentation
 * treats them - never asserted as fact on the visible slide.
 */
export const SLIDES = {

    // ---- Station: Konzept (01-05) ------------------------------------

    1: {
        id: 1,
        stationId: 'konzept',
        layout: 'title',
        eyebrow: 'HWR Berlin · Software Engineering · 2026',
        title: 'TerraGuessr',
        subtitle: 'Wo auf der Welt bist du?',
        byline: 'Maksym & Yevhen · Abschlusspräsentation',
        notes: [
            'Hallo zusammen! Stellt euch vor, ihr werdet irgendwo auf der Welt abgesetzt. Keine Adresse, nur die Umgebung. Woran würdet ihr erkennen, wo ihr seid?',
            'Ein bis zwei spontane Antworten aus dem Publikum zulassen.',
            'TerraGuessr als browserbasiertes Geografiespiel vorstellen.',
        ],
    },
    2: {
        id: 2,
        stationId: 'konzept',
        layout: 'agenda',
        eyebrow: 'Agenda',
        title: 'Vier Stationen, ein Rundgang',
        items: [
            { number: '01', label: 'Das Konzept', detail: 'Projektidee, Ziele, Team' },
            { number: '02', label: 'Produktrundgang', detail: 'Einzelspieler, Mehrspieler, Publikums-Challenge' },
            { number: '03', label: 'Engineering & Architektur', detail: 'Stack, Datenfluss, Aufwand, Herausforderungen' },
            { number: '04', label: 'Anforderungen & Qualität', detail: 'Anforderungsaudit, Testing' },
        ],
        notes: [
            'Die vier Kapitel kurz ankündigen: Konzept, Produktrundgang, Engineering & Architektur, Anforderungen & Qualität.',
            'Live-Demo und Fragerunde liegen bewusst außerhalb der vier Kapitel und folgen am Ende (Station Qualität).',
            'Hinweis: Redezeiten sind als Zwei-Personen-Szenario (Maksym/Yevhen) geplant, nicht als bestätigte Aufteilung der gesamten Gruppe.',
        ],
    },
    3: {
        id: 3,
        stationId: 'konzept',
        layout: 'divider',
        eyebrow: '01 · Konzept',
        title: 'Das Konzept',
        subtitle: 'Projektidee und das Team dahinter',
        body: [
            'Warum TerraGuessr: Geografie über Beobachtung statt Kartenlernen erleben.',
            'Wer das Projekt gebaut hat - und wer wofür zuständig war.',
        ],
        notes: [ 'Kurzer Übergang: „Zuerst zur Idee hinter TerraGuessr und zu uns als Team."' ],
    },
    4: {
        id: 4,
        stationId: 'konzept',
        layout: 'idea',
        eyebrow: 'Projektidee & Ziele',
        title: 'Die Welt spielerisch entdecken',
        subtitle: 'Geografisches Wissen trifft auf interaktive Spielerfahrung',
        goals: [
            { number: '01', title: 'Entdecken', text: 'Unbekannte Orte anhand eines Street-View-Panoramas und situativer Wetter-Hinweise erkunden.' },
            { number: '02', title: 'Raten', text: 'Den vermuteten Standort je nach Schwierigkeitsgrad auf einer Karte markieren oder aus einer Städteliste wählen.' },
            { number: '03', title: 'Vergleichen', text: 'Distanz und Punkte nachvollziehen und sich im Einzel- oder Mehrspielermodus messen.' },
        ],
        audience: 'Zielgruppe: Einzelspieler:innen und Gruppen, die Geografie über Beobachtung statt Kartenlernen erleben möchten.',
        scopeNote: '20 Anforderungen in der Analyse (13 Basis-, 2 Leistungs-, 3 Begeisterungs-, 2 Nebenmerkmale) - aktueller Umsetzungsstand in Station Qualität.',
        notes: [
            'Problem und Ziel erläutern: Geografisches Wissen nicht nur über Karten lernen, sondern über Beobachtung (Panorama, Wetter-Hinweise) und eigenes Raten erlebbar machen.',
            'Die drei Ziele kurz erklären: Entdecken (Panorama), Raten (Karte/Liste), Vergleichen (Punkte/Leaderboard).',
            'Klarstellen: Die Anforderungsanalyse definiert 20 Anforderungen mit unterschiedlicher Priorität (Kano-Modell) - der aktuelle Umsetzungsstand dazu folgt an der Station Qualität.',
        ],
    },
    5: {
        id: 5,
        stationId: 'konzept',
        layout: 'team',
        eyebrow: 'Team & Rollen',
        title: 'Wer TerraGuessr gebaut hat',
        subtitle: 'Zwei Entwickler, durchgängig per Git-Historie belegt',
        speakers: [
            { initials: 'MK', name: 'Maksym', role: 'Frontend & UI (vorläufig)', workPackages: [ 'UI / UX & Frontend', 'Spielablauf & Interaktion' ], accent: '#c0f66b' },
            { initials: 'YV', name: 'Yevhen', role: 'Backend & Spiellogik (vorläufig)', workPackages: [ 'Backend & Spiellogik', 'API- und Systemintegration' ], accent: '#57c4e8' },
        ],
        notes: [
            'Tatsächliche Rollen und Zuständigkeiten erklären.',
            'Achtung: Die Rollenbezeichnungen und Arbeitspakete sind vorläufig und müssen vor der Präsentation im Team bestätigt werden - siehe PRESENTATION_COMPLIANCE.md.',
            'Nicht aus der Commit-Historie auf exakte Rollen oder Arbeitsanteile schließen - Git zeigt nur Aktivität, keine Zuständigkeit. Bestätigt ist ausschließlich: genau zwei Personen committen im Repository (git log, Stand 2026-11-24).',
            'Offene Frage: Eine ältere Quelle nennt eine vierköpfige „Gruppe D" (Linus, Isabelle, Maksym, Yevhen) - nur die letzten zwei erscheinen im TerraGuessr-Repository. Vor der Präsentation klären.',
            'Überleitung: „Damit zum Produkt selbst - wie fühlt sich TerraGuessr tatsächlich an?"',
        ],
    },

    // ---- Station: Gameplay / Produktrundgang (06-10) -----------------

    6: {
        id: 6,
        stationId: 'gameplay',
        layout: 'divider',
        eyebrow: '02 · Produktrundgang',
        title: 'Produktrundgang',
        subtitle: 'Vom Startbildschirm bis zur Punktevergabe',
        body: [
            'Echte Screenshots der laufenden Anwendung (Stand 2026-11-21).',
            'Einzelspieler, Mehrspieler - und eine kleine Publikums-Challenge.',
        ],
        notes: [ 'Übergang: „Schauen wir uns an, wie sich das in der Anwendung konkret zeigt."' ],
    },
    7: {
        id: 7,
        stationId: 'gameplay',
        layout: 'media',
        eyebrow: 'Startbildschirm',
        title: 'Der erste Eindruck',
        subtitle: 'Direkter Einstieg in Einzel- oder Mehrspieler, optionales Tutorial',
        bullets: [
            { title: 'Zwei Einstiege', text: 'Die Startseite führt direkt zu „Play singleplayer" oder „Multiplayer" - Anmeldung ist optional.' },
            { title: 'How to play', text: 'Ein manuell aufrufbares Tutorial erklärt Panorama, Hinweise, Tippabgabe und Punkteberechnung in vier Schritten.' },
        ],
        screenshots: [
            { src: '/presentation/screens/start-home.webp', alt: 'TerraGuessr Startbildschirm', caption: 'Echter Screenshot, terraguessr/docs/screenshots-v2/home-desktop.png' },
            { src: '/presentation/screens/start-tutorial.webp', alt: 'TerraGuessr Tutorial „How to play"', caption: 'Echter Screenshot, terraguessr/docs/screenshots-v2/how-to-play-desktop.png' },
        ],
        notes: [
            'Startseite zeigen: direkter Einstieg in Einzelspieler oder Mehrspieler, optionale Anmeldung.',
            'Auf das optionale, interaktive Tutorial ("How to play") hinweisen - laut Anforderungsanalyse ein Begeisterungsmerkmal (Nr. 14), laut Audit die am besten getestete Anforderung des Projekts.',
            'Screenshots sind echte Aufnahmen der Anwendung (Stand 2026-11-21), keine Mockups.',
        ],
    },
    8: {
        id: 8,
        stationId: 'gameplay',
        layout: 'media',
        eyebrow: 'Einzelspieler',
        title: 'Eine Runde. Vier Schritte.',
        subtitle: 'Von der unbekannten Umgebung bis zum Ergebnis',
        bullets: [
            { title: '1 · Erkunden', text: 'Ein Street-View-Panorama erscheint; Wetter und Gelände liefern erste Hinweise ("Geographic Intelligence").' },
            { title: '2 · Lokalisieren', text: 'Je nach Schwierigkeitsgrad: Städteliste (Leicht) oder Weltkarte mit/ohne Ländergrenzen (Mittel/Schwer).' },
            { title: '3 · Bestätigen', text: 'Der Tipp wird serverseitig entgegengenommen und validiert.' },
            { title: '4 · Auswerten', text: 'Distanz (Haversine-Formel) und Punkte (linear fallende Kurve) werden angezeigt, der echte Standort aufgedeckt.' },
        ],
        screenshots: [
            { src: '/presentation/screens/singleplayer-setup.webp', alt: 'Schwierigkeitsauswahl Einzelspieler', caption: 'Echter Screenshot, singleplayer-setup-desktop.png' },
            { src: '/presentation/screens/singleplayer-round.webp', alt: 'Einzelspieler-Runde mit Panorama und Hinweisen', caption: 'Echter Screenshot, singleplayer-game-easy-desktop.png' },
            { src: '/presentation/screens/singleplayer-result.webp', alt: 'Rundenergebnis mit Distanz und Punkten', caption: 'Echter Screenshot, singleplayer-round-result-desktop.png' },
        ],
        notes: [
            'Rundenablauf anhand der vier Schritte erklären: Standort erscheint (Street-View-Panorama), Hinweise lesen (Wetter/Gelände), Tipp abgeben (Karte oder Städteliste), Punkte erhalten.',
            'Die drei Schwierigkeitsgrade kurz nennen (Leicht: Städteliste; Mittel: Weltkarte mit Ländergrenzen; Schwer: Weltkarte ohne Ländergrenzen).',
            'Nur tatsächlich verifizierte Abläufe als verfügbar bezeichnen - Details und Einschränkungen folgen gebündelt im Anforderungsaudit (Station Qualität), hier nicht vorwegnehmen.',
        ],
    },
    9: {
        id: 9,
        stationId: 'gameplay',
        layout: 'media',
        eyebrow: 'Mehrspieler',
        title: 'Gemeinsam raten',
        subtitle: 'Geteilte Runden, gleiche Bedingungen, ein Leaderboard',
        bullets: [
            { title: 'Lobby per Code', text: 'Ein Lobby-Code lässt weitere Teilnehmende der gleichen Runde beitreten; der Host startet das Match.' },
            { title: 'Gleiche Runden für alle', text: 'Alle Mitspieler:innen erhalten denselben Standort und dieselben Bedingungen; nach jeder Runde ein live aktualisiertes Leaderboard.' },
        ],
        screenshots: [
            { src: '/presentation/screens/multiplayer-lobby.webp', alt: 'Mehrspieler-Lobby mit Beitrittscode', caption: 'Echter Screenshot, mp-lobby-waiting-desktop.png' },
            { src: '/presentation/screens/multiplayer-round.webp', alt: 'Mehrspieler-Runde mit Live-Leaderboard', caption: 'Echter Screenshot, multiplayer-game-desktop.png' },
        ],
        footnote: 'Bestätigt durch einen echten Zwei-Sitzungs-Live-Test (Audit vom 24.11.2026) - stärkste Evidenzbasis aller 20 Anforderungen.',
        notes: [
            'Lobby-Erstellung/-Beitritt über einen Code zeigen, gemeinsame Runden und das Live-Leaderboard erklären.',
            'Sowohl Backend-Logik als auch die Frontend-Anbindung sind implementiert: der Service-Boundary im committeten Code (frontend/src/services/index.ts, HEAD 4bee821) verweist auf die echte HTTP-Implementierung, nicht auf eine Mock-Schicht.',
            'Bestätigt über einen Live-Test mit zwei unabhängigen Clients (Audit vom 24.11.2026): identische Rundendaten, korrekt sortiertes Leaderboard.',
        ],
    },
    10: {
        id: 10,
        stationId: 'gameplay',
        layout: 'challenge',
        eyebrow: 'Publikums-Challenge',
        title: 'Wo auf der Welt seid ihr hier?',
        screenshot: {
            src: '/presentation/screens/audience-challenge.webp',
            alt: 'Street-View-Panorama einer unbekannten Stadt, Publikums-Challenge',
            caption: 'Echter Screenshot, sp-game-hard-desktop.png - Antwort in den Sprechernotizen',
        },
        instructions: [
            'Kontinent oder Region genügt als Antwort - kurz im Publikum sammeln.',
            'Auflösung und Quelle befinden sich ausschließlich in den Sprechernotizen.',
        ],
        notes: [
            'Publikum auffordern, anhand des gezeigten Panoramas zu raten, wo dieser Ort liegt (Kontinent/Region genügt).',
            'TODO - Verifizierung erforderlich: Die exakte Antwort vor der Präsentation über die Bildnachweis-/Standortangabe der Anwendung verifizieren (Screenshot zeigt Google-Street-View-Zuschreibung „© Jesús"); hier nicht raten.',
            'Dies ist ein Präsentationsformat auf Basis eines echten Screenshots, kein dokumentiertes TerraGuessr-Feature - weder Spezifikation noch Quellcode kennen eine "Publikums-Challenge".',
            'Statischer Fallback ist bereits erfüllt: Diese Station nutzt einen echten, fest eingebetteten Screenshot und benötigt keine Live-Internetverbindung.',
        ],
    },

    // ---- Station: Engineering (11-16) ---------------------------------

    11: {
        id: 11,
        stationId: 'engineering',
        layout: 'divider',
        eyebrow: '03 · Engineering',
        title: 'Engineering & Architektur',
        subtitle: 'Wie das Produkt technisch umgesetzt ist',
        body: [
            'Technologie-Stack, Datenfluss einer Spielrunde, Aufwand und Herausforderungen.',
            'Alle Aussagen gegen Quellcode, package.json und Prisma-Schema verifiziert (Stand 24.11.2026).',
        ],
        notes: [ 'Übergang: „Jetzt zur technischen Seite - wie ist das Ganze gebaut?"' ],
    },
    12: {
        id: 12,
        stationId: 'engineering',
        layout: 'stack',
        eyebrow: 'Technologie-Stack',
        title: 'Zwei Stacks, zwei Zwecke',
        subtitle: 'Das TerraGuessr-Produkt - und das Werkzeug, mit dem es gerade präsentiert wird',
        product: {
            frontend: { title: 'Frontend', subtitle: 'UI, Karte, Spielablauf', note: 'React 19 · TypeScript · Vite · Tailwind CSS v4', stack: [ 'React 19', 'TypeScript', 'Vite', 'Tailwind CSS', 'React Three Fiber' ] },
            backend: { title: 'Backend', subtitle: 'Fastify-Server, geteilte Spiellogik', note: 'Scoring & Distanzberechnung: gemeinsame, abhängigkeitsfreie Module', stack: [ 'Fastify 5', 'TypeScript', 'Prisma 5', 'TypeBox' ] },
            data: { title: 'Datenhaltung', subtitle: 'Spiel- und Benutzerdaten', stack: [ 'PostgreSQL 16' ] },
            external: 'Google Maps / Street View · Google OAuth · Open-Meteo Wetter-API',
            quality: [ 'Vitest', 'Playwright', 'GitHub Actions CI', 'Docker Compose' ],
        },
        environmentNote: 'Diese begehbare 3D-Umgebung ist das Präsentationswerkzeug für diesen Vortrag - kein Teil des TerraGuessr-Produkts. Eigener, komplett separater Stack: Three.js/WebGPU (Rendering), Rapier3D (Physik), GSAP (Animation), Vite, Stylus, einfaches JavaScript ohne UI-Framework.',
        notes: [
            'Frontend, Backend und Datenhaltung anhand der tatsächlich verwendeten Technologien erläutern (verifiziert gegen package.json und Prisma-Schema, Stand 24.11.2026).',
            'Die UI/Spiellogik-Trennung (Anforderung Nr. 20) ist laut Audit bestanden: Scoring und Distanzberechnung liegen in gemeinsamen, abhängigkeitsfreien Modulen, die von Einzel- und Mehrspieler-Pfaden gleichermaßen genutzt werden.',
            'Explizit klarstellen, dass dieser begehbare 3D-Raum ein separates Werkzeug mit eigenem Stack ist, nicht Teil des TerraGuessr-Produkts.',
            'Qualitätssicherung kurz nennen: Tests, CI-Pipeline, Docker - Details folgen an der Station Qualität.',
        ],
    },
    13: {
        id: 13,
        stationId: 'engineering',
        layout: 'flow',
        eyebrow: 'Architektur & Ablauf',
        title: 'Ablauf einer Spielrunde',
        subtitle: 'Vom Rundenstart bis zum gespeicherten Ergebnis',
        steps: [
            { number: '1', actor: 'Client', title: 'Sitzung & Runde starten', text: 'POST /singleplayer/games, dann POST .../rounds.' },
            { number: '2', actor: 'Backend', title: 'Standort wählen', text: 'Server wählt Panorama-ID und Kandidaten serverseitig aus einer festen Standortliste.' },
            { number: '3', actor: 'Client', title: 'Panorama & Hinweise zeigen', text: 'Street-View-Panorama plus Wetter-/Gelände-Hinweise ("Geographic Intelligence").' },
            { number: '4', actor: 'Client', title: 'Tipp abgeben', text: 'POST .../rounds/:id/guess mit Koordinaten oder Städte-Auswahl.' },
            { number: '5', actor: 'Backend', title: 'Validieren & berechnen', text: 'Serverseitige Bereichsprüfung, Haversine-Distanz, Punkteformel (linear, 5000 → 0).' },
            { number: '6', actor: 'Datenbank', title: 'Ergebnis festhalten', text: 'Versuch bzw. Ergebnis in Prisma/PostgreSQL gespeichert; Antwort inkl. echtem Standort an den Client.' },
        ],
        multiplayerNote: 'Mehrspieler-Synchronisation läuft über wiederholte Abfragen eines Endpunkts (Polling), nicht über WebSockets.',
        caveat: 'Vorsichtig formuliert: „Standort erst nach Bestätigung" gilt auf API-Ebene (live bestätigt). Die client-seitige Street-View-Komponente löst die Panorama-Position unabhängig davon auf, was diesen Schutz in der Praxis einschränkt - Details folgen bei „Herausforderungen & Lösungen" und im Anforderungsaudit, Nr. 4.',
        notes: [
            'Eine Einzelspieler-Runde Schritt für Schritt durchgehen: Sitzung anlegen, Runde starten, Panorama + Hinweise anzeigen, Tipp serverseitig validieren, Distanz/Punkte serverseitig berechnen, Ergebnis zurückgeben.',
            'Betonen: Validierung und Punkteberechnung liegen serverseitig - nicht im Client.',
            'Mehrspieler-Synchronisation erfolgt über wiederholte Abfragen (Polling) eines Endpunkts, nicht über WebSockets.',
            'Wichtiger Vorbehalt: Die Offenlegung „Standort erst nach Bestätigung" gilt auf API-Ebene. Die client-seitige Street-View-Komponente löst die Panorama-Position unabhängig davon auf - das schränkt diesen Schutz in der Praxis ein (siehe Herausforderungen, Anforderung Nr. 4).',
        ],
    },
    14: {
        id: 14,
        stationId: 'engineering',
        layout: 'table-hours',
        eyebrow: 'Aufwandsschätzung',
        title: 'Plan vs. Ist',
        subtitle: 'Aufwand in Personenstunden',
        items: [
            { label: 'Anforderungsanalyse & Planung', planHours: null, actualHours: null },
            { label: 'UI / UX & Frontend', planHours: null, actualHours: null },
            { label: 'Backend & Spiellogik', planHours: null, actualHours: null },
            { label: 'API- und Systemintegration', planHours: null, actualHours: null },
            { label: 'Tests, Fehlerbehebung & Deployment', planHours: null, actualHours: null },
        ],
        note: 'TODO - Verifizierung erforderlich: Im Projekt-Repository wurde keine Aufwandsschätzung gefunden (geprüft: git log, repoweite Suche nach Planungs-/Zeiterfassungsdokumenten). Ohne diese Zahlen zeigt die Tabelle ausschließlich Platzhalter.',
        notes: [
            'Mit welcher Methode die ursprünglichen Planwerte zustande kamen, ist nicht dokumentiert - im Team klären und hier ergänzen.',
            'Welches Arbeitspaket lag am nächsten am Plan? Welches wich am stärksten ab? Warum?',
            'TODO - Verifizierung erforderlich: Im Projekt-Repository wurde keine Aufwandsschätzung gefunden - Zahlen müssen vor der Präsentation aus anderer Quelle (z. B. Team-Notizen, Zeiterfassung) ergänzt werden.',
        ],
    },
    15: {
        id: 15,
        stationId: 'engineering',
        layout: 'table-challenges',
        eyebrow: 'Herausforderungen & Lösungen',
        title: 'Was uns gefordert hat',
        subtitle: 'Technische Herausforderungen - gelöst und offen',
        items: [
            {
                challenge: 'Mehrspieler-Synchronisation',
                solution: 'Gemeinsame Domain-Logik (Distanz/Punkte) plus serverseitige Lobby- und Match-Verwaltung; per Live-Test mit zwei unabhängigen Clients bestätigt.',
                status: 'gelöst',
                source: 'Audit R16, 24.11.2026',
            },
            {
                challenge: 'Standort vor Bestätigung verdeckt halten',
                solution: 'Die client-seitige Street-View-Anbindung löst die echten Koordinaten im Browser auf, bevor der Tipp bestätigt ist - laut Audit das größte architektonische Risiko des Projekts. Lösungsansätze (serverseitiges Rendering/Proxy) sind in Diskussion.',
                status: 'offen',
                source: 'Audit R4, 24.11.2026',
            },
            {
                challenge: 'Mock-Daten vs. echte Backend-Anbindung',
                solution: 'Nach dem kompletten Frontend-Neuaufbau lief die UI zunächst gegen eine Mock-Datenschicht (dokumentiert in docs/phase2-integration-checklist.md, 21.11.2026). Ein einziger Swap-Point (services/index.ts) ermöglichte danach die Umstellung auf die echte Fastify-API ohne Komponentenänderungen - der committete Code (HEAD 4bee821) verweist bereits auf die HTTP-Implementierung.',
                status: 'gelöst',
                source: 'docs/phase2-integration-checklist.md (21.11.2026); services/index.ts, Audit R16/R20 (24.11.2026)',
            },
        ],
        notes: [
            'Die Mehrspieler-Synchronisation als gelöstes Beispiel erläutern: gemeinsame Domain-Logik plus serverseitige Lobby-Verwaltung, bestätigt durch einen Live-Test mit zwei unabhängigen Clients.',
            'Die Spannung zwischen client-seitiger Street-View-Anbindung und der Anforderung "Standort verdeckt halten" ehrlich als offenen Punkt benennen - laut Audit das größte architektonische Risiko des Projekts.',
            'Die Mock-/Echt-Umstellung (dritter Punkt) als bereits abgeschlossenes Beispiel zeigen: ein einziger Swap-Point hat die spätere Integration ohne Komponentenänderungen ermöglicht.',
            'Soziale/organisatorische Herausforderungen sind im Projekt nicht dokumentiert - nur technische Befunde sind belegt (siehe PRESENTATION_COMPLIANCE.md).',
        ],
    },
    16: {
        id: 16,
        stationId: 'engineering',
        layout: 'learnings',
        eyebrow: 'Gewonnene Erkenntnisse',
        title: 'Was wir mitnehmen',
        items: [
            { number: '01', title: 'Sicherheit früh verankern', text: 'Client-seitige APIs früh gegen Anforderungen wie „Standort verdeckt halten" prüfen, bevor sie fest verbaut werden.' },
            { number: '02', title: 'Abweichungen dokumentieren statt stillschweigend bauen', text: 'Mehrfachversuch-Verhalten und abweichende Kandidatenzahl im Leicht-Modus wichen von der Spezifikation ab, ohne dass dies im Projekt dokumentiert wurde.' },
            { number: '03', title: 'Nur Live-Tests zeigen Live-Fehler', text: 'Tests, die standardmäßig nur gegen Mocks laufen, lassen reale Integrationsfehler zunächst unentdeckt.' },
        ],
        notes: [
            'Die drei Erkenntnisse jeweils an ein konkretes Beispiel aus den Herausforderungen bzw. dem Audit zurückbinden, statt sie abstrakt zu lassen.',
            'Besonders die CI-Erkenntnis betonen: Ein Teil der End-to-End-Tests läuft standardmäßig nur gegen Mocks - dadurch blieben reale Integrationsfehler zunächst unentdeckt.',
        ],
    },

    // ---- Station: Qualität (17-21) -------------------------------------

    17: {
        id: 17,
        stationId: 'qualitaet',
        layout: 'divider',
        eyebrow: '04 · Qualität',
        title: 'Anforderungen & Qualität',
        subtitle: 'Was der Audit über den aktuellen Stand zeigt',
        body: [
            'Anforderungsaudit, Testing-Strategie, Live-Demo und Abschluss.',
            'Ehrlich bilanziert: erfüllt, teilweise erfüllt, nicht erfüllt.',
        ],
        notes: [ 'Übergang: „Wie ehrlich hält das Produkt, was die Spezifikation verlangt? Das zeigt unser Audit."' ],
    },
    18: {
        id: 18,
        stationId: 'qualitaet',
        layout: 'audit',
        eyebrow: 'Anforderungsaudit',
        title: 'Acht von zwanzig bestanden',
        subtitle: 'Audit vom 24.11.2026 - Live-Tests, Code-Analyse, Datenbank-Inspektion',
        summary: { totalPass: 8, totalPartial: 7, totalFail: 5, total: 20, mandatoryPass: 6, mandatoryTotal: 16 },
        methodology: [
            'Live-Tests gegen laufenden Dev-Stack (Datenbank, Backend, Frontend)',
            'Quellcode-Analyse mit konkreten Datei- und Zeilenverweisen',
            'Automatisierte Tests: 106/106 Unit-, 64/64 Integrationstests',
            'Direkte Datenbank-Inspektion und Screenshot-Abgleich',
        ],
        rows: [
            { nr: 4, text: 'Standort vor Bestätigung verdeckt halten', status: 'nicht bestanden', evidence: 'Client löst echte Koordinaten via Street-View-API vor Bestätigung auf.', critical: true },
            { nr: 5, text: 'Drei Schwierigkeitsgrade mit festen Regeln', status: 'nicht bestanden', evidence: 'Leicht zeigt 6 statt 4 Kandidaten; Schwer entspricht in den Ländergrenzen noch Mittel.' },
            { nr: 9, text: 'Distanzberechnung in km, 1 Nachkommastelle', status: 'nicht bestanden', evidence: 'Haversine-Berechnung korrekt, Anzeige rundet nicht spezifikationsgemäß.' },
            { nr: 15, text: 'Konsistente, responsive Wetteranzeige', status: 'nicht bestanden', evidence: 'Abgeschnittene Wetter-/Städtenamen-Labels bei Desktop-Breite, im Screenshot bestätigt.' },
            { nr: 17, text: 'Öffentliches HTTPS-Deployment', status: 'nicht bestanden', evidence: 'Kein live erreichbares Deployment vorhanden.' },
            { nr: 1, text: 'Zufällige, gültige Standortwahl', status: 'teilweise', evidence: 'Kryptografisch zufällige Auswahl aus 30 kuratierten Standorten; keine automatisierte Landflächen-Prüfung.' },
            { nr: 19, text: 'Geheime API-Keys nur serverseitig', status: 'teilweise', evidence: 'Code trennt Schlüssel korrekt; in dieser Umgebung sind Server- und Public-Key aktuell identisch konfiguriert.' },
            { nr: 14, text: 'Interaktives Tutorial', status: 'bestanden', evidence: '7/7 End-to-End-Tests live bestanden - laut Audit am besten abgesicherte Anforderung.' },
            { nr: 16, text: 'Mehrspieler-Lobby mit Leaderboard', status: 'bestanden', evidence: 'Live-Test mit zwei unabhängigen Clients: gleiche Runde, korrekt sortiertes Leaderboard.' },
            { nr: 20, text: 'Trennung UI / Spiellogik', status: 'bestanden', evidence: '106/106 Unit-Tests ohne Datenbank; Domain-Module ohne Framework-Abhängigkeit.' },
        ],
        closing: 'Kein Punkt wurde als „nicht umsetzbar" oder „nicht überprüfbar" bewertet - jede Anforderung hatte mindestens eine Teilumsetzung und einen nachvollziehbaren Prüfweg. Vollständige 20-Zeilen-Tabelle: REQUIREMENTS_AUDIT.md im Projekt terraguessr.',
        notes: [
            'Die Gesamtzahlen nennen: 8 von 20 Anforderungen vollständig bestanden, 7 teilweise, 5 nicht bestanden; bei den 16 verpflichtenden („Basis"-)Anforderungen 6 von 16 bestanden.',
            'Den kritischsten Befund transparent erklären: Die client-seitige Google-Street-View-Anbindung löst die echten Koordinaten im Browser auf, bevor der Tipp bestätigt wird - das widerspricht Anforderung Nr. 4 direkt.',
            'Betonen, dass kein Punkt als "nicht umsetzbar" bewertet wurde - jede Anforderung hat mindestens eine Teilumsetzung und einen nachvollziehbaren Prüfweg (Code, Live-Test oder beides).',
            'Diese Station zeigt eine verdichtete Auswahl von 10 der 20 Zeilen (Vortragstauglichkeit) - auf Nachfrage auf die vollständige Tabelle in REQUIREMENTS_AUDIT.md verweisen.',
        ],
    },
    19: {
        id: 19,
        stationId: 'qualitaet',
        layout: 'testing',
        eyebrow: 'Testing & Qualitätssicherung',
        title: 'Drei Testebenen, eine CI-Pipeline',
        tiers: [
            { label: 'Unit-Tests', tool: 'Vitest', result: '106 / 106 bestanden', note: 'Keine Datenbank erforderlich - Domain-Module sind reine Funktionen.' },
            { label: 'Integrationstests', tool: 'Vitest + PostgreSQL', result: '64 / 64 bestanden', note: 'Gegen eine isolierte, nach dem Lauf verworfene Test-Datenbank.' },
            { label: 'End-to-End (Tutorial)', tool: 'Playwright', result: '7 / 7 bestanden', note: 'Live gegen den echten Dev-Server - laut Audit der am besten getestete Bereich.' },
        ],
        ciSteps: [
            'GitHub Actions, drei Jobs: Backend, Frontend, E2E',
            'Je Job: Lint, Typecheck, Build, automatisierte Tests',
            'Backend-Job läuft gegen einen echten PostgreSQL-Service-Container',
            'Auslöser: Push/PR auf main und integration/phase1',
        ],
        caveats: [
            'Testanzahl ist keine Code-Abdeckung - im Projekt existiert keine Coverage-Kennzahl.',
            'Ein Teil der E2E-Spezifikationen gegen echte Kartendienste benötigt reale Zugangsdaten und läuft standardmäßig nicht in der CI - genau dieser Pfad enthielt laut Audit die schwerwiegendsten Befunde (Nr. 4, Nr. 5).',
        ],
        notes: [
            'Die drei Testebenen nennen: Unit-Tests (Vitest), Integrationstests (gegen eine echte, isolierte Postgres-Instanz), End-to-End-Tests (Playwright).',
            'Explizit klarstellen: Testanzahl ist keine Code-Abdeckung - im Projekt existiert keine Coverage-Kennzahl, also wird auch keine genannt.',
            'Die CI-Pipeline kurz erläutern (GitHub Actions, drei Jobs: Backend, Frontend, E2E).',
            'Transparent benennen: Ein Teil der E2E-Spezifikationen gegen echte Kartendienste läuft standardmäßig nicht in der CI und benötigt echte Zugangsdaten - dadurch bleiben manche Integrationsfehler zunächst unentdeckt.',
        ],
    },
    20: {
        id: 20,
        stationId: 'qualitaet',
        layout: 'demo',
        eyebrow: 'Live-Demo',
        title: 'Jetzt live: die echte Anwendung',
        subtitle: 'Kein öffentliches Deployment (Audit Nr. 17) - die Demo läuft lokal',
        steps: [
            { number: '01', label: 'Start & Tutorial zeigen' },
            { number: '02', label: 'Einzelspieler-Runde spielen' },
            { number: '03', label: 'Mehrspieler-Lobby zeigen' },
        ],
        fallbackText: 'Kein öffentliches Deployment (Audit Nr. 17) - Demo läuft lokal über „npm run dev" im Ordner terraguessr/frontend. Backup: die echten Screenshots an der Station Produktrundgang.',
        returnNote: 'Rückkehr: Browser-Tab bzw. Fenster zu dieser 3D-Präsentation zurückwechseln und Esc drücken - die Erkundung setzt exakt an der vorherigen Position fort.',
        notes: [
            'Es existiert kein öffentliches Deployment (Anforderungsaudit, Nr. 17 nicht bestanden) - die Demo läuft lokal über `npm run dev` im Ordner terraguessr/frontend, ohne Datenbank oder Docker.',
            'Ablaufvorschlag (ca. 7 Minuten): 0:00-1:00 Startseite und Tutorial zeigen · 1:00-3:00 Einzelspieler-Runde spielen, Publikum nach Hinweisen fragen · 3:00-5:00 Mehrspieler-Lobby mit zwei Geräten zeigen (echte Anbindung, kein Mock) · 5:00-7:00 Zusammenfassung und Rückkehr zur Präsentation.',
            'Vorab auf dem Vortragsgerät testen. Backup: die Screenshots an der Station Produktrundgang. Kein Backup als Live-Demo ausgeben.',
            'Technisch: terraguessr läuft als eigener Prozess/Tab neben diesem 3D-Fenster - kein Iframe, keine Integration. Rückkehr per Tab-/Fensterwechsel und Esc.',
        ],
    },
    21: {
        id: 21,
        stationId: 'qualitaet',
        layout: 'conclusion',
        eyebrow: 'Abschluss',
        lines: [ 'Entdecken.', 'Raten.', 'Dazulernen.' ],
        subline: 'Von der Projektidee zum Geografie-Spiel - und zu konkreten Erkenntnissen über Software Engineering.',
        achievements: [
            'Die drei Projektziele (Entdecken, Raten, Vergleichen) sind in Einzel- und Mehrspieler funktional umgesetzt und live bestätigt.',
            'Von 20 Anforderungen: 8 vollständig, 7 teilweise bestanden - keine als „nicht umsetzbar" bewertet.',
        ],
        limitations: [
            'Größte offene Einschränkung: Standort wird vor Bestätigung client-seitig offengelegt (Anforderung Nr. 4, kritisch).',
            'Kein öffentliches Deployment; Team-Rollen und Aufwandsschätzung bleiben zu bestätigen (siehe PRESENTATION_COMPLIANCE.md).',
        ],
        closing: [ 'Danke.', 'Fragen?' ],
        notes: [
            'TerraGuessr verbindet Geografie, interaktive Spielmechanik und Softwareentwicklung.',
            'Neben dem Produkt haben wir wichtige Erkenntnisse über Planung, Integration und Qualitätssicherung gewonnen - einschließlich der Punkte, die laut Audit noch offen sind.',
            'Vielen Dank für eure Aufmerksamkeit. Habt ihr Fragen?',
        ],
    },
}

export function getSlide(id)
{
    return SLIDES[id] ?? null
}

export function getDefinedSlideIds()
{
    return Object.keys(SLIDES).map(Number).sort((a, b) => a - b)
}
