import gsap from 'gsap'
import { Game } from '../Game.js'
import { STATION_ORDER, STATIONS } from './PresentationStations.js'

/**
 * Phase 6 — Creative direction & visual design.
 *
 * The 21-slide deck is now art-directed as an extension of the TerraGuessr
 * universe rather than a generic card grid. Every layout has a distinct,
 * intentional composition driven by typography, scale, geometry and negative
 * space — while every verified fact, speaker note and TODO from slides.js is
 * preserved verbatim.
 *
 * Shared SVG primitives (faceted icosahedron earth, the four station
 * landmarks, the sequence diagram) are generated as pure string builders so
 * they stay deterministic and can be reused as motion targets in Phase 7.
 */

// Layouts whose content needs the full-viewport stage rather than the
// compact editorial column.
const WIDE_LAYOUTS = new Set([
    'idea', 'media', 'challenge', 'stack', 'flow', 'learnings',
    'table-hours', 'table-challenges', 'audit', 'testing', 'demo',
])

// ---------------------------------------------------------------------------
// SVG primitives (pure string builders — reusable, deterministic)
// ---------------------------------------------------------------------------

const PALETTE = {
    space950: '#090718', space900: '#0e0b20', space850: '#14112a',
    space800: '#1a1636', space700: '#221c41', space600: '#2b2452',
    space500: '#352d64', cream: '#fbf7ee', muted: '#bdb5d8',
    subtle: '#948bac', lime300: '#d7ff96', lime400: '#c0f66b',
    lime500: '#a8e04e', lime600: '#86c334', ink: '#1b2a10',
    amber: '#ffb45e', sky: '#57c4e8', violet: '#9d7dff', rose: '#f27f88',
}

function hexToRgb(hex)
{
    const h = String(hex ?? '').replace('#', '')
    if(h.length < 6)
        return '192, 246, 107'
    const r = parseInt(h.slice(0, 2), 16)
    const g = parseInt(h.slice(2, 4), 16)
    const b = parseInt(h.slice(4, 6), 16)
    return Number.isFinite(r) && Number.isFinite(g) && Number.isFinite(b) ? `${r}, ${g}, ${b}` : '192, 246, 107'
}

function icosahedron()
{
    const t = (1 + Math.sqrt(5)) / 2
    const raw = [
        [ -1,  t, 0 ], [ 1, t, 0 ], [ -1, -t, 0 ], [ 1, -t, 0 ],
        [ 0, -1, t ], [ 0, 1, t ], [ 0, -1, -t ], [ 0, 1, -t ],
        [ t, 0, -1 ], [ t, 0, 1 ], [ -t, 0, -1 ], [ -t, 0, 1 ],
    ]
    const verts = raw.map((v) =>
    {
        const n = Math.hypot(v[0], v[1], v[2])
        return [ v[0] / n, v[1] / n, v[2] / n ]
    })

    const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2])
    let min = Infinity
    for(let i = 0; i < verts.length; i++)
        for(let j = i + 1; j < verts.length; j++)
            min = Math.min(min, dist(verts[i], verts[j]))

    const edges = []
    for(let i = 0; i < verts.length; i++)
        for(let j = i + 1; j < verts.length; j++)
            if(Math.abs(dist(verts[i], verts[j]) - min) < 1e-6)
                edges.push([ i, j ])

    const adj = new Set(edges.map((e) => `${e[0]}-${e[1]}`))
    const faces = []
    for(let i = 0; i < verts.length; i++)
        for(let j = i + 1; j < verts.length; j++)
            for(let k = j + 1; k < verts.length; k++)
                if(adj.has(`${i}-${j}`) && adj.has(`${j}-${k}`) && adj.has(`${i}-${k}`))
                    faces.push([ i, j, k ])

    return { verts, edges, faces }
}

/**
 * Faceted icosahedron "earth" — the recurring hero motif. Deterministic low-
 * poly globe with a handful of lime/sky "continent" facets over indigo sea.
 */
