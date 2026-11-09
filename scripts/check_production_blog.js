#!/usr/bin/env node

/**
 * After a Vercel deploy, fetch the live article HTML with Node's https client.
 * This does not run JavaScript. It is not part of npm test.
 *
 * Usage: node scripts/check_production_blog.js
 */

const fs = require('fs');
const https = require('https');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const ORIGIN = 'https://www.knectar.com';

function visibleText(html) {
    return String(html)
        .replace(/<script[\s\S]*?<\/script>/gi, ' ')
        .replace(/<style[\s\S]*?<\/style>/gi, ' ')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/\s+/g, ' ')
        .trim();
}

function get(url) {
    return new Promise((resolve, reject) => {
        https.get(url, { headers: { 'User-Agent': 'knectar-blog-check', Accept: 'text/html' } }, (res) => {
            const chunks = [];
            res.on('data', (chunk) => chunks.push(chunk));
            res.on('end', () => {
                resolve({
                    status: res.statusCode,
                    type: String(res.headers['content-type'] || ''),
                    body: Buffer.concat(chunks).toString('utf8')
                });
            });
        }).on('error', reject);
    });
}

async function main() {
    const posts = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'blog.json'), 'utf8'));
    const ordered = posts.slice().sort((a, b) => {
        if (a.slug === 'ai-with-production-access') return -1;
        if (b.slug === 'ai-with-production-access') return 1;
        return 0;
    });
    let failed = 0;
    for (const post of ordered) {
        const url = ORIGIN + '/blog/' + encodeURIComponent(post.slug) + '/';
        const res = await get(url);
        const bodyText = visibleText(post.body || '');
        const pageText = visibleText(res.body);
        const ok = res.status === 200 && res.type.includes('text/html') && pageText.includes(bodyText);
        console.log((ok ? 'ok  ' : 'FAIL') + ' ' + res.status + ' ' + url);
        if (!ok) {
            failed += 1;
            console.error('  content-type: ' + res.type);
            console.error('  body present: ' + pageText.includes(bodyText));
        }
    }
    if (failed) {
        console.error(failed + ' production page(s) did not include the article body.');
        process.exit(1);
    }
    console.log('Production HTML includes every article body.');
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
