import { Game } from '../Game.js'
import { TitleGlobe } from './TitleGlobe.js'
import { getDefinedSlideIds } from './slides.js'

/**
 * TerraGuessr Corporate-Editorial Presentation Renderer.
 *
 * Translates executive presentation principles (generous negative space,
 * decisive light/dark/split polarity, razor-sharp alignment, minimalist data
 * visualizations, and unboxed typography) into TerraGuessr's authentic brand
 * identity (midnight cosmic indigo, pure white, electric lime / botanical
 * forest, and cartographic geometry).
 */

// ---------------------------------------------------------------------------
// Minimal SVG primitives (fallback globe, subtle topographic lines, sequence)
// ---------------------------------------------------------------------------

/**
 * Clean faceted low-poly Earth illustration used ONLY in standalone
 * linear/print mode when the live 3D WebGL origami globe is not mounted.
 */
function staticTitleEarthSVG()
{
    return `
        <svg class="hero__static-earth" viewBox="0 0 600 600" aria-hidden="true">
            <defs>
                <clipPath id="earth-clip">
                    <circle cx="300" cy="300" r="196"/>
                </clipPath>
            </defs>
            <circle cx="306" cy="310" r="196" fill="rgba(5, 6, 14, 0.34)"/>
            <circle cx="300" cy="300" r="196" fill="#2a5bc2"/>
            <g clip-path="url(#earth-clip)">
                <polygon points="104,104 320,104 250,240 104,290" fill="#3569d4"/>
                <polygon points="320,104 496,104 496,260 360,295 250,240" fill="#2654b6"/>
                <polygon points="360,295 496,260 496,496 290,496" fill="#1e4296"/>
                <polygon points="104,290 250,240 360,295 290,496 104,496" fill="#234ca8"/>
                <polygon points="135,235 205,158 292,148 268,218 190,268" fill="#82c94c"/>
                <polygon points="292,148 395,152 454,218 402,272 268,218" fill="#6fb840"/>
                <polygon points="190,268 268,218 338,246 312,340 222,348" fill="#5da636"/>
                <polygon points="364,298 448,284 468,368 386,396 342,346" fill="#50942e"/>
                <polygon points="184,376 254,362 282,424 224,458 172,424" fill="#65ae3c"/>
                <polygon points="268,218 338,246 402,272 364,298 312,340" fill="#7ac446"/>
                <polygon points="214,112 300,104 388,116 342,140 248,136" fill="#eceae2"/>
                <polygon points="228,476 304,496 374,478 338,460 258,462" fill="#d8d6ce"/>
            </g>
            <polygon points="244,126 274,72 306,126" fill="#5a6173"/>
            <polygon points="274,72 290,100 258,100" fill="#f4f3ee"/>
            <polygon points="292,130 322,84 352,130" fill="#494f60"/>
            <polygon points="322,84 336,107 308,107" fill="#eceae2"/>
            <polygon points="178,162 204,108 230,162" fill="#529a32"/>
            <polygon points="204,108 218,140 190,140" fill="#82c94c"/>
            <polygon points="366,154 392,102 418,154" fill="#4b8e2d"/>
            <polygon points="392,102 406,132 378,132" fill="#77bf46"/>
            <circle cx="300" cy="300" r="196" fill="none" stroke="rgba(244, 243, 238, 0.14)" stroke-width="1.2"/>
        </svg>
    `
}

/**
 * Clean light-canvas 3-lifeline engineering sequence diagram.
 */