function polyEarthSVG(size, { accent = PALETTE.lime400, radiusScale = 0.94 } = {})
{
    const { verts, edges, faces } = icosahedron()
    const c = size / 2
    const R = (size / 2) * radiusScale

    const rotY = -0.55
    const rotX = 0.42
    const cosY = Math.cos(rotY), sinY = Math.sin(rotY)
    const cosX = Math.cos(rotX), sinX = Math.sin(rotX)

    const project = ([ x, y, z ]) =>
    {
        const x1 = x * cosY + z * sinY
        const z1 = -x * sinY + z * cosY
        const y1 = y * cosX - z1 * sinX
        const z2 = y * sinX + z1 * cosX
        return { x: c + x1 * R, y: c - y1 * R, z: z2 }
    }

    const pts = verts.map(project)
    const faceData = faces.map((f, i) =>
    {
        const centroid = f.map((vi) => pts[vi]).reduce((a, p) => ({ x: a.x + p.x, y: a.y + p.y, z: a.z + p.z }), { x: 0, y: 0, z: 0 })
        centroid.x /= 3; centroid.y /= 3; centroid.z /= 3
        const back = centroid.z < 0
        // deterministic "continent" clustering
        const land = Math.sin(centroid.x * 0.16 + centroid.z * 0.11) > 0.42 && !back
        const landAlt = Math.cos(centroid.x * 0.1 - centroid.z * 0.07) > 0.72 && !back
        return { face: f, i, back, land: land || landAlt, c: centroid }
    })

    const faceFill = (fd) =>
    {
        if(fd.back) return PALETTE.space800
        if(fd.land) return (fd.i % 2 === 0) ? PALETTE.lime500 : PALETTE.sky
        return (fd.i % 2 === 0) ? PALETTE.space600 : PALETTE.space700
    }

    const facePaths = faceData.map((fd) =>
    {
        const p = fd.face.map((vi) => pts[vi])
        const path = `M${p[0].x.toFixed(2)} ${p[0].y.toFixed(2)} L${p[1].x.toFixed(2)} ${p[1].y.toFixed(2)} L${p[2].x.toFixed(2)} ${p[2].y.toFixed(2)} Z`
        const fill = faceFill(fd)
        const opacity = fd.back ? 0.9 : (fd.land ? 0.9 : 0.72)
        return `<path d="${path}" fill="${fill}" fill-opacity="${opacity}" stroke="${PALETTE.cream}" stroke-opacity="${fd.back ? 0.08 : 0.2}" stroke-width="1" stroke-linejoin="round"/>`
    }).join('')

    // edge glow ring
    const ring = `<circle cx="${c}" cy="${c}" r="${R + 3}" fill="none" stroke="${accent}" stroke-opacity="0.35" stroke-width="1.5"/>`

    return `<svg class="earth" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" aria-hidden="true"><circle cx="${c}" cy="${c}" r="${R + 1}" fill="${PALETTE.space800}" fill-opacity="0.55"/>${facePaths}${ring}</svg>`
}

/**
 * Station landmark glyphs — reused by the agenda route, chapter dividers and
 * (as a recurring motif) the station nav. Mirrors the real 3D landmark in
 * each zone (see ZoneIdentity.js).
 */
function landmarkSVG(kind, size, accent)
{
    const c = size / 2
    const w = 1.6
    switch(kind)
    {
        case 'gem': // Konzept — faceted gem stack
        {
            const gem = (x, y, r, fill, op) =>
                `<path d="M${x} ${y - r} L${x + r} ${y} L${x} ${y + r} L${x - r} ${y} Z" fill="${fill}" fill-opacity="${op}" stroke="${PALETTE.cream}" stroke-opacity="0.55" stroke-width="${w}"/>`
            return `<svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" aria-hidden="true">${gem(c, c + 10, 18, PALETTE.cream, 0.9)}${gem(c, c - 8, 13, accent, 0.95)}<path d="M${c} ${c - 30} L${c + 7} ${c - 15} L${c} ${c} L${c - 7} ${c - 15} Z" fill="${accent}" fill-opacity="0.9" stroke="${PALETTE.cream}" stroke-opacity="0.55" stroke-width="${w}"/></svg>`
        }
        case 'core': // Engineering — pulsing core
        {
            const ticks = Array.from({ length: 8 }, (_, i) =>
            {
                const a = (i / 8) * Math.PI * 2
                const x1 = c + Math.cos(a) * 16, y1 = c + Math.sin(a) * 16
                const x2 = c + Math.cos(a) * 22, y2 = c + Math.sin(a) * 22
                return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${accent}" stroke-opacity="0.8" stroke-width="${w}"/>`
            }).join('')
            return `<svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" aria-hidden="true"><circle cx="${c}" cy="${c}" r="22" fill="none" stroke="${accent}" stroke-opacity="0.5" stroke-width="${w}"/>${ticks}<circle cx="${c}" cy="${c}" r="11" fill="${accent}" fill-opacity="0.95"/><circle cx="${c}" cy="${c}" r="5" fill="${PALETTE.space900}"/></svg>`
        }
        case 'check': // Qualität — ring + checkmark
        {
            const check = `<path d="M${c - 9} ${c} L${c - 2} ${c + 7} L${c + 10} ${c - 6}" fill="none" stroke="${accent}" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/>`
            return `<svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" aria-hidden="true"><circle cx="${c}" cy="${c}" r="17" fill="none" stroke="${PALETTE.cream}" stroke-width="${w + 0.4}"/>${check}</svg>`
        }
        case 'globe':
        default: // Gameplay — origami earth
            return polyEarthSVG(size, { accent })
    }
}

