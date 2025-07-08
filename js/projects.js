// projects.js – lightweight category filter for the unified project list view

// Helper – normalize technology labels to broader groups
function canonicalizeTech(raw) {
    const str = (raw || '').trim();
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
    const match = map.find(m => m.pattern.test(str));
    if (match) return match.name;

    // remove trailing numbers ("Tech 10")
    const cleaned = str.replace(/\s+\d+.*/, '').trim();
    return cleaned || str;
}

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

    // After building tiles and before referencing filters
    const techFilterSelect = document.getElementById('technologyFilter');
    const techDropdownToggle = document.getElementById('techDropdownToggle');
    const techDropdownOptions = document.getElementById('techDropdownOptions');
    const techDropdownLabel = document.getElementById('techDropdownLabel');

    if (!filterSelect) return; // bail if not on the list view page

    // Apply initial filter (from query-string or default value)
    const params = new URLSearchParams(window.location.search);
    const initial = params.get('category');
    if (initial) {
        filterSelect.value = initial;
    }

    // will hold counts of canonical techs once computed
    let techCounts = {};
    let currentVisibleTotal = tiles.length; // updated in refreshTechCounts

    // Helper – recompute tech counts for currently selected category & refresh dropdown labels
    function refreshTechCounts(currentCat) {
        if (!techFilterSelect || !techDropdownOptions) return;
        techCounts = {};
        let visibleTileTotal = 0;
        tiles.forEach(tile => {
            const cat = tile.dataset.category;
            if (currentCat === 'All' || cat === currentCat) {
                visibleTileTotal++;
                const techStr = tile.dataset.technology || '';
                techStr.split('|').forEach(t => {
                    if (!t) return;
                    techCounts[t] = (techCounts[t] || 0) + 1;
                });
            }
        });
        currentVisibleTotal = visibleTileTotal;

        // Update native select
        techFilterSelect.querySelectorAll('option').forEach(opt => {
            const val = opt.value;
            if (val === 'All') {
                opt.textContent = `All (${visibleTileTotal})`;
                opt.hidden = false;
            } else {
                const cnt = techCounts[val] || 0;
                opt.textContent = `${val} (${cnt})`;
                // Hide/disable options with zero count
                opt.hidden = cnt === 0;
                opt.disabled = cnt === 0;
            }
        });
        // Update custom dropdown list items
        techDropdownOptions.querySelectorAll('li').forEach(li => {
            const val = li.getAttribute('data-value');
            if (val === 'All') {
                li.textContent = `All (${visibleTileTotal})`;
                li.style.display = '';
            } else {
                const cnt = techCounts[val] || 0;
                li.textContent = `${val} (${cnt})`;
                li.style.display = cnt === 0 ? 'none' : '';
            }
        });

        // Reset technology filter to "All" if current selection now empty
        const selectedVal = techFilterSelect.value;
        if (selectedVal !== 'All' && !techCounts[selectedVal]) {
            techFilterSelect.value = 'All';
        }
    }

    // Helper to get display label (with counts) for technology dropdown header
    function getTechLabel(tech) {
        if (tech === 'All') {
            return `All (${currentVisibleTotal})`;
        }
        return `${tech} (${techCounts[tech] || 0})`;
    }

    // Dynamically populate technology dropdown based on rendered tiles
    if (techFilterSelect && techDropdownOptions) {
        tiles.forEach(tile => {
            const techStr = tile.dataset.technology || '';
            techStr.split('|').forEach(t => {
                if (!t) return;
                techCounts[t] = (techCounts[t] || 0) + 1;
            });
        });

        const techArr = Object.keys(techCounts).sort();
        techArr.forEach(t => {
            const label = `${t} (${techCounts[t]})`;
            // native select
            const opt = document.createElement('option');
            opt.value = t;
            opt.textContent = label;
            techFilterSelect.appendChild(opt);
            // custom list item
            const li = document.createElement('li');
            li.setAttribute('data-value', t);
            li.textContent = label;
            techDropdownOptions.appendChild(li);
        });
        // Update All label to include total count, keep value as All
        const totalCount = tiles.length;
        const firstLi = techDropdownOptions.querySelector('li[data-value="All"]');
        if (firstLi) firstLi.textContent = `All (${totalCount})`;
        const firstOpt = techFilterSelect.querySelector('option[value="All"]');
        if (firstOpt) firstOpt.textContent = `All (${totalCount})`;
    }

    // Apply initial tech filter from URL if present (e.g., ?technology=Drupal%2010)
    const initialTech = params.get('technology');
    if (initialTech && techFilterSelect) {
        techFilterSelect.value = initialTech;
    }

    // Now that techCounts populated and initial selection set, apply filter once
    applyFilter();

    // Re-filter on dropdown change
    filterSelect.addEventListener('change', applyFilter);

    // Re-filter on tech dropdown change
    if (techFilterSelect) techFilterSelect.addEventListener('change', applyFilter);

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

    function closeTechDropdown() { if (techDropdownOptions) techDropdownOptions.style.display = 'none'; }
    function openTechDropdown()  { if (techDropdownOptions) techDropdownOptions.style.display = 'block'; }

    if (techDropdownToggle) {
        techDropdownToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = techDropdownOptions && techDropdownOptions.style.display === 'block';
            if (isOpen) { closeTechDropdown(); } else { openTechDropdown(); }
        });
    }
    if (techDropdownOptions) {
        techDropdownOptions.addEventListener('click', (e) => {
            const li = e.target.closest('li');
            if (!li) return;
            const val = li.getAttribute('data-value');
            techFilterSelect.value = val;
            techFilterSelect.dispatchEvent(new Event('change'));
            closeTechDropdown();
        });
    }
    // Close both dropdowns on outside click
    document.addEventListener('click', () => { closeDropdown(); closeTechDropdown(); });

    function applyFilter() {
        const currentCat = filterSelect.value;

        // Recalculate technology counts & labels based on selected category
        refreshTechCounts(currentCat);

        const currentTech = techFilterSelect ? techFilterSelect.value : 'All';
        // Build query params based on current selections
        const queryParts = [];
        if (currentCat !== 'All') queryParts.push(`category=${encodeURIComponent(currentCat)}`);
        if (currentTech !== 'All') queryParts.push(`technology=${encodeURIComponent(currentTech)}`);
        const queryString = queryParts.length ? `?${queryParts.join('&')}` : '';

        // Update breadcrumb link text + href
        const catLink = document.getElementById('crumbCategoryLink');
        if (catLink) {
            catLink.textContent = currentCat;
            catLink.setAttribute('href', `projects.html${queryString}`);
        }

        // Sync sidebar active state
        updateSidebarActive(currentCat);

        tiles.forEach(tile => {
            const cat = tile.dataset.category;
            const techData = tile.dataset.technology || '';
            const techMatch = currentTech === 'All' || techData.toLowerCase().includes(currentTech.toLowerCase());
            const catMatch = currentCat === 'All' || cat === currentCat;
            const shouldShow = catMatch && techMatch;
            tile.style.display = shouldShow ? '' : 'none';
        });

        // Trigger entrance animation for visible tiles
        animateVisibleTiles();

        // Update address bar without reloading page
        const newUrl = `projects.html${queryString}`;
        if (window.location.href.split('#')[0].split('?')[0].endsWith('projects.html')) {
            // Preserve hash (if any)
            const hash = window.location.hash || '';
            history.replaceState(null, '', newUrl + hash);
        }

        // Update custom dropdown UI
        if (dropdownLabel) dropdownLabel.textContent = currentCat;
        if (dropdownIcon) {
            const iconMap = {
                'Higher Education': 'assets/grad.svg',
                'Intranets & Portals': 'assets/intranet.svg',
                'Web & iOS Apps': 'assets/web.svg',
                'Informational': 'assets/info.svg',
                'E-Commerce': 'assets/money.svg',
                'Blog Posts': 'assets/hash.svg',
                'Music & Art': 'assets/music.svg',
                'All': 'assets/360.svg'
            };
            dropdownIcon.style.backgroundImage = iconMap[currentCat] ? `url('${iconMap[currentCat]}')` : 'none';
        }

        if (techDropdownLabel) techDropdownLabel.textContent = getTechLabel(currentTech);
    }

    function updateSidebarActive(category) {
        const map = {
            'Higher Education': 'HIGHER EDUCATION',
            'Intranets & Portals': 'INTRANETS & PORTALS',
            'Web & iOS Apps': 'WEB & IOS APPS',
            'Informational': 'INFORMATIONAL',
            'E-Commerce': 'E-COMMERCE',
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

        // Build canonical technology list for grouping
        let canonicalList = [];
        if (item.technology) {
            item.technology.split(',').forEach(t => {
                const canon = canonicalizeTech(t);
                if (canon && !canonicalList.includes(canon)) canonicalList.push(canon);
            });
        }
        article.dataset.technology = canonicalList.join('|');

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