#!/usr/bin/env node

/**
 * Bake blog posts into static HTML from data/blog.json.
 *
 * Fetchers that do not run JavaScript need the article text in the file.
 * This writes /blog/<slug>/index.html and the marked list in blog.html.
 * Open Graph images are written only when missing or when the JPEG bytes change.
 *
 * npm run build runs this, then runs it again with --check.
 * --check renders in memory and exits non-zero if the files differ.
 *
 * Usage:
 *   node scripts/generate_blog_pages.js
 *   node scripts/generate_blog_pages.js --check
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const {
    escapeHtml,
    escapeAttr,
    safeUrl,
    absoluteUrl,
    canonicalPostUrl,
    formatDate,
    jsonLdScript,
    sortPosts
} = require('./static_html');

const ROOT = path.resolve(__dirname, '..');
const ORIGIN = 'https://www.knectar.com';
const TEMPLATE = path.join(ROOT, 'blog-post.html');
const BLOG_HTML = path.join(ROOT, 'blog.html');
const BLOG_JSON = path.join(ROOT, 'data', 'blog.json');
const OUT_DIR = path.join(ROOT, 'blog');
const OG_WIDTH = 1200;
const OG_HEIGHT = 630;
const DEFAULT_IMAGE = '/assets/og-image.png';
const INDEX_START = '<!-- blog:index -->';
const INDEX_END = '<!-- /blog:index -->';

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
    if (!withAttrFirst.test(html)) {
        throw new Error(`Could not set ${attr} on #${id}`);
    }
    return html.replace(withAttrFirst, `$1${escaped}$2`);
}

function ogOutputPath(coverRel) {
    const parsed = path.parse(coverRel);
    return path.join(parsed.dir, `${parsed.name}-og.jpg`).replace(/\\/g, '/');
}

async function ensureOgImage(coverSitePath) {
    const rel = coverSitePath.replace(/^\//, '');
    const absCover = path.join(ROOT, rel);
    if (!fs.existsSync(absCover)) return null;
    const relOut = ogOutputPath(rel);
    const absOut = path.join(ROOT, relOut);
    const buf = await sharp(absCover)
        .resize(OG_WIDTH, OG_HEIGHT, { fit: 'cover', position: 'centre' })
        .jpeg({ quality: 85 })
        .toBuffer();
    fs.mkdirSync(path.dirname(absOut), { recursive: true });
    if (fs.existsSync(absOut) && fs.readFileSync(absOut).equals(buf)) {
        return '/' + relOut.replace(/\\/g, '/');
    }
    fs.writeFileSync(absOut, buf);
    return '/' + relOut.replace(/\\/g, '/');
}

function loadPosts() {
    const posts = JSON.parse(fs.readFileSync(BLOG_JSON, 'utf8'));
    if (!Array.isArray(posts)) throw new Error('blog.json must be an array');
    return sortPosts(posts).filter((post) => post && post.slug && !/[/\\]|\.\./.test(String(post.slug)));
}

async function shareImagePath(post, writeImages) {
    if (!post.coverImage) return DEFAULT_IMAGE;
    const sitePath = safeUrl(post.coverImage);
    if (!sitePath) return DEFAULT_IMAGE;
    if (/^https?:\/\//i.test(sitePath)) return sitePath;
    const absCover = path.join(ROOT, sitePath.replace(/^\//, ''));
    if (!fs.existsSync(absCover)) return sitePath;
    const relOut = ogOutputPath(sitePath.replace(/^\//, ''));
    if (writeImages) await ensureOgImage(sitePath);
    return '/' + relOut.replace(/\\/g, '/');
}

function dataAttr(name, value, asUrl) {
    if (value == null || value === '') return '';
    const stored = asUrl ? safeUrl(value) : String(value);
    if (!stored) return '';
    return ` ${name}="${escapeAttr(stored)}"`;
}

function coverDataAttrs(post, includeCredit) {
    const iframe = dataAttr('data-cover-iframe', post.coverIframe, true);
    if (!iframe) return '';
    let attrs = iframe + dataAttr('data-cover-iframe-title', post.coverIframeTitle, false);
    if (includeCredit) {
        attrs += dataAttr('data-cover-credit', post.coverIframeCredit, false);
        attrs += dataAttr('data-cover-credit-url', post.coverIframeCreditUrl, true);
    }
    return attrs;
}

function renderArticle(post) {
    const title = post.title || 'Knectar Blog';
    let html = `<article class="blog-post-info" id="blogPost" aria-label="Blog post" data-static-post="${escapeAttr(post.slug)}"`;
    html += coverDataAttrs(post, true);
    html += '>';
    html += `<h1 style="margin: 0;">${escapeHtml(title)}</h1>`;

    const rows = [];
    const date = formatDate(post.date);
    if (date) rows.push(`<li><strong>DATE:</strong> ${escapeHtml(date)}</li>`);
    if (post.author) rows.push(`<li><strong>AUTHOR:</strong> ${escapeHtml(post.author)}</li>`);
    if (post.category) {
        const href = '/blog/?category=' + encodeURIComponent(post.category);
        rows.push(`<li><strong>CATEGORY:</strong> <a href="${escapeAttr(href)}" class="tech-link">${escapeHtml(post.category)}</a></li>`);
    }
    if (rows.length) html += `<ul>${rows.join('\n')}</ul>`;

    // post.body is authored HTML from data/blog.json. It is inserted unescaped
    // inside this article, never inside <script>. Do not escape or sanitize it.
    if (post.body) html += `<div class="description">${post.body}</div>`;

    html += '<p class="blog-back-link"><a href="/blog/" class="tech-link">&larr; All posts</a></p>';
    html += '</article>';
    return html;
}

function applyPostMeta(html, post, imageUrl, imageType, width, height) {
    const url = canonicalPostUrl(ORIGIN, post.slug);
    const safeImage = absoluteUrl(ORIGIN, imageUrl) || absoluteUrl(ORIGIN, DEFAULT_IMAGE);
    const title = post.title || 'Knectar Blog';
    const desc = post.excerpt || title;
    const pageTitle = `${title} | Knectar Blog`;

    html = html.replace(/<title>[^<]*<\/title>/i, `<title>${escapeHtml(pageTitle)}</title>`);
    html = replaceAttrById(html, 'canonical-link', 'href', url);
    html = replaceAttrById(html, 'image-src', 'href', safeImage);
    const attrs = {
        'meta-description': desc,
        'og-url': url,
        'og-title': title,
        'og-description': desc,
        'og-image': safeImage,
        'og-image-secure': safeImage,
        'og-image-alt': title,
        'og-image-width': String(width),
        'og-image-height': String(height),
        'og-image-type': imageType,
        'twitter-url': url,
        'twitter-title': title,
        'twitter-description': desc,
        'twitter-image': safeImage
    };
    Object.keys(attrs).forEach((id) => {
        html = replaceAttrById(html, id, 'content', attrs[id]);
    });

    const crumb = `<span id="crumbPostTitle">${escapeHtml(title)}</span>`;
    if (!html.includes('<span id="crumbPostTitle">')) {
        throw new Error('template is missing #crumbPostTitle');
    }
    html = html.replace(/<span id="crumbPostTitle">[^<]*<\/span>/, crumb);

    const article = renderArticle(post);
    if (!/<article\b[^>]*\bid="blogPost"[^>]*>[\s\S]*?<\/article>/i.test(html)) {
        throw new Error('template is missing #blogPost article');
    }
    html = html.replace(/<article\b[^>]*\bid="blogPost"[^>]*>[\s\S]*?<\/article>/i, article);

    const cover = safeUrl(post.coverImage || '');
    if (cover && !/^https?:\/\//i.test(cover)) {
        const alt = escapeAttr(`${title} image`);
        const hero = `<img id="blogHeroImage" class="detail-stack-image active blog-hero" src="${escapeAttr(cover)}" alt="${alt}" />`;
        if (!/<img\b[^>]*\bid="blogHeroImage"[^>]*>/i.test(html)) {
            throw new Error('template is missing #blogHeroImage');
        }
        html = html.replace(/<img\b[^>]*\bid="blogHeroImage"[^>]*>/i, hero);
    }

    const linkedData = {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: title,
        description: desc,
        mainEntityOfPage: url,
        image: safeImage
    };
    if (/^\d{4}-\d{2}-\d{2}/.test(String(post.date || ''))) {
        linkedData.datePublished = String(post.date).slice(0, 10);
    }
    if (post.author) {
        linkedData.author = { '@type': 'Person', name: post.author };
    }
    const script = jsonLdScript(linkedData);
    if (html.includes('application/ld+json')) {
        html = html.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/i, script);
    } else {
        html = html.replace(/<\/head>/i, `    ${script}\n</head>`);
    }
    return html;
}

function renderTile(post, index) {
    const title = post.title || 'Knectar Blog';
    const category = post.category || 'Uncategorized';
    const href = '/blog/' + encodeURIComponent(post.slug) + '/';
    const image = safeUrl(post.tileImage || post.coverImage || 'project_tiles/sample_tile1.png');
    const reverse = index % 2 === 1 ? ' reverse' : '';
    const date = formatDate(post.date);
    let attrs = ` class="project-tile${reverse}" data-category="${escapeAttr(category)}"`;
    attrs += coverDataAttrs(post, false);
    const lines = [
        `                <article${attrs}>`,
        '                    <div class="project-image">',
        '                        <div class="image-container" style="position: relative; width: 100%; height: 200px;">',
        `                            <img src="${escapeAttr(image)}" alt="${escapeAttr(title + ' image')}" style="width: 100%; height: 200px; object-fit: cover; border-radius: var(--border-radius) 0 0 var(--border-radius);">`,
        '                        </div>',
        '                    </div>',
        '                    <div class="project-text">',
        `                        <span class="project-category">${escapeHtml(category)}</span>`,
        `                        <h2 class="project-title"><a href="${escapeAttr(href)}">${escapeHtml(title)}</a></h2>`
    ];
    if (date) lines.push(`                        <p><strong>Date:</strong> ${escapeHtml(date)}</p>`);
    if (post.excerpt) lines.push(`                        <p class="blog-excerpt">${escapeHtml(post.excerpt)}</p>`);
    lines.push('                    </div>', '                </article>');
    return lines.join('\n');
}

function renderIndexDocument(blogHtml, posts) {
    let html = blogHtml.replace(
        /<section\b[^>]*\bid="blogList"[^>]*>/i,
        '<section class="project-list" id="blogList" aria-label="Blog posts" data-static-index>'
    );
    const start = html.indexOf(INDEX_START);
    const end = html.indexOf(INDEX_END);
    if (start === -1 || end < start) {
        throw new Error('blog.html is missing blog:index markers');
    }
    const inner = posts.map(renderTile).join('\n');
    return html.slice(0, start + INDEX_START.length) + '\n' + inner + '\n                ' + html.slice(end);
}

async function renderAll(writeImages) {
    const template = fs.readFileSync(TEMPLATE, 'utf8');
    const blogHtml = fs.readFileSync(BLOG_HTML, 'utf8');
    const posts = loadPosts();
    const pages = [];
    for (const post of posts) {
        const imagePath = await shareImagePath(post, writeImages);
        const html = applyPostMeta(template, post, imagePath, mimeFor(imagePath), OG_WIDTH, OG_HEIGHT);
        pages.push({
            slug: post.slug,
            html,
            dest: path.join(OUT_DIR, post.slug, 'index.html'),
            imagePath
        });
    }
    return {
        posts,
        pages,
        indexHtml: renderIndexDocument(blogHtml, posts)
    };
}

function compareToDisk(rendered) {
    const mismatches = [];
    rendered.pages.forEach((page) => {
        if (!fs.existsSync(page.dest)) {
            mismatches.push(`Missing ${path.relative(ROOT, page.dest)}`);
            return;
        }
        const current = fs.readFileSync(page.dest, 'utf8');
        if (current !== page.html) mismatches.push(`Out of date ${path.relative(ROOT, page.dest)}`);
    });
    const indexCurrent = fs.readFileSync(BLOG_HTML, 'utf8');
    if (indexCurrent !== rendered.indexHtml) mismatches.push('Out of date blog.html');
    return mismatches;
}

async function main() {
    const check = process.argv.includes('--check');
    const rendered = await renderAll(!check);
    if (check) {
        const mismatches = compareToDisk(rendered);
        if (mismatches.length) {
            console.error('Generated blog HTML does not match data/blog.json:');
            mismatches.forEach((line) => console.error('  ' + line));
            process.exit(1);
        }
        console.log(`Blog HTML matches data/blog.json (${rendered.pages.length} posts).`);
        return;
    }

    fs.mkdirSync(OUT_DIR, { recursive: true });
    rendered.pages.forEach((page) => {
        fs.mkdirSync(path.dirname(page.dest), { recursive: true });
        fs.writeFileSync(page.dest, page.html);
        console.log(`Wrote ${path.relative(ROOT, page.dest)} (${page.imagePath})`);
    });
    fs.writeFileSync(BLOG_HTML, rendered.indexHtml);
    console.log('Wrote blog.html');
}

if (require.main === module) {
    main().catch((err) => {
        console.error('Failed to generate blog pages:', err);
        process.exit(1);
    });
}

module.exports = {
    applyPostMeta,
    ensureOgImage,
    renderAll,
    compareToDisk,
    INDEX_START,
    INDEX_END
};