function iconSVG(name, size)
{
    const c = size / 2
    switch(name)
    {
        case 'explore': // magnifier over globe
            return `<svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" aria-hidden="true"><circle cx="${c - 2}" cy="${c - 2}" r="${size * 0.30}" fill="none" stroke="currentColor" stroke-width="2.2"/><line x1="${c + size * 0.20}" y1="${c + size * 0.20}" x2="${c + size * 0.42}" y2="${c + size * 0.42}" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/></svg>`
        case 'guess': // map pin
            return `<svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" aria-hidden="true"><path d="M${c} ${c - size * 0.34} C${c + size * 0.22} ${c - size * 0.34} ${c + size * 0.22} ${c} ${c} ${c + size * 0.10} C${c - size * 0.22} ${c} ${c - size * 0.22} ${c - size * 0.34} ${c} ${c - size * 0.34} Z" fill="currentColor" fill-opacity="0.25" stroke="currentColor" stroke-width="2"/><circle cx="${c}" cy="${c - size * 0.16}" r="${size * 0.07}" fill="currentColor"/></svg>`
        case 'compare': // podium bars
            return `<svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" aria-hidden="true"><rect x="${c - size * 0.30}" y="${c + size * 0.06}" width="${size * 0.16}" height="${size * 0.26}" fill="currentColor" fill-opacity="0.55"/><rect x="${c - size * 0.08}" y="${c - size * 0.06}" width="${size * 0.16}" height="${size * 0.38}" fill="currentColor" fill-opacity="0.85"/><rect x="${c + size * 0.14}" y="${c + size * 0.16}" width="${size * 0.16}" height="${size * 0.16}" fill="currentColor" fill-opacity="0.4"/></svg>`
        default:
            return ''
    }
}

/**
 * Sequence diagram (slide 13): three lifelines (Client / Backend / Datenbank)
 * with the six verified round steps as numbered messages, arrows indicating
 * request vs. response direction. Full verified text lives in the HTML legend
 * below the SVG (see renderFlow) so nothing clips.
 */
function flowDiagramSVG(steps)
{
    const W = 980, H = 320
    const lanes = [ { x: 150, label: 'Client', color: PALETTE.lime400 }, { x: 500, label: 'Backend', color: PALETTE.amber }, { x: 850, label: 'Datenbank', color: PALETTE.sky } ]

    // Fixed message sequence (request/response topology) matching the six
    // verified steps in slides.js — see renderFlow for the full-text legend.
    const messages = [
        { from: 0, to: 1, dir: 'req', label: '1 · POST /games · Runde starten' },
        { from: 1, to: 0, dir: 'res', label: '2 · Standort · Panorama-ID + Kandidaten' },
        { from: 0, to: 0, dir: 'self', label: '3 · Panorama & Hinweise zeigen' },
        { from: 0, to: 1, dir: 'req', label: '4 · POST /rounds/:id/guess' },
        { from: 1, to: 2, dir: 'req', label: '5 · validieren · berechnen · speichern' },
        { from: 1, to: 0, dir: 'res', label: '6 · Distanz + Punkte + echter Standort' },
    ]

    const top = 66
    const rowGap = 40
    const ys = messages.map((_, i) => top + i * rowGap)

    const head = lanes.map((l) => `
        <rect x="${l.x - 66}" y="20" width="132" height="38" rx="19" fill="${PALETTE.space800}" stroke="${l.color}" stroke-opacity="0.5" stroke-width="1.5"/>
        <text x="${l.x}" y="45" text-anchor="middle" font-family="Fredoka, sans-serif" font-weight="600" font-size="18" fill="${PALETTE.cream}">${l.label}</text>
    `).join('')

    const lifelines = lanes.map((l) => `
        <line x1="${l.x}" y1="64" x2="${l.x}" y2="${H - 16}" stroke="${PALETTE.subtle}" stroke-opacity="0.3" stroke-width="1.5" stroke-dasharray="4 6"/>
    `).join('')

    const arrowFor = (m, i) =>
    {
        const x1 = lanes[m.from].x, x2 = lanes[m.to].x
        const y = ys[i]
        const color = m.dir === 'res' ? PALETTE.muted : PALETTE.lime400

        if(m.dir === 'self')
        {
            const sx = lanes[m.from].x
            const path = `M${sx} ${y} L${sx + 34} ${y} L${sx + 34} ${y + 20} L${sx} ${y + 20}`
            return `<path d="${path}" fill="none" stroke="${PALETTE.muted}" stroke-width="1.8"/><path d="M${sx - 6} ${y + 14} L${sx} ${y + 20} L${sx + 6} ${y + 14}" fill="none" stroke="${PALETTE.muted}" stroke-width="1.8"/><text x="${sx + 40}" y="${y + 11}" font-family="Nunito, sans-serif" font-size="13.5" fill="${PALETTE.muted}">${m.label}</text>`
        }

        const left = x1 < x2
        const ax = left ? x2 - 12 : x2 + 12
        const labelX = (x1 + x2) / 2
        const arrow = `<line x1="${x1}" y1="${y}" x2="${x2}" y2="${y}" stroke="${color}" stroke-width="1.8"/><path d="M${ax} ${y - 5.5} L${x2} ${y} L${ax} ${y + 5.5}" fill="none" stroke="${color}" stroke-width="1.8"/>`
        return `${arrow}<text x="${labelX}" y="${y - 9}" text-anchor="middle" font-family="Nunito, sans-serif" font-size="13.5" fill="${PALETTE.cream}">${m.label}</text>`
    }

    const arrows = messages.map(arrowFor).join('')

    return `<svg class="flow-diagram" viewBox="0 0 ${W} ${H}" width="100%" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Ablauf einer Spielrunde">${head}${lifelines}${arrows}</svg>`
}

