'use strict';
// Creates a new local artifact only. Never uploads, overwrites or deletes a previous build.
const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto');
const { checkRelease } = require('./build-release.cjs');
const { auditLicenses } = require('./audit-licenses.cjs');
const project = path.resolve(__dirname, '../..'), src = path.join(project, 'src');
const outputRoot = path.join(project, '.local', 'public-builds');
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const headers = () => fs.readFileSync(path.join(__dirname, 'public-headers.txt'));
function safeAsset(file) {
    if (typeof file !== 'string' || !/^[\w./-]+$/.test(file) || file.startsWith('/') || file.split('/').some(p => !p || p === '.' || p === '..')) throw new Error('Unsafe public path');
    return file;
}
function regularFile(base, file) {
    safeAsset(file);
    let target = base;
    for (const part of file.split('/')) {
        target = path.join(target, part);
        if (fs.lstatSync(target).isSymbolicLink()) throw new Error('Symbolic link forbidden: ' + file);
    }
    if (!fs.statSync(target).isFile()) throw new Error('Not a regular file: ' + file);
    return target;
}
function publicPaths(release) {
    // Separate allowlist derived from the active HTML, manifest and explicit runtime assets.
    const html = fs.readFileSync(path.join(src, 'index.html'), 'utf8');
    const paths = new Set(['index.html', 'manifest.json', 'sw.js', 'release-manifest.json']);
    for (const match of html.matchAll(/(?:src|href)="([^"#]+)"/g)) paths.add(safeAsset(match[1]));
    for (const icon of JSON.parse(fs.readFileSync(path.join(src, 'manifest.json'), 'utf8')).icons) paths.add(safeAsset(icon.src));
    for (const file of ['data/interface-translations.json', 'data/who-manifest.json', 'data/who-official.json', 'data/LICENSE-anthro.txt',
        'vendor/pdf/Amiri-Regular.ttf', 'vendor/pdf/Amiri-Bold.ttf', 'vendor/pdf/OFL.txt', 'vendor/pdf/METADATA.pb', 'vendor/pdf/provenance.json',
        'vendor/pdf/jspdf-4.2.1.umd.min.js.LICENSE.txt', 'vendor/pdf/autotable-5.0.8.min.js.LICENSE.txt']) paths.add(file);
    for (const file of Object.keys(release.assets)) {
        if (file === './') continue;
        safeAsset(file);
        if (!paths.has(file)) throw new Error('Unused or unapproved release resource: ' + file);
    }
    for (const file of paths) {
        if (!['sw.js', 'release-manifest.json'].includes(file) && !Object.hasOwn(release.assets, file)) throw new Error('Missing public resource: ' + file);
    }
    return [...paths].sort();
}
function assertContained(directory) {
    const absolute = path.resolve(directory), relative = path.relative(outputRoot, absolute);
    if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) throw new Error('Output must be a new child of .local/public-builds');
    let target = outputRoot;
    if (fs.existsSync(target) && fs.lstatSync(target).isSymbolicLink()) throw new Error('Symbolic output root');
    for (const part of relative.split(path.sep)) {
        target = path.join(target, part);
        if (fs.existsSync(target) && fs.lstatSync(target).isSymbolicLink()) throw new Error('Symbolic output directory');
    }
    return absolute;
}
function collect(directory, prefix = '') {
    const result = [];
    for (const item of fs.readdirSync(directory, { withFileTypes: true })) {
        const file = prefix + item.name;
        if (item.isSymbolicLink()) throw new Error('Symbolic package entry');
        if (item.isDirectory()) result.push(...collect(path.join(directory, item.name), file + '/'));
        else if (item.isFile()) result.push(file);
        else throw new Error('Non-regular package entry');
    }
    return result.sort();
}
function verifyPublic(directory) {
    auditLicenses();
    const output = assertContained(directory), release = checkRelease(), paths = publicPaths(release);
    const expected = Object.fromEntries(paths.map(file => [file, sha(fs.readFileSync(regularFile(src, file)))]));
    expected._headers = sha(headers());
    const manifest = JSON.parse(fs.readFileSync(regularFile(output, 'publication-manifest.json'), 'utf8'));
    if (manifest.format !== 1 || manifest.release !== release.id || manifest.version !== release.version || JSON.stringify(manifest.files) !== JSON.stringify(expected)) throw new Error('Publication manifest differs from verified sources');
    const actual = collect(output), wanted = [...Object.keys(expected), 'publication-manifest.json'].sort();
    if (JSON.stringify(actual) !== JSON.stringify(wanted)) throw new Error('Unexpected or missing public files');
    let bytes = 0, largest = 0;
    for (const [file, hash] of Object.entries(expected)) {
        const content = fs.readFileSync(regularFile(output, file));
        if (sha(content) !== hash) throw new Error('Public bytes changed: ' + file);
        bytes += content.length; largest = Math.max(largest, content.length);
    }
    bytes += fs.statSync(path.join(output, 'publication-manifest.json')).size;
    return { output, version: release.version, release: release.id, files: actual.length, bytes, largestFileBytes: largest, verified: true, published: false };
}
function preparePublic(name) {
    auditLicenses();
    const release = checkRelease(), paths = publicPaths(release);
    // Read and validate all source files before creating an output directory.
    const records = paths.map(file => [file, fs.readFileSync(regularFile(src, file))]);
    records.push(['_headers', headers()]);
    const output = assertContained(path.join(outputRoot, name || release.version + '-' + release.id.slice(0, 12) + '-' + crypto.randomUUID()));
    if (fs.existsSync(output)) throw new Error('Output already exists; nothing overwritten');
    fs.mkdirSync(outputRoot, { recursive: true });
    fs.mkdirSync(output); // Exclusive: a concurrent creation fails and preserves its contents.
    for (const [file, bytes] of records) {
        const target = path.join(output, file);
        fs.mkdirSync(path.dirname(target), { recursive: true });
        fs.writeFileSync(target, bytes, { flag: 'wx' });
    }
    const manifest = { format: 1, version: release.version, release: release.id, files: Object.fromEntries(records.map(([file, bytes]) => [file, sha(bytes)])) };
    fs.writeFileSync(path.join(output, 'publication-manifest.json'), JSON.stringify(manifest, null, 2) + '\n', { flag: 'wx' });
    return verifyPublic(output);
}
if (require.main === module) {
    try {
        const args = process.argv.slice(2);
        if (args.length && !(args.length === 2 && args[0] === '--verify')) throw new Error('Usage: node scripts/prepare-public.cjs [--verify .local/public-builds/<directory>]');
        console.log(JSON.stringify(args.length ? verifyPublic(args[1]) : preparePublic(), null, 2));
    } catch (error) { console.error(error.message); process.exitCode = 1; }
}
module.exports = { preparePublic, verifyPublic, publicPaths, outputRoot };
