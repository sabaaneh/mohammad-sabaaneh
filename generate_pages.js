import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';
import { geoNaturalEarth1, geoPath, geoGraticule10 } from 'd3-geo';
import { feature } from 'topojson-client';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LINKS = [
    ['index.html#about', 'Bio'],
    ['cartoons.html', 'Cartoons'],
    ['murals.html', 'Murals'],
    ['ink-murals.html', 'Ink Murals'],
    ['books.html', 'Books'],
    ['prints.html', 'Prints'],
    ['art.html', 'Art'],
    ['news.html', 'News'],
    ['#contact', 'Contact'],
];

const SOCIAL = `
                <a href="https://www.instagram.com/sabaaneh/" target="_blank" rel="noopener" aria-label="Instagram"><i class="fab fa-instagram"></i></a>
                <a href="https://x.com/sabaaneh" target="_blank" rel="noopener" aria-label="X"><i class="fab fa-x-twitter"></i></a>
                <a href="https://www.facebook.com/msabaaneh" target="_blank" rel="noopener" aria-label="Facebook"><i class="fab fa-facebook-f"></i></a>`;

const NAV = `
    <a class="skip-link" href="#main">Skip to content</a>
    <header class="navbar">
        <div class="container nav-container">
            <a href="index.html" class="logo-link">
                <img src="./public/Logo-White.png" alt="Mohammad Sabaaneh home" class="logo" width="436" height="241">
            </a>
            <button class="nav-toggle" aria-label="Open menu" aria-expanded="false" aria-controls="menu">
                <span class="nav-toggle-text">Menu</span>
                <span class="burger" aria-hidden="true"><span></span><span></span></span>
            </button>
        </div>
    </header>
    <div class="menu" id="menu">
        <nav class="menu-links container" aria-label="Main">
            ${LINKS.map(([href, label], i) => `<a href="${href}"><span class="num">0${i + 1}</span>${label}</a>`).join('\n            ')}
        </nav>
        <div class="menu-footer container">
            <a href="mailto:sabaaneh@gmail.com" class="menu-mail">sabaaneh@gmail.com</a>
            <div class="social-links">${SOCIAL}
            </div>
        </div>
    </div>`;

const FOOTER = `
    <footer class="footer" id="contact">
        <div class="container footer-grid">
            <div>
                <p class="eyebrow">Get in touch</p>
                <a href="mailto:sabaaneh@gmail.com" class="footer-mail">sabaaneh@gmail.com</a>
            </div>
            <div class="social-links">${SOCIAL}
            </div>
        </div>
        <div class="container footer-bottom">
            <p>&copy; 2026 Mohammad Sabaaneh. All rights reserved.</p>
            <p>Powered by <a href="https://el7mz.com" target="_blank" rel="noopener" class="credit">el7mz.com</a></p>
        </div>
    </footer>`;

// Folder name -> [title, subtitle, English cover file]
const BOOKS = {
    'Welcome to hell': ['Welcome to Hell', 'From the West Bank to Gaza', 'Welcome to Hell front cover.webp'],
    '30 second from Gaza': ['30 Seconds from Gaza', 'Diary of Genocide', '30 Seconds from Gaza front cover.webp'],
    'Power Born of Dream': ['Power Born of Dreams', 'My Story is Palestine', 'Power Born of Dreams Galley-1.webp'],
    'Palestine White and Black': ['White and Black', 'Political Cartoons from Palestine', 'White and Black front cover.webp'],
};

const BUY_LINKS = JSON.parse(await fs.readFile(path.join(__dirname, 'content', 'buy-links.json'), 'utf8'));
const readJson = async (name) => JSON.parse(await fs.readFile(path.join(__dirname, 'content', name), 'utf8'));
const REVIEWS = await readJson('reviews.json');
const AWARDS = await readJson('awards.json');
const PRESS = await readJson('press.json');
const PRINTS = await readJson('prints.json');

