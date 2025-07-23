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

// Helper function to clean legacy Quill editor content for display
function cleanLegacyContent(content) {
    if (!content) return '';
    
    console.log('cleanLegacyContent input:', content);
    
    // If content contains HTML tags, preserve the structure
    if (content.includes('<') && content.includes('>')) {
        // Clean up only legacy Quill editor markup, preserve all other HTML formatting
        let cleanHtml = content
            .replace(/<div[^>]*class="ql-[^"]*"[^>]*>/gi, '') // Remove Quill editor divs
            .replace(/<span[^>]*class="ql-[^"]*"[^>]*>/gi, '') // Remove Quill editor spans
            .trim(); // Remove leading/trailing whitespace
        
        // Ensure proper paragraph structure - wrap text in <p> tags if it's not already wrapped
        if (!cleanHtml.includes('<p>') && !cleanHtml.includes('<h') && !cleanHtml.includes('<ul>') && !cleanHtml.includes('<ol>')) {
            // Split by double line breaks and wrap each section in <p> tags
            const sections = cleanHtml.split(/\n\s*\n/);
            cleanHtml = sections.map(section => {
                const trimmed = section.trim();
                if (trimmed) {
                    return `<p>${trimmed}</p>`;
                }
                return '';
            }).join('');
        }
        
        // Preserve code blocks with proper line breaks and ensure <pre> wrapper
        cleanHtml = cleanHtml.replace(
            /<pre><code([^>]*)>([\s\S]*?)<\/code><\/pre>/gi,
            function(match, codeAttrs, codeContent) {
                // Convert \n to <br> tags to preserve line breaks
                const preservedContent = codeContent.replace(/\n/g, '<br>');
                return `<pre><code${codeAttrs}>${preservedContent}</code></pre>`;
            }
        );
        
        // Fix code blocks that are missing <pre> wrapper (common issue)
        cleanHtml = cleanHtml.replace(
            /<code([^>]*class="[^"]*language-[^"]*"[^>]*)>([\s\S]*?)<\/code>/gi,
            function(match, codeAttrs, codeContent) {
                // Only wrap in <pre> if it's a language code block (not inline code)
                if (codeAttrs.includes('language-')) {
                    // Convert \n to <br> tags to preserve line breaks
                    const preservedContent = codeContent.replace(/\n/g, '<br>');
                    return `<pre><code${codeAttrs}>${preservedContent}</code></pre>`;
                }
                return match; // Keep inline code as-is
            }
        );
        
        return cleanHtml;
    }
    
    // For plain text content, convert to readable HTML structure
    let cleanText = content
        .replace(/<div[^>]*class="ql-[^"]*"[^>]*>/gi, '') // Remove Quill editor divs
        .replace(/<span[^>]*class="ql-[^"]*"[^>]*>/gi, '') // Remove Quill editor spans
        .trim(); // Remove leading/trailing whitespace
    
    // Convert plain text to proper HTML structure
    if (cleanText) {
        // Split by double line breaks to identify paragraphs
        const sections = cleanText.split(/\n\s*\n/);
        cleanText = sections.map(section => {
            const trimmed = section.trim();
            if (trimmed) {
                // Check if this looks like a heading (starts with common heading words)
                if (/^(Background|Objectives|Key Features|Technical Approach|Outcomes|Challenges|Solution|Results|Summary)/i.test(trimmed)) {
                    return `<h3>${trimmed}</h3>`;
                }
                // Check if this looks like a list item
                if (/^\d+\.\s/.test(trimmed) || /^[•\-\*]\s/.test(trimmed)) {
                    return `<ul><li>${trimmed.replace(/^[\d•\-\*\.\s]+/, '')}</li></ul>`;
                }
                return `<p>${trimmed}</p>`;
            }
            return '';
        }).join('');
    }
    
    return cleanText;
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
        // Save button and Edit button in upper right if admin
        if (window.authManager && window.authManager.isLoggedIn) {
            html += `<div class="desc-edit-actions" style="display: flex; justify-content: flex-end; align-items: center; gap: 12px; margin-bottom: 8px;">
                <button id="edit-desc-btn" class="edit-desc-btn" style="background: none; border: none; cursor: pointer; padding: 4px; border-radius: 4px; transition: background 0.2s;" title="Edit Description">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="m18.5 2.5 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                </button>
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
            rows.push(`<li><strong>DESIGN PARTNER:</strong> <a href="${data.designPartnerUrl}" target="_blank" class="external-link">${data.designPartner}</a><span class="link-icon" aria-hidden="true">↗</span></li>`);
        } else {
            rows.push(`<li><strong>DESIGN PARTNER:</strong> ${data.designPartner}</li>`);
        }
    }
    if (data.projectUrl) {
        const disp = data.projectLinkDisplay || data.projectUrl;
        rows.push(`<li><strong>DOMAIN:</strong> <a href="${data.projectUrl}" target="_blank" class="external-link">${disp}</a><span class="link-icon" aria-hidden="true">↗</span></li>`);
    }
    if (data.project_haiku) {
        rows.push(`<li><strong>TL;DR HAIKU:</strong></li>`);
    }
    if (rows.length) html += `<ul>${rows.join('\n')}</ul>`;

    // Add project haiku content after the metadata list
    if (data.project_haiku) {
        html += `<div class="project-haiku" style="
        margin: 32px 0 36px 0; 
        padding-left: 50px; 
        font-family: 'Spectral', serif; 
        font-size: 22px; 
        font-style: italic;
        font-weight: 400; 
        text-shadow: 0 3px 6px rgba(0,0,0,0.2); 
        line-height: 1.6; 
        opacity: 0.8;
        color:rgb(0, 0, 0);">${data.project_haiku}</div>`;
    }

    // Description: Simple textarea editor if logged in, static text otherwise
    if (window.authManager && window.authManager.isLoggedIn) {
        // For logged-in users, show the raw content in a hidden element for editing
        console.log('Building project info for:', data.projectTitle);
        console.log('Raw pageSummary:', data.pageSummary);
        const cleanedContent = cleanLegacyContent(data.pageSummary || '');
        console.log('Cleaned content:', cleanedContent);
        
        html += `<div class="description-edit-wrap">
            <div id="project-description" class="description" style="display: none;">${data.pageSummary || ''}</div>
            <p class="description-display">${cleanedContent || 'No description available.'}</p>
        </div>`;
    } else if (data.pageSummary) {
        html += `<p class="description">${cleanLegacyContent(data.pageSummary)}</p>`;
    }
    if (data.pageBody) html += `<div class="dynamic-body">${data.pageBody}</div>`;
    
    // Add project footer CTA if present
    if (data.project_footer_CTA) {
        // Parse the CTA to extract heading and body
        const ctaText = data.project_footer_CTA;
        const questionMarkIndex = ctaText.indexOf('?');
        let heading = '';
        let bodyText = '';
        
        if (questionMarkIndex !== -1) {
            heading = ctaText.substring(0, questionMarkIndex + 1).trim();
            bodyText = ctaText.substring(questionMarkIndex + 1).trim();
        } else {
            // Fallback: use first sentence as heading
            const sentences = ctaText.split('.');
            heading = sentences[0] + (sentences.length > 1 ? '.' : '');
            bodyText = sentences.slice(1).join('.').trim();
        }
        
        // Add contact link to body text
        const bodyWithLink = bodyText + ' <a href="/contact.html" style="color: #000; text-decoration: underline;">Contact us</a> to learn more.';
        
        html += `<div class="project-footer-cta" style="
        margin-top: 40px; 
        padding: 24px; 
        background-color: #D9D9D9; 
        border-radius: 8px; 
        line-height: 1.5;">
            <div style="font-weight: bold; color: #FF0000; font-size: 15px; margin-bottom: 8px;">${heading}</div>
            <div style="color: #000; font-size: 15px;">${bodyWithLink}</div>
        </div>`;
    }
    
    return html;
}

