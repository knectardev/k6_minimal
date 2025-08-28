document.addEventListener('DOMContentLoaded', () => {
    // Populate dynamic page content (project meta) from menu.json
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
    
    // Function to initialize haiku grainy effect
    function initializeHaikuGrainyEffect() {
        // Add SVG filter for grainy effect if not already present
        if (!document.getElementById('roughpaper-filter')) {
            const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svg.setAttribute('id', 'roughpaper-filter');
            svg.style.position = 'absolute';
            svg.style.width = '0';
            svg.style.height = '0';
            svg.style.overflow = 'hidden';
            
            const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
            const filter = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
            filter.setAttribute('id', 'roughpaper');
            
            // Create turbulence for noise
            const turbulence = document.createElementNS('http://www.w3.org/2000/svg', 'feTurbulence');
            turbulence.setAttribute('baseFrequency', '0.04');
            turbulence.setAttribute('numOctaves', '5');
            turbulence.setAttribute('result', 'noise');
            
            // Create displacement map
            const displacementMap = document.createElementNS('http://www.w3.org/2000/svg', 'feDisplacementMap');
            displacementMap.setAttribute('in', 'SourceGraphic');
            displacementMap.setAttribute('in2', 'noise');
            displacementMap.setAttribute('scale', '1.5');
            
            // Create gaussian blur
            const gaussianBlur = document.createElementNS('http://www.w3.org/2000/svg', 'feGaussianBlur');
            gaussianBlur.setAttribute('stdDeviation', '0.3');
            
            // Assemble the filter
            filter.appendChild(turbulence);
            filter.appendChild(displacementMap);
            filter.appendChild(gaussianBlur);
            defs.appendChild(filter);
            svg.appendChild(defs);
            document.body.appendChild(svg);
        }
        
        // No additional visual enhancements needed - keeping it clean with just the SVG filter
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
    
    // Initialize haiku grainy effect
    initializeHaikuGrainyEffect();
    
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



    // Feature flags

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
    
    // Remove console.log to clean up console output
    // console.log('cleanLegacyContent input:', content);
    
    // Convert legacy content to modern format
    
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
    if (data.projectTitle) {
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
    if (data.designPartner || data.design_partner) {
        const partner = data.designPartner || data.design_partner;
        if (partner && partner.trim() !== "") {
            if (data.designPartnerUrl) {
                rows.push(`<li><strong>DESIGN PARTNER:</strong> <a href="${data.designPartnerUrl}" target="_blank" class="external-link">${partner}</a><span class="link-icon" aria-hidden="true">↗</span></li>`);
            } else {
                rows.push(`<li><strong>DESIGN PARTNER:</strong> ${partner}</li>`);
            }
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
        html += `<div class="project-haiku">${data.project_haiku}</div>`;
    }

    // Description: static text only
    if (data.pageSummary) {
        const cleanedContent = cleanLegacyContent(data.pageSummary);
        // Check if content is long enough to warrant read more functionality
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = cleanedContent;
        const textLength = tempDiv.textContent || tempDiv.innerText || '';
        
        if (textLength.length > 800) { // Only add read more for long content
            html += `
                <div class="description read-more-container collapsed">
                    <div class="read-more-content">${cleanedContent}</div>
                    <button class="read-more-btn" onclick="toggleReadMore(this)">Read More</button>
                </div>
            `;
        } else {
            html += `<div class="description">${cleanedContent}</div>`;
        }
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
        line-height: 1.5;
        max-width: 500px;
        width: fit-content;">
            <div style="font-weight: bold; color: #FF0000; font-size: 15px; margin-bottom: 8px;">${heading}</div>
            <div style="color: #000; font-size: 15px;">${bodyWithLink}</div>
        </div>`;
    }
    
    return html;
}







// Enhanced page data injection with proper cache management
(function() {
    const origInject = injectPageData;
    injectPageData = function() {
        origInject();
        
        // Apply red bullet styling after content is injected
        if (typeof styleRedBullets === 'function') {
            styleRedBullets();
        }
        
        // Apply haiku grainy effect after content is injected
        if (document.querySelector('.project-haiku') && typeof initializeHaikuGrainyEffect === 'function') {
            initializeHaikuGrainyEffect();
        }
    }
})();



// Read More functionality
function toggleReadMore(button) {
    const container = button.closest('.read-more-container');
    if (!container) return;
    
    const isCollapsed = container.classList.contains('collapsed');
    
    if (isCollapsed) {
        // Start expansion animation
        container.classList.add('expanding');
        
        // Small delay to start the button fade
        setTimeout(() => {
            container.classList.remove('collapsed');
        }, 50);
        
        // Update button text and clean up after animation completes
        setTimeout(() => {
            button.textContent = 'Read Less';
            container.classList.remove('expanding');
        }, 650); // Slightly longer than CSS transition
        
        // Optional: Log to console for debugging
        console.log('Read More clicked for:', window.location.pathname + window.location.search);
    } else {
        // Collapse content
        container.classList.add('collapsed');
        button.textContent = 'Read More';
        
        // Scroll back to the top of the content
        container.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// Make toggleReadMore globally available
window.toggleReadMore = toggleReadMore;