// ---------------------------------------------------------------------------
// Markup builders
// ---------------------------------------------------------------------------

function list(items)
{
    return `<ul class="list">${items.map((item) => `<li>${item}</li>`).join('')}</ul>`
}

function note(text, modifier = '')
{
    return `<p class="note ${modifier}">${text}</p>`
}

function pill(text)
{
    return `<span class="pill">${text}</span>`
}

function badge(status, label = status)
{
    return `<span class="badge" data-status="${status}">${label}</span>`
}

function stationLandmark(slide)
{
    const map = { konzept: 'gem', gameplay: 'globe', engineering: 'core', qualitaet: 'check' }
    return map[slide.stationId] ?? 'globe'
}

// --- title (01) -------------------------------------------------------------

function renderTitle(slide)
{
    return `
        <div class="hero hero--title">
            <p class="hero__eyebrow">${slide.eyebrow}</p>
            <div class="hero__earth">${polyEarthSVG(430)}</div>
            <h1 class="hero__title">${slide.title}</h1>
            <p class="hero__subtitle">${slide.subtitle}</p>
            <p class="hero__byline">${slide.byline}</p>
        </div>
    `
}

// --- agenda (02) ------------------------------------------------------------

function renderAgenda(slide)
{
    const stops = slide.items.map((item, i) =>
    {
        const kind = [ 'gem', 'globe', 'core', 'check' ][i] ?? 'globe'
        return `
            <li class="route__stop">
                <span class="route__glyph">${landmarkSVG(kind, 46, STATIONS[slide.stationId].accent)}</span>
                <span class="route__index">${item.number}</span>
                <span class="route__label">${item.label}</span>
                <span class="route__detail">${item.detail}</span>
            </li>
        `
    }).join('')

    return `
        <div class="route">
            <ol class="route__stops">${stops}</ol>
            <div class="route__line" aria-hidden="true"><i></i><i></i><i></i></div>
        </div>
    `
}

// --- divider (03, 06, 11, 17) ----------------------------------------------

function renderDivider(slide)
{
    const kind = stationLandmark(slide)
    const number = slide.eyebrow.match(/\d+/)?.[0] ?? ''
    return `
        <div class="divider">
            <div class="divider__glyph">${landmarkSVG(kind, 120, STATIONS[slide.stationId].accent)}</div>
            <div class="divider__body">
                ${slide.body ? list(slide.body) : ''}
            </div>
            <span class="divider__number" aria-hidden="true">${number}</span>
        </div>
    `
}

// --- idea (04) --------------------------------------------------------------

function renderIdea(slide)
{
    const icons = [ 'explore', 'guess', 'compare' ]
    const steps = slide.goals.map((goal, i) => `
        <li class="idea__step">
            <span class="idea__icon">${iconSVG(icons[i] ?? 'explore', 30)}</span>
            <span class="idea__number">${goal.number}</span>
            <h3>${goal.title}</h3>
            <p>${goal.text}</p>
        </li>
    `).join('')

    return `
        <div class="idea">
            <ol class="idea__flow">
                ${steps}
            </ol>
            <div class="idea__meta">
                <p class="idea__audience">${slide.audience}</p>
                ${note(slide.scopeNote, 'note--muted')}
            </div>
        </div>
    `
}

// --- team (05) --------------------------------------------------------------

function renderTeam(slide)
{
    const members = slide.speakers.map((speaker) => `
        <li class="member" style="--accent:${speaker.accent}">
            <span class="member__avatar" aria-hidden="true"><svg viewBox="0 0 64 64" width="72" height="72"><path d="M32 4 L58 19 V45 L32 60 L6 45 V19 Z" fill="none" stroke="var(--accent)" stroke-width="2.5"/><text x="32" y="40" text-anchor="middle" font-family="Fredoka, sans-serif" font-weight="700" font-size="19" fill="var(--accent)">${speaker.initials}</text></svg></span>
            <div class="member__body">
                <h3>${speaker.name}</h3>
                <p class="member__role">${speaker.role}</p>
                <ul class="member__packages">${speaker.workPackages.map((pkg) => `<li>${pkg}</li>`).join('')}</ul>
            </div>
        </li>
    `).join('')

    return `
        <div class="team">
            <ul class="team__members">${members}</ul>
            <p class="team__count" aria-hidden="true">2</p>
        </div>
    `
}

