document.addEventListener('DOMContentLoaded', () => {
    // Populate dynamic page content (project / blog meta) from menu.json
    injectPageData();

    const hamburgerButton = document.getElementById('hamburger-button');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.querySelector('.overlay');

    // Menu expand/collapse functionality
    const menuParents = document.querySelectorAll('.menu-parent');
    
    /* --------------------------------------------------------------------
       Unified Projects List – navigation sync
    -------------------------------------------------------------------- */
    const categoryMap = {
        'HIGHER EDUCATION': 'Higher Education',
        'INTRANETS & PORTALS': 'Intranets & Portals',
        'WEB & IOS APPS': 'Web & iOS Apps',
        'INFORMATIONAL': 'Informational',
        'BLOG POSTS': 'Blog Posts',
        'MUSIC & ART': 'Music & Art',
        'E-COMMERCE': 'E-Commerce'
    };

    menuParents.forEach(parent => {
        parent.addEventListener('click', (e) => {
            e.preventDefault();

            /* ----------------- Expand / collapse submenu ----------------- */
            const parentLi = parent.closest('li');
            const submenu = parentLi.querySelector('.submenu');

            if (submenu) {
                const isExpanded = parentLi.classList.contains('active');

                // Collapse all other open parents first
                menuParents.forEach(other => {
                    const otherLi = other.closest('li');
                    if (otherLi !== parentLi) {
                        otherLi.classList.remove('active');
                        const otherSub = otherLi.querySelector('.submenu');
                        if (otherSub) otherSub.style.display = 'none';
                    }
                });

                // Toggle this parent
                if (isExpanded) {
                    parentLi.classList.remove('active');
                    submenu.style.display = 'none';
                    removeConnectingLine();
                } else {
                    parentLi.classList.add('active');
                    submenu.style.display = 'block';
                    removeConnectingLine();
                    setTimeout(() => {
                        const activeItem = document.querySelector('.main-nav .submenu li.active-sub');
                        const projectDetails = document.querySelector('.project-details');
                        const projectImage = document.querySelector('.project-gallery img');
                        if (activeItem && projectDetails && projectImage) {
                            createConnectingLine();
                        }
                    }, 50);
                }
            }

            /* ----------------- Unified projects list sync ----------------- */
            const label = parent.textContent.replace(/\s+/g,' ').trim().toUpperCase();
            const chosen = categoryMap[label] || parent.textContent.trim();
            if (!chosen) return; // not a top-level category needing sync

            const isListPage = window.location.pathname.includes('projects.html');
            if (isListPage) {
                const select = document.getElementById('categoryFilter');
                if (select) {
                    select.value = chosen;
                    select.dispatchEvent(new Event('change'));
                    const crumb = document.getElementById('crumbCategoryLink');
                    if (crumb) crumb.textContent = chosen;
                }
            } else {
                window.location.href = `projects.html?category=${encodeURIComponent(chosen)}`;
            }
        });
    });

    // Initialize menu states - show submenus for items that have 'active' class
    document.querySelectorAll('.main-nav li.active .submenu').forEach(submenu => {
        submenu.style.display = 'block';
    });

    // Mobile menu functionality
    if (hamburgerButton && sidebar) {
        hamburgerButton.addEventListener('click', () => {
            sidebar.classList.toggle('is-open');
            if (overlay) {
                overlay.classList.toggle('is-active');
            }
        });
    }

    if (overlay) {
        overlay.addEventListener('click', () => {
            sidebar.classList.remove('is-open');
            overlay.classList.remove('is-active');
        });
    }

    // Function to completely remove the connecting line
    function removeConnectingLine() {
        // Remove by ID - this should be sufficient for proper cleanup
        const existingLine = document.getElementById('dynamic-connecting-line');
        const existingDot = document.getElementById('dynamic-dot');
        const existingStyle = document.querySelector('style[data-dynamic-line]');
        
        if (existingLine) existingLine.remove();
        if (existingDot) existingDot.remove();
        if (existingStyle) existingStyle.remove();
    }

    // Dynamic connecting line functionality
    function createConnectingLine() {
        // Always remove existing line first
        removeConnectingLine();

        // Find the active menu item (only appears when a child item is selected)
        const activeItem = document.querySelector('.main-nav .submenu li.active-sub');
        const projectImage = document.querySelector('.project-gallery img');
        const projectDetails = document.querySelector('.project-details');
        
        // Only show line if ALL conditions are met:
        // 1. There's an active-sub menu item
        // 2. There's a project image to connect to  
        // 3. We're on a project details page (not a placeholder/category page)
        if (!activeItem || !projectImage || !projectDetails) {
            // Explicitly ensure line is hidden - don't create anything
            return;
        }
        
        // Remove the broken double-check that was preventing valid lines from showing
        
        // Wait for image to load if it hasn't yet
        if (!projectImage.complete) {
            projectImage.onload = () => setTimeout(createConnectingLine, 50);
            return;
        }

        // Get positions
        const activeRect = activeItem.getBoundingClientRect();
        const imageRect = projectImage.getBoundingClientRect();
        
        // Find the actual text element (the link) for more precise positioning
        const activeLink = activeItem.querySelector('a');
        const activeLinkRect = activeLink ? activeLink.getBoundingClientRect() : activeRect;
        
        // If the active link hasn't been laid out yet (width==0), wait and retry
        if (activeLinkRect.width === 0 || activeLinkRect.height === 0) {
            setTimeout(createConnectingLine, 50);
            return;
        }

        // Calculate line start (right edge of active menu text)
        const lineStartX = activeLinkRect.right + 5; // Small gap after text
        const lineStartY = activeLinkRect.top + (activeLinkRect.height / 2); // Center on text
        
        // Calculate line end (left edge of image)
        const lineEndX = imageRect.left;
        const lineWidth = lineEndX - lineStartX;
        
        // Only create line if there's positive width
        if (lineWidth > 0) {
            // Create the connecting line
            const line = document.createElement('div');
            line.id = 'dynamic-connecting-line';
            line.style.cssText = `
                position: fixed;
                left: ${lineStartX}px;
                top: ${lineStartY - 0.5}px;
                width: ${lineWidth}px;
                height: 1px;
                background-color: #eee;
                z-index: 1000;
                pointer-events: none;
            `;
            document.body.appendChild(line);

            // Create the animated dot
            const dot = document.createElement('div');
            dot.id = 'dynamic-dot';
            dot.style.cssText = `
                position: fixed;
                left: ${lineStartX + 20}px;
                top: ${lineStartY}px;
                width: 8px;
                height: 8px;
                background-color: #FF0000;
                border-radius: 50%;
                z-index: 1001;
                pointer-events: none;
                animation: dynamicDrift 4s ease-in-out infinite alternate;
                transform: translate(-50%, -50%);
            `;
            document.body.appendChild(dot);

            // Add animation for the dot
            const style = document.createElement('style');
            style.setAttribute('data-dynamic-line', 'true');
            style.textContent = `
                @keyframes dynamicDrift {
                    from { left: ${lineStartX + 3}px; }
                    to { left: ${lineEndX - 3}px; }
                }
            `;
            document.head.appendChild(style);
        }
    }

    // Only create line on page load if there's actually an active-sub item
    // (for pages that load with a pre-selected child item)
    function initializeConnectingLine() {
        const activeItem = document.querySelector('.main-nav .submenu li.active-sub');
        const projectDetails = document.querySelector('.project-details');
        const projectImage = document.querySelector('.project-gallery img');
        
        if (activeItem && projectDetails && projectImage) {
            createConnectingLine();
        }
    }

    // Home page line functionality
    function createHomeConnectingLine() {
        // Always remove existing line first
        removeConnectingLine();

        // Check if we're on the home page and elements exist
        const logoActive = document.querySelector('.logo-active');
        const nodeText = document.querySelector('.node-text');
        const homeContent = document.querySelector('.home-content');
        
        // Only create line on home page with definition text
        if (!logoActive || !nodeText || !homeContent) {
            return;
        }

        // Get positions - more precise targeting
        const logoLink = logoActive.querySelector('a');
        const logoLinkRect = logoLink.getBoundingClientRect();
        const nodeTextRect = nodeText.getBoundingClientRect();
        
        // Calculate line start (right edge of "KNECTAR" text)
        const lineStartX = logoLinkRect.right + 5; // Small gap after "R"
        const lineStartY = logoLinkRect.top + (logoLinkRect.height / 2); // Center on logo text
        
        // Calculate line end (left edge of "node" text)
        const lineEndX = nodeTextRect.left - 5; // Small gap before "n"
        const lineWidth = lineEndX - lineStartX;
        
        // Only create line if there's positive width and we're on desktop
        if (lineWidth > 0 && window.innerWidth > 768) {
            // Create the connecting line
            const line = document.createElement('div');
            line.id = 'dynamic-connecting-line';
            line.style.cssText = `
                position: fixed;
                left: ${lineStartX}px;
                top: ${lineStartY - 0.5}px;
                width: ${lineWidth}px;
                height: 1px;
                background-color: #eee;
                z-index: 1000;
                pointer-events: none;
            `;
            document.body.appendChild(line);

            // Create the animated dot
            const dot = document.createElement('div');
            dot.id = 'dynamic-dot';
            dot.style.cssText = `
                position: fixed;
                left: ${lineStartX + 20}px;
                top: ${lineStartY}px;
                width: 8px;
                height: 8px;
                background-color: #FF0000;
                border-radius: 50%;
                z-index: 1001;
                pointer-events: none;
                animation: homeDynamicDrift 4s ease-in-out infinite alternate;
                transform: translate(-50%, -50%);
            `;
            document.body.appendChild(dot);

            // Add animation for the dot
            const style = document.createElement('style');
            style.setAttribute('data-dynamic-line', 'true');
            style.textContent = `
                @keyframes homeDynamicDrift {
                    from { left: ${lineStartX + 3}px; }
                    to { left: ${lineEndX - 3}px; }
                }
            `;
            document.head.appendChild(style);
        }
    }

    // Initialize line only if there's an active child item OR we're on home page
    initializeConnectingLine();
    
    // Initialize home page line if applicable
    if (document.querySelector('.logo-active')) {
        createHomeConnectingLine();
    }
    
    // Try again after a short delay to ensure layout is settled (only if needed)
    setTimeout(() => {
        const activeItem = document.querySelector('.main-nav .submenu li.active-sub');
        const projectDetails = document.querySelector('.project-details');
        const projectImage = document.querySelector('.project-gallery img');
        
        if (activeItem && projectDetails && projectImage) {
            createConnectingLine();
        } else if (document.querySelector('.logo-active')) {
            createHomeConnectingLine();
        }
    }, 100);
    
    // Final attempt after fonts and images are loaded (only if needed)
    window.addEventListener('load', () => {
        const activeItem = document.querySelector('.main-nav .submenu li.active-sub');
        const projectDetails = document.querySelector('.project-details');
        const projectImage = document.querySelector('.project-gallery img');
        
        if (activeItem && projectDetails && projectImage) {
            createConnectingLine();
        } else if (document.querySelector('.logo-active')) {
            createHomeConnectingLine();
        }
    });

    // Recreate line on window resize (for both project pages and home page)
    window.addEventListener('resize', () => {
        const activeItem = document.querySelector('.main-nav .submenu li.active-sub');
        const logoActive = document.querySelector('.logo-active');
        
        if (activeItem) {
            setTimeout(createConnectingLine, 50);
        } else if (logoActive) {
            setTimeout(createHomeConnectingLine, 50);
        } else {
            removeConnectingLine();
        }
    });

    // --------------------------------------------------------------
    // Intro-text "negative force field" repulsion effect (home page)
    // --------------------------------------------------------------
    const introText = document.querySelector('.intro-text');
    if (introText) {
        // Wrap each word in spans for individual movement
        introText.querySelectorAll('p').forEach(paragraph => {
            const words = paragraph.innerText.split(' ');
            paragraph.innerHTML = '';
            words.forEach((word, idx) => {
                const span = document.createElement('span');
                span.textContent = word;
                span.style.display = 'inline-block';
                span.style.transition = 'transform 0.25s ease-out';
                paragraph.appendChild(span);
                if (idx < words.length - 1) paragraph.append(' ');
            });
        });

        const radius = 100;   // influence radius in pixels
        const strength = 40;  // maximum displacement in pixels

        function handleMouseMove(e) {
            const mouseX = e.clientX;
            const mouseY = e.clientY;

            introText.querySelectorAll('span').forEach(span => {
                const rect = span.getBoundingClientRect();
                const spanX = rect.left + rect.width / 2;
                const spanY = rect.top + rect.height / 2;
                const dx = spanX - mouseX;
                const dy = spanY - mouseY;
                const dist = Math.hypot(dx, dy);

                if (dist < radius && dist > 0.1) {
                    const force = (1 - dist / radius) * strength;
                    const offsetX = (dx / dist) * force;
                    const offsetY = (dy / dist) * force;
                    span.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
                } else {
                    span.style.transform = '';
                }
            });
        }

        introText.addEventListener('mousemove', handleMouseMove);
        introText.addEventListener('mouseleave', () => {
            introText.querySelectorAll('span').forEach(span => {
                span.style.transform = '';
            });
        });
    }
});