// Linked screenshot + quote cards (reviews, awards, news, interviews)
function cardsSection(title, items = []) {
    if (!items.length) return '';
    const cards = items.map(r => {
        const img = r.image.startsWith('./') ? r.image : `./public/assets/Reviews/${r.image}`;
        const cite = [r.author, r.source, r.year].filter(Boolean).join(', ');
        return `
                <a href="${r.url.replace(/&/g, '&amp;')}" target="_blank" rel="noopener" class="review animate-up">
                    <img src="${img}" alt="${r.source} article" loading="lazy">
                    <blockquote class="praise"${r.lang ? ` lang="${r.lang}"${r.lang === 'ar' ? ' dir="rtl"' : ''}` : ''}>“${r.quote}”<cite>${cite}</cite></blockquote>
                </a>`;
    }).join('');
    return `<section class="section pb-0"><div class="container"><h2 class="section-title sub">${title}</h2><div class="reviews">${cards}</div></div></section>`;
}

const HEAD = (title) => `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} | Mohammad Sabaaneh</title>
    <link rel="icon" href="./public/fav.png" type="image/png">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600;1,8..60,400&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <link rel="stylesheet" href="./style.css">
</head>
<body>`;

const CLOSE = `
    <script type="module" src="./main.js"></script>
</body>
</html>`;

async function getWebpFiles(dir) {
    try {
        const items = await fs.readdir(dir, { withFileTypes: true });
        return items.filter(f => f.isFile() && f.name.endsWith('.webp')).map(f => f.name).sort();
    } catch { return []; }
}

// Panoramas (much wider than tall) span the full gallery width
async function wideClass(file) {
    const { width, height } = await sharp(file).metadata();
    return width / height > 2.5 ? ' wide' : '';
}

async function getSubdirs(dir) {
    try {
        const items = await fs.readdir(dir, { withFileTypes: true });
        return items.filter(f => f.isDirectory()).map(f => f.name).sort();
    } catch { return []; }
}

function pageHeader(eyebrow, title) {
    return `
    <section class="section pb-0">
        <div class="container">
            <p class="eyebrow text-center">${eyebrow}</p>
            <h1 class="section-title text-center">${title}</h1>
        </div>
    </section>`;
}

function gallerySection(title, imagesHtml, extraHtml = '') {
    return `
    <section class="gallery section">
        <div class="container">
            <h2 class="section-title sub">${title}</h2>
            ${extraHtml}
            <div class="gallery-grid masonry">
                ${imagesHtml}
            </div>
        </div>
    </section>`;
}

// ======================= CARTOONS =======================
async function generateCartoons() {
    const basePath = path.join(__dirname, 'public', 'assets', 'Cartoon');
    const years = (await getSubdirs(basePath)).reverse(); // newest first
    let tabs = '';
    let sections = '';
    for (const year of years) {
        const files = await getWebpFiles(path.join(basePath, year));
        if (files.length === 0) continue;
        const imgs = files.map(f => `<img src="./public/assets/Cartoon/${year}/${f}" alt="Cartoon ${year}" loading="lazy">`).join('\n                ');
        tabs += `<button class="tab" data-year="${year}">${year}</button>`;
        sections += `
    <section class="gallery section year-panel" id="y${year}" hidden>
        <div class="container">
            <div class="gallery-grid masonry">
                ${imgs}
            </div>
        </div>
    </section>`;
    }
    sections = `
    <section class="section pb-0">
        <div class="container">
            <p class="eyebrow text-center">2017 – 2025</p>
            <h1 class="section-title text-center">Cartoons</h1>
            <nav class="tabs" aria-label="Year">${tabs}</nav>
        </div>
    </section>` + sections;
    const html = HEAD('Cartoons') + NAV + `<main class="page" id="main">${sections}</main>` + FOOTER + CLOSE;
    await fs.writeFile(path.join(__dirname, 'cartoons.html'), html);
    console.log('Generated cartoons.html');
}