// --- media (07, 08, 09) — three distinct compositions -----------------------

function figure(shot, modifier = '')
{
    return `<figure class="shot ${modifier}"><img src="${shot.src}" alt="${shot.alt}" loading="lazy"><figcaption>${shot.caption ?? ''}</figcaption></figure>`
}

function renderMedia(slide)
{
    // 07 Startbildschirm — dominant hero screenshot + annotation rail
    if(slide.id === 7)
    {
        const [ primary, secondary ] = slide.screenshots
        return `
            <div class="media media--hero">
                <div class="media__primary">
                    ${figure(primary, 'shot--primary')}
                </div>
                <aside class="media__rail">
                    <ol class="callouts">
                        ${slide.bullets.map((b, i) => `<li><span class="callouts__n">${i + 1}</span><div><strong>${b.title}</strong><p>${b.text}</p></div></li>`).join('')}
                    </ol>
                    ${figure(secondary, 'shot--secondary')}
                </aside>
            </div>
        `
    }

    // 08 Einzelspieler — Explore → Guess → Evaluate filmstrip
    if(slide.id === 8)
    {
        const phases = [
            { title: 'Explore', steps: slide.bullets.slice(0, 1) },
            { title: 'Guess', steps: slide.bullets.slice(1, 3) },
            { title: 'Evaluate', steps: slide.bullets.slice(3, 4) },
        ]
        const screens = slide.screenshots.map((shot) => figure(shot)).join('')
        return `
            <div class="media media--filmstrip">
                <ol class="phases">
                    ${phases.map((phase) => `
                        <li class="phase">
                            <span class="phase__label">${phase.title}</span>
                            <ul class="phase__steps">${phase.steps.map((s) => `<li><strong>${s.title.replace(/^\d+\s*·\s*/, '')}.</strong> ${s.text}</li>`).join('')}</ul>
                        </li>
                    `).join('')}
                </ol>
                <div class="media__strip">${screens}</div>
            </div>
        `
    }

    // 09 Mehrspieler — competitive "versus" composition
    const [ lobby, round ] = slide.screenshots
    return `
        <div class="media media--versus">
            <div class="versus">
                <div class="versus__side">
                    ${figure(lobby, 'shot--lobby')}
                    <p class="versus__caption">${slide.bullets[0].title} — ${slide.bullets[0].text}</p>
                </div>
                <span class="versus__mark" aria-hidden="true">VS</span>
                <div class="versus__side">
                    ${figure(round, 'shot--round')}
                    <p class="versus__caption">${slide.bullets[1].title} — ${slide.bullets[1].text}</p>
                </div>
            </div>
            ${slide.footnote ? note(slide.footnote, 'note--muted') : ''}
        </div>
    `
}

// --- challenge (10) ----------------------------------------------------------

function renderChallenge(slide)
{
    return `
        <div class="challenge">
            <figure class="challenge__pano"><img src="${slide.screenshot.src}" alt="${slide.screenshot.alt}" loading="lazy"><figcaption>${slide.screenshot.caption ?? ''}</figcaption></figure>
            <div class="challenge__ask">
                <span class="challenge__ping" aria-hidden="true"></span>
                ${list(slide.instructions)}
            </div>
        </div>
    `
}

// --- stack (12) --------------------------------------------------------------

function renderStack(slide)
{
    const { frontend, backend, data, external, quality } = slide.product
    const layer = (title, subtitle, noteText, items, color) => `
        <div class="stack__layer" style="--layer:${color}">
            <div class="stack__layer-head">
                <h3>${title}</h3>
                <p>${subtitle}</p>
            </div>
            <div class="stack__body">
                <div class="stack__items">${items.map(pill).join('')}</div>
                ${noteText ? note(noteText, 'note--muted') : ''}
            </div>
        </div>
    `
    return `
        <div class="stack">
            <div class="stack__diagram">
                ${layer(frontend.title, frontend.subtitle, frontend.note, frontend.stack, PALETTE.lime400)}
                ${layer(backend.title, backend.subtitle, backend.note, backend.stack, PALETTE.amber)}
                ${layer(data.title, data.subtitle, '', data.stack, PALETTE.sky)}
            </div>
            <p class="stack__external"><strong>Extern:</strong> ${external}</p>
            <p class="stack__quality"><strong>Qualitätssicherung:</strong> ${quality.map(pill).join('')}</p>
            ${note(slide.environmentNote, 'note--callout')}
        </div>
    `
}

// --- flow (13) ---------------------------------------------------------------

