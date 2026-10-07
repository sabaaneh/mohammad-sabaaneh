import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(__dirname, 'public', 'assets');

async function ensureDir(dir) {
    await fs.mkdir(dir, { recursive: true });
}

async function compress(inputPath, outputPath) {
    console.log(`Compressing ${inputPath} -> ${outputPath}`);
    try {
        await sharp(inputPath)
            .resize({ width: 1400, withoutEnlargement: true })
            .webp({ quality: 80 })
            .toFile(outputPath);
    } catch (err) {
        console.error(`FAILED: ${inputPath}: ${err.message}`);
    }
}

async function processDir(srcDir, outDir) {
    await ensureDir(outDir);
    const items = await fs.readdir(srcDir, { withFileTypes: true });
    for (const item of items) {
        if (item.isFile() && item.name.match(/\.(png|jpg|jpeg|tif|tiff|psd)$/i) && !item.name.startsWith('.')) {
            const outName = path.parse(item.name).name + '.webp';
            const outPath = path.join(outDir, outName);
            // Skip if already exists
            try {
                await fs.access(outPath);
                console.log(`SKIP (exists): ${outPath}`);
            } catch {
                await compress(path.join(srcDir, item.name), outPath);
            }
        }
    }
}

async function main() {
    // 1. Hero.png
    const heroSrc = path.join(ROOT, 'Hero.png');
    const heroDst = path.join(OUT, 'Hero.webp');
    try { await fs.access(heroDst); } catch { await compress(heroSrc, heroDst); }

    // 2. Ink murals (has .tif files that weren't processed)
    await processDir(path.join(ROOT, 'Mural ', 'Ink'), path.join(OUT, 'Mural', 'Ink'));

    // Art (paintings)
    await processDir(path.join(ROOT, 'Art'), path.join(OUT, 'Art'));

    // 3. Book pages
    const books = ['30 second from Gaza', 'Palestine White and Black', 'Power Born of Dream ', 'Welcome to hell'];
    for (const book of books) {
        // Book covers/root images
        await processDir(path.join(ROOT, 'Books', book), path.join(OUT, 'Books', book.trim()));
        // Book pages
        const pagesDir = path.join(ROOT, 'Books', book, 'Pages');
        try {
            await fs.access(pagesDir);
            await processDir(pagesDir, path.join(OUT, 'Books', book.trim(), 'Pages'));
        } catch {
            console.log(`No Pages dir for ${book}`);
        }
    }

    // 4. Cartoons - all years
    const years = ['2017', '2018', '2019', '2020', '2021', '2022', '2023', '2024', '2025'];
    for (const year of years) {
        await processDir(path.join(ROOT, 'Cartoon', year), path.join(OUT, 'Cartoon', year));
    }

    // 5. Sabaaneh Portfolio.pdf -> copy
    const portfolioSrc = path.join(ROOT, 'Sabaaneh Portfolio.pdf');
    const portfolioDst = path.join(OUT, 'Sabaaneh_Portfolio.pdf');
    try { await fs.access(portfolioSrc); await fs.copyFile(portfolioSrc, portfolioDst); console.log('Copied Sabaaneh Portfolio.pdf'); } catch(e) { console.error(e.message); }

    // 6. sabaaneh high.pdf -> copy to prints section (only if missing: the committed copy is compressed for Cloudflare's 25MB limit)
    const highSrc = path.join(ROOT, 'sabaaneh high.pdf');
    const highDst = path.join(OUT, 'prints', 'Sabaaneh_High.pdf');
    try { await fs.access(highDst); } catch { await fs.copyFile(highSrc, highDst); console.log('Copied sabaaneh high.pdf'); }

    // 7. Signature
    const sigSrc = path.join(ROOT, 'signiture.jpg');
    const sigDst = path.join(OUT, 'signature.webp');
    try { await fs.access(sigDst); } catch { try { await compress(sigSrc, sigDst); } catch(e) { console.error(e.message); } }

    console.log('DONE');
}

main();