function sequenceSVG(lanes, messages)
{
    const W = 1200
    const top = 112
    const gap = 64
    const H = top + (messages.length - 1) * gap + 46
    const xs = [ 190, 600, 1010 ]

    const header = lanes.map((name, i) => `
        <line x1="${xs[i] - 130}" y1="54" x2="${xs[i] + 130}" y2="54" stroke="${i === 1 ? '#2b6e35' : '#121429'}" stroke-width="${i === 1 ? '2.5' : '1.5'}"/>
        <text x="${xs[i]}" y="36" text-anchor="middle" font-family="Barlow, DM Sans, sans-serif" font-weight="700" font-size="18" letter-spacing="-0.01em" fill="#121429">${name}</text>
    `).join('')

    const lifelines = xs.map((x) => `
        <line x1="${x}" y1="66" x2="${x}" y2="${H - 12}" stroke="rgba(18, 20, 41, 0.16)" stroke-width="1.2" stroke-dasharray="4 6"/>
    `).join('')

    const arrows = messages.map((m, i) =>
    {
        const y = top + i * gap
        const x1 = xs[m.from]
        const x2 = xs[m.to]

        const isReq = m.kind === 'req'
        const stroke = isReq ? '#2b6e35' : '#3b6fd4'
        const dir = x1 < x2 ? 1 : -1
        const tipX = x2 - dir * 10
        const midX = (x1 + x2) / 2
        const dash = isReq ? '' : 'stroke-dasharray="6 4"'

        return `
            <g class="seq-msg" data-message="${m.id}">
                <line x1="${x1}" y1="${y}" x2="${x2}" y2="${y}" stroke="${stroke}" stroke-width="2" ${dash}/>
                <path d="M ${tipX} ${y - 6} L ${x2} ${y} L ${tipX} ${y + 6}" fill="none" stroke="${stroke}" stroke-width="2" stroke-linecap="square" stroke-linejoin="miter"/>
                <text x="${midX}" y="${y - 12}" text-anchor="middle" font-family="Barlow, DM Sans, sans-serif" font-weight="${isReq ? '600' : '500'}" font-size="16" fill="${isReq ? '#121429' : '#3d425c'}">${m.label}</text>
            </g>
        `
    }).join('')

    return `<svg class="sequence__svg" viewBox="0 0 ${W} ${H}" width="100%" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Datenfluss einer Spielrunde">${header}${lifelines}${arrows}</svg>`
}

// ---------------------------------------------------------------------------
// Shared structural helpers
// ---------------------------------------------------------------------------

function slideHeader(slide, { centered = false } = {})
{
    return `
        <header class="slide-head ${centered ? 'slide-head--center' : ''}">
            ${slide.title ? `<h1 class="slide-head__title">${slide.title}</h1>` : ''}
            ${slide.subtitle ? `<p class="slide-head__subtitle">${slide.subtitle}</p>` : ''}
        </header>
    `
}

function darkAnchorBand(text)
{
    return `<div class="anchor-band"><p>${text}</p></div>`
}

function segmentedRule()
{
    return `<span class="seg-rule" aria-hidden="true"><i></i><i></i><i></i></span>`
}

// ---------------------------------------------------------------------------
// Per-layout markup builders
// ---------------------------------------------------------------------------

function renderTitle(slide, { staticEarth = false } = {})
{
    const brandMarkup = slide.title === 'TerraGuessr'
        ? `<span class="hero__brand-terra">Terra</span><span class="hero__brand-guessr">Guessr</span>`
        : slide.title

    return `
        <div class="hero hero--title">
            <div class="hero__inner">
                <div class="hero__header">
                    ${slide.academicLine ? `<p class="hero__academic">${slide.academicLine}</p>` : ''}
                    <h1 class="hero__name">${brandMarkup}</h1>
                    <p class="hero__tagline">${slide.subtitle}</p>
                    <div class="hero__rule" aria-hidden="true"></div>
                    <p class="hero__byline">${slide.byline}</p>
                </div>
                <div class="hero__planet-stage" aria-hidden="true">
                    <div class="hero__globe-host">${staticEarth ? staticTitleEarthSVG() : ''}</div>
                </div>
            </div>
        </div>
    `
}

function renderAgenda(slide)
{
    const cols = slide.items.map((item) => `
        <li class="agenda__col">
            <span class="agenda__num">${item.number}</span>
            <h2 class="agenda__label">${item.label}</h2>
            <p class="agenda__speaker">${item.speaker}</p>
            <ul class="agenda__topics">
                ${item.topics.map((t) => `<li>${t}</li>`).join('')}
            </ul>
        </li>
    `).join('')

    return `
        <div class="slide-frame slide-frame--with-band">
            <div class="slide-body">
                ${slideHeader(slide, { centered: true })}
                <ol class="agenda__grid">${cols}</ol>
            </div>
            ${darkAnchorBand(slide.footerBar)}
        </div>
    `
}

function renderDivider(slide)
{
    const title = slide.title ?? [ slide.titleLight, slide.titleBold ].filter(Boolean).join(' ')

    return `
        <div class="divider">
            <div class="divider__inner">
                ${slide.kicker ? `<p class="divider__kicker">${slide.kicker}</p>` : ''}
                <h1 class="divider__title">${title}</h1>
                ${slide.subtitle ? `<p class="divider__subtitle">${slide.subtitle}</p>` : ''}
            </div>
        </div>
    `
}