// Simple textarea editor for admins
function setupSimpleDescriptionEditor(slug, originalDesc) {
    const descDiv = document.getElementById('project-description');
    const editBtn = document.getElementById('edit-desc-btn');
    const menuCheckbox = document.getElementById('displayInMenuCheckbox');
    
    if (!descDiv || !editBtn) return;
    
    // Store original state
    let origChecked = menuCheckbox ? menuCheckbox.checked : null;
    
    // Replace display with WYSIWYG editor
    const descEditor = document.createElement('div');
    descEditor.className = 'desc-editor';
    descEditor.innerHTML = `
        <div class="wysiwyg-toolbar">
            <button onclick="execWysiwygCommand('bold')" title="Bold" class="toolbar-btn">
                <strong>B</strong>
            </button>
            <button onclick="execWysiwygCommand('italic')" title="Italic" class="toolbar-btn">
                <em>I</em>
            </button>
            <button onclick="execWysiwygCommand('underline')" title="Underline" class="toolbar-btn">
                <u>U</u>
            </button>
            <button onclick="execWysiwygCommand('insertUnorderedList')" title="Bulleted List" class="toolbar-btn">• List</button>
            <button onclick="execWysiwygCommand('insertOrderedList')" title="Numbered List" class="toolbar-btn">1. List</button>
            <button onclick="insertWysiwygCodeBlock()" title="Insert Code Block" class="toolbar-btn">
                📄 Code
            </button>
            <button onclick="insertWysiwygInlineCode()" title="Inline Code" class="toolbar-btn">
                \`code\`
            </button>
            <button onclick="insertWysiwygLink()" title="Insert Link" class="toolbar-btn">
                🔗 Link
            </button>
            <select onchange="formatWysiwygHeading(this.value)" title="Heading Style" class="toolbar-select wysiwyg-heading-select">
                <option value="">Heading</option>
                <option value="h1" class="wysiwyg-h1-option">H1</option>
                <option value="h2" class="wysiwyg-h2-option">H2</option>
                <option value="h3" class="wysiwyg-h3-option">H3</option>
                <option value="p" class="wysiwyg-p-option">Normal</option>
                <option value="red-bold" class="wysiwyg-red-bold-option">Red Bold</option>
            </select>
            <select id="wysiwygLanguageSelect" onchange="changeWysiwygCodeLanguage()" title="Code Language" class="toolbar-select">
                <option value="javascript">JavaScript</option>
                <option value="python">Python</option>
                <option value="html">HTML</option>
                <option value="css">CSS</option>
                <option value="json">JSON</option>
                <option value="sql">SQL</option>
            </select>
        </div>
        <style>
        /* Style the heading dropdown options visually and with correct font */
        .wysiwyg-heading-select option.wysiwyg-h1-option {
            font-family: 'Benne', serif;
            font-size: 2em;
            font-weight: bold;
        }
        .wysiwyg-heading-select option.wysiwyg-h2-option {
            font-family: 'Karla', sans-serif;
            font-size: 1.5em;
            font-weight: bold;
        }
        .wysiwyg-heading-select option.wysiwyg-h3-option {
            font-family: 'Karla', sans-serif;
            font-size: 1.17em;
            font-weight: bold;
        }
        .wysiwyg-heading-select option.wysiwyg-p-option {
            font-family: 'Karla', sans-serif;
            font-size: 16px;
            font-weight: normal;
        }
        .wysiwyg-heading-select option.wysiwyg-red-bold-option {
            font-family: 'Karla', sans-serif;
            font-size: 1em;
            font-weight: bold;
            color: #FF0000;
        }
        /* Fallback for browsers that ignore option styles: style the select itself for preview */
        .wysiwyg-heading-select {
            font-family: 'Karla', sans-serif;
        }
        .wysiwyg-heading-select:has(option:checked.wysiwyg-h1-option),
        .wysiwyg-heading-select option:checked.wysiwyg-h1-option {
            font-family: 'Benne', serif;
            font-size: 2em;
            font-weight: bold;
        }
        /* Style toolbar buttons for lists */
        .wysiwyg-toolbar .toolbar-btn { min-width: 32px; }
        </style>
        <div id="wysiwyg-editor" class="wysiwyg-editor" contenteditable="true"></div>
        <div class="desc-edit-actions" style="text-align: right; margin-top: 8px;">
            <button id="desc-cancel-btn" style="background: #f5f5f5; border: 1px solid #ddd; padding: 8px 16px; border-radius: 4px; cursor: pointer;">Cancel</button>
        </div>
    `;
    
    // Insert editor after the description-edit-wrap div
    const editWrap = descDiv.closest('.description-edit-wrap');
    if (editWrap) {
        editWrap.appendChild(descEditor);
        
        // Hide ALL display elements - be more aggressive about hiding
        const displayText = editWrap.querySelector('.description-display');
        if (displayText) {
            displayText.style.display = 'none';
            displayText.style.visibility = 'hidden';
            displayText.style.opacity = '0';
        }
        
        const originalDesc = editWrap.querySelector('.description');
        if (originalDesc) {
            originalDesc.style.display = 'none';
            originalDesc.style.visibility = 'hidden';
            originalDesc.style.opacity = '0';
        }
        
        // Hide the edit button
        editBtn.style.display = 'none';
        
        // Hide ALL other elements within the edit wrap that aren't the editor
        const allElements = editWrap.querySelectorAll('*');
        allElements.forEach(el => {
            if (el !== descDiv && 
                el !== descEditor && 
                !el.classList.contains('wysiwyg-toolbar') && 
                !el.classList.contains('desc-edit-actions') &&
                !el.closest('.wysiwyg-toolbar') &&
                !el.closest('.desc-edit-actions') &&
                !el.closest('#wysiwyg-editor')) {
                el.style.display = 'none';
                el.style.visibility = 'hidden';
                el.style.opacity = '0';
            }
        });
        
        // Ensure the editor is visible
        descEditor.style.display = 'block';
        descEditor.style.visibility = 'visible';
        descEditor.style.opacity = '1';
    }
    
    // Initialize WYSIWYG editor
    const wysiwygEditor = document.getElementById('wysiwyg-editor');
    
    console.log('WYSIWYG editor element found:', !!wysiwygEditor);
    console.log('Original description content:', originalDesc);
    console.log('Content type:', typeof originalDesc);
    console.log('Content length:', originalDesc ? originalDesc.length : 0);
    
    if (!wysiwygEditor) {
        console.error('WYSIWYG editor element not found!');
        return;
    }
    
    // Debug the editor element's styles
    const computedStyle = window.getComputedStyle(wysiwygEditor);
    console.log('Editor computed styles:', {
        display: computedStyle.display,
        visibility: computedStyle.visibility,
        opacity: computedStyle.opacity,
        height: computedStyle.height,
        minHeight: computedStyle.minHeight,
        color: computedStyle.color,
        backgroundColor: computedStyle.backgroundColor
    });
    
    // Force the editor to be visible
    if (computedStyle.display === 'none') {
        console.log('Editor was hidden, forcing it to be visible');
        wysiwygEditor.style.display = 'block';
    }
    
    // Use the same content processing logic that works for display
    const cleanedContent = cleanLegacyContent(originalDesc);
    console.log('Using cleaned content:', cleanedContent);
    
    // Use requestAnimationFrame to ensure DOM is ready
    requestAnimationFrame(() => {
        // Set the cleaned content directly
        wysiwygEditor.innerHTML = cleanedContent || '<p><br></p>';
        console.log('Editor innerHTML after setting:', wysiwygEditor.innerHTML);
        
        // Focus the editor and place cursor at the end
        wysiwygEditor.focus();
        const sel = window.getSelection();
        if (sel) {
            const range = document.createRange();
            range.selectNodeContents(wysiwygEditor);
            range.collapse(false); // place at end
            sel.removeAllRanges();
            sel.addRange(range);
        }
        
        // Try triggering a DOM update
        wysiwygEditor.dispatchEvent(new Event('input'));
        wysiwygEditor.dispatchEvent(new Event('change'));
    });
    
    let lastDesc = wysiwygEditor.innerHTML;
    let descChanged = false;
    let menuChanged = false;
    
    // Listen for WYSIWYG editor changes to update the main save button state
    wysiwygEditor.addEventListener('input', function() {
        descChanged = (wysiwygEditor.innerHTML !== lastDesc);
        // Update the main save button state
        const mainSaveBtn = document.getElementById('desc-save-btn');
        if (mainSaveBtn) {
            if (descChanged || menuChanged) {
                mainSaveBtn.disabled = false;
                mainSaveBtn.style.background = '#FF0000';
                mainSaveBtn.style.cursor = 'pointer';
            } else {
                mainSaveBtn.disabled = true;
                mainSaveBtn.style.background = '#888';
                mainSaveBtn.style.cursor = 'not-allowed';
            }
        }
    });
    
    // Add keyboard shortcuts for the WYSIWYG editor
    wysiwygEditor.addEventListener('keydown', function(e) {
        // ESC to cancel editing and refresh
        if (e.key === 'Escape') {
            e.preventDefault();
            const cancelBtn = document.getElementById('desc-cancel-btn');
            if (cancelBtn) cancelBtn.click();
            // Give DOM a moment, then refresh to fetch latest data
            setTimeout(() => window.location.reload(), 50);
            return;
        }
        if (e.ctrlKey || e.metaKey) {
            switch(e.key) {
                case 'z':
                    if (e.shiftKey) {
                        // Ctrl+Shift+Z or Cmd+Shift+Z for Redo
                        e.preventDefault();
                        execWysiwygCommand('redo', false, null);
                    } else {
                        // Ctrl+Z or Cmd+Z for Undo
                        e.preventDefault();
                        execWysiwygCommand('undo', false, null);
                    }
                    break;
                case 'y':
                    // Ctrl+Y or Cmd+Y for Redo (alternative)
                    e.preventDefault();
                    execWysiwygCommand('redo', false, null);
                    break;
                case 'b':
                    // Ctrl+B or Cmd+B for Bold
                    e.preventDefault();
                    execWysiwygCommand('bold', false, null);
                    break;
                case 'i':
                    // Ctrl+I or Cmd+I for Italic
                    e.preventDefault();
                    execWysiwygCommand('italic', false, null);
                    break;
                case 'u':
                    // Ctrl+U or Cmd+U for Underline
                    e.preventDefault();
                    execWysiwygCommand('underline', false, null);
                    break;
                case 'k':
                    // Ctrl+K or Cmd+K for Insert Link
                    e.preventDefault();
                    insertWysiwygLink();
                    break;
                case 'Enter':
                    // Ctrl+Enter or Cmd+Enter to Quick-Save without closing editor
                    e.preventDefault();
                    const menuCheckboxQuick = document.getElementById('displayInMenuCheckbox');
                    const menuStateQuick = menuCheckboxQuick ? menuCheckboxQuick.checked : null;
                    const newDescQuick = wysiwygEditor.innerHTML;
                    updateProjectDescription(slug, newDescQuick, menuStateQuick, true);
                    // Provide visual feedback on the main Save button but keep editing
                    const saveBtnShortcut = document.getElementById('desc-save-btn');
                    if (saveBtnShortcut) {
                        saveBtnShortcut.textContent = 'Saved!';
                        saveBtnShortcut.style.background = '#28a745';
                        saveBtnShortcut.disabled = true;
                        // Re-enable after few seconds so user can save again later
                        setTimeout(() => {
                            saveBtnShortcut.textContent = 'Save';
                            saveBtnShortcut.style.background = '#FF0000';
                            saveBtnShortcut.disabled = false;
                        }, 2000);
                    }
                    break;
            }
        }
    });
    
    // Listen for menu checkbox changes
    if (menuCheckbox) {
        menuCheckbox.addEventListener('change', function() {
            menuChanged = (menuCheckbox.checked !== origChecked);
            
            // Get fresh data from server to avoid corruption
            fetch('/data/menu.json', { 
                cache: 'no-cache',
                headers: {
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache'
                }
            })
            .then(res => res.json())
            .then(serverData => {
                // Update sub_menu in server data
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
                
                updateSubMenu(serverData);
                
                // Update local data to match
                if (window.menuDataManager) {
                    window.menuDataManager.updateData(serverData);
                } else {
                    window.__MENU_DATA = serverData;
                    localStorage.setItem('menu_json_edits', JSON.stringify(serverData));
                }
                
                // Update the main save button state
                const mainSaveBtn = document.getElementById('desc-save-btn');
                if (mainSaveBtn) {
                    if (descChanged || menuChanged) {
                        mainSaveBtn.disabled = false;
                        mainSaveBtn.style.background = '#FF0000';
                        mainSaveBtn.style.cursor = 'pointer';
                    } else {
                        mainSaveBtn.disabled = true;
                        mainSaveBtn.style.background = '#888';
                        mainSaveBtn.style.cursor = 'not-allowed';
                    }
                }
            })
            .catch(err => {
                console.error('Failed to update menu checkbox:', err);
                // Fallback to local update if server fetch fails
                const currentData = window.menuDataManager ? window.menuDataManager.getCurrentData() : window.__MENU_DATA;
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
                updateSubMenu(currentData);
                
                // Update the main save button state
                const mainSaveBtn = document.getElementById('desc-save-btn');
                if (mainSaveBtn) {
                    if (descChanged || menuChanged) {
                        mainSaveBtn.disabled = false;
                        mainSaveBtn.style.background = '#FF0000';
                        mainSaveBtn.style.cursor = 'pointer';
                    } else {
                        mainSaveBtn.disabled = true;
                        mainSaveBtn.style.background = '#888';
                        mainSaveBtn.style.cursor = 'not-allowed';
                    }
                }
            });
        });
    }
    
    // Cancel button
    const cancelBtn = document.getElementById('desc-cancel-btn');
    if (cancelBtn) {
        cancelBtn.onclick = function() {
            // Remove editor and show original content
            descEditor.remove();
            
            // Show the display text
            const displayText = editWrap.querySelector('.description-display');
            if (displayText) displayText.style.display = 'block';
            
            // Show the edit button
            editBtn.style.display = 'block';
            
            // Show any other description elements that were hidden
            const allDescElements = editWrap.querySelectorAll('p, div');
            allDescElements.forEach(el => {
                if (el !== descDiv && el.classList.contains('description-display')) {
                    el.style.display = 'block';
                }
            });
        };
    }
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
        // Don't auto-initialize editor - let user click edit button instead
    }
})();