// ======================= MURALS =======================
async function generateMurals() {
    const basePath = path.join(__dirname, 'public', 'assets', 'Mural');
    // Newest first; folders not listed here go at the end
    const ORDER = ['Jerusalem', 'Home', 'Yasser Arafat', 'Vanella'];
    const dirs = (await getSubdirs(basePath)).filter(d => d !== 'Ink').sort((a, b) =>
        (ORDER.indexOf(a) + 1 || 99) - (ORDER.indexOf(b) + 1 || 99));
    let sections = '';
    for (const dir of dirs) {
        const files = await getWebpFiles(path.join(basePath, dir));
        if (files.length === 0) continue;
        const imgs = (await Promise.all(files.map(async f => `<img src="./public/assets/Mural/${dir}/${f}" alt="${dir} mural" class="animate-up${await wideClass(path.join(basePath, dir, f))}" loading="lazy">`))).join('\n                ');
        // Add video for Home mural
        let extra = '';
        if (dir === 'Home') {
            extra = `<div class="video-container mb"><iframe src="https://www.youtube.com/embed/j62kvrTzHTY" title="Home Mural Video" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>`;
        }
        sections += gallerySection(dir, imgs, extra);
    }
    const html = HEAD('Murals') + NAV + `<main class="page" id="main">${pageHeader('Public walls', 'Murals')}${sections}</main>` + FOOTER + CLOSE;
    await fs.writeFile(path.join(__dirname, 'murals.html'), html);
    console.log('Generated murals.html');
}

// ======================= INK MURALS =======================
// Long ink murals on paper, split out from the Murals page
async function generateInkMurals() {
    const dir = path.join(__dirname, 'public', 'assets', 'Mural', 'Ink');
    const files = await getWebpFiles(dir);
    const imgs = files.map(f => `<img src="./public/assets/Mural/Ink/${f}" alt="Ink mural" class="animate-up wide" loading="lazy">`).join('\n                ');
    const html = HEAD('Ink Murals') + NAV + `<main class="page" id="main">${pageHeader('Murals on paper', 'Ink Murals')}${gallerySection('Ink', imgs)}</main>` + FOOTER + CLOSE;
    await fs.writeFile(path.join(__dirname, 'ink-murals.html'), html);
    console.log('Generated ink-murals.html');
}

// ======================= ART =======================
async function generateArt() {
    const dir = path.join(__dirname, 'public', 'assets', 'Art');
    const files = await getWebpFiles(dir);
    const imgs = files.map(f => `<img src="./public/assets/Art/${f}" alt="Painting by Mohammad Sabaaneh" class="animate-up" loading="lazy">`).join('\n                ');
    const html = HEAD('Art') + NAV + `<main class="page" id="main">${pageHeader('Paintings', 'Art')}${gallerySection('Paintings', imgs)}</main>` + FOOTER + CLOSE;
    await fs.writeFile(path.join(__dirname, 'art.html'), html);
    console.log('Generated art.html');
}