function renderSplitIdea(slide)
{
    const clues = (slide.clues ?? []).map((c) => `<li>${c}</li>`).join('')

    const steps = slide.steps.map((s) => `
        <li class="num-row">
            <span class="num-row__idx">${s.number}</span>
            <div class="num-row__body">
                <strong>${s.title}:</strong> ${s.text}
            </div>
        </li>
    `).join('')

    return `
        <div class="split-layout split-layout--34">
            <aside class="split-layout__dark">
                <span class="split-rail__label">${slide.problemLabel}</span>
                <h2 class="split-rail__headline">${slide.problemHeadline}</h2>
                <div class="split-rail__rule" aria-hidden="true"></div>
                <ul class="split-rail__clues">${clues}</ul>
                ${slide.problemQuote ? `<p class="split-rail__quote">${slide.problemQuote}</p>` : ''}
            </aside>
            <section class="split-layout__light">
                <h1 class="slide-head__title">${slide.ideaTitle}</h1>
                <ol class="num-rows">${steps}</ol>
            </section>
        </div>
    `
}

function renderGoals(slide)
{
    const goals = slide.goals.map((g) => `
        <li class="goals__row">
            <span class="goals__idx">${g.index}</span>
            <div class="goals__copy">
                <h2>${g.title}</h2>
                <p>${g.text}</p>
            </div>
        </li>
    `).join('')

    const total = Number(slide.kpi.value) || 20
    const segments = slide.kpi.segments ?? []
    const segBar = segments.map((seg) => `
        <span class="kano-bar__seg is-${seg.tone}" style="width:${(seg.count / total) * 100}%"></span>
    `).join('')

    const segLegend = segments.map((seg) => `
        <li>
            <span class="kano-legend__dot is-${seg.tone}" aria-hidden="true"></span>
            <span class="kano-legend__name">${seg.label}</span>
            <strong class="kano-legend__val">${seg.count}</strong>
        </li>
    `).join('')

    return `
        <div class="slide-frame slide-frame--with-band">
            <div class="slide-body">
                ${slideHeader(slide)}
                <div class="goals">
                    <ol class="goals__list">${goals}</ol>
                    <aside class="goals__kpi">
                        <div class="goals__kpi-top">
                            <span class="goals__kpi-value"><span class="num" data-to="${slide.kpi.value}">${slide.kpi.value}</span></span>
                            <div>
                                <strong class="goals__kpi-label">${slide.kpi.label}</strong>
                                <span class="goals__kpi-sub">${slide.kpi.sub}</span>
                            </div>
                        </div>
                        <div class="kano-bar" aria-hidden="true">${segBar}</div>
                        <ul class="kano-legend">${segLegend}</ul>
                    </aside>
                </div>
            </div>
            ${darkAnchorBand(slide.footerBar)}
        </div>
    `
}

function renderTeam(slide)
{
    const members = slide.members.map((m) => `
        <li class="team__col">
            <span class="team__num">${m.number}</span>
            <h2 class="team__name">${m.name}</h2>
            <p class="team__pres">${m.presentationRole}</p>
            <div class="team__rule" aria-hidden="true"></div>
            <p class="team__proj ${m.pending ? 'is-pending' : ''}">${m.projectRole}</p>
        </li>
    `).join('')

    return `
        <div class="slide-frame slide-frame--with-band">
            <div class="slide-body">
                ${slideHeader(slide)}
                <ul class="team__grid">${members}</ul>
            </div>
            ${darkAnchorBand(slide.footerBar)}
        </div>
    `
}

function renderVersus(slide)
{
    const cols = slide.screenshots.map((shot) => `
        <div class="versus__col">
            <figure class="versus__shot">
                <img src="${shot.src}" alt="${shot.alt}" loading="eager">
            </figure>
            <div class="versus__caption">
                <span class="versus__step">${shot.step}</span>
                <div>
                    <h2>${shot.label}</h2>
                    <p>${shot.text}</p>
                </div>
            </div>
        </div>
    `).join('')

    return `
        <div class="slide-frame">
            <div class="slide-body">
                ${slideHeader(slide)}
                <div class="versus__grid">${cols}</div>
            </div>
        </div>
    `
}