function renderFlow(slide)
{
    const legend = slide.steps.map((step) => `
        <li class="flow__legend-item" data-actor="${step.actor}">
            <span class="flow__legend-n">${step.number}</span>
            <div><strong>${step.actor} — ${step.title}</strong><p>${step.text}</p></div>
        </li>
    `).join('')

    return `
        <div class="flow">
            ${flowDiagramSVG(slide.steps)}
            <ol class="flow__legend">${legend}</ol>
            <div class="flow__notes">
                ${note(slide.multiplayerNote)}
                ${note(slide.caveat, 'note--callout')}
            </div>
        </div>
    `
}

// --- table-hours (14) --------------------------------------------------------

function renderHours(slide)
{
    const bars = slide.items.map((item) => `
        <li class="hours__row">
            <span class="hours__label">${item.label}</span>
            <span class="hours__track hours__track--plan"><i></i><em>${item.planHours ?? '—'}</em></span>
            <span class="hours__track hours__track--ist"><i></i><em>${item.actualHours ?? '—'}</em></span>
        </li>
    `).join('')

    return `
        <div class="hours">
            <div class="hours__key"><span><i class="is-plan"></i>Plan (h)</span><span><i class="is-ist"></i>Ist (h)</span></div>
            <ol class="hours__rows">${bars}</ol>
            ${note(slide.note, 'note--callout')}
        </div>
    `
}

// --- table-challenges (15) ---------------------------------------------------

function renderChallenges(slide)
{
    const items = slide.items.map((item) => `
        <li class="challenges__row">
            <div class="challenges__problem"><span class="challenges__tag">Herausforderung</span><p>${item.challenge}</p></div>
            <span class="challenges__arrow" aria-hidden="true">→</span>
            <div class="challenges__solution">
                <p>${item.solution}</p>
                ${item.source ? `<span class="challenges__source">${item.source}</span>` : ''}
            </div>
            <div class="challenges__status">${badge(item.status)}</div>
        </li>
    `).join('')

    return `<ol class="challenges">${items}</ol>`
}

// --- learnings (16) ----------------------------------------------------------

function renderLearnings(slide)
{
    const items = slide.items.map((item) => `
        <li class="learnings__item">
            <span class="learnings__number">${item.number}</span>
            <h3>${item.title}</h3>
            <p>${item.text}</p>
        </li>
    `).join('')

    return `<ol class="learnings">${items}</ol>`
}

// --- audit (18) --------------------------------------------------------------

function renderAudit(slide)
{
    const { totalPass, totalPartial, totalFail, total, mandatoryPass, mandatoryTotal } = slide.summary
    const rows = slide.rows.map((row) => `
        <tr class="${row.critical ? 'is-critical' : ''}">
            <td class="audit__nr">${row.nr}</td>
            <td>${row.text}${row.critical ? '<span class="audit__critical-tag">kritisch</span>' : ''}</td>
            <td>${badge(row.status)}</td>
        </tr>
    `).join('')

    return `
        <div class="audit">
            <div class="audit__summary">
                <div class="audit__bar" role="img" aria-label="${totalPass} bestanden, ${totalPartial} teilweise, ${totalFail} nicht bestanden von ${total}">
                    <span class="audit__seg is-pass" style="--w:${(totalPass / total) * 100}%"></span>
                    <span class="audit__seg is-partial" style="--w:${(totalPartial / total) * 100}%"></span>
                    <span class="audit__seg is-fail" style="--w:${(totalFail / total) * 100}%"></span>
                </div>
                <div class="audit__stats">
                    <span class="audit__stat is-pass"><b>${totalPass}/${total}</b><em>bestanden</em></span>
                    <span class="audit__stat is-partial"><b>${totalPartial}/${total}</b><em>teilweise</em></span>
                    <span class="audit__stat is-fail"><b>${totalFail}/${total}</b><em>nicht bestanden</em></span>
                    <span class="audit__stat is-mandatory"><b>${mandatoryPass}/${mandatoryTotal}</b><em>Basis-Anforderungen</em></span>
                </div>
            </div>
            <div class="audit__cols">
                <div class="audit__table-wrap">
                    <table class="audit__table">
                        <thead><tr><th>Nr.</th><th>Anforderung</th><th>Status</th></tr></thead>
                        <tbody>${rows}</tbody>
                    </table>
                </div>
                <div class="audit__method">
                    <h4>Methodik</h4>
                    <ul class="list list--compact">${slide.methodology.map((m) => `<li>${m}</li>`).join('')}</ul>
                    ${note(slide.closing, 'note--muted')}
                </div>
            </div>
        </div>
    `
}

// --- testing (19) ------------------------------------------------------------

