#!/usr/bin/env node

/**
 * Bake project case studies into static HTML.
 *
 * Source of truth is data/menu.json. When data/projects/<slug>.json exists,
 * its fields override the menu entry (same merge the lazy loader uses).
 * Writes /project/<slug>/index.html, the project list in projects.html,
 * and the query-string redirects in vercel.json.
 *
 * The empty project.html shell stays the fallback for unknown slugs.
 * JavaScript enhances baked pages and does not replace their text.
 *
 * Usage:
 *   node scripts/generate_project_pages.js
 *   node scripts/generate_project_pages.js --check
 */

const fs = require('fs');
const path = require('path');
const { cleanLegacyContent } = require('./clean_legacy_content');
const {
    escapeHtml,
    escapeAttr,
    safeUrl,
    absoluteUrl,
    jsonLdScript
} = require('./static_html');

const ROOT = path.resolve(__dirname, '..');
const ORIGIN = 'https://www.knectar.com';
const TEMPLATE = path.join(ROOT, 'project.html');
const PROJECTS_HTML = path.join(ROOT, 'projects.html');
const MENU_JSON = path.join(ROOT, 'data', 'menu.json');
const PROJECTS_DIR = path.join(ROOT, 'data', 'projects');
const OUT_DIR = path.join(ROOT, 'project');
const VERCEL_JSON = path.join(ROOT, 'vercel.json');
const DEFAULT_IMAGE = ORIGIN + '/assets/og-image.png';
const INDEX_START = '<!-- projects:index -->';
const INDEX_END = '<!-- /projects:index -->';
const REDIRECT_START = '__static_project_redirects_start';
const REDIRECT_END = '__static_project_redirects_end';

const CATEGORY_SLUGS = {
    'Higher Education': 'higher-education',
    'Intranets & Portals': 'intranets-&-portals',
    'Web & iOS Apps': 'web-&-ios-apps',
    'Informational': 'informational',
    'E-Commerce': 'e-commerce',
    'Music & Art': 'music-&-art'
};

function canonicalProjectUrl(slug) {
    return ORIGIN + '/project/' + encodeURIComponent(slug) + '/';
}

function categoryHref(label) {
    if (!label) return '/projects.html';
    const slug = CATEGORY_SLUGS[label] || label.toLowerCase().replace(/\s+/g, '-');
    return '/projects/' + encodeURIComponent(slug) + '/';
}

function canonicalizeTech(raw) {
    const str = String(raw || '').trim();
    if (!str || /^\d+$/.test(str)) return null;
    const map = [
        { pattern: /drupal/i, name: 'Drupal' },
        { pattern: /shopify/i, name: 'Shopify' },
        { pattern: /magento/i, name: 'Magento' },
        { pattern: /wordpress/i, name: 'WordPress' },
        { pattern: /django/i, name: 'Django' },
        { pattern: /angular/i, name: 'Angular' },
        { pattern: /javascript|js/i, name: 'JavaScript' },
        { pattern: /p5\.js/i, name: 'P5.js' },
        { pattern: /unity/i, name: 'Unity' },
        { pattern: /c#/i, name: 'C#' },
        { pattern: /rhino/i, name: 'Rhino 3D' }
    ];
    const match = map.find(entry => entry.pattern.test(str));
    if (match) return match.name;
    const cleaned = str.replace(/\s+\d+.*/, '').trim();
    return cleaned || str;
}

function techList(technology) {
    const found = [];
    String(technology || '').split(',').forEach(part => {
        const canon = canonicalizeTech(part);
        if (canon && found.indexOf(canon) === -1) found.push(canon);
    });
    return found;
}

function visibleText(html) {
    return String(html || '')
        .replace(/<script[\s\S]*?<\/script>/gi, ' ')
        .replace(/<style[\s\S]*?<\/style>/gi, ' ')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/\s+/g, ' ')
        .trim();
}

function excerptFromSummary(html) {
    const cleaned = cleanLegacyContent(html || '');
    let text = visibleText(cleaned);
    const bold = cleaned.match(/<(?:b|strong)[^>]*>([\s\S]*?)<\/(?:b|strong)>/i);
    if (bold) {
        const label = visibleText(bold[1]);
        if (label && text.indexOf(label) === 0) text = text.slice(label.length).trim();
    }
    if (text.length > 155) {
        text = text.slice(0, 152).replace(/\s+\S*$/, '') + '...';
    }
    return text;
}