function renderProductMosaic(slide)
{
    const secondary = slide.secondary.map((shot) => `
        <figure class="mosaic__sub">
            <img src="${shot.src}" alt="${shot.alt}" loading="eager">
            <figcaption>
                <span class="mosaic__step">${shot.step}</span>
                <span>${shot.label}</span>
            </figcaption>
        </figure>
    `).join('')

    return `
        <div class="slide-frame">
            <div class="slide-body">
                ${slideHeader(slide)}
                <div class="mosaic">
                    <figure class="mosaic__main">
                        <img src="${slide.primary.src}" alt="${slide.primary.alt}" loading="eager">
                        <figcaption class="mosaic__main-cap">
                            <span class="mosaic__step">${slide.primary.step}</span>
                            <div>
                                <strong>${slide.primary.label}</strong>
                                <p>${slide.primary.detail}</p>
                            </div>
                        </figcaption>
                    </figure>
                    <div class="mosaic__stack">${secondary}</div>
                </div>
            </div>
        </div>
    `
}

function renderShowcase(slide)
{
    const pts = slide.points.map((p) => `
        <li class="showcase__point">
            <span class="showcase__tag">#${p.tag}</span>
            <h2>${p.label}</h2>
            ${segmentedRule()}
            <p>${p.text}</p>
        </li>
    `).join('')

    return `
        <div class="slide-frame">
            <div class="slide-body">
                ${slideHeader(slide)}
                <div class="showcase">
                    <figure class="showcase__primary">
                        <img src="${slide.primaryShot.src}" alt="${slide.primaryShot.alt}" loading="eager">
                        <figcaption>${slide.primaryShot.caption}</figcaption>
                    </figure>
                    <div class="slant-divider" aria-hidden="true"></div>
                    <ul class="showcase__points">${pts}</ul>
                </div>
            </div>
        </div>
    `
}

function renderArchitecture(slide)
{
    const layers = slide.layers.map((layer, idx) => `
        <div class="arch__tier">
            <span class="arch__num">${layer.num}</span>
            <div class="arch__info">
                <h2>${layer.name}</h2>
                <p class="arch__role">${layer.role}</p>
                <p class="arch__stack">${layer.stack}</p>
            </div>
        </div>
        ${idx < slide.layers.length - 1 ? '<div class="arch__arrow" aria-hidden="true"><span></span></div>' : ''}
    `).join('')

    return `
        <div class="slide-frame">
            <div class="slide-body">
                ${slideHeader(slide)}
                <div class="arch">
                    <div class="arch__tiers">${layers}</div>
                    <aside class="arch__side">
                        <div class="arch__block">
                            <h3>Externe Dienste</h3>
                            ${segmentedRule()}
                            <ul>${slide.external.map((e) => `<li>${e}</li>`).join('')}</ul>
                        </div>
                        <div class="arch__block">
                            <h3>Qualität &amp; Betrieb</h3>
                            ${segmentedRule()}
                            <p>${slide.ops}</p>
                        </div>
                        <div class="arch__block arch__block--accent">
                            <h3>Kernprinzip</h3>
                            ${segmentedRule()}
                            <p>${slide.principle}</p>
                        </div>
                    </aside>
                </div>
                <p class="slide-footnote">${slide.footnote}</p>
            </div>
        </div>
    `
}

function renderSequence(slide)
{
    const facts = slide.facts.map((f) => `
        <div class="sequence__fact">
            <strong>${f.label}</strong>
            <p>${f.text}</p>
        </div>
    `).join('')

    return `
        <div class="slide-frame">
            <div class="slide-body">
                ${slideHeader(slide)}
                <div class="sequence">
                    ${sequenceSVG(slide.lanes, slide.messages)}
                    <div class="sequence__facts">${facts}</div>
                </div>
            </div>
        </div>
    `
}