/* =============================================================
   Dynamic Page Content Helpers (injected from menu.json)
============================================================= */

function injectPageData() {
    if (!window.__MENU_DATA) return;

    const urlParams = new URLSearchParams(window.location.search);
    const slugParam = urlParams.get('item');

    let pageData;
    let result;
    if (slugParam) {
        result = findBySlug(window.__MENU_DATA, slugParam);
        if (result) pageData = result.item;
    }

    if (!pageData) {
        const pagePath = window.location.pathname.split('/').pop();
        pageData = findPageData(window.__MENU_DATA, pagePath);
    }
    if (!pageData) return;

    // Cover image if present
    const cover = document.querySelector('.project-gallery img[data-field="coverImage"]');
    if (cover && pageData.coverImage) cover.src = pageData.coverImage;
    
    // Generic attribute replacement via [data-field]
    document.querySelectorAll('[data-field]').forEach(el => {
        const key = el.getAttribute('data-field');
        if (key && pageData[key] != null) {
            if (el.tagName === 'A') {
                el.href = pageData[key + 'Url'] || pageData[key];
                el.textContent = pageData[key + 'Display'] || pageData[key];
            } else {
                el.textContent = pageData[key];
            }
        }
    });

    // ------------ Breadcrumb parent link -------------
    const crumbParent = document.getElementById('crumbCategoryLink');
    if (crumbParent) {
        // determine parentLabel (if not already cached)
        let parentLabel = null;
        const lookup = findBySlug(window.__MENU_DATA, pageData.slug || '', null) || findPageData(window.__MENU_DATA, pageData.url || '', null);
        if (lookup) parentLabel = lookup.parentLabel;

        if (parentLabel) {
            crumbParent.textContent = parentLabel;
            crumbParent.href = `projects.html?category=${encodeURIComponent(parentLabel)}`;
        } else {
            // hide dangling separator if no parent
            crumbParent.remove();
        }
    }

    // Project-detail template
    const projectInfo = document.querySelector('.project-info');
    if (projectInfo) {
        projectInfo.innerHTML = buildProjectInfoHTML(pageData);
    }

    // Blog-post template
    const blogPost = document.querySelector('.blog-post');
    if (blogPost) {
        buildBlogPostHTML(blogPost, pageData);
    }

    // Feature flags
    if (pageData.textToAudioWidgetDisplayed === false) {
        const ttsPlayer = document.querySelector('.tts-player');
        if (ttsPlayer) ttsPlayer.style.display = 'none';
    }
}