// ======================= BOOKS =======================
async function generateBooks() {
    const basePath = path.join(__dirname, 'public', 'assets', 'Books');
    const bookDirs = Object.keys(BOOKS);

    // Books overview page - showing covers linking to individual book pages
    let cardsHtml = '';
    for (const book of bookDirs) {
        const files = await getWebpFiles(path.join(basePath, book));
        const cover = files.includes(BOOKS[book][2]) ? BOOKS[book][2] : files[0];
        const coverImg = cover ? `./public/assets/Books/${book}/${cover}` : '';
        const slug = book.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-$/, '');
        const [title, subtitle] = BOOKS[book];
        cardsHtml += `
                <a href="book-${slug}.html" class="book-card animate-up">
                    <img src="${coverImg}" alt="${title} cover" loading="lazy">
                    <h3>${title}</h3>
                    <p>${subtitle}</p>
                </a>`;
    }

    const booksHtml = HEAD('Books') + NAV + `
    <main class="page" id="main">
        <section class="gallery section">
            <div class="container">
                <p class="eyebrow text-center">Published work</p>
                <h1 class="section-title text-center">Books</h1>
                <div class="book-grid">
                    ${cardsHtml}
                </div>
            </div>
        </section>
    </main>` + FOOTER + CLOSE;

    await fs.writeFile(path.join(__dirname, 'books.html'), booksHtml);
    console.log('Generated books.html');

    // Individual book pages
    for (const book of bookDirs) {
        const slug = book.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-$/, '');
        const files = await getWebpFiles(path.join(basePath, book));
        const pageFiles = await getWebpFiles(path.join(basePath, book, 'Pages'));
        const [title, subtitle] = BOOKS[book];

        files.sort((a, b) => (b === BOOKS[book][2]) - (a === BOOKS[book][2]));
        let coverImgs = files.map(f => `<img src="./public/assets/Books/${book}/${f}" alt="${title} cover" class="animate-up" loading="lazy">`).join('\n                ');

        let pagesImgs = '';
        if (pageFiles.length > 0) {
            pagesImgs = pageFiles.map(f => `<img src="./public/assets/Books/${book}/Pages/${f}" alt="${title} page" class="animate-up" loading="lazy">`).join('\n                ');
        }

        // Add video for Power Born of Dreams
        let videoHtml = '';
        if (book === 'Power Born of Dream') {
            videoHtml = `
            <div class="video-container">
                <iframe src="https://www.youtube.com/embed/OIi4wYCErS8" title="Power Born of Dreams" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
            </div>`;
        }

        let text = '';
        try {
            text = await fs.readFile(path.join(__dirname, 'content', 'books', `${slug}.html`), 'utf8');
            text = `<section class="section pb-0"><div class="container"><div class="book-text">${text}</div></div></section>`;
        } catch {}

        const editions = BUY_LINKS[book] || [];
        const buy = editions.length ? `
        <section class="section pb-0">
            <div class="container">
                <div class="buy">
                    <h2 class="buy-title">Buy the book</h2>
                    ${editions.map(e => `
                    <div class="edition">
                        <p class="edition-lang">${e.language}</p>
                        <p class="edition-title">${e.title}</p>
                        <div class="stores">${e.stores.map(([name, url]) => `<a href="${url.replace(/&/g, '&amp;')}" target="_blank" rel="noopener" class="store">${name} <i class="fas fa-arrow-up-right-from-square" aria-hidden="true"></i></a>`).join('')}</div>
                    </div>`).join('')}
                </div>
            </div>
        </section>` : '';

        let sections = buy + text + cardsSection('Awards &amp; Honors', AWARDS[book]) + cardsSection('Press &amp; Reviews', REVIEWS[book]) + gallerySection('Covers', coverImgs);
        if (videoHtml) sections += `<section class="section bg-dark"><div class="container"><h2 class="section-title sub text-center">Video</h2>${videoHtml}</div></section>`;
        if (pagesImgs) sections += gallerySection('Pages', pagesImgs);

        const bookHtml = HEAD(title) + NAV + `
    <main class="page" id="main">
        <section class="section pb-0">
            <div class="container">
                <p class="text-center"><a href="books.html" class="back-link">← Back to Books</a></p>
                <h1 class="section-title text-center book-title">${title}</h1>
                <p class="text-center book-subtitle">${subtitle}</p>
            </div>
        </section>
        ${sections}
    </main>` + FOOTER + CLOSE;

        await fs.writeFile(path.join(__dirname, `book-${slug}.html`), bookHtml);
        console.log(`Generated book-${slug}.html`);
    }
}

// ======================= PRINTS =======================
const PRINT_NOTES = {
    lino: '<p class="print-note"><i class="fas fa-signature" aria-hidden="true"></i> Hand-pulled linocuts, signed and numbered by the artist. <a href="mailto:sabaaneh@gmail.com?subject=Linocut%20print%20enquiry">Price on request</a>.</p>',
    digital: '<p class="print-note"><i class="fas fa-signature" aria-hidden="true"></i> Signed prints of these digital works are available directly from the artist. <a href="mailto:sabaaneh@gmail.com?subject=Signed%20digital%20print%20enquiry">Ask about a signed print</a>.</p>',
};

const COLLECT = `
    <section class="section pb-0">
        <div class="container">
            <div class="collect">
                <p class="eyebrow">Collect</p>
                <h2 class="collect-title">Own an original Sabaaneh</h2>
                <p>Linocut prints are hand-pulled, signed and numbered by the artist. Signed prints of the digital works are also available. Each work below lists its size and edition.</p>
                <p class="collect-ship"><i class="fas fa-truck" aria-hidden="true"></i> Shipping costs are paid by the collector.</p>
                <details class="enquire">
                    <summary class="btn"><i class="fas fa-comment" aria-hidden="true"></i> Enquire about a work</summary>
                    <div class="enquire-menu">
                            <a href="https://wa.me/970599835218?text=Hello%20Mohammad%2C%20I%27m%20interested%20in%20one%20of%20your%20works." target="_blank" rel="noopener"><i class="fab fa-whatsapp" aria-hidden="true"></i> WhatsApp</a>
                            <a href="mailto:sabaaneh@gmail.com?subject=Artwork%20enquiry"><i class="fas fa-envelope" aria-hidden="true"></i> Email</a>
                        </div>
                </details>
            </div>
        </div>
    </section>`;