function renderChallenges(slide)
{
    const rows = slide.items.map((item) => `
        <li class="challenge-row">
            <span class="challenge-row__idx">${item.number}</span>
            <div class="challenge-row__body">
                <h2>${item.challenge}</h2>
                <p class="challenge-row__prob"><span>Problem</span>${item.problem}</p>
                <p class="challenge-row__sol"><span>Lösung</span>${item.solution}</p>
            </div>
        </li>
    `).join('')

    return `
        <div class="split-layout split-layout--30">
            <aside class="split-layout__dark">
                <span class="split-rail__label">${slide.railLabel}</span>
                <h2 class="split-rail__headline">${slide.railHeadline}</h2>
                <div class="split-rail__rule" aria-hidden="true"></div>
                <p class="split-rail__quote">${slide.railQuote}</p>
            </aside>
            <section class="split-layout__light">
                <h1 class="slide-head__title">${slide.title}</h1>
                <ol class="challenge-rows">${rows}</ol>
            </section>
        </div>
    `
}

function renderHours(slide)
{
    const rows = slide.items.map((item) => `
        <tr>
            <td class="hours__code">${item.code}</td>
            <td class="hours__pkg">${item.label}</td>
            <td class="hours__val">${item.plan}</td>
            <td class="hours__val">${item.actual}</td>
            <td class="hours__val">${item.delta}</td>
        </tr>
    `).join('')

    const totalRow = slide.total ? `
        <tfoot>
            <tr class="hours__total">
                <td class="hours__code">${slide.total.code}</td>
                <td class="hours__pkg">${slide.total.label}</td>
                <td class="hours__val">${slide.total.plan}</td>
                <td class="hours__val">${slide.total.actual}</td>
                <td class="hours__val">${slide.total.delta}</td>
            </tr>
        </tfoot>
    ` : ''

    const risks = slide.risks.map((r) => `
        <li class="hours__risk">
            <span class="hours__risk-idx">${r.index}</span>
            <div>
                <h3>${r.title}</h3>
                <p>${r.text}</p>
            </div>
        </li>
    `).join('')

    return `
        <div class="slide-frame slide-frame--with-band">
            <div class="slide-body">
                ${slideHeader(slide)}
                <div class="hours">
                    <table class="hours__table">
                        <thead>
                            <tr>
                                <th>AP</th>
                                <th>Arbeitspaket</th>
                                <th>Plan</th>
                                <th>Ist</th>
                                <th>Delta</th>
                            </tr>
                        </thead>
                        <tbody>${rows}</tbody>
                        ${totalRow}
                    </table>
                    <aside class="hours__risks">
                        <h2 class="hours__risks-title">Schätzrisiken</h2>
                        <ol class="hours__risk-list">${risks}</ol>
                    </aside>
                </div>
            </div>
            ${darkAnchorBand(slide.footerBar)}
        </div>
    `
}

function renderLearnings(slide)
{
    const cols = slide.items.map((item, idx) => `
        ${idx > 0 ? '<div class="slant-divider" aria-hidden="true"></div>' : ''}
        <div class="learnings__col">
            <span class="learnings__tag">${item.tag}</span>
            <h2>${item.title}</h2>
            ${segmentedRule()}
            <p>${item.text}</p>
        </div>
    `).join('')

    return `
        <div class="slide-frame">
            <div class="slide-body">
                ${slideHeader(slide)}
                <div class="learnings__cols">${cols}</div>
            </div>
        </div>
    `
}

