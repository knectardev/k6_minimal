/**
 * Small HTML helpers for build-time pages.
 *
 * Blog generation uses these today. Project pages (/project/<slug>/ served from
 * project.html, with the body injected from menu JSON) have the same
 * client-rendered gap and can require this module later. Do not generate
 * project pages from here.
 *
 * Trust boundary: escape text and attributes. A caller may insert an authored
 * HTML body only as element content, never inside <script>.
 */

const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

function escapeHtml(value) {
    return String(value == null ? '' : value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function escapeAttr(value) {
    return escapeHtml(value);
}

/**
 * Accept a site-root path or an http(s) URL.
 * Reject javascript:, data:, protocol-relative URLs, and other schemes.
 * Site paths are returned root-relative with each segment encoded.
 */
function safeUrl(value) {
    if (value == null) return '';
    const raw = String(value).trim();
    if (!raw || /[\u0000-\u001F\u007F]/.test(raw) || raw.includes('\\')) return '';
    if (raw.startsWith('//')) return '';

    if (/^[a-z][a-z0-9+.-]*:/i.test(raw)) {
        let url;
        try {
            url = new URL(raw);
        } catch (err) {
            return '';
        }
        if (url.protocol !== 'http:' && url.protocol !== 'https:') return '';
        return url.href;
    }

    const withSlash = raw.startsWith('/') ? raw : '/' + raw;
    if (withSlash.startsWith('//')) return '';

    const hashAt = withSlash.indexOf('#');
    const beforeHash = hashAt === -1 ? withSlash : withSlash.slice(0, hashAt);
    const hash = hashAt === -1 ? '' : withSlash.slice(hashAt);
    const queryAt = beforeHash.indexOf('?');
    const pathname = queryAt === -1 ? beforeHash : beforeHash.slice(0, queryAt);
    const search = queryAt === -1 ? '' : beforeHash.slice(queryAt);
    if (/[<>"']/.test(search + hash)) return '';

    let encodedPath;
    try {
        encodedPath = pathname.split('/').map((segment) => {
            if (!segment) return '';
            return encodeURIComponent(decodeURIComponent(segment));
        }).join('/');
    } catch (err) {
        return '';
    }
    if (!encodedPath.startsWith('/')) encodedPath = '/' + encodedPath;
    return encodedPath + search + hash;
}

function absoluteUrl(origin, value) {
    const safe = safeUrl(value);
    if (!safe) return '';
    if (/^https?:\/\//i.test(safe)) return safe;
    return String(origin).replace(/\/$/, '') + safe;
}

function canonicalPostUrl(origin, slug) {
    return String(origin).replace(/\/$/, '') + '/blog/' + encodeURIComponent(String(slug)) + '/';
}

/**
 * Format YYYY-MM-DD with a fixed English month table.
 * Avoid toLocaleDateString so two machines emit the same HTML.
 */
function formatDate(iso) {
    if (!iso) return '';
    const match = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!match) return '';
    const month = MONTHS[Number(match[2]) - 1];
    if (!month) return '';
    return month + ' ' + Number(match[3]) + ', ' + match[1];
}

function jsonLdScript(obj) {
    const json = JSON.stringify(obj).replace(/</g, '\\u003c');
    return '<script type="application/ld+json">' + json + '</script>';
}

function sortPosts(posts) {
    return posts.slice().sort((a, b) => {
        const byDate = String(b && b.date || '').localeCompare(String(a && a.date || ''));
        if (byDate) return byDate;
        return String(a && a.slug || '').localeCompare(String(b && b.slug || ''));
    });
}

module.exports = {
    escapeHtml,
    escapeAttr,
    safeUrl,
    absoluteUrl,
    canonicalPostUrl,
    formatDate,
    jsonLdScript,
    sortPosts
};
