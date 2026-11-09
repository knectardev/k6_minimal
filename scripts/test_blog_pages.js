#!/usr/bin/env node

/**
 * Regression checks for baked blog HTML.
 * Uses Node's built-in assert and http modules. Does not request production.
 *
 * Usage: node scripts/test_blog_pages.js
 */

const assert = require('assert');
const fs = require('fs');
const http = require('http');
const path = require('path');
const { spawn, spawnSync } = require('child_process');
const {
    escapeHtml,
    safeUrl,
    formatDate,
    jsonLdScript,
    canonicalPostUrl
} = require('./static_html');

const ROOT = path.resolve(__dirname, '..');
const ORIGIN = 'https://www.knectar.com';
const INDEX_START = '<!-- blog:index -->';
const INDEX_END = '<!-- /blog:index -->';

function runNode(args) {
    const result = spawnSync(process.execPath, args, { cwd: ROOT, encoding: 'utf8' });
    if (result.status !== 0) {
        const detail = (result.stdout || '') + (result.stderr || '');
        throw new Error(args.join(' ') + ' exited ' + result.status + '\n' + detail);
    }
    return result;
}

function decodeAttr(value) {
    return String(value)
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&');
}

function visibleText(html) {
    return decodeAttr(String(html)
        .replace(/<script[\s\S]*?<\/script>/gi, ' ')
        .replace(/<style[\s\S]*?<\/style>/gi, ' ')
        .replace(/<[^>]+>/g, ' '))
        .replace(/\s+/g, ' ')
        .trim();
}

function attrById(html, id, attr) {
    const idFirst = new RegExp('<[^>]*\\sid="' + id + '"[^>]*\\s' + attr + '="([^"]*)"', 'i');
    const attrFirst = new RegExp('<[^>]*\\s' + attr + '="([^"]*)"[^>]*\\sid="' + id + '"', 'i');
    const match = html.match(idFirst) || html.match(attrFirst);
    assert.ok(match, 'missing ' + attr + ' on #' + id);
    return decodeAttr(match[1]);
}

function jsonLd(html) {
    const match = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/i);
    assert.ok(match, 'missing BlogPosting JSON-LD');
    return JSON.parse(match[1]);
}

function loadPosts() {
    const posts = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'blog.json'), 'utf8'));
    assert.ok(Array.isArray(posts) && posts.length, 'blog.json must list posts');
    return posts;
}

function assertArticle(html, post, where) {
    const canonical = canonicalPostUrl(ORIGIN, post.slug);
    const text = visibleText(html);
    const bodyText = visibleText(post.body || '');
    assert.ok(bodyText.length > 0, post.slug + ' has no body');
    assert.ok(text.includes(bodyText), where + ' is missing the article body for ' + post.slug);
    assert.ok(
        html.includes('<span id="crumbPostTitle">' + escapeHtml(post.title) + '</span>'),
        where + ' breadcrumb does not match ' + post.slug
    );
    assert.ok(
        html.includes('<h1 style="margin: 0;">' + escapeHtml(post.title) + '</h1>'),
        where + ' heading does not match ' + post.slug
    );
    assert.strictEqual(attrById(html, 'canonical-link', 'href'), canonical, where + ' canonical');
    assert.strictEqual(attrById(html, 'og-url', 'content'), canonical, where + ' og:url');
    assert.strictEqual(attrById(html, 'og-title', 'content'), post.title, where + ' og:title');
    assert.strictEqual(attrById(html, 'meta-description', 'content'), post.excerpt, where + ' description');
    assert.ok(html.includes('data-static-post="' + escapeHtml(post.slug) + '"'), where + ' static marker');
    const data = jsonLd(html);
    assert.strictEqual(data.headline, post.title);
    assert.strictEqual(data.datePublished, String(post.date).slice(0, 10));
    assert.strictEqual(data.author && data.author.name, post.author);
    assert.strictEqual(data.mainEntityOfPage, canonical);
    assert.ok(String(data.image).startsWith(ORIGIN + '/'), where + ' image URL');
}

function assertIndex(html) {
    const posts = loadPosts();
    assert.strictEqual(html.split(INDEX_START).length, 2, 'blog index start marker');
    assert.strictEqual(html.split(INDEX_END).length, 2, 'blog index end marker');
    const start = html.indexOf(INDEX_START);
    const end = html.indexOf(INDEX_END);
    const region = html.slice(start, end);
    posts.forEach((post) => {
        const href = '/blog/' + encodeURIComponent(post.slug) + '/';
        assert.ok(region.includes('href="' + href + '"'), 'index missing ' + href);
    });
    assert.ok(html.includes('data-static-index'), 'index static marker');
}

function snapshotPages(posts) {
    const files = { 'blog.html': fs.readFileSync(path.join(ROOT, 'blog.html')) };
    posts.forEach((post) => {
        const rel = path.join('blog', post.slug, 'index.html');
        files[rel] = fs.readFileSync(path.join(ROOT, rel));
    });
    return files;
}

