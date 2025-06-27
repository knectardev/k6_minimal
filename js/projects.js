// projects.js – lightweight category filter for the unified project list view

document.addEventListener('DOMContentLoaded', initProjects);

function initProjects() {
    // Wait for menu data to be ready
    if (!window.__MENU_DATA) {
        setTimeout(initProjects, 50);
        return;
    }

    if (window.__projectsInitialized) return;
    window.__projectsInitialized = true;
    buildTilesFromData(window.__MENU_DATA);
    const filterSelect = document.getElementById('categoryFilter');
    const tiles = document.querySelectorAll('.project-tile');
    const dropdownToggle = document.getElementById('dropdownToggle');
    const dropdownOptions = document.getElementById('dropdownOptions');
    const dropdownLabel = document.getElementById('dropdownLabel');
    const dropdownIcon = document.getElementById('dropdownIcon');

    if (!filterSelect) return; // bail if not on the list view page

    // Apply initial filter (from query-string or default value)
    const params = new URLSearchParams(window.location.search);
    const initial = params.get('category');
    if (initial) {
        filterSelect.value = initial;
    }
    applyFilter();

    // Re-filter on dropdown change
    filterSelect.addEventListener('change', applyFilter);

    function closeDropdown() {
        dropdownOptions.style.display = 'none';
    }
    function openDropdown() {
        dropdownOptions.style.display = 'block';
    }
    if (dropdownToggle) {
        dropdownToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = dropdownOptions.style.display === 'block';
            if (isOpen) { closeDropdown(); } else { openDropdown(); }
        });
    }
    if (dropdownOptions) {
        dropdownOptions.addEventListener('click', (e) => {
            const li = e.target.closest('li');
            if (!li) return;
            const val = li.getAttribute('data-value');
            filterSelect.value = val;
            filterSelect.dispatchEvent(new Event('change'));
            closeDropdown();
        });
    }
    // Close on outside click
    document.addEventListener('click', closeDropdown);

    function applyFilter() {
        const current = filterSelect.value;
        // Update breadcrumb link text + href
        const catLink = document.getElementById('crumbCategoryLink');
        if (catLink) {
            catLink.textContent = current;
            const url = current === 'All' ? 'projects.html' : `projects.html?category=${encodeURIComponent(current)}`;
            catLink.setAttribute('href', url);
        }

        // Sync sidebar active state
        updateSidebarActive(current);

        tiles.forEach(tile => {
            const cat = tile.dataset.category;
            const shouldShow = current === 'All' || cat === current;
            tile.style.display = shouldShow ? '' : 'none';
        });

        // Trigger entrance animation for visible tiles
        animateVisibleTiles();

        // Update address bar without reloading page
        const newUrl = current === 'All'
            ? 'projects.html'
            : `projects.html?category=${encodeURIComponent(current)}`;
        if (window.location.href.split('#')[0].split('?')[0].endsWith('projects.html')) {
            // Preserve hash (if any)
            const hash = window.location.hash || '';
            history.replaceState(null, '', newUrl + hash);
        }

        // Update custom dropdown UI
        if (dropdownLabel) dropdownLabel.textContent = current;
        if (dropdownIcon) {
            const iconMap = {
                'Higher Education': 'assets/grad.svg',
                'Intranets & Portals': 'assets/intranet.svg',
                'Web & iOS Apps': 'assets/web.svg',
                'Informational': 'assets/info.svg',
                'Blog Posts': 'assets/hash.svg',
                'Music & Art': 'assets/music.svg',
                'All': 'assets/360.svg'
            };
            dropdownIcon.style.backgroundImage = iconMap[current] ? `url('${iconMap[current]}')` : 'none';
        }
    }

    function updateSidebarActive(category) {
        const map = {
            'Higher Education': 'HIGHER EDUCATION',
            'Intranets & Portals': 'INTRANETS & PORTALS',
            'Web & iOS Apps': 'WEB & IOS APPS',
            'Informational': 'INFORMATIONAL',
            'Blog Posts': 'BLOG POSTS',
            'Music & Art': 'MUSIC & ART',
            'All': ''
        };
        const label = map[category] || '';
        document.querySelectorAll('.menu-parent').forEach(parent => {
            const li = parent.closest('li');
            const submenu = li.querySelector('.submenu');
            if (!label) {
                li.classList.remove('active');
                if (submenu) submenu.style.display = 'none';
            } else if (parent.textContent.trim().toUpperCase() === label) {
                li.classList.add('active');
                if (submenu) submenu.style.display = 'block';
            } else {
                li.classList.remove('active');
                if (submenu) submenu.style.display = 'none';
            }
        });
    }

    // ---------------------------------------------------
    // Helper – Animate visible tiles with a gentle bounce
    // ---------------------------------------------------
    function animateVisibleTiles() {
        let delay = 0;
        tiles.forEach(tile => {
            if (tile.style.display === '' || tile.style.display === 'block') {
                const leftClass = 'slide-in-left';
                const rightClass = 'slide-in-right';
                // pick orientation randomly each time
                const useLeft = Math.random() < 0.5;

                tile.classList.remove(leftClass, rightClass);
                void tile.offsetWidth; // reflow

                tile.style.animationDelay = `${delay}s`;
                tile.classList.add(useLeft ? leftClass : rightClass);
                delay += 0.075;
            }
        });
    }

    // Initial animation on page load
    animateVisibleTiles();
}

// If script is loaded after DOMContentLoaded, call immediately
if (document.readyState !== 'loading') {
    initProjects();
}

// --------------------------------------------
// Build tiles dynamically from menu.json data
// --------------------------------------------
function buildTilesFromData(menu) {
    const container = document.getElementById('projectList');
    if (!container) return;

    // Clear any placeholder tiles
    container.innerHTML = '';

    const leafItems = [];
    function traverse(arr, parentLabel) {
        arr.forEach(item => {
            if (item.submenu) {
                traverse(item.submenu, item.label);
            } else if (item.sub_menu !== 0) {
                leafItems.push({ ...item, parentLabel });
            }
        });
    }
    traverse(menu, null);

    leafItems.forEach((item, idx) => {
        const article = document.createElement('article');
        article.className = 'project-tile';
        if (Math.random() < 0.5) article.classList.add('reverse');
        article.dataset.category = item.parentLabel || 'Misc';

        // link
        const link = item.url;

        article.innerHTML = `
            <div class="project-image"><img src="${item.coverImage || 'project_tiles/sample_tile1.png'}" alt="${item.projectTitle || item.label} image"></div>
            <div class="project-text">
                <span class="project-category">${item.parentLabel || ''}</span>
                <h2 class="project-title">${item.projectTitle || item.label}</h2>
                ${item.role ? `<p><strong>Role:</strong> ${item.role}</p>` : ''}
                ${item.technology ? `<p><strong>Technology:</strong> ${item.technology}</p>` : ''}
            </div>`;

        article.addEventListener('click', () => {
            window.location.href = link;
        });
        article.style.cursor = 'pointer';
        container.appendChild(article);
    });
} 