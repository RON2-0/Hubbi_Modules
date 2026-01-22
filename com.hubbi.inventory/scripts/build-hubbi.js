/**
 * scripts/build-hubbi.js
 * 
 * Automates the build and packaging process for Hubbi Modules.
 * 1. Builds the project (npm run build)
 * 2. Copies manifest.json and sql/ to dist/
 * 3. Calculates SHA256 integrity hash of index.umd.js
 * 4. Updates dist/manifest.json with integrity and version
 * 5. Zips dist/ into com.hubbi.inventory.hubbi
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';
import { execSync } from 'node:child_process';
import archiver from 'archiver'; // Requires 'pnpm add -D archiver'

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MODULE_DIR = path.resolve(__dirname, '..');
const DIST_DIR = path.join(MODULE_DIR, 'dist');
const SQL_DIR = path.join(MODULE_DIR, 'sql');
const MANIFEST_SRC = path.join(MODULE_DIR, 'manifest.json');
const MANIFEST_DIST = path.join(DIST_DIR, 'manifest.json');

// Helper Logger
const log = (msg) => console.log(`\x1b[36m[Hubbi Build]\x1b[0m ${msg}`);
const error = (msg) => console.error(`\x1b[31m[Hubbi Error]\x1b[0m ${msg}`);

async function main() {
    try {
        // 1. Build
        log('Building project...');
        execSync('npm run build', { stdio: 'inherit', cwd: MODULE_DIR });

        // 2. Copy Assets
        log('Copying assets...');
        fs.copyFileSync(MANIFEST_SRC, MANIFEST_DIST);

        const distSqlDir = path.join(DIST_DIR, 'sql');

        if (fs.existsSync(SQL_DIR)) {
            if (!fs.existsSync(distSqlDir)) fs.mkdirSync(distSqlDir);
            fs.cpSync(SQL_DIR, distSqlDir, { recursive: true });
        }

        const README_SRC = path.join(MODULE_DIR, 'README.md');
        const README_DIST = path.join(DIST_DIR, 'README.md');
        if (fs.existsSync(README_SRC)) {
            fs.copyFileSync(README_SRC, README_DIST);
        }

        // 3. Calculate Integrity
        log('Calculating integrity...');
        const bundlePath = path.join(DIST_DIR, 'index.umd.js');
        if (!fs.existsSync(bundlePath)) throw new Error('Build failed: index.umd.js not found');

        const fileBuffer = fs.readFileSync(bundlePath);
        const hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
        const fileSize = fs.statSync(bundlePath).size;

        // 4. Update Manifest
        log(`Updating manifest (Hash: ${hash.substring(0, 8)}...)...`);
        const manifest = JSON.parse(fs.readFileSync(MANIFEST_DIST, 'utf-8'));
        manifest.meta = {
            ...manifest.meta,
            integrity: hash,
            size: fileSize,
            built_at: new Date().toISOString()
        };
        fs.writeFileSync(MANIFEST_DIST, JSON.stringify(manifest, null, 2));

        // 5. Zip Package
        const zipName = `${manifest.id}.hubbi`;
        const zipPath = path.join(MODULE_DIR, zipName);
        log(`Packaging to ${zipName}...`);

        const output = fs.createWriteStream(zipPath);
        const archive = archiver('zip', { zlib: { level: 9 } });

        output.on('close', () => {
            log(`Success! Package created: ${zipName} (${archive.pointer()} bytes)`);
        });

        archive.on('error', (err) => { throw err; });

        archive.pipe(output);

        // --- FIXED PACKAGING STRUCTURE ---
        // 1. Manifest (Root)
        archive.file(MANIFEST_DIST, { name: 'manifest.json' });

        // 2. Bundle (Inside dist/)
        const bundleFile = path.join(DIST_DIR, 'index.umd.js');
        if (fs.existsSync(bundleFile)) {
            archive.file(bundleFile, { name: 'dist/index.umd.js' });
        }

        // 3. README (Root)
        if (fs.existsSync(README_DIST)) {
            archive.file(README_DIST, { name: 'README.md' });
        }

        // 4. SQL Scripts (Root/sql)
        const sqlDistDir = path.join(DIST_DIR, 'sql');
        if (fs.existsSync(sqlDistDir)) {
            archive.directory(sqlDistDir, 'sql');
        }
        await archive.finalize();

    } catch (err) {
        error(err.message);
        process.exit(1);
    }
}

main();