function validSlug(slug) {
    return typeof slug === 'string' && slug.length > 0 && !/[\/\\]/.test(slug) && slug.indexOf('..') === -1;
}

function collectProjects() {
    const menu = JSON.parse(fs.readFileSync(MENU_JSON, 'utf8'));
    const projects = [];
    const seen = new Set();

    function walk(items, parentLabel) {
        (items || []).forEach(item => {
            if (item && item.submenu) {
                walk(item.submenu, item.label);
                return;
            }
            if (!item || !item.projectTitle) return;
            if (!validSlug(item.slug)) {
                throw new Error('Project "' + item.projectTitle + '" is missing a safe slug');
            }
            if (seen.has(item.slug)) {
                throw new Error('Duplicate project slug: ' + item.slug);
            }
            seen.add(item.slug);
            let data = Object.assign({}, item, { parentLabel: parentLabel || '' });
            const file = path.join(PROJECTS_DIR, item.slug + '.json');
            if (fs.existsSync(file)) {
                const extra = JSON.parse(fs.readFileSync(file, 'utf8'));
                data = Object.assign({}, data, extra, { parentLabel: parentLabel || '' });
            }
            projects.push(data);
        });
    }

    walk(menu, '');
    return projects;
}

function metaLine(label, inner) {
    if (!inner) return '';
    return '<li><span class="meta-label">' + escapeHtml(label) + ':</span> ' + inner + '</li>';
}

function footerCtaHtml(raw) {
    const cta = String(raw || '').trim();
    if (!cta) return '';
    let heading = "Let's Connect";
    let body = cta;
    if (cta.indexOf('?') !== -1) {
        const parts = cta.split('?');
        heading = parts[0].trim() + '?';
        body = parts.slice(1).join('?').trim();
    } else if (cta.indexOf('.') !== -1) {
        const parts = cta.split('.');
        heading = parts[0].trim();
        body = parts.slice(1).join('.').trim();
    } else if (cta.indexOf(':') !== -1) {
        const parts = cta.split(':');
        heading = parts[0].trim();
        body = parts.slice(1).join(':').trim();
    }
    return '<div class="project-footer-cta"><h3>' + escapeHtml(heading) + '</h3><p>' + escapeHtml(body) + '</p><a href="/index.html#contact" class="cta-button">Start a Conversation</a></div>';
}

function projectInfoHtml(project) {
    const title = project.projectTitle || project.label || project.slug;
    const techs = String(project.technology || '').split(',').map(part => part.trim()).filter(Boolean);
    const techHtml = techs.map(tech => {
        const href = '/projects.html?technology=' + encodeURIComponent(tech);
        return '<a href="' + escapeAttr(href) + '" class="technology-link">' + escapeHtml(tech) + '</a>';
    }).join(', ');
    const partnerUrl = safeUrl(project.designPartnerUrl);
    const partner = project.designPartner
        ? (partnerUrl
            ? '<a href="' + escapeAttr(partnerUrl) + '" target="_blank" rel="noopener">' + escapeHtml(project.designPartner) + '</a>'
            : escapeHtml(project.designPartner))
        : '';
    const projectUrl = safeUrl(project.projectUrl);
    const urlHtml = projectUrl
        ? '<a href="' + escapeAttr(projectUrl) + '" target="_blank" rel="noopener">' + escapeHtml(projectUrl) + '</a>'
        : '';
    const summary = cleanLegacyContent(project.pageSummary || '');
    const haiku = project.project_haiku
        ? '<div class="project-haiku">' + project.project_haiku + '</div>'
        : '';

    return [
        '<h1 style="margin: 0;">' + escapeHtml(title) + '</h1>',
        '<ul>',
        metaLine('Role', project.role ? escapeHtml(project.role) : ''),
        metaLine('Budget', project.budget ? escapeHtml(project.budget) : ''),
        metaLine('Technology', techHtml),
        metaLine('Years', project.years ? escapeHtml(project.years) : ''),
        metaLine('Design Partner', partner),
        metaLine('URL', urlHtml),
        '</ul>',
        haiku,
        summary ? '<div class="description">' + summary + '</div>' : '',
        footerCtaHtml(project.project_footer_CTA)
    ].filter(Boolean).join('');
}

