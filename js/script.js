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
        const existingArc = document.getElementById('dynamic-connecting-arc');
        
        if (existingLine) existingLine.remove();
        if (existingDot) existingDot.remove();
        if (existingStyle) existingStyle.remove();
        if (existingArc) existingArc.remove();
    }

    // Dynamic connecting line functionality
    function createConnectingLine() {
        // Always remove existing line first
        removeConnectingLine();

        // Find the active menu item (only appears when a child item is selected)
        const activeItem = document.querySelector('.main-nav .submenu li.active-sub');
        const projectInfo = document.querySelector('.project-info');
        const projectDetails = document.querySelector('.project-details');
        
        // Only show line if ALL conditions are met:
        // 1. There's an active-sub menu item
        // 2. There's a project info section to connect to
        // 3. We're on a project details page (not a placeholder/category page)
        if (!activeItem || !projectInfo || !projectDetails) {
            // Explicitly ensure line is hidden - don't create anything
            return;
        }
        
        // Find the actual text element (the link) for more precise positioning
        const activeLink = activeItem.querySelector('a');
        const activeLinkRect = activeLink ? activeLink.getBoundingClientRect() : activeItem.getBoundingClientRect();
        const projectInfoRect = projectInfo.getBoundingClientRect();

        // If the active link hasn't been laid out yet (width==0), wait and retry
        if (activeLinkRect.width === 0 || activeLinkRect.height === 0) {
            setTimeout(createConnectingLine, 50);
            return;
        }

        // Calculate line start (right edge of active menu text)
        const lineStartX = activeLinkRect.right + 5; // Small gap after text
        const lineStartY = activeLinkRect.top + (activeLinkRect.height / 2); // Center on text
        // Calculate line end (left edge of project-info)
        const lineEndX = projectInfoRect.left;
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
    function initializeConnectingLine() {
        const activeItem = document.querySelector('.main-nav .submenu li.active-sub');
        const projectDetails = document.querySelector('.project-details');
        const projectInfo = document.querySelector('.project-info');
        
        if (activeItem && projectDetails && projectInfo) {
            createConnectingLine();
        }
    }

    // Home page line functionality
    function createHomeConnectingLine() {
        removeConnectingLine();

        // Check if we're on the home page and elements exist
        const logoActive = document.querySelector('.logo-active');
        const nodeText = document.querySelector('.node-text');
        const homeContent = document.querySelector('.home-content');
        if (!logoActive || !nodeText || !homeContent) return;

        // Get positions
        const logoLink = logoActive.querySelector('a');
        const logoLinkRect = logoLink.getBoundingClientRect();
        const nodeTextRect = nodeText.getBoundingClientRect();

        // Start: right edge of logo text, center vertically
        const startX = logoLinkRect.right + window.scrollX;
        const startY = logoLinkRect.top + logoLinkRect.height / 2 + window.scrollY;
        // End: left edge of node text, center vertically
        const endX = nodeTextRect.left + window.scrollX;
        const endY = nodeTextRect.top + nodeTextRect.height / 2 + window.scrollY;

        // Only create arc if on desktop and arc is visible
        if (window.innerWidth > 768 && (endX - startX > 60) && (Math.abs(endY - startY) > 40)) {
            // Calculate radius for a true quarter circle
            const radius = Math.min(endX - startX, endY - startY);
            // SVG container covers bounding box of arc
            const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svg.setAttribute('id', 'dynamic-connecting-arc');
            svg.style.position = 'fixed';
            svg.style.left = `${startX}px`;
            svg.style.top = `${startY}px`;
            svg.style.width = `${radius}px`;
            svg.style.height = `${radius}px`;
            svg.style.overflow = 'visible';
            svg.style.zIndex = 1000;
            svg.style.pointerEvents = 'none';

            // Arc path: true quarter circle from (0,0) to (radius, radius)
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('d', `M 0 0 A ${radius} ${radius} 0 0 1 ${radius} ${radius}`);
            path.setAttribute('stroke', '#eee');
            path.setAttribute('stroke-width', '1');
            path.setAttribute('fill', 'none');
            svg.appendChild(path);

            // Remove any existing dot with id 'dynamic-dot' before creating a new one
            const existingDot = document.getElementById('dynamic-dot');
            if (existingDot) existingDot.remove();

            // Red dot (only one)
            const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            dot.setAttribute('id', 'dynamic-dot');
            dot.setAttribute('r', '4');
            dot.setAttribute('fill', '#FF0000');
            svg.appendChild(dot);

            document.body.appendChild(svg);

            // Animate dot along arc using getPointAtLength
            const pathLength = path.getTotalLength();
            let direction = 1;
            let t = 0;
            const duration = 2000; // ms for full sweep
            function animateDot() {
                t += direction * (16 / duration);
                if (t > 1) { t = 1; direction = -1; }
                if (t < 0) { t = 0; direction = 1; }
                const pos = path.getPointAtLength(pathLength * t);
                dot.setAttribute('cx', pos.x);
                dot.setAttribute('cy', pos.y);
                requestAnimationFrame(animateDot);
            }
            animateDot();
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
        const projectInfo = document.querySelector('.project-info');
        
        if (activeItem && projectDetails && projectInfo) {
            createConnectingLine();
        } else if (document.querySelector('.logo-active')) {
            createHomeConnectingLine();
        }
    }, 100);
    
    // Final attempt after fonts and images are loaded (only if needed)
    window.addEventListener('load', () => {
        const activeItem = document.querySelector('.main-nav .submenu li.active-sub');
        const projectDetails = document.querySelector('.project-details');
        const projectInfo = document.querySelector('.project-info');
        
        if (activeItem && projectDetails && projectInfo) {
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
            for (let idx = 0; idx < words.length; idx++) {
                let word = words[idx];
                // Remove punctuation for matching
                const cleanWord = word.replace(/[.,'\"!?]/g, '').toLowerCase();
                // Check for 'align teams' sequence
                if (cleanWord === 'align' && words[idx + 1] && words[idx + 1].replace(/[.,'\"!?]/g, '').toLowerCase() === 'teams') {
                    // Create a span for 'align teams'
                    const span = document.createElement('span');
                    span.textContent = word + ' ' + words[idx + 1];
                    span.classList.add('highlight-red');
                    span.style.display = 'inline-block';
                    span.style.transition = 'transform 0.25s ease-out';
                    paragraph.appendChild(span);
                    idx++; // Skip next word
                } else {
                    const span = document.createElement('span');
                    span.textContent = word;
                    if (cleanWord === 'node' || cleanWord === 'knectar') {
                        span.classList.add('highlight-red');
                    }
                    span.style.display = 'inline-block';
                    span.style.transition = 'transform 0.25s ease-out';
                    paragraph.appendChild(span);
                }
                if (idx < words.length - 1) paragraph.append(' ');
            }
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
        const res2 = findPageData(window.__MENU_DATA, pagePath);
        if (res2) pageData = res2.item;
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
    // Add the Display in menu checkbox above the project title, left-aligned
    if (data.projectTitle) {
        // Only show the checkbox if admin is logged in
        if (window.authManager && window.authManager.isLoggedIn) {
            const checked = (data.sub_menu === 1 || data.sub_menu === '1') ? 'checked' : '';
            html += `<div class="display-in-menu-wrap" style="display: flex; align-items: flex-start; margin-bottom: 8px;">
                <label style="display: flex; align-items: center; font-size: 15px; font-weight: 500; cursor: pointer;">
                    <input type="checkbox" id="displayInMenuCheckbox" ${checked} style="margin-right: 6px; accent-color: #FF0000;">Display in menu
                </label>
            </div>`;
        }
        // Save button in upper right if admin (Cancel removed)
        if (window.authManager && window.authManager.isLoggedIn) {
            html += `<div class="desc-edit-actions" style="display: flex; justify-content: flex-end; align-items: center; gap: 12px; margin-bottom: 8px;">
                <button id="desc-save-btn" class="desc-save-btn" disabled style="background: #888; cursor: not-allowed;">Save</button>
            </div>`;
        }
        html += `<h1 style="margin: 0;">${data.projectTitle}</h1>`;
    }

    const rows = [];
    if (data.role) rows.push(`<li><strong>ROLE:</strong> ${data.role}</li>`);
    if (data.budget) rows.push(`<li><strong>BUDGET:</strong> ${data.budget}</li>`);
    if (data.technology) {
        // Support multiple technologies separated by comma
        const techs = data.technology.split(',').map(t => t.trim()).filter(Boolean);
        const techLinks = techs.map(t => `<a href="projects.html?technology=${encodeURIComponent(t)}" class="tech-link">${t}</a>`).join(', ');
        rows.push(`<li><strong>TECHNOLOGY:</strong> ${techLinks}</li>`);
    }
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

    // Description: Quill editor if logged in, static text otherwise
    if (window.authManager && window.authManager.isLoggedIn) {
        html += `<div class="description-edit-wrap">
            <div id="desc-quill-editor" class="description"></div>
        </div>`;
    } else if (data.pageSummary) {
        html += `<p class="description">${data.pageSummary}</p>`;
    }
    if (data.pageBody) html += `<div class="dynamic-body">${data.pageBody}</div>`;
    return html;
}

// Always-in-place Quill editor for admins
function setupQuillDescriptionEditor(slug, originalDesc) {
    const quillDiv = document.getElementById('desc-quill-editor');
    if (!quillDiv) return;
    const quill = new Quill('#desc-quill-editor', {
        theme: 'snow',
        modules: {
            toolbar: [
                [{ 'font': [] }, { 'size': [] }],
                ['bold', 'italic', 'underline', 'strike'],
                [{ 'color': [] }, { 'background': [] }],
                [{ 'script': 'super' }, { 'script': 'sub' }],
                [{ 'header': 1 }, { 'header': 2 }, 'blockquote', 'code-block'],
                [{ 'list': 'ordered' }, { 'list': 'bullet' }, { 'indent': '-1' }, { 'indent': '+1' }],
                [{ 'direction': 'rtl' }, { 'align': [] }],
                ['link', 'image', 'video', 'formula'],
                ['clean']
            ]
        }
    });
    quill.root.innerHTML = originalDesc;
    const saveBtn = document.getElementById('desc-save-btn');
    let lastDesc = originalDesc;
    let descChanged = false;
    let menuChanged = false;
    const menuCheckbox = document.getElementById('displayInMenuCheckbox');
    let origChecked = menuCheckbox ? menuCheckbox.checked : null;
    // Helper to update Save button state
    function updateSaveBtnState() {
        if (descChanged || menuChanged) {
            saveBtn.disabled = false;
            saveBtn.style.background = '#FF0000';
            saveBtn.style.cursor = 'pointer';
        } else {
            saveBtn.disabled = true;
            saveBtn.style.background = '#888';
            saveBtn.style.cursor = 'not-allowed';
        }
    }
    // Listen for Quill changes
    quill.on('text-change', function() {
        descChanged = (quill.root.innerHTML !== lastDesc);
        updateSaveBtnState();
    });
    // Listen for menu checkbox changes
    if (menuCheckbox) {
        menuCheckbox.addEventListener('change', function() {
            menuChanged = (menuCheckbox.checked !== origChecked);
            // Update sub_menu in menu data, but do not re-render UI
            function updateSubMenu(arr) {
                for (const entry of arr) {
                    if (entry.slug === slug) {
                        entry.sub_menu = menuCheckbox.checked ? 1 : 0;
                        return true;
                    }
                    if (entry.submenu && updateSubMenu(entry.submenu)) return true;
                }
                return false;
            }
            updateSubMenu(window.__MENU_DATA);
            // Persist to localStorage for dev persistence
            localStorage.setItem('menu_json_edits', JSON.stringify(window.__MENU_DATA));
            updateSaveBtnState();
        });
    }
    // Save button
    saveBtn.onclick = function() {
        if (saveBtn.disabled) return;
        let newDesc = quill.root.innerHTML;
        lastDesc = newDesc;
        descChanged = false;
        if (menuCheckbox) {
            origChecked = menuCheckbox.checked;
            menuChanged = false;
        }
        updateProjectDescription(slug, newDesc);
        injectPageData();
    };
}

// Add event handler after rendering project info
(function() {
    const origInject = injectPageData;
    injectPageData = function() {
        if (window.authManager && window.authManager.isLoggedIn) {
            const edits = localStorage.getItem('menu_json_edits');
            if (edits) {
                try { window.__MENU_DATA = JSON.parse(edits); } catch (e) {}
            }
        }
        origInject();
        // If logged in and on project detail, initialize Quill and checkbox handler
        const urlParams = new URLSearchParams(window.location.search);
        const slugParam = urlParams.get('item');
        if (slugParam && window.authManager && window.authManager.isLoggedIn) {
            const pageData = findBySlug(window.__MENU_DATA, slugParam);
            if (pageData && pageData.item && pageData.item.pageSummary !== undefined) {
                setupQuillDescriptionEditor(slugParam, pageData.item.pageSummary);
            }
            // REMOVE: Add event handler for the Display in menu checkbox
            // (All logic now handled in setupQuillDescriptionEditor)
        }
    }
})();

function updateProjectDescription(slug, newDesc) {
    // Update in-memory menu data
    function updateInMenu(arr) {
        for (const entry of arr) {
            if (entry.slug === slug) {
                entry.pageSummary = newDesc;
                return true;
            }
            if (entry.submenu && updateInMenu(entry.submenu)) return true;
        }
        return false;
    }
    updateInMenu(window.__MENU_DATA);
    // Save to localStorage for dev persistence
    localStorage.setItem('menu_json_edits', JSON.stringify(window.__MENU_DATA));

    // Send to backend for permanent save
    fetch('/api/update-menu', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-edit-secret': 'dowhatyouaredoing' // match EDIT_SECRET in .env
        },
        body: JSON.stringify(window.__MENU_DATA)
    }).then(res => res.json()).then(data => {
        if (!data.success) {
            alert('Failed to save to server: ' + (data.error || 'Unknown error'));
        }
    }).catch(err => {
        alert('Failed to save to server: ' + err.message);
    });
}

// Patch injectPageData to load edits from localStorage if present
(function() {
    const origInject = injectPageData;
    injectPageData = function() {
        if (window.authManager && window.authManager.isLoggedIn) {
            const edits = localStorage.getItem('menu_json_edits');
            if (edits) {
                try {
                    window.__MENU_DATA = JSON.parse(edits);
                } catch (e) {}
            }
        }
        origInject();
        // Attach edit icon handler if logged in and on project detail
        const urlParams = new URLSearchParams(window.location.search);
        const slugParam = urlParams.get('item');
        if (slugParam && window.authManager && window.authManager.isLoggedIn) {
            const editBtn = document.getElementById('edit-desc-btn');
            const descP = document.getElementById('project-description');
            if (editBtn && descP) {
                editBtn.onclick = function() {
                    enableDescriptionEditing(slugParam, descP.innerHTML);
                };
            }
        }
    }
})();

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

    // Inject full body copy if provided
    if (data.pageBody) {
        const bodyDiv = document.createElement('div');
        bodyDiv.className = 'dynamic-body';
        bodyDiv.innerHTML = data.pageBody;
        articleEl.appendChild(bodyDiv);
    }
} 