function updateProjectDescription(slug, newDesc, menuCheckboxState = null, skipReload = false) {
    // First, get the original data from the server to ensure we don't lose any fields
    fetch('/data/menu.json', { 
        cache: 'no-cache',
        headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
        }
    })
    .then(res => res.json())
    .then(serverData => {
        // Find and update the specific project in the server data
        function updateInMenu(arr) {
            for (const entry of arr) {
                if (entry.slug === slug) {
                    // Update the pageSummary if new description is provided
                    if (newDesc !== null) {
                        // Preserve the HTML content from WYSIWYG editor
                        entry.pageSummary = newDesc;
                    }
                    
                    // Update sub_menu if checkbox state is provided
                    if (menuCheckboxState !== null) {
                        entry.sub_menu = menuCheckboxState ? 1 : 0;
                        console.log(`Updated sub_menu for ${slug} to: ${entry.sub_menu}`);
                    }
                    
                    return true;
                }
                if (entry.submenu && updateInMenu(entry.submenu)) return true;
            }
            return false;
        }
        
        // Update the server data
        updateInMenu(serverData);
        
        // Update local data to match
        if (window.menuDataManager) {
            window.menuDataManager.updateData(serverData);
        } else {
            window.__MENU_DATA = serverData;
            localStorage.setItem('menu_json_edits', JSON.stringify(serverData));
        }

        // Log the data being sent for debugging
        console.log('Sending updated data for project:', slug);
        console.log('Description updated:', !!newDesc);
        console.log('Menu checkbox state:', menuCheckboxState);
        console.log('Data structure preserved:', serverData.some(item => 
            item.submenu && item.submenu.some(sub => 
                sub.slug === slug && sub.detailImages && sub.coverImage
            )
        ));
        
        // Send the complete, updated data to the server
        return fetch('/api/update-menu', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-edit-secret': 'dowhatyouaredoing' // match EDIT_SECRET in .env
            },
            body: JSON.stringify(serverData)
        });
    })
    .then(res => res.json())
    .then(data => {
        if (!data.success) {
            alert('Failed to save to server: ' + (data.error || 'Unknown error'));
        } else {
            // Clear edit cache after successful server save
            if (window.menuDataManager) {
                window.menuDataManager.clearAllCaches();
            }
            console.log('Project updated successfully');
            if (menuCheckboxState !== null) {
                console.log(`Menu visibility set to: ${menuCheckboxState ? 'visible' : 'hidden'}`);
            }
            
            // Show success message
            const saveBtn = document.getElementById('desc-save-btn');
            if (saveBtn) {
                const originalText = saveBtn.textContent;
                saveBtn.textContent = 'Saved!';
                saveBtn.style.background = '#28a745';
                saveBtn.disabled = true;
            }
            
            // Reload page only if not skipping (regular save button)
            if (!skipReload) {
                setTimeout(() => {
                    window.location.reload();
                }, 1000);
            }
        }
    })
    .catch(err => {
        console.error('Update failed:', err);
        alert('Failed to save to server: ' + err.message);
    });
}

