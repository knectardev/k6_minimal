#!/usr/bin/env node

/**
 * Bake per-post Open Graph tags into static HTML.
 *
 * LinkedIn, Slack, and Facebook fetch HTML without running JavaScript.
 * blog-post.html therefore cannot set a post's title or cover image in the
 * crawler. This script writes /blog/<slug>/index.html with those values filled
 * in, and (when a cover image exists) a 1200x630 JPEG for the share card.
 *
 * Usage:
 *   node scripts/generate_blog_pages.js
 *   npm run generate-blog-pages
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT = path.resolve(__dirname, '..');
const ORIGIN = 'https://www.knectar.com';
const TEMPLATE = path.join(ROOT, 'blog-post.html');
const BLOG_JSON = path.join(ROOT, 'data', 'blog.json');
const OUT_DIR = path.join(ROOT, 'blog');
const OG_WIDTH = 1200;
const OG_HEIGHT = 630;
const DEFAULT_IMAGE = '/assets/og-image.png';

function escapeAttr(value) {
    return String(value == null ? '' : value)
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;');
}

function rootPath(src) {
    if (!src) return '';
        return src.startsWith('/') || /^https?:\/\//i.test(src) ? src : '/' + src;
}

function mimeFor(src) {
    const lower = String(src).split('?')[0].toLowerCase();
    if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
    if (lower.endsWith('.webp')) return 'image/webp';
    if (lower.endsWith('.gif')) return 'image/gif';
    return 'image/png';
}

function replaceAttrById(html, id, attr, value) {
    const escaped = escapeAttr(value);
    const withIdFirst = new RegExp(
        `(<[^>]*\\sid="${id}"[^>]*\\s${attr}=")[^"]*(")`,
        'i'
    );
    if (withIdFirst.test(html)) {
        return html.replace(withIdFirst, `$1${escaped}$2`);
    }
    const withAttrFirst = new RegExp(
        `(<[^>]*\\s${attr}=")[^"]*("[^>]*\\sid="${id}")`,
        'i'
    );
    return html.replace(withAttrFirst, `$1${escaped}$2`);
}

function applyPostMeta(html, post, imageUrl, imageType, width, height) {
    const url = `${ORIGIN}/blog/${encodeURIComponent(post.slug)}/`;
    const title = post.title || 'Knectar Blog';
    const desc = post.excerpt || title;
    const pageTitle = `${title} | Knectar Blog`;
    const alt = post.title || 'Knectar';

    html = html.replace(/<title>[^<]*<\/title>/i, `<title>${escapeAttr(pageTitle)}</title>`);
    html = replaceAttrById(html, 'canonical-link', 'href', url);
    html = replaceAttrById(html, 'image-src', 'href', imageUrl);
    const attrs = {
        'meta-description': desc,
        'og-url': url,
        'og-title': title,
        'og-description': desc,
        'og-image': imageUrl,
        'og-image-secure': imageUrl,
        'og-image-alt': alt,
        'og-image-width': String(width),
        'og-image-height': String(height),
        'og-image-type': imageType,
        'twitter-url': url,
        'twitter-title': title,
        'twitter-description': desc,
        'twitter-image': imageUrl
    };
    Object.keys(attrs).forEach((id) => {
        html = replaceAttrById(html, id, 'content', attrs[id]);
    });
    return html;
}

function ogOutputPath(coverRel) {
    const parsed = path.parse(coverRel);
    return path.join(parsed.dir, `${parsed.name}-og.jpg`).replace(/\\/g, '/');
}

async function ensureOgImage(coverRel) {
    const absCover = path.join(ROOT, coverRel.replace(/^\//, ''));
    if (!fs.existsSync(absCover)) return null;
    const relOut = ogOutputPath(coverRel.replace(/^\//, ''));
    const absOut = path.join(ROOT, relOut);
    fs.mkdirSync(path.dirname(absOut), { recursive: true });
    await sharp(absCover)
        .resize(OG_WIDTH, OG_HEIGHT, { fit: 'cover', position: 'centre' })
        .jpeg({ quality: 85 })
        .toFile(absOut);
    return '/' + relOut.replace(/\\/g, '/');
}

async function main() {
    const template = fs.readFileSync(TEMPLATE, 'utf8');
    const posts = JSON.parse(fs.readFileSync(BLOG_JSON, 'utf8'));
    if (!Array.isArray(posts)) throw new Error('blog.json must be an array');

    fs.mkdirSync(OUT_DIR, { recursive: true });

    for (const post of posts) {
        if (!post || !post.slug) continue;
        let imagePath = DEFAULT_IMAGE;
        let width = OG_WIDTH;
        let height = OG_HEIGHT;
        if (post.coverImage) {
            const ogRel = await ensureOgImage(rootPath(post.coverImage));
            imagePath = ogRel || rootPath(post.coverImage);
        }
        const imageUrl = `${ORIGIN}${imagePath}`;
        const html = applyPostMeta(template, post, imageUrl, mimeFor(imagePath), width, height);
        const destDir = path.join(OUT_DIR, post.slug);
        fs.mkdirSync(destDir, { recursive: true });
        const dest = path.join(destDir, 'index.html');
        fs.writeFileSync(dest, html);
        console.log(`Wrote ${path.relative(ROOT, dest)} (${imagePath})`);
    }
}

if (require.main === module) {
    main().catch((err) => {
        console.error('Failed to generate blog pages:', err);
        process.exit(1);
    });
}

module.exports = { applyPostMeta, ensureOgImage };