function renderTesting(slide)
{
    const tiers = slide.tiers.map((tier, i) => `
        <li class="tiers__tier" style="--i:${i}">
            <div class="tiers__head">
                <h3>${tier.label}</h3>
                <span class="tiers__tool">${tier.tool}</span>
            </div>
            <p class="tiers__result">${tier.result}</p>
            <p class="tiers__note">${tier.note}</p>
        </li>
    `).join('')

    return `
        <div class="testing">
            <ol class="tiers">${tiers}</ol>
            <div class="testing__ci">
                <h4>CI-Pipeline</h4>
                ${list(slide.ciSteps)}
            </div>
            <div class="testing__caveats">
                ${slide.caveats.map((caveat) => note(caveat, 'note--callout')).join('')}
            </div>
        </div>
    `
}

// --- demo (20) ---------------------------------------------------------------

function renderDemo(slide)
{
    return `
        <div class="demo">
            <div class="demo__live"><span class="demo__dot" aria-hidden="true"></span>LIVE</div>
            <ol class="demo__steps">${slide.steps.map((step) => `<li><span>${step.number}</span>${step.label}</li>`).join('')}</ol>
            <div class="demo__notes">
                ${note(slide.fallbackText, 'note--callout')}
                ${note(slide.returnNote)}
            </div>
        </div>
    `
}

// --- conclusion (21) ---------------------------------------------------------

function renderConclusion(slide)
{
    return `
        <div class="hero hero--closing">
            <p class="hero__eyebrow">${slide.eyebrow}</p>
            <div class="hero__earth">${polyEarthSVG(300)}</div>
            <div class="hero__lines">${slide.lines.map((line) => `<span>${line}</span>`).join('')}</div>
            <p class="hero__subline">${slide.subline}</p>
            <div class="hero__columns">
                <div><h3>Erreicht</h3>${list(slide.achievements)}</div>
                <div><h3>Offen</h3>${list(slide.limitations)}</div>
            </div>
            <div class="hero__closing">${slide.closing.map((line) => `<span>${line}</span>`).join('')}</div>
        </div>
    `
}

/**
 * Builds the inner markup of `.presentation__content` for one slide.
 */
function renderContent(slide)
{
    switch(slide.layout)
    {
        case 'title': return renderTitle(slide)
        case 'agenda': return renderAgenda(slide)
        case 'divider': return renderDivider(slide)
        case 'idea': return renderIdea(slide)
        case 'team': return renderTeam(slide)
        case 'media': return renderMedia(slide)
        case 'challenge': return renderChallenge(slide)
        case 'stack': return renderStack(slide)
        case 'flow': return renderFlow(slide)
        case 'table-hours': return renderHours(slide)
        case 'table-challenges': return renderChallenges(slide)
        case 'learnings': return renderLearnings(slide)
        case 'audit': return renderAudit(slide)
        case 'testing': return renderTesting(slide)
        case 'demo': return renderDemo(slide)
        case 'conclusion': return renderConclusion(slide)
        default: return list(slide.body ?? [])
    }
}

/**
 * Lightweight HTML/CSS/SVG presentation overlay. Pure rendering — it only
 * receives resolved slide objects and station ids. No navigation state, no
 * 3D-world coupling. (Unchanged public API from Phase 4/5.)
 */
export class SlideRenderer
{
    constructor()
    {
        this.game = Game.getInstance()
        this.onStationSelect = null
        this.onClose = null

        this.build()
    }

    build()
    {
        this.root = document.createElement('div')
        this.root.className = 'presentation'

        this.root.innerHTML = `
            <div class="presentation__scrim"></div>
            <div class="presentation__pattern" aria-hidden="true"></div>
            <div class="presentation__watermark" aria-hidden="true"></div>
            <nav class="presentation__stations"></nav>
            <button type="button" class="presentation__close" aria-label="Präsentation schließen">&times;</button>
            <div class="presentation__stage">
                <div class="presentation__stage-inner">
                    <div class="presentation__eyebrow"></div>
                    <h1 class="presentation__title"></h1>
                    <p class="presentation__subtitle"></p>
                    <div class="presentation__content"></div>
                    <div class="presentation__section-nav">
                        <span class="presentation__section-count"></span>
                        <button type="button" class="presentation__finish">Zur Erkundung zurückkehren</button>
                    </div>
                </div>
            </div>
            <div class="presentation__hints">
                <span><i>&#8594;</i> / <i>Space</i> weiter</span>
                <span><i>&#8592;</i> zurück</span>
                <span class="presentation__hint--tour"><i>Home</i>/<i>End</i> Anfang/Ende</span>
                <span class="presentation__hint--tour"><i>M</i> erkunden</span>
                <span class="presentation__hint--station"><i>Esc</i> erkunden</span>
                <span><i>F</i> Vollbild</span>
            </div>
        `

        this.elements = {
            scrim: this.root.querySelector('.presentation__scrim'),
            pattern: this.root.querySelector('.presentation__pattern'),
            watermark: this.root.querySelector('.presentation__watermark'),
            stations: this.root.querySelector('.presentation__stations'),
            close: this.root.querySelector('.presentation__close'),
            stage: this.root.querySelector('.presentation__stage-inner'),
            eyebrow: this.root.querySelector('.presentation__eyebrow'),
            title: this.root.querySelector('.presentation__title'),
            subtitle: this.root.querySelector('.presentation__subtitle'),
            content: this.root.querySelector('.presentation__content'),
            sectionCount: this.root.querySelector('.presentation__section-count'),
            finish: this.root.querySelector('.presentation__finish'),
        }

        this.elements.close.addEventListener('click', () => this.onClose?.())
        this.elements.finish.addEventListener('click', () => this.onClose?.())

        for(const id of STATION_ORDER)
        {
            const station = STATIONS[id]

            const dot = document.createElement('button')
            dot.type = 'button'
            dot.className = 'presentation__station-dot'
            dot.dataset.station = id
            dot.style.setProperty('--accent', station.accent)
            dot.innerHTML = `<span class="presentation__station-index">${String(station.index + 1).padStart(2, '0')}</span><span class="presentation__station-title">${station.title}</span>`

            dot.addEventListener('click', () =>
            {
                this.onStationSelect?.(id)
            })

            this.elements.stations.appendChild(dot)
        }

        document.body.appendChild(this.root)
    }