// Enhanced page data injection with proper cache management
(function() {
    const origInject = injectPageData;
    injectPageData = function() {
        // Use menu data manager to get the correct data source
        if (window.menuDataManager) {
            window.__MENU_DATA = window.menuDataManager.getCurrentData();
        }
        
        origInject();
        
        // Apply red bullet styling after content is injected
        if (typeof styleRedBullets === 'function') {
            styleRedBullets();
        }
        
        // Attach edit icon handler if logged in and on project detail
        const urlParams = new URLSearchParams(window.location.search);
        const slugParam = urlParams.get('item');
        if (slugParam && window.authManager && window.authManager.isLoggedIn) {
            const editBtn = document.getElementById('edit-desc-btn');
            const descDiv = document.getElementById('project-description');
            const saveBtn = document.getElementById('desc-save-btn');
            
            if (editBtn && descDiv) {
                editBtn.onclick = function() {
                    // Get the raw content from the hidden project-description div
                    const contentToEdit = descDiv.innerHTML || '';
                    console.log('Content to edit:', contentToEdit);
                    setupSimpleDescriptionEditor(slugParam, contentToEdit);
                };
            }
            
            // Add click handler for the main save button
            if (saveBtn) {
                saveBtn.onclick = function() {
                    if (saveBtn.disabled) return;
                    
                    // Get the current WYSIWYG editor content if editor is open
                    const wysiwygEditor = document.getElementById('wysiwyg-editor');
                    const menuCheckbox = document.getElementById('displayInMenuCheckbox');
                    
                    if (wysiwygEditor) {
                        // Editor is open, save the WYSIWYG editor content
                        const newDesc = wysiwygEditor.innerHTML;
                        const menuState = menuCheckbox ? menuCheckbox.checked : null;
                        updateProjectDescription(slugParam, newDesc, menuState);
                    } else {
                        // Editor is not open, just save menu checkbox state if changed
                        const menuState = menuCheckbox ? menuCheckbox.checked : null;
                        if (menuState !== null) {
                            updateProjectDescription(slugParam, null, menuState);
                        }
                    }
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
            metaRows.push(`<li><span class="label">Domain:</span> <span><a href="${data.projectUrl}" target="_blank" class="external-link">${disp}</a><span class="link-icon" aria-hidden="true">↗</span></span></li>`);
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

// WYSIWYG Editor Functions
function execWysiwygCommand(command, showUI = false, value = null) {
    document.execCommand(command, showUI, value);
    // Trigger change detection
    const wysiwygEditor = document.getElementById('wysiwyg-editor');
    if (wysiwygEditor) {
        wysiwygEditor.dispatchEvent(new Event('input'));
    }
}

function insertWysiwygCodeBlock() {
    const language = document.getElementById('wysiwygLanguageSelect').value;
    const codeBlock = document.createElement('pre');
    codeBlock.innerHTML = `<code class="language-${language}" contenteditable="true" data-language="${language}">// Enter your ${language} code here
console.log("Hello, World!");</code>`;
    
    // Create a paragraph element to add after the code block
    const afterParagraph = document.createElement('p');
    afterParagraph.innerHTML = '<br>';
    
    const wysiwygEditor = document.getElementById('wysiwyg-editor');
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        range.deleteContents();
        range.insertNode(codeBlock);
        
        // Insert the paragraph after the code block
        const afterRange = document.createRange();
        afterRange.setStartAfter(codeBlock);
        afterRange.insertNode(afterParagraph);
        
        // Move cursor to the paragraph after the code block
        const newRange = document.createRange();
        newRange.setStart(afterParagraph, 0);
        newRange.collapse(true);
        selection.removeAllRanges();
        selection.addRange(newRange);
    }
    
    // Apply syntax highlighting
    if (window.hljs) {
        const codeElement = codeBlock.querySelector('code');
        if (codeElement) {
            hljs.highlightElement(codeElement);
        }
    }
    
    // Trigger change detection
    wysiwygEditor.dispatchEvent(new Event('input'));
}

function formatWysiwygHeading(tag) {
    if (tag && tag !== '') {
        if (tag === 'red-bold') {
            // Apply red bold styling using execCommand for undo support
            const selection = window.getSelection();
            if (selection.rangeCount > 0) {
                const range = selection.getRangeAt(0);
                const selectedText = range.toString();
                
                if (selectedText) {
                    // Use execCommand for foreground color and bold to make it undoable
                    execWysiwygCommand('foreColor', false, '#FF0000');
                    execWysiwygCommand('bold', false, null);
                }
            }
        } else if (tag === 'p') {
            // Handle "Normal" selection - remove inline styles from selected text
            const selection = window.getSelection();
            if (selection.rangeCount > 0) {
                const range = selection.getRangeAt(0);
                const selectedText = range.toString();
                
                if (selectedText) {
                    // First try to remove all formatting
                    execWysiwygCommand('removeFormat', false, null);
                    // Then ensure we have normal color and no bold
                    execWysiwygCommand('foreColor', false, '#000000');
                    execWysiwygCommand('bold', false, null);
                }
            }
            // Also apply normal paragraph formatting
            execWysiwygCommand('formatBlock', false, '<p>');
        } else {
            execWysiwygCommand('formatBlock', false, `<${tag}>`);
        }
        // Reset dropdown after use
        document.querySelector('select[onchange="formatWysiwygHeading(this.value)"]').selectedIndex = 0;
    }
}

function changeWysiwygCodeLanguage() {
    const selection = window.getSelection();
    let codeBlock = null;
    
    if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        let element = range.commonAncestorContainer;
        
        // If the common ancestor is a text node, get its parent
        if (element.nodeType === Node.TEXT_NODE) {
            element = element.parentElement;
        }
        
        // Look for code element by traversing up the DOM tree
        while (element && element !== document.getElementById('wysiwyg-editor')) {
            if (element.tagName === 'CODE') {
                codeBlock = element;
                break;
            }
            if (element.tagName === 'PRE') {
                const codeChild = element.querySelector('code');
                if (codeChild) {
                    codeBlock = codeChild;
                    break;
                }
            }
            element = element.parentElement;
        }
    }
    
    if (codeBlock) {
        const newLanguage = document.getElementById('wysiwygLanguageSelect').value;
        
        // Remove all existing language classes
        codeBlock.className = codeBlock.className.replace(/language-\w+/g, '').trim();
        
        // Add new language class
        codeBlock.classList.add(`language-${newLanguage}`);
        codeBlock.setAttribute('data-language', newLanguage);
        
        // Clear any existing highlighting
        codeBlock.removeAttribute('data-highlighted');
        
        // Re-highlight with new language
        if (window.hljs) {
            hljs.highlightElement(codeBlock);
        }
        
        // Trigger change detection
        const wysiwygEditor = document.getElementById('wysiwyg-editor');
        if (wysiwygEditor) {
            wysiwygEditor.dispatchEvent(new Event('input'));
        }
    }
}

function insertWysiwygInlineCode() {
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const selectedText = range.toString() || 'code';
        
        const code = document.createElement('code');
        code.className = 'inline-code';
        code.textContent = selectedText;
        
        range.deleteContents();
        range.insertNode(code);
        selection.removeAllRanges();
    }
    
    // Trigger change detection
    const wysiwygEditor = document.getElementById('wysiwyg-editor');
    if (wysiwygEditor) {
        wysiwygEditor.dispatchEvent(new Event('input'));
    }
} 

// Insert a hyperlink with red, underlined styling that opens in a new tab
function insertWysiwygLink() {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
        alert('Please select the text you want to turn into a link.');
        return;
    }

    const url = prompt('Enter the URL to link to (include http:// or https://):');
    if (!url) return;

    // Use execCommand to create the link so that undo/redo work as expected
    execWysiwygCommand('createLink', false, url);

    // Post-process the newly created <a> elements to enforce styling & behaviour
    const wysiwygEditor = document.getElementById('wysiwyg-editor');
    if (!wysiwygEditor) return;

    // Query for anchors that match the provided URL inside the editor
    const anchors = wysiwygEditor.querySelectorAll(`a[href="${url}"]`);
    anchors.forEach(anchor => {
        anchor.setAttribute('target', '_blank');
        anchor.style.color = '#FF0000';  // red text
        anchor.style.textDecoration = 'underline'; // underline
        anchor.style.fontWeight = 'normal'; // ensure not bold
    });

    // Trigger change detection so that the Save button state updates
    wysiwygEditor.dispatchEvent(new Event('input'));
} 

// Replace literal bullet characters (•) with styled red bullet spans
function styleRedBullets() {
    const selectors = ['.project-info', '.dynamic-body', '.description-display', '.description'];
    selectors.forEach(sel => {
        document.querySelectorAll(sel).forEach(container => {
            if (!container) return;
            const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, null);
            const textNodes = [];
            while (walker.nextNode()) {
                const node = walker.currentNode;
                if (node.nodeValue && node.nodeValue.includes('•')) {
                    textNodes.push(node);
                }
            }
            textNodes.forEach(node => {
                const parts = node.nodeValue.split('•');
                const frag = document.createDocumentFragment();
                parts.forEach((txt, idx) => {
                    if (idx > 0) {
                        const span = document.createElement('span');
                        span.className = 'red-bullet';
                        span.textContent = '•';
                        frag.appendChild(span);
                    }
                    if (txt.length) {
                        frag.appendChild(document.createTextNode(txt));
                    }
                });
                node.parentNode.replaceChild(frag, node);
            });
        });
    });
} 