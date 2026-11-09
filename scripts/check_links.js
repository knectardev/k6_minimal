#!/usr/bin/env node

/**
 * Check internal and external links in the public site.
 * Internal links are resolved the way server.js serves them.
 * External links are requested with redirects followed.
 *
 * Usage: node scripts/check_links.js
 * Writes scripts/link_report.json
 */

const fs = require('fs');
const http = require('http');
const https = require('https');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const LOCAL = 'http://127.0.0.1:8000';
const OUT = path.join(__dirname, 'link_report.json');
const SKIP_DIRS = new Set(['node_modules', '.git', 'backups']);
const CATEGORIES = new Set([
    'higher-education',
    'intranets-&-portals',
    'web-&-ios-apps',
    'informational',
    'e-commerce',
    'music-&-art',
    'programming-&-technical'
]);

function walk(dir, acc) {
    fs.readdirSync(dir, { withFileTypes: true }).forEach((entry) => {
        if (SKIP_DIRS.has(entry.name)) return;
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            walk(full, acc);
            return;
        }
        if (/\.(html|css)$/i.test(entry.name)) acc.push(full);
    });
}

function pageUrl(file) {
    const rel = path.relative(ROOT, file).split(path.sep).join('/');
    const project = rel.match(/^project\/([^/]+)\/index\.html$/);
    if (project) return '/project/' + project[1] + '/';
    const blog = rel.match(/^blog\/([^/]+)\/index\.html$/);
    if (blog) return '/blog/' + blog[1] + '/';
    if (rel === 'index.html') return '/';
    if (rel === 'about.html') return '/about/';
    if (rel === 'services.html') return '/services/';
    if (rel === 'blog.html') return '/blog/';
    if (rel === 'projects.html') return '/projects.html';
    if (rel.startsWith('data/') || rel === 'sitemap.xml') return '/';
    return '/' + rel;
}

function collectStrings(value, acc) {
    if (typeof value === 'string') acc.push(value);
    else if (Array.isArray(value)) value.forEach((item) => collectStrings(item, acc));
    else if (value && typeof value === 'object') Object.values(value).forEach((item) => collectStrings(item, acc));
}

function extractFromText(text) {
    const found = [];
    const attr = /(?:href|src|poster)\s*=\s*["']([^"']+)["']/gi;
    let match;
    while ((match = attr.exec(text))) found.push(match[1]);
    const srcset = /srcset\s*=\s*["']([^"']+)["']/gi;
    while ((match = srcset.exec(text))) {
        match[1].split(',').forEach((part) => {
            const url = part.trim().split(/\s+/)[0];
            if (url) found.push(url);
        });
    }
    const cssUrl = /url\(\s*['"]?([^'")]+)['"]?\s*\)/gi;
    while ((match = cssUrl.exec(text))) found.push(match[1]);
    return found;
}

function shouldSkip(raw) {
    const value = String(raw).trim();
    if (!value || value.startsWith('data:') || value.startsWith('javascript:') || value.startsWith('mailto:') || value.startsWith('tel:')) {
        return true;
    }
    return false;
}

function resolveLink(raw, basePath) {
    const value = String(raw).replace(/&amp;/g, '&').trim();
    if (value.startsWith('#')) return { kind: 'fragment', fragment: value.slice(1), path: basePath };
    if (value.startsWith('//')) return { kind: 'external', href: 'https:' + value };
    let url;
    try {
        url = new URL(value, LOCAL + basePath);
    } catch (err) {
        return { kind: 'invalid', href: value };
    }
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return { kind: 'skip' };
    if (url.hostname === '127.0.0.1' || url.hostname === 'localhost') {
        return { kind: 'internal', path: url.pathname, search: url.search, fragment: url.hash.slice(1), href: url.pathname + url.search };
    }
    if (url.hostname === 'www.knectar.com' || url.hostname === 'knectar.com') {
        return { kind: 'internal', path: url.pathname, search: url.search, fragment: url.hash.slice(1), href: url.pathname + url.search };
    }
    return { kind: 'external', href: url.href.split('#')[0] };
}