function assertUnchanged(before, posts) {
    assert.ok(before['blog.html'].equals(fs.readFileSync(path.join(ROOT, 'blog.html'))), 'blog.html changed on second generate');
    posts.forEach((post) => {
        const rel = path.join('blog', post.slug, 'index.html');
        const again = fs.readFileSync(path.join(ROOT, rel));
        assert.ok(before[rel].equals(again), rel + ' changed on second generate');
    });
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
            const req = http.get({ hostname: '127.0.0.1', port, path: '/blog/' }, (res) => {
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

function assertHelpers() {
    assert.strictEqual(safeUrl('javascript:alert(1)'), '');
    assert.strictEqual(safeUrl('data:text/html,hi'), '');
    assert.strictEqual(safeUrl('//evil.example/a'), '');
    assert.strictEqual(safeUrl('/embeds/gpu-fluid.html?v=20260911d'), '/embeds/gpu-fluid.html?v=20260911d');
    assert.strictEqual(formatDate('2026-09-10'), 'September 10, 2026');
    const script = jsonLdScript({ headline: '</script><script>alert(1)' });
    const inner = script.slice(script.indexOf('>') + 1, script.lastIndexOf('</script>'));
    assert.ok(!inner.includes('</'), 'JSON-LD must not contain a raw closing tag');
    assert.strictEqual(JSON.parse(inner).headline, '</script><script>alert(1)');
    assert.ok(escapeHtml('<b>&').includes('&lt;'));
}

async function assertServed(posts) {
    const port = await freePort();
    const child = spawn(process.execPath, ['server.js'], {
        cwd: ROOT,
        env: Object.assign({}, process.env, { PORT: String(port), NODE_ENV: 'development' }),
        stdio: ['ignore', 'pipe', 'pipe']
    });
    let logs = '';
    child.stdout.on('data', (chunk) => { logs += chunk; });
    child.stderr.on('data', (chunk) => { logs += chunk; });
    try {
        await waitForServer(port);
        const index = await httpGet(port, '/blog/');
        assert.strictEqual(index.status, 200);
        assert.ok(index.type.includes('text/html'), index.type);
        assertIndex(index.body);

        const featured = posts.find((post) => post.slug === 'ai-with-production-access') || posts[0];
        const other = posts.find((post) => post.slug !== featured.slug);
        for (const post of [featured, other]) {
            const res = await httpGet(port, '/blog/' + encodeURIComponent(post.slug) + '/');
            assert.strictEqual(res.status, 200, post.slug);
            assert.ok(res.type.includes('text/html'), res.type);
            assertArticle(res.body, post, 'HTTP ' + post.slug);
        }

        const missing = await httpGet(port, '/blog/this-post-does-not-exist/');
        assert.strictEqual(missing.status, 200);
        const shell = missing.body.match(/<article\b[^>]*\bid="blogPost"[^>]*>([\s\S]*?)<\/article>/i);
        assert.ok(shell, 'fallback page has no #blogPost article');
        assert.strictEqual(shell[1].trim(), '');
        assert.ok(!/data-static-post/.test(shell[0]), 'fallback article should stay empty');
    } catch (err) {
        err.message += '\n' + logs;
        throw err;
    } finally {
        child.kill();
    }
}

async function main() {
    assertHelpers();
    runNode(['scripts/generate_blog_pages.js']);
    const posts = loadPosts();
    const before = snapshotPages(posts);
    runNode(['scripts/generate_blog_pages.js']);
    assertUnchanged(before, posts);
    runNode(['scripts/generate_blog_pages.js', '--check']);

    const indexHtml = fs.readFileSync(path.join(ROOT, 'blog.html'), 'utf8');
    assertIndex(indexHtml);
    posts.forEach((post) => {
        const html = fs.readFileSync(path.join(ROOT, 'blog', post.slug, 'index.html'), 'utf8');
        assertArticle(html, post, post.slug);
    });

    const sample = posts[0];
    const samplePath = path.join(ROOT, 'blog', sample.slug, 'index.html');
    const original = fs.readFileSync(samplePath, 'utf8');
    const needle = sample.body.slice(0, 80);
    const at = original.indexOf(needle);
    assert.ok(at !== -1, 'sample body was not baked into ' + sample.slug);
    const broken = original.slice(0, at) + 'REMOVED-BODY' + original.slice(at + needle.length);
    fs.writeFileSync(samplePath, broken);
    const failed = spawnSync(process.execPath, ['scripts/generate_blog_pages.js', '--check'], {
        cwd: ROOT,
        encoding: 'utf8'
    });
    fs.writeFileSync(samplePath, original);
    assert.notStrictEqual(failed.status, 0, '--check should fail when generated HTML drifts');
    runNode(['scripts/generate_blog_pages.js', '--check']);

    await assertServed(posts);
    console.log('Blog page checks passed (' + posts.length + ' posts, files and HTTP).');
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
