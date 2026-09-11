// blog.js – renders the blog list (blog.html) and single post (blog-post.html)
// from /data/blog.json. Deliberately independent of the project pipeline
// (menu.json / projects.js / script.js injectPageData) so posts never leak into
// the sidebar or the projects list.

(function () {
    const BLOG_JSON = '/data/blog.json';
    const BLOG_BASE = '/blog/';
    const SITE_ORIGIN = 'https://www.knectar.com';

    // ---------------------------------------------------------------
    // Helpers
    // ---------------------------------------------------------------
    function escapeHtml(str) {
        return String(str == null ? '' : str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function rootPath(src) {
        if (!src) return '';
        return src.startsWith('/') || /^https?:\/\//i.test(src) ? src : '/' + src;
    }

    function mountFluid(canvas, options) {
        if (!canvas) return;
        if (window.KnectarFluid && typeof window.KnectarFluid.mount === 'function') {
            window.KnectarFluid.mount(canvas, options);
            return;
        }
        canvas.style.background = '#087a82';
    }

    // "2026-08-18" -> "August 18, 2026" (parsed as UTC to avoid off-by-one)
    function formatDate(iso) {
        if (!iso) return '';
        const d = new Date(iso.length === 10 ? iso + 'T00:00:00Z' : iso);
        if (isNaN(d.getTime())) return iso;
        return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
    }

    function postUrl(post) {
        return `${BLOG_BASE}${encodeURIComponent(post.slug)}/`;
    }

    function categoryUrl(cat) {
        return `${BLOG_BASE}?category=${encodeURIComponent(cat)}`;
    }

    // Body HTML runs through the same cleaner project pageSummary uses when available
    function cleanBody(html) {
        if (typeof window.cleanLegacyContent === 'function') {
            return window.cleanLegacyContent(html);
        }
        return html || '';
    }

    function setMeta(id, attr, value) {
        const el = document.getElementById(id);
        if (el && value != null) el.setAttribute(attr, value);
    }

    // Highlight the Blog entry in the sidebar built by load_menu.js
    function markSidebarActive() {
        const link = document.querySelector(`.main-nav a[href="${BLOG_BASE}"]`);
        const li = link && link.closest('li');
        if (li) li.classList.add('active');
    }

    async function fetchPosts() {
        const res = await fetch(BLOG_JSON);
        if (!res.ok) throw new Error(`HTTP ${res.status} loading ${BLOG_JSON}`);
        const data = await res.json();
        if (!Array.isArray(data)) throw new Error('blog.json must be an array');
        // Newest first
        return data.slice().sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));
    }

    // ---------------------------------------------------------------
    // List mode (blog.html)
    // ---------------------------------------------------------------
    function initList(posts) {
        const container = document.getElementById('blogList');
        const filterSelect = document.getElementById('blogCategoryFilter');
        const dropdownToggle = document.getElementById('blogDropdownToggle');
        const dropdownOptions = document.getElementById('blogDropdownOptions');
        const dropdownLabel = document.getElementById('blogDropdownLabel');
        const dropdownIcon = document.getElementById('blogDropdownIcon');
        // Own id on purpose: script.js injectPageData() removes #crumbCategoryLink on pretty URLs
        const crumb = document.getElementById('crumbBlogCategory');

        // ---- Build tiles ----
        container.innerHTML = '';
        posts.forEach((post, idx) => {
            const article = document.createElement('article');
            article.className = 'project-tile';
            if (Math.random() < 0.5) article.classList.add('reverse');
            article.dataset.category = post.category || 'Uncategorized';

            const imageSrc = rootPath(post.tileImage || post.coverImage || 'project_tiles/sample_tile1.png');
            const imageId = `blog-img-${idx}`;
            let mediaHTML;
            if (post.coverIframe) {
                mediaHTML = `
                <div class="image-container blog-tile-embed" style="position: relative; width: 100%; height: 200px;">
                    <canvas class="blog-tile-fluid"
                            role="img"
                            aria-label="${escapeHtml(post.coverIframeTitle || post.title)}"></canvas>
                </div>`;
            } else {
                mediaHTML = `
                <div class="image-container" style="position: relative; width: 100%; height: 200px;">
                    <div class="image-skeleton" style="width: 100%; height: 200px; position: absolute; top: 0; left: 0;"></div>
                    <img id="${imageId}"
                         src="${escapeHtml(imageSrc)}"
                         alt="${escapeHtml(post.title)} image"
                         loading="lazy"
                         class="fade-in-image"
                         style="width: 100%; height: 200px; object-fit: cover; border-radius: var(--border-radius) 0 0 var(--border-radius);"
                         onload="this.classList.add('loaded'); this.previousElementSibling.style.display='none';"
                         onerror="this.previousElementSibling.style.display='none';">
                </div>`;
            }

            article.innerHTML = `
                <div class="project-image">${mediaHTML}</div>
                <div class="project-text">
                    <span class="project-category">${escapeHtml(post.category || '')}</span>
                    <h2 class="project-title">${escapeHtml(post.title)}</h2>
                    ${post.date ? `<p><strong>Date:</strong> ${escapeHtml(formatDate(post.date))}</p>` : ''}
                    ${post.excerpt ? `<p class="blog-excerpt">${escapeHtml(post.excerpt)}</p>` : ''}
                </div>`;

            const href = postUrl(post);
            article.addEventListener('click', () => { window.location.href = href; });
            article.style.cursor = 'pointer';
            container.appendChild(article);
            mountFluid(article.querySelector('.blog-tile-fluid'), { tile: true, interactive: false });
        });

        const tiles = container.querySelectorAll('.project-tile');

        // ---- Populate category dropdown ----
        const counts = {};
        posts.forEach(p => {
            const c = p.category || 'Uncategorized';
            counts[c] = (counts[c] || 0) + 1;
        });
        const categories = Object.keys(counts).sort();

        if (filterSelect && dropdownOptions) {
            categories.forEach(cat => {
                const opt = document.createElement('option');
                opt.value = cat;
                opt.textContent = cat;
                filterSelect.appendChild(opt);

                const li = document.createElement('li');
                li.setAttribute('data-value', cat);
                li.setAttribute('role', 'option');
                li.innerHTML = `<span class="option-icon"></span>${escapeHtml(cat)}`;
                dropdownOptions.appendChild(li);
            });
        }

        // ---- Initial category from query string ----
        const params = new URLSearchParams(window.location.search);
        const initial = params.get('category');
        if (initial && filterSelect && categories.includes(initial)) {
            filterSelect.value = initial;
        }

        // ---- Dropdown open/close ----
        function closeDropdown() { if (dropdownOptions) dropdownOptions.style.display = 'none'; }
        function openDropdown() { if (dropdownOptions) dropdownOptions.style.display = 'block'; }

        if (dropdownToggle) {
            dropdownToggle.addEventListener('click', (e) => {
                e.stopPropagation();
                const isOpen = dropdownOptions && dropdownOptions.style.display === 'block';
                if (isOpen) closeDropdown(); else openDropdown();
                dropdownToggle.setAttribute('aria-expanded', String(!isOpen));
            });
        }
        if (dropdownOptions) {
            dropdownOptions.addEventListener('click', (e) => {
                const li = e.target.closest('li');
                if (!li) return;
                filterSelect.value = li.getAttribute('data-value');
                filterSelect.dispatchEvent(new Event('change'));
                closeDropdown();
                if (dropdownToggle) dropdownToggle.setAttribute('aria-expanded', 'false');
            });
        }
        document.addEventListener('click', closeDropdown);

        // ---- Filtering ----
        function animateVisibleTiles() {
            let delay = 0;
            tiles.forEach(tile => {
                if (tile.style.display === '' || tile.style.display === 'block') {
                    const useLeft = Math.random() < 0.5;
                    tile.classList.remove('slide-in-left', 'slide-in-right');
                    void tile.offsetWidth; // reflow
                    tile.style.animationDelay = `${delay}s`;
                    tile.classList.add(useLeft ? 'slide-in-left' : 'slide-in-right');
                    delay += 0.075;
                    tile.addEventListener('animationend', function handler() {
                        tile.style.transform = '';
                        tile.classList.remove('slide-in-left', 'slide-in-right');
                        tile.removeEventListener('animationend', handler);
                    });
                }
            });
        }

        function currentListPath() {
            // Keep whichever entry point the visitor used (/blog/, /blog, or /blog.html)
            const p = window.location.pathname;
            if (p === '/blog.html') return p;
            return BLOG_BASE;
        }

        function updateUrlAndCanonical(cat) {
            const qs = cat !== 'All' ? `?category=${encodeURIComponent(cat)}` : '';
            const path = currentListPath();
            const p = window.location.pathname;
            if (p === '/blog' || p === BLOG_BASE || p === '/blog.html') {
                history.replaceState(null, '', path + qs + (window.location.hash || ''));
            }
            const canonical = `${SITE_ORIGIN}${BLOG_BASE}${qs}`;
            setMeta('canonical-link', 'href', canonical);
            setMeta('og-url', 'content', canonical);
            setMeta('twitter-url', 'content', canonical);
        }

        function applyFilter() {
            const cat = filterSelect ? filterSelect.value : 'All';

            tiles.forEach(tile => {
                const show = cat === 'All' || tile.dataset.category === cat;
                tile.style.display = show ? '' : 'none';
            });

            if (crumb) crumb.textContent = cat;
            if (dropdownLabel) dropdownLabel.textContent = cat;
            if (dropdownIcon) {
                dropdownIcon.style.backgroundImage = cat === 'All' ? "url('/assets/360.svg')" : 'none';
            }

            updateUrlAndCanonical(cat);
            animateVisibleTiles();
        }

        if (filterSelect) filterSelect.addEventListener('change', applyFilter);
        applyFilter();
    }

    // ---------------------------------------------------------------
    // Detail mode (blog-post.html)
    // ---------------------------------------------------------------
    function getPostSlug() {
        const params = new URLSearchParams(window.location.search);
        let slug = params.get('post');
        if (!slug) {
            const m = window.location.pathname.match(/\/blog\/([^\/]+)\/?$/i);
            if (m && m[1]) slug = decodeURIComponent(m[1]);
        }
        return slug;
    }

    function renderNotFound(container, slug) {
        container.innerHTML = `
            <h1 style="margin: 0;">Post not found</h1>
            <p>There is no post at <code>${escapeHtml(slug || '')}</code>. It may have moved or never existed.</p>
            <p><a href="${BLOG_BASE}" class="tech-link">Back to the blog</a></p>`;
        document.title = 'Post not found | Knectar Blog';
        const crumb = document.getElementById('crumbPostTitle');
        if (crumb) crumb.textContent = 'Not found';
    }

    function buildPostHTML(post) {
        let html = `<h1 style="margin: 0;">${escapeHtml(post.title)}</h1>`;

        const rows = [];
        if (post.date) rows.push(`<li><strong>DATE:</strong> ${escapeHtml(formatDate(post.date))}</li>`);
        if (post.author) rows.push(`<li><strong>AUTHOR:</strong> ${escapeHtml(post.author)}</li>`);
        if (post.category) {
            rows.push(`<li><strong>CATEGORY:</strong> <a href="${categoryUrl(post.category)}" class="tech-link">${escapeHtml(post.category)}</a></li>`);
        }
        if (rows.length) html += `<ul>${rows.join('\n')}</ul>`;

        if (post.coverIframeCredit) {
            const creditUrl = post.coverIframeCreditUrl || post.coverIframe || '';
            const creditLabel = escapeHtml(post.coverIframeCredit);
            const creditLink = creditUrl
                ? `<a href="${escapeHtml(creditUrl)}" target="_blank" rel="noopener" class="external-link">${creditLabel}</a>`
                : creditLabel;
            html += `<p class="blog-embed-credit">Visual after ${creditLink}. Drag the simulation to stir the dye.</p>`;
        }

        if (post.body) html += `<div class="description">${cleanBody(post.body)}</div>`;

        html += `<p class="blog-back-link"><a href="${BLOG_BASE}" class="tech-link">&larr; All posts</a></p>`;
        return html;
    }

    function insertMobileHero(container, post) {
        if (!post.coverIframe && !post.coverImage) return;
        if (!window.matchMedia('(max-width: 768px)').matches) return;
        const gallery = document.createElement('div');
        gallery.className = 'mobile-gallery';
        gallery.setAttribute('aria-label', post.coverIframe ? 'Post simulation' : 'Post image');
        if (post.coverIframe) {
            const canvas = document.createElement('canvas');
            canvas.className = 'blog-mobile-fluid';
            canvas.setAttribute('role', 'img');
            canvas.setAttribute('aria-label', post.coverIframeTitle || post.title);
            gallery.appendChild(canvas);
            mountFluid(canvas, { tile: false, interactive: true });
        } else {
            const img = document.createElement('img');
            img.src = rootPath(post.coverImage);
            img.alt = `${post.title} image`;
            img.style.cursor = 'pointer';
            img.addEventListener('click', () => showImageModal(rootPath(post.coverImage)));
            gallery.appendChild(img);
        }
        const metaList = container.querySelector('ul');
        if (metaList && metaList.parentNode === container) {
            metaList.after(gallery);
        } else {
            container.prepend(gallery);
        }
    }

    function insertDesktopHero(post) {
        if (window.matchMedia('(max-width: 768px)').matches) return;
        const gallery = document.querySelector('.project-gallery');
        const hero = document.getElementById('blogHeroImage');
        if (post.coverIframe && gallery) {
            if (hero) {
                hero.removeAttribute('src');
                hero.style.display = 'none';
            }
            const canvas = document.createElement('canvas');
            canvas.className = 'blog-hero-fluid';
            canvas.setAttribute('role', 'img');
            canvas.setAttribute('aria-label', post.coverIframeTitle || post.title);
            gallery.appendChild(canvas);
            gallery.setAttribute('aria-label', 'Post simulation');
            mountFluid(canvas, { tile: false, interactive: true });
            return;
        }
        if (hero && post.coverImage) {
            const src = rootPath(post.coverImage);
            hero.src = src;
            hero.alt = `${post.title} image`;
            hero.style.display = 'block';
            hero.style.cursor = 'pointer';
            hero.addEventListener('click', () => showImageModal(src));
        }
    }

    function initDetail(posts) {
        const container = document.getElementById('blogPost');
        const slug = getPostSlug();
        const post = slug ? posts.find(p => p.slug === slug) : null;

        if (!post) {
            renderNotFound(container, slug);
            return;
        }

        container.innerHTML = buildPostHTML(post);
        insertMobileHero(container, post);
        insertDesktopHero(post);

        // Title, breadcrumb, meta tags
        document.title = `${post.title} | Knectar Blog`;
        const crumb = document.getElementById('crumbPostTitle');
        if (crumb) crumb.textContent = post.title;

        const canonical = `${SITE_ORIGIN}${postUrl(post)}`;
        const desc = post.excerpt || '';
        const shareImage = post.coverImage
            ? `${SITE_ORIGIN}${rootPath(post.coverImage).replace(/(\.[a-z0-9]+)$/i, '-og.jpg')}`
            : null;
        const image = post.coverImage ? `${SITE_ORIGIN}${rootPath(post.coverImage)}` : null;
        setMeta('canonical-link', 'href', canonical);
        setMeta('og-url', 'content', canonical);
        setMeta('twitter-url', 'content', canonical);
        setMeta('og-title', 'content', post.title);
        setMeta('twitter-title', 'content', post.title);
        if (desc) {
            setMeta('meta-description', 'content', desc);
            setMeta('og-description', 'content', desc);
            setMeta('twitter-description', 'content', desc);
        }
        if (shareImage) {
            setMeta('og-image', 'content', shareImage);
            setMeta('og-image-secure', 'content', shareImage);
            setMeta('twitter-image', 'content', shareImage);
            setMeta('image-src', 'href', shareImage);
            setMeta('og-image-alt', 'content', post.title);
            setMeta('og-image-type', 'content', 'image/jpeg');
            setMeta('og-image-width', 'content', '1200');
            setMeta('og-image-height', 'content', '630');
        } else if (image) {
            setMeta('og-image', 'content', image);
            setMeta('twitter-image', 'content', image);
        }

        if (window.hljs && typeof window.hljs.highlightAll === 'function') {
            window.hljs.highlightAll();
        }
    }

    // Zoom overlay, matching project.html showImageModal (single image, so arrows stay disabled)
    function showImageModal(src) {
        if (!src) return;
        if (document.querySelector('.image-modal-overlay')) return;

        const overlay = document.createElement('div');
        overlay.className = 'image-modal-overlay';

        const isVid = /\.(mp4|webm|ogg)$/i.test(src);
        const mediaEl = document.createElement(isVid ? 'video' : 'img');
        mediaEl.src = src.startsWith('/') || /^https?:\/\//i.test(src) ? src : '/' + src;
        if (isVid) {
            mediaEl.autoplay = true;
            mediaEl.loop = true;
            mediaEl.playsInline = true;
        }
        overlay.appendChild(mediaEl);

        const closeX = document.createElement('div');
        closeX.className = 'image-modal-close';
        closeX.textContent = '×';
        overlay.appendChild(closeX);

        const leftArrow = document.createElement('div');
        leftArrow.className = 'image-modal-arrow left disabled';
        leftArrow.innerHTML = '<span class="css-arrow-left"></span>';
        const rightArrow = document.createElement('div');
        rightArrow.className = 'image-modal-arrow right disabled';
        rightArrow.innerHTML = '<span class="css-arrow-right"></span>';
        overlay.appendChild(leftArrow);
        overlay.appendChild(rightArrow);

        function closeModal() {
            document.removeEventListener('keydown', handleKey);
            overlay.remove();
        }
        function handleKey(e) {
            if (e.key === 'Escape') closeModal();
        }

        overlay.addEventListener('click', closeModal);
        closeX.addEventListener('click', e => { e.stopPropagation(); closeModal(); });
        leftArrow.addEventListener('click', e => e.stopPropagation());
        rightArrow.addEventListener('click', e => e.stopPropagation());
        document.addEventListener('keydown', handleKey);

        document.body.appendChild(overlay);
        requestAnimationFrame(() => overlay.classList.add('active'));
    }

    // ---------------------------------------------------------------
    // Bootstrap
    // ---------------------------------------------------------------
    let initialized = false;
    let waitTries = 0;

    function start() {
        if (initialized) return;
        // Wait briefly for load_menu.js to finish (sidebar + script.js helpers)
        if (!window.__MENU_DATA && waitTries < 100) {
            waitTries++;
            setTimeout(start, 50);
            return;
        }
        initialized = true;
        markSidebarActive();

        const isList = !!document.getElementById('blogList');
        const isDetail = !!document.getElementById('blogPost');
        if (!isList && !isDetail) return;

        fetchPosts()
            .then(posts => {
                if (isList) initList(posts);
                if (isDetail) initDetail(posts);
            })
            .catch(err => {
                console.error('blog.js: failed to load posts', err);
                const target = document.getElementById('blogList') || document.getElementById('blogPost');
                if (target) {
                    target.innerHTML = '<p>Sorry, the blog could not be loaded right now.</p>';
                }
            });
    }

    // load_menu.js re-dispatches DOMContentLoaded after script.js loads; the
    // `initialized` flag makes that harmless.
    document.addEventListener('DOMContentLoaded', start);
    if (document.readyState !== 'loading') start();
})();