function galleryHtml(project) {
    const images = Array.isArray(project.detailImages) ? project.detailImages : [];
    const tops = ['100px', '450px', '800px', '1150px'];
    return images.map((src, i) => {
        const url = safeUrl(src);
        if (!url) return '';
        const tilt = ((i * 7) - 10).toFixed(2);
        const top = tops[i] || (100 + i * 350) + 'px';
        const style = 'display:block;position:absolute;width:340px;border-radius:8px;box-shadow:0 4px 24px rgba(0,0,0,0.20);cursor:pointer;left:calc(50% + 100px);top:' + top + ';--tilt:' + tilt + 'deg';
        const isVideo = /\.(mp4|webm|ogg)$/i.test(url.split('?')[0]);
        if (isVideo) {
            return '<video class="detail-stack-image detail-stack-image-base" src="' + escapeAttr(url) + '" data-orig-tilt="' + tilt + '" data-image-index="' + i + '" style="' + style + '" muted loop playsinline autoplay></video>';
        }
        return '<img class="detail-stack-image detail-stack-image-base" src="' + escapeAttr(url) + '" alt="Project detail media ' + (i + 1) + '" data-orig-tilt="' + tilt + '" data-image-index="' + i + '" style="' + style + '">';
    }).filter(Boolean).join('\n');
}

function setAttr(html, id, attr, value) {
    const encoded = escapeAttr(value);
    const idFirst = new RegExp('(<[^>]*\\sid="' + id + '"[^>]*\\s' + attr + '=")[^"]*(")', 'i');
    const attrFirst = new RegExp('(<[^>]*\\s' + attr + '=")[^"]*("[^>]*\\sid="' + id + '")', 'i');
    if (idFirst.test(html)) return html.replace(idFirst, '$1' + encoded + '$2');
    if (attrFirst.test(html)) return html.replace(attrFirst, '$1' + encoded + '$2');
    throw new Error('template is missing ' + attr + ' on #' + id);
}

function renderProject(template, project) {
    const title = project.projectTitle || project.label || project.slug;
    const fullTitle = title + ' | Knectar Portfolio';
    const canonical = canonicalProjectUrl(project.slug);
    const excerpt = excerptFromSummary(project.pageSummary || '');
    const category = project.parentLabel || 'Projects';
    const cover = absoluteUrl(ORIGIN, project.coverImage || (project.detailImages && project.detailImages[0]) || '');
    const image = cover || DEFAULT_IMAGE;

    let html = template;
    html = html.replace(/<title>[^<]*<\/title>/, '<title>' + escapeHtml(fullTitle) + '</title>');
    html = setAttr(html, 'canonical-link', 'href', canonical);
    html = setAttr(html, 'og-url', 'content', canonical);
    html = setAttr(html, 'twitter-url', 'content', canonical);
    html = setAttr(html, 'og-title', 'content', fullTitle);
    html = setAttr(html, 'twitter-title', 'content', fullTitle);
    if (excerpt) {
        html = setAttr(html, 'meta-description', 'content', excerpt);
        html = setAttr(html, 'og-description', 'content', excerpt);
        html = setAttr(html, 'twitter-description', 'content', excerpt);
    }
    html = html.split(DEFAULT_IMAGE).join(image);

    const crumb = '&gt; <a href="' + escapeAttr(categoryHref(project.parentLabel)) + '" class="breadcrumb-link" id="crumbCategoryLink">' + escapeHtml(category) + '</a> &gt; <span data-field="projectTitle">' + escapeHtml(title) + '</span>';
    const crumbFrom = '&gt; <a href="#" class="breadcrumb-link" id="crumbCategoryLink"></a> &gt; <span data-field="projectTitle"></span>';
    if (html.indexOf(crumbFrom) === -1) throw new Error('template is missing the project breadcrumb');
    html = html.replace(crumbFrom, crumb);

    const gallery = '<div class="project-gallery" aria-label="Project gallery">\n' + galleryHtml(project) + '\n</div>';
    if (!/<div class="project-gallery" aria-label="Project gallery">[\s\S]*?<\/div>/.test(html)) {
        throw new Error('template is missing the project gallery');
    }
    html = html.replace(/<div class="project-gallery" aria-label="Project gallery">[\s\S]*?<\/div>/, gallery);

    const info = '<div class="project-info" aria-label="Project information" data-static-project="' + escapeAttr(project.slug) + '">' + projectInfoHtml(project) + '</div>';
    const infoFrom = '<div class="project-info" aria-label="Project information"><!-- populated dynamically --></div>';
    if (html.indexOf(infoFrom) === -1) throw new Error('template is missing the empty project-info');
    html = html.replace(infoFrom, info);

    const ld = jsonLdScript({
        '@context': 'https://schema.org',
        '@type': 'CreativeWork',
        name: title,
        description: excerpt || title,
        url: canonical,
        image: image,
        author: { '@type': 'Organization', name: 'Knectar' }
    });
    if (html.indexOf('</head>') === -1) throw new Error('template is missing </head>');
    html = html.replace('</head>', ld + '\n</head>');
    return html;
}