async function generatePrints() {
    const basePath = path.join(__dirname, 'public', 'assets', 'prints');
    const dirs = await getSubdirs(basePath);
    let sections = '';

    // Add download link for sabaaneh high.pdf
    sections += `
    <section class="section pb-0">
        <div class="container text-center">
            <a href="./public/assets/prints/Sabaaneh_High.pdf" download="Sabaaneh_High_Resolution.pdf" class="btn">
                <i class="fas fa-arrow-down"></i> Download High Resolution Portfolio (PDF)
            </a>
        </div>
    </section>`;

    sections += COLLECT;

    // Sort so Digital comes last
    const sortedDirs = dirs.filter(d => d !== 'Digital');
    const hasDigital = dirs.includes('Digital');
    if (hasDigital) sortedDirs.push('Digital');

    for (const dir of sortedDirs) {
        const files = await getWebpFiles(path.join(basePath, dir));
        if (files.length === 0) continue;
        const technique = PRINTS.technique[dir] || '';
        const imgs = (await Promise.all(files.map(async f => {
            const img = `<img src="./public/assets/prints/${dir}/${f}" alt="${technique || dir}" class="animate-up${await wideClass(path.join(basePath, dir, f))}" loading="lazy">`;
            const w = PRINTS.works[`${dir}/${f}`];
            return w ? `<figure class="print">${img}<figcaption>${[technique, w.size, w.edition].join(' · ')}</figcaption></figure>` : img;
        }))).join('\n                ');
        sections += gallerySection(dir, imgs, PRINT_NOTES[PRINTS.notes[dir]] || '');
    }
    const html = HEAD('Prints') + NAV + `<main class="page" id="main">${pageHeader('Printmaking', 'Prints')}${sections}</main>` + FOOTER + CLOSE;
    await fs.writeFile(path.join(__dirname, 'prints.html'), html);
    console.log('Generated prints.html');
}

// ======================= NEWS =======================
async function generateNews() {
    const sections = Object.entries(PRESS).map(([title, items]) => cardsSection(title, items)).join('');
    const html = HEAD('News') + NAV + `<main class="page" id="main">${pageHeader('In the press', 'News &amp; Interviews')}${sections}</main>` + FOOTER + CLOSE;
    await fs.writeFile(path.join(__dirname, 'news.html'), html);
    console.log('Generated news.html');
}