function renderQuality(slide)
{
    const { passed, partial, total, mandatoryPassed, mandatoryTotal, progression, note } = slide.audit
    const { total: testTotal, files, bars, ciSteps, caveat } = slide.testing

    const barRows = bars.map((b) => `
        <li class="qbar__row">
            <div class="qbar__meta">
                <strong>${b.label}</strong>
                <span>${b.detail}</span>
            </div>
            <div class="qbar__track">
                <span class="qbar__fill" style="--w:${b.pct}%"></span>
                <em class="qbar__count">${b.count}</em>
            </div>
        </li>
    `).join('')

    const ciMarkup = ciSteps.map((step) => `<li>${step}</li>`).join('')

    return `
        <div class="slide-frame">
            <div class="slide-body">
                ${slideHeader(slide)}
                <div class="quality">
                    <section class="quality__col">
                        <h2 class="quality__heading">Anforderungen</h2>
                        <div class="quality__kpis">
                            <div class="quality__kpi">
                                <strong><span class="num" data-to="${passed}">${passed}</span><span>/${total}</span></strong>
                                <em>direkt umgesetzt</em>
                            </div>
                            <div class="quality__kpi">
                                <strong><span class="num" data-to="${mandatoryPassed}">${mandatoryPassed}</span><span>/${mandatoryTotal}</span></strong>
                                <em>Pflicht (muss)</em>
                            </div>
                        </div>
                        <div class="audit__bar" role="img" aria-label="${passed} umgesetzt, ${partial} Live-Check von ${total}">
                            <span class="audit__seg is-pass" style="--w:${(passed / total) * 100}%"></span>
                            <span class="audit__seg is-partial" style="--w:${(partial / total) * 100}%"></span>
                        </div>
                        <p class="quality__prog">${progression}</p>
                        <p class="quality__note">${note}</p>
                    </section>

                    <div class="quality__divider" aria-hidden="true"></div>

                    <section class="quality__col">
                        <div class="quality__test-head">
                            <h2 class="quality__heading">Tests &amp; CI/CD</h2>
                            <span class="quality__test-total"><strong class="num" data-to="${testTotal}">${testTotal}</strong> Testfälle · ${files} Dateien</span>
                        </div>
                        <ul class="qbar__list">${barRows}</ul>
                        <div class="quality__ci">
                            <span class="quality__ci-label">GitHub Actions · Backend-First</span>
                            <ol class="quality__ci-steps">${ciMarkup}</ol>
                        </div>
                        <p class="quality__caveat">${caveat}</p>
                    </section>
                </div>
            </div>
        </div>
    `
}

function renderStatement(slide)
{
    return `
        <div class="split-layout split-layout--38">
            <aside class="split-layout__dark statement__left">
                <span class="split-rail__label">${slide.eyebrow}</span>
                <h1 class="statement__lines">
                    ${slide.statementLines.map((line, i) => `<span class="${i === slide.statementLines.length - 1 ? 'is-accent' : ''}">${line}</span>`).join('')}
                </h1>
            </aside>
            <section class="split-layout__light statement__right">
                <div class="statement__group">
                    <h2>Erreicht</h2>
                    <ul>${slide.achieved.map((a) => `<li>${a}</li>`).join('')}</ul>
                </div>
                <div class="statement__group is-open">
                    <h2>Nächste Schritte</h2>
                    <ul>${slide.open.map((o) => `<li>${o}</li>`).join('')}</ul>
                </div>
            </section>
        </div>
    `
}

function renderDemo(slide)
{
    const steps = slide.steps.map((s) => `
        <li class="demo__step">
            <span class="demo__step-num">${s.number}</span>
            <div>
                <strong>${s.title}</strong>
                <p>${s.text}</p>
            </div>
        </li>
    `).join('')

    return `
        <div class="slide-frame">
            <div class="slide-body">
                ${slideHeader(slide)}
                <div class="demo">
                    <ol class="demo__steps">${steps}</ol>
                    <div class="slant-divider" aria-hidden="true"></div>
                    <aside class="demo__prompt">
                        <span class="demo__prompt-label">${slide.prompt.label}</span>
                        <h2 class="demo__prompt-q">${slide.prompt.question}</h2>
                        ${segmentedRule()}
                        <p class="demo__prompt-hint">${slide.prompt.hint}</p>
                        <p class="demo__clues">${slide.prompt.clues.join(' · ')}</p>
                    </aside>
                </div>
            </div>
        </div>
    `
}

function renderQA(slide)
{
    return `
        <div class="qa">
            <div class="qa__inner">
                <div class="qa__left">
                    <h1 class="qa__thanks">${slide.title}</h1>
                    <p class="qa__question">${slide.question}</p>
                </div>
                <div class="slant-divider qa__slant" aria-hidden="true"></div>
                <div class="qa__right">
                    <div class="qa__brand"><span>Terra</span><em>Guessr</em></div>
                    <p class="qa__byline">${slide.byline}</p>
                    <p class="qa__academic">${slide.academicLine}</p>
                    ${slide.hint ? `<p class="qa__hint">${slide.hint}</p>` : ''}
                </div>
            </div>
        </div>
    `
}