function tileHtml(project, index) {
    const title = project.projectTitle || project.label || project.slug;
    const href = '/project/' + encodeURIComponent(project.slug) + '/';
    const techs = techList(project.technology);
    const classes = 'project-tile' + (index % 2 === 1 ? ' reverse' : '');
    const cover = safeUrl(project.coverImage);
    const isVideo = cover && /\.(mp4|webm|ogg)$/i.test(cover.split('?')[0]);
    let media = '';
    if (isVideo) {
        media = '<video src="' + escapeAttr(cover) + '" autoplay loop muted playsinline></video>';
    } else if (cover) {
        media = '<img src="' + escapeAttr(cover) + '" alt="' + escapeAttr(title + ' image') + '" loading="lazy">';
    }
    return [
        '<article class="' + classes + '" data-category="' + escapeAttr(project.parentLabel || 'Misc') + '" data-technology="' + escapeAttr(techs.join('|')) + '">',
        '<div class="project-image">' + media + '</div>',
        '<div class="project-text">',
        '<span class="project-category">' + escapeHtml(project.parentLabel || '') + '</span>',
        '<h2 class="project-title"><a href="' + escapeAttr(href) + '">' + escapeHtml(title) + '</a></h2>',
        project.role ? '<p><strong>Role:</strong> ' + escapeHtml(project.role) + '</p>' : '',
        project.technology ? '<p><strong>Technology:</strong> ' + escapeHtml(project.technology) + '</p>' : '',
        '</div>',
        '</article>'
    ].filter(Boolean).join('');
}

function renderIndex(projectsHtml, projects) {
    const start = projectsHtml.indexOf(INDEX_START);
    const end = projectsHtml.indexOf(INDEX_END);
    if (start === -1 || end === -1 || end < start) {
        throw new Error('projects.html is missing project index markers');
    }
    const tiles = projects.map(tileHtml).join('\n');
    return projectsHtml.slice(0, start + INDEX_START.length) + '\n' + tiles + '\n' + projectsHtml.slice(end);
}

function redirectObject(value, destination, permanent) {
    return [
        '    {',
        '      "source": "/project.html",',
        '      "has": [{ "type": "query", "key": "item", "value": ' + JSON.stringify(value) + ' }],',
        '      "destination": ' + JSON.stringify(destination) + ',',
        '      "permanent": ' + (permanent ? 'true' : 'false'),
        '    }'
    ].join('\n');
}

function replaceRedirectBlock(text, slugs) {
    const startKey = JSON.stringify(REDIRECT_START);
    const endKey = JSON.stringify(REDIRECT_END);
    const startAt = text.indexOf(startKey);
    const endAt = text.indexOf(endKey);
    if (startAt < 0 || endAt < 0 || endAt < startAt) {
        throw new Error('vercel.json is missing the static project redirect markers');
    }
    const blockStart = text.lastIndexOf('\n    {', startAt);
    const blockEnd = text.indexOf('\n    }', endAt);
    if (blockStart < 0 || blockEnd < 0) throw new Error('could not bound the project redirect markers');
    const after = blockEnd + '\n    }'.length;
    const entries = [redirectObject(REDIRECT_START, '/projects.html', false)];
    slugs.forEach(slug => {
        entries.push(redirectObject(slug, '/project/' + encodeURIComponent(slug) + '/', true));
    });
    entries.push(redirectObject(REDIRECT_END, '/projects.html', false));
    return text.slice(0, blockStart + 1) + entries.join(',\n') + text.slice(after);
}

