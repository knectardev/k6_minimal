#!/usr/bin/env node

/**
 * Regression checks for baked project HTML.
 * Uses Node's built-in assert and http modules. Does not request production.
 *
 * Usage: node scripts/test_project_pages.js
 */

const assert = require('assert');
const fs = require('fs');
const http = require('http');
const path = require('path');
const { spawn, spawnSync } = require('child_process');
const { cleanLegacyContent } = require('./clean_legacy_content');
const {
    collectProjects,
    canonicalProjectUrl,
    visibleText,
    INDEX_START,
    INDEX_END
} = require('./generate_project_pages');

const ROOT = path.resolve(__dirname, '..');
const SLUG = 'university-of-massachusetts-amherst';

function runNode(args) {
    const result = spawnSync(process.execPath, args, { cwd: ROOT, encoding: 'utf8' });
    if (result.status !== 0) {
        throw new Error(args.join(' ') + ' exited ' + result.status + '\n' + (result.stdout || '') + (result.stderr || ''));
    }
    return result;
}

function projectFile(slug) {
    return path.join(ROOT, 'project', slug, 'index.html');
}

function assertPage(project) {
    const html = fs.readFileSync(projectFile(project.slug), 'utf8');
    const text = visibleText(html);
    const summary = visibleText(cleanLegacyContent(project.pageSummary || ''));
    const title = String(project.projectTitle || project.slug).replace(/\s+/g, ' ').trim();
    assert.ok(text.includes(title), project.slug + ' is missing its title');
    if (summary.length >= 40) {
        assert.ok(text.includes(summary), project.slug + ' is missing its case-study text');
    }
    assert.ok(html.includes('data-static-project="' + project.slug + '"'), project.slug + ' is missing data-static-project');
    assert.ok(html.includes('href="' + canonicalProjectUrl(project.slug) + '"'), project.slug + ' is missing its canonical');
    const ld = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/i);
    assert.ok(ld, project.slug + ' is missing JSON-LD');
    const data = JSON.parse(ld[1]);
    assert.strictEqual(data.url, canonicalProjectUrl(project.slug));
    assert.ok(ld[1].indexOf('<') === -1, project.slug + ' JSON-LD contains a raw <');
    return html;
}

function freePort() {
    return new Promise((resolve, reject) => {
        const server = http.createServer();
        server.on('error', reject);
        server.listen(0, '127.0.0.1', () => {
            const port = server.address().port;
            server.close(() => resolve(port));
        });
    });
}

function httpGet(port, urlPath) {
    return new Promise((resolve, reject) => {
        const req = http.get({ hostname: '127.0.0.1', port, path: urlPath }, (res) => {
            const chunks = [];
            res.on('data', (chunk) => chunks.push(chunk));
            res.on('end', () => {
                resolve({
                    status: res.statusCode,
                    location: res.headers.location || '',
                    type: String(res.headers['content-type'] || ''),
                    body: Buffer.concat(chunks).toString('utf8')
                });
            });
        });
        req.on('error', reject);
    });
}

function waitForServer(port) {
    const started = Date.now();
    return new Promise((resolve, reject) => {
        const attempt = () => {
            const req = http.get({ hostname: '127.0.0.1', port, path: '/projects.html' }, (res) => {
                res.resume();
                if (res.statusCode === 200) resolve();
                else if (Date.now() - started > 10000) reject(new Error('server status ' + res.statusCode));
                else setTimeout(attempt, 150);
            });
            req.on('error', () => {
                if (Date.now() - started > 10000) reject(new Error('server did not start'));
                else setTimeout(attempt, 150);
            });
        };
        attempt();
    });
}

async function main() {
    runNode(['scripts/generate_project_pages.js']);
    const projects = collectProjects();
    const umass = projects.find(project => project.slug === SLUG);
    assert.ok(umass, 'menu is missing the UMass project');

    const before = {
        page: fs.readFileSync(projectFile(SLUG)),
        index: fs.readFileSync(path.join(ROOT, 'projects.html')),
        vercel: fs.readFileSync(path.join(ROOT, 'vercel.json'))
    };
    runNode(['scripts/generate_project_pages.js']);
    assert.ok(before.page.equals(fs.readFileSync(projectFile(SLUG))), 'UMass page changed on second generate');
    assert.ok(before.index.equals(fs.readFileSync(path.join(ROOT, 'projects.html'))), 'projects.html changed on second generate');
    assert.ok(before.vercel.equals(fs.readFileSync(path.join(ROOT, 'vercel.json'))), 'vercel.json changed on second generate');
    runNode(['scripts/generate_project_pages.js', '--check']);

    projects.forEach(assertPage);
    const umassHtml = fs.readFileSync(projectFile(SLUG), 'utf8');
    assert.ok(visibleText(umassHtml).includes('Blocks Placer'), 'UMass page is missing the case-study sentence');

    const index = fs.readFileSync(path.join(ROOT, 'projects.html'), 'utf8');
    const regionStart = index.indexOf(INDEX_START);
    const regionEnd = index.indexOf(INDEX_END);
    assert.ok(regionStart !== -1 && regionEnd > regionStart, 'projects.html markers missing');
    const region = index.slice(regionStart, regionEnd);
    assert.ok(region.includes('href="/project/' + SLUG + '/"'), 'project list is missing the UMass link');
    assert.strictEqual(index.split(INDEX_START).length, 2, 'project index marker should appear once');

    const vercel = fs.readFileSync(path.join(ROOT, 'vercel.json'), 'utf8');
    assert.ok(vercel.includes('"/project/:slug/index.html"'), 'pretty project URLs must serve the baked file');
    assert.ok(vercel.includes('"/project/' + SLUG + '/"'), 'query URL redirect for UMass is missing');
    assert.ok(!vercel.includes('/project.html?item=' + SLUG), 'legacy UMass destination still points at the empty shell');

    const tampered = umassHtml.replace('Blocks Placer', 'Blocks Missing');
    fs.writeFileSync(projectFile(SLUG), tampered);
    const failed = spawnSync(process.execPath, ['scripts/generate_project_pages.js', '--check'], { cwd: ROOT, encoding: 'utf8' });
    fs.writeFileSync(projectFile(SLUG), umassHtml);
    assert.notStrictEqual(failed.status, 0, '--check should fail when a project page drifts');
    runNode(['scripts/generate_project_pages.js', '--check']);

    const port = await freePort();
    const child = spawn(process.execPath, ['server.js'], {
        cwd: ROOT,
        env: Object.assign({}, process.env, { PORT: String(port), NODE_ENV: 'development' }),
        stdio: 'ignore'
    });
    try {
        await waitForServer(port);
        const page = await httpGet(port, '/project/' + SLUG + '/');
        assert.strictEqual(page.status, 200);
        assert.ok(page.type.includes('text/html'));
        assert.ok(visibleText(page.body).includes('Blocks Placer'), 'served UMass page is missing the case study');
        const query = await httpGet(port, '/project.html?item=' + SLUG);
        assert.strictEqual(query.status, 301);
        assert.ok(query.location.indexOf('/project/' + SLUG + '/') !== -1, 'query URL did not redirect to the baked page');
        const list = await httpGet(port, '/projects.html');
        assert.strictEqual(list.status, 200);
        assert.ok(list.body.includes('href="/project/' + SLUG + '/"'), 'served project list is missing the UMass link');
    } finally {
        child.kill();
    }

    console.log('Project page checks passed (' + projects.length + ' projects, files and HTTP).');
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