    setActiveStation(stationId)
    {
        for(const dot of this.elements.stations.children)
            dot.classList.toggle('is-active', dot.dataset.station === stationId)
    }

    fillStage(slide, sectionMeta = null)
    {
        const station = STATIONS[slide.stationId]

        this.root.dataset.layout = slide.layout
        this.root.dataset.density = WIDE_LAYOUTS.has(slide.layout) ? 'wide' : 'narrow'
        this.elements.stage.style.setProperty('--accent', station.accent)
        this.elements.stage.style.setProperty('--accent-rgb', hexToRgb(station.accent))
        this.elements.eyebrow.textContent = slide.eyebrow ?? ''
        this.elements.title.textContent = slide.title ?? ''
        this.elements.subtitle.textContent = slide.subtitle ?? ''
        this.elements.content.innerHTML = renderContent(slide)
        this.elements.watermark.textContent = String(slide.id).padStart(2, '0')

        if(sectionMeta)
        {
            this.elements.sectionCount.textContent = `Folie ${sectionMeta.indexInSection} von ${sectionMeta.totalInSection}`
            this.elements.finish.classList.toggle('is-visible', sectionMeta.isFinal)
        }
    }

    showInitial(slide)
    {
        this.root.dataset.flow = 'tour'
        this.fillStage(slide)
        this.setActiveStation(slide.stationId)
        this.root.classList.add('is-visible')
        gsap.fromTo(this.elements.stage, { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, duration: 0.9, ease: 'power2.out' })
    }

    swapSlide(slide)
    {
        const stage = this.elements.stage
        gsap.to(stage, {
            autoAlpha: 0, y: -10, duration: 0.25, ease: 'power1.in',
            onComplete: () =>
            {
                this.fillStage(slide)
                gsap.fromTo(stage, { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.35, ease: 'power2.out' })
            }
        })
    }

    hideForTransition()
    {
        this.setActiveStation(null)

        return new Promise((resolve) =>
        {
            gsap.to(this.elements.stage, {
                autoAlpha: 0, y: -18, duration: 0.4, ease: 'power1.in',
                onComplete: resolve
            })
        })
    }

    revealAfterTransition(slide)
    {
        this.root.dataset.flow = 'tour'
        this.fillStage(slide)
        this.setActiveStation(slide.stationId)
        gsap.fromTo(this.elements.stage, { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, duration: 0.6, ease: 'power2.out' })
    }

    showStation(slide, sectionMeta)
    {
        this.root.dataset.flow = 'station'
        this.fillStage(slide, sectionMeta)
        this.setActiveStation(null)
        this.root.classList.add('is-visible')
        gsap.fromTo(this.elements.stage, { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, duration: 0.6, ease: 'power2.out' })
    }

    swapStationSlide(slide, sectionMeta)
    {
        const stage = this.elements.stage
        gsap.to(stage, {
            autoAlpha: 0, y: -10, duration: 0.25, ease: 'power1.in',
            onComplete: () =>
            {
                this.fillStage(slide, sectionMeta)
                gsap.fromTo(stage, { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.35, ease: 'power2.out' })
            }
        })
    }

    hideStation()
    {
        gsap.to(this.elements.stage, {
            autoAlpha: 0, y: -10, duration: 0.3, ease: 'power1.in',
            onComplete: () => this.setVisible(false)
        })
    }

    setVisible(visible)
    {
        this.root.classList.toggle('is-visible', visible)
    }

    get isVisible()
    {
        return this.root.classList.contains('is-visible')
    }
}
