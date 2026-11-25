/**
 * Slide content - pure data, decoupled from SlideRenderer (rendering) and
 * PresentationController (navigation). Phase 4 proof of concept: one
 * temporary German demo slide per station, wired to that station's real
 * slideRange in PresentationStations.js. Slides 2-5, 7-10, 12-16 and 18-21
 * will be added later without touching the navigation architecture - see
 * PresentationController.getDefinedSlideIds().
 */
export const SLIDES = {
    1: {
        id: 1,
        stationId: 'konzept',
        layout: 'divider',
        eyebrow: '01 · Konzept',
        title: 'Von der Weltkarte zum begehbaren Raum',
        subtitle: 'TerraGuessr als interaktive 3D-Präsentation',
        body: [
            'TerraGuessr ist ein Geolocation-Ratespiel: Orte erkennen, auf der Karte schätzen, Distanz zählt.',
            'Für diese Präsentation wird dieselbe Identität - Farben, Formen, Typografie - in einen begehbaren 3D-Raum übersetzt.',
            'Vier thematische Stationen ersetzen klassische Folien: Konzept, Gameplay, Engineering, Qualität.',
        ],
    },
    6: {
        id: 6,
        stationId: 'gameplay',
        layout: 'divider',
        eyebrow: '02 · Gameplay',
        title: 'Ein Blick auf den Globus, eine Schätzung, ein Ergebnis',
        subtitle: 'Der Spielkern in drei Schritten',
        body: [
            'Ein Ort wird gezeigt - Foto, Panorama oder Ausschnitt.',
            'Die Spielerin platziert ihre Schätzung auf der Weltkugel.',
            'Die Distanz zum echten Ort bestimmt die Punktzahl der Runde.',
        ],
    },
    11: {
        id: 11,
        stationId: 'engineering',
        layout: 'divider',
        eyebrow: '03 · Engineering',
        title: 'Unter der Haube',
        subtitle: 'Technischer Stack dieser 3D-Umgebung',
        body: [
            'Three.js/WebGPU für Rendering, Rapier für Physik, GSAP für Animation.',
            'Datengetriebene Zonen: eine generische Area-Klasse statt Code pro Ort.',
            'Dieselbe Engine trägt jetzt auch die Präsentations-Choreografie.',
        ],
    },
    17: {
        id: 17,
        stationId: 'qualitaet',
        layout: 'divider',
        eyebrow: '04 · Qualität',
        title: 'Verlässlich bis ins Detail',
        subtitle: 'Wie Qualität in TerraGuessr entsteht',
        body: [
            'Automatisierte Tests und manuelle Prüfung im echten Browser.',
            'Performance-Budget: flüssige Bildrate bleibt Pflicht, nicht Kür.',
            'Jede Änderung wird gegen die bestehende Spielidentität geprüft.',
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