function findPageData(arr, path, parentLabel = null) {
    for (const entry of arr) {
        if (entry.url && entry.url.endsWith(path)) return { item: entry, parentLabel };
        if (entry.submenu) {
            const res = findPageData(entry.submenu, path, entry.label);
            if (res) return res;
        }
    }
    return null;
}

function findBySlug(arr, slug, parentLabel = null) {
    for (const entry of arr) {
        if (entry.slug && entry.slug === slug) return { item: entry, parentLabel };
        if (entry.submenu) {
            const res = findBySlug(entry.submenu, slug, entry.label);
            if (res) return res;
        }
    }
    return null;
}

function buildProjectInfoHTML(data) {
    let html = "";
    if (data.projectTitle) html += `<h1>${data.projectTitle}</h1>`;

    const rows = [];
    if (data.role) rows.push(`<li><strong>ROLE:</strong> ${data.role}</li>`);
    if (data.budget) rows.push(`<li><strong>BUDGET:</strong> ${data.budget}</li>`);
    if (data.technology) rows.push(`<li><strong>TECHNOLOGY:</strong> ${data.technology}</li>`);
    if (data.years) rows.push(`<li><strong>YEARS:</strong> ${data.years}</li>`);
    if (data.designPartner) {
        if (data.designPartnerUrl) {
            rows.push(`<li><strong>DESIGN PARTNER:</strong> <a href="${data.designPartnerUrl}" target="_blank" class="external-link">${data.designPartner}<img src="assets/link_arrow.svg" alt="" class="link-icon"></a></li>`);
        } else {
            rows.push(`<li><strong>DESIGN PARTNER:</strong> ${data.designPartner}</li>`);
        }
    }
    if (data.projectUrl) {
        const disp = data.projectLinkDisplay || data.projectUrl;
        rows.push(`<li><strong>DOMAIN:</strong> <a href="${data.projectUrl}" target="_blank" class="external-link">${disp}<img src="assets/link_arrow.svg" alt="" class="link-icon"></a></li>`);
    }
    if (rows.length) html += `<ul>${rows.join('\n')}</ul>`;

    if (data.pageSummary) html += `<p class="description">${data.pageSummary}</p>`;
    if (data.pageBody) html += `<div class="dynamic-body">${data.pageBody}</div>`;
    return html;
}

function buildBlogPostHTML(articleEl, data) {
    const title = articleEl.querySelector('h1');
    if (title && data.projectTitle) title.textContent = data.projectTitle;

    const meta = articleEl.querySelector('.blog-meta');
    if (meta) {
        const metaRows = [];
        if (data.author) metaRows.push(`<li><span class="label">Author:</span> <span>${data.author}</span></li>`);
        if (data.technology) metaRows.push(`<li><span class="label">Technology:</span> <span>${data.technology}</span></li>`);
        if (data.projectUrl) {
            const disp = data.projectLinkDisplay || data.projectUrl;
            metaRows.push(`<li><span class="label">Domain:</span> <span><a href="${data.projectUrl}" target="_blank" class="external-link">${disp}<img src="assets/link_arrow.svg" alt="" class="link-icon"></a></span></li>`);
        }
        if (metaRows.length) meta.innerHTML = metaRows.join('\n');
    }

    const tldr = articleEl.querySelector('.blog-summary');
    if (tldr && data.pageTLDR) {
        tldr.innerHTML = `<span class="summary-label">TL;DR:</span> ${data.pageTLDR}`;
    }
} 