function internalTarget(pathname, search) {
    let decoded = pathname;
    try {
        decoded = decodeURIComponent(pathname);
    } catch (err) {
        return { ok: false, reason: 'bad encoding' };
    }
    if (decoded.includes('..')) return { ok: false, reason: 'path traversal' };
    const params = new URLSearchParams(search || '');

    if (decoded === '/project.html' && params.get('item')) {
        const file = path.join(ROOT, 'project', params.get('item'), 'index.html');
        return fs.existsSync(file) ? { ok: true, file: file } : { ok: false, reason: 'unknown project' };
    }
    const pretty = {
        '/': 'index.html',
        '/index.html': 'index.html',
        '/about': 'about.html',
        '/about/': 'about.html',
        '/services': 'services.html',
        '/services/': 'services.html',
        '/blog': 'blog.html',
        '/blog/': 'blog.html',
        '/projects': 'projects.html',
        '/projects/': 'projects.html'
    };
    if (pretty[decoded]) return { ok: true, file: path.join(ROOT, pretty[decoded]) };

    let project = decoded.match(/^\/project\/([^/]+)\/?$/);
    if (project) {
        const file = path.join(ROOT, 'project', project[1], 'index.html');
        return fs.existsSync(file) ? { ok: true, file: file } : { ok: false, reason: 'missing project page' };
    }
    let blog = decoded.match(/^\/blog\/([^/]+)\/?$/);
    if (blog) {
        const file = path.join(ROOT, 'blog', blog[1], 'index.html');
        return fs.existsSync(file) ? { ok: true, file: file } : { ok: false, reason: 'missing blog page' };
    }
    let category = decoded.match(/^\/projects\/([^/]+)\/?$/);
    if (category) {
        let slug = category[1];
        try { slug = decodeURIComponent(slug); } catch (err) { return { ok: false, reason: 'bad category' }; }
        if (!CATEGORIES.has(slug)) return { ok: false, reason: 'unknown project category' };
        return { ok: true, file: path.join(ROOT, 'projects.html') };
    }

    const relative = decoded.replace(/^\/+/, '');
    const file = path.join(ROOT, relative);
    if (fs.existsSync(file) && fs.statSync(file).isFile()) return { ok: true, file: file };
    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) {
        const index = path.join(file, 'index.html');
        if (fs.existsSync(index)) return { ok: true, file: index };
    }
    return { ok: false, reason: 'file not found' };
}

function hasFragment(file, fragment) {
    if (!fragment) return true;
    if (!file || !fs.existsSync(file)) return false;
    const html = fs.readFileSync(file, 'utf8');
    const id = fragment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp('(?:id|name)=["\']' + id + '["\']', 'i').test(html);
}

function requestOnce(href) {
    return new Promise((resolve) => {
        let url;
        try { url = new URL(href); } catch (err) { resolve({ error: 'invalid url' }); return; }
        const lib = url.protocol === 'https:' ? https : http;
        const req = lib.request(url, {
            method: 'GET',
            timeout: 15000,
            headers: {
                'User-Agent': 'knectar-link-check',
                'Accept': 'text/html,application/xhtml+xml,*/*'
            }
        }, (res) => {
            res.resume();
            resolve({ status: res.statusCode, location: res.headers.location || '' });
        });
        req.on('timeout', () => { req.destroy(); resolve({ error: 'timeout' }); });
        req.on('error', (err) => resolve({ error: err.code || err.message }));
        req.end();
    });
}

async function follow(href) {
    const chain = [];
    let current = href;
    for (let i = 0; i < 5; i += 1) {
        const result = await requestOnce(current);
        if (result.error) return { href: href, error: result.error, chain: chain };
        chain.push({ url: current, status: result.status });
        if (![301, 302, 303, 307, 308].includes(result.status) || !result.location) {
            return { href: href, status: result.status, final: current, chain: chain };
        }
        current = new URL(result.location, current).href;
    }
    return { href: href, error: 'too many redirects', chain: chain };
}

function pool(items, limit, worker) {
    const results = new Array(items.length);
    let next = 0;
    async function run() {
        while (next < items.length) {
            const index = next;
            next += 1;
            results[index] = await worker(items[index], index);
        }
    }
    const runners = [];
    for (let i = 0; i < Math.min(limit, items.length); i += 1) runners.push(run());
    return Promise.all(runners).then(() => results);
}