function pointLegacyDestinations(text, slugSet) {
    return text.replace(/\/project\.html\?item=([^"&#]+)/g, function (match, slug) {
        let decoded = slug;
        try {
            decoded = decodeURIComponent(slug);
        } catch (err) {
            return match;
        }
        if (!slugSet.has(decoded)) return match;
        return '/project/' + encodeURIComponent(decoded) + '/';
    });
}

function renderVercel(vercelText, projects) {
    const slugs = projects.map(project => project.slug).slice().sort((a, b) => a.localeCompare(b));
    const slugSet = new Set(slugs);
    return replaceRedirectBlock(pointLegacyDestinations(vercelText, slugSet), slugs);
}

function writeIfChanged(file, next) {
    const buf = Buffer.from(next, 'utf8');
    if (fs.existsSync(file) && fs.readFileSync(file).equals(buf)) return false;
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, buf);
    return true;
}

function removeStale(slugs) {
    if (!fs.existsSync(OUT_DIR)) return;
    fs.readdirSync(OUT_DIR).forEach(name => {
        const dir = path.join(OUT_DIR, name);
        if (!fs.statSync(dir).isDirectory()) return;
        if (slugs.has(name)) return;
        const index = path.join(dir, 'index.html');
        if (fs.existsSync(index)) fs.unlinkSync(index);
        if (fs.readdirSync(dir).length === 0) fs.rmdirSync(dir);
    });
}

function renderAll() {
    const template = fs.readFileSync(TEMPLATE, 'utf8');
    const projects = collectProjects();
    const pages = {};
    projects.forEach(project => {
        pages[project.slug] = renderProject(template, project);
    });
    return {
        projects,
        pages,
        index: renderIndex(fs.readFileSync(PROJECTS_HTML, 'utf8'), projects),
        vercel: renderVercel(fs.readFileSync(VERCEL_JSON, 'utf8'), projects)
    };
}

function compareToDisk(rendered) {
    const diffs = [];
    rendered.projects.forEach(project => {
        const file = path.join(OUT_DIR, project.slug, 'index.html');
        if (!fs.existsSync(file) || fs.readFileSync(file, 'utf8') !== rendered.pages[project.slug]) {
            diffs.push('project/' + project.slug + '/index.html');
        }
    });
    if (fs.existsSync(OUT_DIR)) {
        fs.readdirSync(OUT_DIR).forEach(name => {
            const index = path.join(OUT_DIR, name, 'index.html');
            if (fs.existsSync(index) && !rendered.pages[name]) diffs.push('stale project/' + name + '/index.html');
        });
    }
    if (fs.readFileSync(PROJECTS_HTML, 'utf8') !== rendered.index) diffs.push('projects.html');
    if (fs.readFileSync(VERCEL_JSON, 'utf8') !== rendered.vercel) diffs.push('vercel.json');
    return diffs;
}

function main() {
    const check = process.argv.indexOf('--check') !== -1;
    const rendered = renderAll();
    if (check) {
        const diffs = compareToDisk(rendered);
        if (diffs.length) {
            console.error('Project pages are out of date:\n' + diffs.join('\n'));
            process.exit(1);
        }
        console.log('Project pages match source (' + rendered.projects.length + ' projects).');
        return;
    }
    let written = 0;
    rendered.projects.forEach(project => {
        const file = path.join(OUT_DIR, project.slug, 'index.html');
        if (writeIfChanged(file, rendered.pages[project.slug])) written += 1;
    });
    removeStale(new Set(rendered.projects.map(project => project.slug)));
    if (writeIfChanged(PROJECTS_HTML, rendered.index)) written += 1;
    if (writeIfChanged(VERCEL_JSON, rendered.vercel)) written += 1;
    console.log('Wrote project pages for ' + rendered.projects.length + ' projects (' + written + ' files changed).');
}

if (require.main === module) main();

module.exports = {
    INDEX_START,
    INDEX_END,
    canonicalProjectUrl,
    collectProjects,
    renderAll,
    compareToDisk,
    visibleText
};