// ======================= WORLD MAP (home) =======================
// Built once at generation time: plain inline SVG, no map library in the browser.
async function buildWorldMap() {
    const MAP = await readJson('map.json');
    const world = JSON.parse(await fs.readFile(path.join(__dirname, 'node_modules', 'world-atlas', 'countries-110m.json'), 'utf8'));
    const countries = feature(world, world.objects.countries).features.filter(f => f.properties.name !== 'Antarctica');
    const W = 1000, H = 520;
    const projection = geoNaturalEarth1().fitExtent([[8, 8], [W - 8, H - 8]], { type: 'FeatureCollection', features: countries });
    const toPath = geoPath(projection).digits(1);
    const esc = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
    const label = (n) => n === 'United States of America' ? 'United States' : n;

    const shapes = countries.map(f => {
        const name = f.properties.name;
        return MAP[name] ? '' : `<path d="${toPath(f)}"/>`;
    }).join('');
    const byName = Object.fromEntries(countries.map(f => [f.properties.name, f]));
    // One pin per city/place; listed order = draw order (last on top)
    const active = Object.entries(MAP).map(([name, points]) => {
        const pins = points.map(({ place, at, items }) => {
            const [x, y] = projection(at).map(v => v.toFixed(1));
            return `<g class="map-point" tabindex="0" role="button" data-place="${esc(place)}" data-items="${esc(JSON.stringify(items))}" aria-label="${esc(place)}: ${esc(items.join('; '))}">
                    <circle class="map-pulse" cx="${x}" cy="${y}" r="4"/>
                    <circle class="map-pin" cx="${x}" cy="${y}" r="3"/>
                </g>`;
        }).join('');
        return `<g class="map-country${name === 'Palestine' ? ' is-home' : ''}" data-name="${esc(label(name))}">
                <path d="${toPath(byName[name])}"/>${pins}
            </g>`;
    }).join('');
    const names = Object.keys(MAP).reverse();
    const chips = names.map(n => `<button class="map-chip" data-name="${esc(label(n))}">${esc(label(n))}</button>`).join('');
    const places = Object.values(MAP).flat().length;
    // Region boxes [west, north, east, south] projected to viewBox rects for the zoom buttons
    const box = ([w, n, e, so]) => { const [x0, y0] = projection([w, n]); const [x1, y1] = projection([e, so]); return [x0, y0, x1 - x0, y1 - y0].map(v => +v.toFixed(1)); };
    const regions = { na: box([-128, 52, -66, 30]), eu: box([-11, 62, 40, 35]), me: box([30, 38, 54, 24]), af: box([-18, 38, 40, -36]) };

    return `
        <section class="section worldmap-section" id="world" aria-labelledby="world-title">
            <div class="container">
                <p class="eyebrow">Around the world</p>
                <h2 class="section-title sub" id="world-title">Exhibitions, Books &amp; Activities</h2>
                <p class="worldmap-count"><strong>${names.length}</strong> countries · <strong>${places}</strong> places · hover, tap or zoom</p>
                <div class="worldmap">
                    <div class="map-regions" role="group" aria-label="Zoom to region">
                        <button data-region="world" class="is-active">World</button>
                        <button data-region="na">North America</button>
                        <button data-region="eu">Europe</button>
                        <button data-region="me">Middle East</button>
                        <button data-region="af">Africa</button>
                    </div>
                    <div class="map-zoom" role="group" aria-label="Map zoom">
                        <button data-zoom="in" aria-label="Zoom in">+</button>
                        <button data-zoom="out" aria-label="Zoom out">−</button>
                    </div>
                    <svg viewBox="0 0 ${W} ${H}" data-regions='${JSON.stringify(regions)}' role="group" aria-label="World map of exhibitions, books and activities">
                        <path class="map-graticule" d="${toPath(geoGraticule10())}"/>
                        <g class="map-land">${shapes}</g>
                        <g class="map-active">${active}</g>
                    </svg>
                    <div class="map-tip" role="status" aria-live="polite" hidden></div>
                </div>
                <div class="map-chips">${chips}</div>
            </div>
        </section>`;
}

// ======================= MAIN =======================
// Inject shared nav/footer into the hand-written index.html
async function syncIndex() {
    const file = path.join(__dirname, 'index.html');
    let html = await fs.readFile(file, 'utf8');
    html = html
        .replace(/<!-- NAV -->[\s\S]*<!-- \/NAV -->/, `<!-- NAV -->${NAV}\n<!-- /NAV -->`)
        .replace(/<!-- FOOTER -->[\s\S]*<!-- \/FOOTER -->/, `<!-- FOOTER -->${FOOTER}\n<!-- /FOOTER -->`)
        .replace(/<!-- MAP -->[\s\S]*<!-- \/MAP -->/, `<!-- MAP -->${await buildWorldMap()}\n<!-- /MAP -->`);
    await fs.writeFile(file, html);
    console.log('Synced index.html');
}

// ======================= 404 =======================
async function generate404() {
    // <base> keeps relative asset paths working at any missing URL depth
    const html = HEAD('Page not found').replace('<head>', '<head>\n    <base href="/">') + NAV + `
    <main class="page" id="main">
        <section class="section">
            <div class="container text-center">
                <p class="eyebrow">Error 404</p>
                <h1 class="section-title">Page not found</h1>
                <a href="index.html" class="btn">Back to home</a>
            </div>
        </section>
    </main>` + FOOTER + CLOSE;
    await fs.writeFile(path.join(__dirname, '404.html'), html);
    console.log('Generated 404.html');
}

async function main() {
    await syncIndex();
    await generate404();
    await generateCartoons();
    await generateMurals();
    await generateInkMurals();
    await generateBooks();
    await generatePrints();
    await generateArt();
    await generateNews();
}

main();