async function main() {
    const files = [];
    walk(ROOT, files);
    ['data/menu.json', 'data/blog.json'].forEach((rel) => files.push(path.join(ROOT, rel)));
    const projectsDir = path.join(ROOT, 'data', 'projects');
    if (fs.existsSync(projectsDir)) {
        fs.readdirSync(projectsDir).forEach((name) => {
            if (name.endsWith('.json')) files.push(path.join(projectsDir, name));
        });
    }
    files.push(path.join(ROOT, 'sitemap.xml'));

    const occurrences = new Map();
    function add(raw, sourceFile, basePath) {
        if (shouldSkip(raw)) return;
        const resolved = resolveLink(raw, basePath);
        if (!resolved || resolved.kind === 'skip') return;
        const key = resolved.kind === 'external' ? 'ext ' + resolved.href : resolved.kind === 'fragment' ? 'frag ' + basePath + '#' + resolved.fragment : 'int ' + (resolved.href || basePath);
        if (!occurrences.has(key)) occurrences.set(key, { resolved: resolved, sources: [] });
        const entry = occurrences.get(key);
        if (entry.sources.length < 8 && !entry.sources.includes(sourceFile)) entry.sources.push(sourceFile);
    }

    files.forEach((file) => {
        if (!fs.existsSync(file)) return;
        const text = fs.readFileSync(file, 'utf8');
        const base = pageUrl(file);
        if (file.endsWith('.xml')) {
            const locs = text.match(/<loc>([^<]+)<\/loc>/g) || [];
            locs.forEach((loc) => add(loc.replace(/<\/?loc>/g, ''), path.relative(ROOT, file), base));
            return;
        }
        if (file.endsWith('.json')) {
            let data;
            try { data = JSON.parse(text); } catch (err) { return; }
            const strings = [];
            collectStrings(data, strings);
            strings.forEach((value) => {
                const trimmed = value.trim();
                if (/href=|src=|srcset=/i.test(value)) {
                    extractFromText(value).forEach((raw) => add(raw, path.relative(ROOT, file), base));
                }
                if (/^(https?:\/\/|\/)[^\s]+$/.test(trimmed) && trimmed.length < 300) {
                    add(trimmed, path.relative(ROOT, file), base);
                }
            });
            return;
        }
        extractFromText(text).forEach((raw) => add(raw, path.relative(ROOT, file), base));
    });

    const internal = [];
    const external = [];
    const fragments = [];
    const invalid = [];
    occurrences.forEach((entry) => {
        const item = { sources: entry.sources.map((file) => file.split(path.sep).join('/')), resolved: entry.resolved };
        if (entry.resolved.kind === 'external') external.push(item);
        else if (entry.resolved.kind === 'fragment') fragments.push(item);
        else if (entry.resolved.kind === 'invalid') invalid.push(item);
        else internal.push(item);
    });

    internal.forEach((item) => {
        const target = internalTarget(item.resolved.path, item.resolved.search);
        item.target = target;
        item.fragmentOk = hasFragment(target.file, item.resolved.fragment);
        item.ok = !!(target.ok && item.fragmentOk);
    });
    fragments.forEach((item) => {
        const file = path.join(ROOT, item.resolved.path.replace(/^\//, ''));
        const pageFile = item.resolved.path.endsWith('/') ? path.join(ROOT, item.resolved.path, 'index.html') : file;
        item.ok = hasFragment(pageFile, item.resolved.fragment) || hasFragment(file, item.resolved.fragment);
    });

    const live = await pool(internal.filter((item) => item.ok), 8, async (item) => {
        const href = LOCAL + item.resolved.path + (item.resolved.search || '');
        const result = await follow(href);
        item.http = result.status || result.error;
        if (typeof result.status === 'number' && result.status >= 400) item.ok = false;
        return item;
    });
    void live;

    console.log('Checking ' + external.length + ' external URLs...');
    await pool(external, 6, async (item) => {
        item.http = await follow(item.resolved.href);
        const status = item.http.status;
        item.ok = typeof status === 'number' && status >= 200 && status < 400;
        item.blocked = status === 401 || status === 403 || status === 429 || status === 999;
        return item;
    });

    const report = {
        checkedAt: new Date().toISOString(),
        counts: {
            internal: internal.length,
            external: external.length,
            fragments: fragments.length,
            invalid: invalid.length,
            internalBroken: internal.filter((item) => !item.ok).length,
            externalBroken: external.filter((item) => !item.ok && !item.blocked).length,
            externalBlocked: external.filter((item) => item.blocked).length
        },
        internalBroken: internal.filter((item) => !item.ok).map((item) => ({
            href: item.resolved.href,
            reason: item.target && item.target.ok === false ? item.target.reason : (item.fragmentOk === false ? 'missing fragment' : 'http ' + item.http),
            http: item.http || null,
            sources: item.sources
        })),
        externalBroken: external.filter((item) => !item.ok && !item.blocked).map((item) => ({
            href: item.resolved.href,
            status: item.http.status || null,
            error: item.http.error || null,
            final: item.http.final || null,
            sources: item.sources
        })),
        externalBlocked: external.filter((item) => item.blocked).map((item) => ({
            href: item.resolved.href,
            status: item.http.status,
            sources: item.sources
        })),
        externalRedirects: external.filter((item) => item.ok && item.http.chain && item.http.chain.length > 1).map((item) => ({
            href: item.resolved.href,
            final: item.http.final,
            status: item.http.chain[0].status,
            sources: item.sources
        })),
        invalid: invalid
    };

    fs.writeFileSync(OUT, JSON.stringify(report, null, 2));
    console.log(JSON.stringify(report.counts, null, 2));
    console.log('Wrote ' + OUT);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