function renderAppendixAudit(slide)
{
    const left = slide.rows.slice(0, 10)
    const right = slide.rows.slice(10)

    const buildTable = (rows) => `
        <table class="audit__table">
            <thead><tr><th>Nr.</th><th>Anforderung</th><th>Typ</th><th>Status</th></tr></thead>
            <tbody>
                ${rows.map((r) => `
                    <tr data-status="${r.status}">
                        <td class="audit__nr">${String(r.nr).padStart(2, '0')}</td>
                        <td>${r.text}</td>
                        <td class="audit__type">${r.obligation} · ${r.kano}</td>
                        <td class="audit__status is-${r.status}">${r.status}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `

    return `
        <div class="slide-frame">
            <div class="slide-body">
                ${slideHeader(slide)}
                <div class="audit__tables">
                    ${buildTable(left)}
                    ${buildTable(right)}
                </div>
                <p class="slide-footnote">${slide.footnote}</p>
            </div>
        </div>
    `
}

export function renderSlideMarkup(slide, options = {})
{
    switch(slide.layout)
    {
        case 'title': return renderTitle(slide, options)
        case 'agenda': return renderAgenda(slide)
        case 'divider':
        case 'divider-light':
            return renderDivider(slide)
        case 'split-idea': return renderSplitIdea(slide)
        case 'goals': return renderGoals(slide)
        case 'team': return renderTeam(slide)
        case 'versus': return renderVersus(slide)
        case 'product-mosaic': return renderProductMosaic(slide)
        case 'showcase': return renderShowcase(slide)
        case 'architecture': return renderArchitecture(slide)
        case 'sequence': return renderSequence(slide)
        case 'challenges': return renderChallenges(slide)
        case 'hours': return renderHours(slide)
        case 'learnings': return renderLearnings(slide)
        case 'quality': return renderQuality(slide)
        case 'statement': return renderStatement(slide)
        case 'demo': return renderDemo(slide)
        case 'qa': return renderQA(slide)
        case 'appendix-audit': return renderAppendixAudit(slide)
        default: return ''
    }
}

// ---------------------------------------------------------------------------
// SlideRenderer public class
// ---------------------------------------------------------------------------

export class SlideRenderer
{
    constructor({ standalone = false } = {})
    {
        this.standalone = standalone
        this.game = standalone ? null : Game.getInstance()
        this.onStationSelect = null
        this.onClose = null
        this.titleGlobe = standalone ? null : new TitleGlobe(this.game)

        this.build()
    }

    build()
    {
        this.root = document.createElement('div')
        this.root.className = 'presentation'
        if(this.standalone)
            this.root.dataset.standalone = 'true'

        this.root.innerHTML = `
            <div class="presentation__scrim"></div>
            <div class="presentation__brand" aria-hidden="true"><span>TERRA</span><em>GUESSR</em></div>
            <div class="presentation__stage">
                <div class="presentation__stage-inner">
                    <div class="presentation__content"></div>
                </div>
            </div>
            <div class="presentation__footer-chrome">
                <span class="presentation__slide-num"></span>
            </div>
        `

        this.elements = {
            scrim: this.root.querySelector('.presentation__scrim'),
            brand: this.root.querySelector('.presentation__brand'),
            stage: this.root.querySelector('.presentation__stage-inner'),
            content: this.root.querySelector('.presentation__content'),
            slideNum: this.root.querySelector('.presentation__slide-num'),
        }

        document.body.appendChild(this.root)
    }

    setActiveStation()
    {
        // Intentionally quiet — zero floating station HUD chrome on slides.
    }

    fillStage(slide)
    {
        this.root.dataset.layout = slide.layout
        this.root.dataset.theme = slide.theme ?? 'light'
        this.elements.content.innerHTML = renderSlideMarkup(slide, { staticEarth: this.standalone })

        const numLabel = typeof slide.id === 'number'
            ? String(slide.id)
            : `Anhang ${slide.id}`
        this.elements.slideNum.textContent = numLabel

        if(this.titleGlobe)
        {
            if(slide.layout === 'title')
            {
                const globeHost = this.elements.content.querySelector('.hero__globe-host')
                if(globeHost)
                    this.titleGlobe.mount(globeHost)
            }
            else
            {
                this.titleGlobe.unmount()
            }
        }
    }

    setFlow(flow)
    {
        this.root.dataset.flow = flow
    }

    setVisible(visible)
    {
        this.root.classList.toggle('is-visible', visible)
        if(!this.titleGlobe)
            return

        if(!visible)
            this.titleGlobe.setActive(false)
        else if(this.root.dataset.layout === 'title')
            this.titleGlobe.setActive(true)
    }

    get isVisible()
    {
        return this.root.classList.contains('is-visible')
    }
}
