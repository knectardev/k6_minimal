// load_menu.js – builds sidebar from JSON data then loads main site script

(function() {
    // Google Tag Manager
    (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
    new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
    j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
    'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
    })(window,document,'script','dataLayer','GTM-MQ8X9HLL');
    // End Google Tag Manager

  const MENU_JSON = 'data/menu.json';
  const CACHE_KEY = 'menu_json_cache';
  const CACHE_VERSION_KEY = 'menu_cache_version';
  const CACHE_TIMESTAMP_KEY = 'menu_cache_timestamp';
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache

  // Cache management utilities
  const cacheManager = {
    getCache() {
      try {
        const cached = localStorage.getItem(CACHE_KEY);
        const version = localStorage.getItem(CACHE_VERSION_KEY);
        const timestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);
        
        if (!cached || !version || !timestamp) return null;
        
        const age = Date.now() - parseInt(timestamp);
        if (age > CACHE_DURATION) {
          this.clearCache();
          return null;
        }
        
        return {
          data: JSON.parse(cached),
          version: version,
          timestamp: parseInt(timestamp)
        };
      } catch (e) {
        console.warn('Cache read error:', e);
        this.clearCache();
        return null;
      }
    },

    setCache(data, version) {
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(data));
        localStorage.setItem(CACHE_VERSION_KEY, version);
        localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
      } catch (e) {
        console.warn('Cache write error:', e);
      }
    },

    clearCache() {
      localStorage.removeItem(CACHE_KEY);
      localStorage.removeItem(CACHE_VERSION_KEY);
      localStorage.removeItem(CACHE_TIMESTAMP_KEY);
    },

    // Get server version without downloading full data
    async getServerVersion() {
      try {
        const response = await fetch(MENU_JSON, { 
          method: 'HEAD',
          cache: 'no-cache'
        });
        if (!response.ok) return null;
        
        // Use ETag or Last-Modified as version
        const etag = response.headers.get('etag');
        const lastModified = response.headers.get('last-modified');
        return etag || lastModified || response.headers.get('content-length');
      } catch (e) {
        console.warn('Server version check failed:', e);
        return null;
      }
    }
  };

  async function fetchMenuData() {
    try {
      // Check if we have valid cached data
      const cached = cacheManager.getCache();
      const serverVersion = await cacheManager.getServerVersion();
      
      // Use cached data if available and not expired
      if (cached && cached.timestamp && (Date.now() - cached.timestamp) < CACHE_DURATION) {
          // console.log('Using cached menu data');
          return cached.data;
      }
      
      // Fetch fresh data from server
      // console.log('Fetching fresh menu data from server');
      const response = await fetch(MENU_JSON, { 
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Cache the fresh data
      const cacheData = {
          data: data,
          timestamp: Date.now()
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
      
      return data;
    } catch (error) {
      // console.log('Server unavailable, using cached data');
      
      // Fallback to cached data even if expired
      const cachedData = localStorage.getItem(CACHE_KEY);
      if (cachedData) {
          try {
              const parsed = JSON.parse(cachedData);
              return parsed.data;
          } catch (e) {
              // Invalid cached data, continue to fallback
          }
      }
      
      return window.__MENU_FALLBACK;
    }
  }



  function buildMenu(menu) {
    const overlay = document.createElement('div');
    overlay.className = 'overlay';

    const aside = document.createElement('aside');
    aside.className = 'sidebar';
    aside.id = 'sidebar';

    const logo = document.createElement('div');
    logo.className = 'logo logo-desktop logo-active';
    logo.innerHTML = '<a href="index.html"><img src="assets/logo.svg" class="logo-icon" alt="">KNECTAR</a>';

    const nav = document.createElement('nav');
    nav.className = 'main-nav';
    const ul = document.createElement('ul');

    menu.forEach(item => ul.appendChild(buildItem(item)));
    nav.appendChild(ul);

    aside.appendChild(logo);
    aside.appendChild(nav);

    document.body.insertAdjacentElement('afterbegin', overlay);
    document.body.insertAdjacentElement('afterbegin', aside);

    // Highlight current page if it exists in the menu
    setActiveFromURL();
  }

  function setActiveFromURL() {
    const pathPart = window.location.pathname.split('/').pop();
    const searchPart = window.location.search;
    const full = pathPart + searchPart;

    // First, try to match top-level menu items (like About and Tools)
    let link = document.querySelector(`.main-nav > ul > li > a[href='${full}']`);
    
    // Fallback: match top-level items by file name only
    if (!link) {
      link = document.querySelector(`.main-nav > ul > li > a[href$='${pathPart}']`);
    }

    // If not found in top-level, try submenu items with full match including query string
    if (!link) {
      link = document.querySelector(`.main-nav .submenu a[href='${full}']`);
    }

    // Fallback: match submenu items by file name only
    if (!link) {
      link = document.querySelector(`.main-nav .submenu a[href$='${pathPart}']`);
    }

    // If still not found, check for ?category=<parent> param and activate parent
    if (!link) {
      const cat = new URLSearchParams(searchPart).get('category');
      if (cat) {
        link = Array.from(document.querySelectorAll('.main-nav > ul > li > a.menu-parent'))
          .find(a => a.textContent.trim().toUpperCase() === cat.toUpperCase());
      }
    }

    if (!link) return;

    const li = link.closest('li');
    if (!li) return;

    // If link itself is parent, expand its submenu
    if (li.classList.contains('menu-item-parent')) {
      li.classList.add('active');
      const sub = li.querySelector('.submenu');
      if (sub) sub.style.display = 'block';
    } else {
      // link is child
      li.classList.add('active-sub');
      const parentLi = li.closest('li.menu-item-parent');
      if (parentLi) {
        parentLi.classList.add('active');
        const sub = parentLi.querySelector('.submenu');
        if (sub) sub.style.display = 'block';
      }
    }
  }

  function buildItem(item) {
    const li = document.createElement('li');
    li.classList.add('menu-item-parent');
    const a = document.createElement('a');
    
    // Set href for parent menu items
    if (item.url) {
      a.href = item.url;
    } else if (item.submenu) {
      // Parent menu items with submenus should link to their category page
      a.href = `projects.html?category=${encodeURIComponent(item.label)}`;
    } else {
      a.href = '#';
    }
    
    a.innerHTML = `<img src="assets/${item.icon}" class="nav-icon" alt="">${item.label.toUpperCase()}`;

    if (item.submenu) a.classList.add('menu-parent');
    li.appendChild(a);

    if (item.submenu) {
      const subUl = document.createElement('ul');
      subUl.className = 'submenu';
      item.submenu.forEach(sub => {
        if (sub.sub_menu !== undefined && !sub.sub_menu) return; // skip if explicitly false/0
        if (sub.label === 'more...') return; // old placeholders ignored
        const subLi = document.createElement('li');
        const subA = document.createElement('a');
        subA.href = sub.url;
        // Use menuDisplayName if present, else label, else projectTitle
        subA.textContent = sub.menuDisplayName || sub.label || sub.projectTitle || '';
        subLi.appendChild(subA);
        subUl.appendChild(subLi);
      });

      // Add automatic "more..." link if parent has `more: 1`
      if (item.more) {
        const moreLi = document.createElement('li');
        const moreA = document.createElement('a');
        moreA.href = `projects.html?category=${encodeURIComponent(item.label)}`;
        moreA.textContent = 'more...';
        moreLi.appendChild(moreA);
        subUl.appendChild(moreLi);
      }
      li.appendChild(subUl);
    }
    return li;
  }

  // Fallback data (same structure as JSON)
  window.__MENU_FALLBACK = [
    /* content copied from data/menu.json at build time */
  ];

  fetchMenuData().then(menuData => {
    // expose globally for page-content script
    window.__MENU_DATA = menuData;
    buildMenu(menuData);
  }).then(() => {
    // Load main site script
    const mainScript = document.createElement('script');
    mainScript.src = 'js/script.js';
    document.body.appendChild(mainScript);
    mainScript.onload = () => {
      // Load GitHub fork button after main script
      const githubForkScript = document.createElement('script');
      githubForkScript.src = 'js/github_fork.js';
      document.body.appendChild(githubForkScript);
      
      const evt = new Event('DOMContentLoaded', { bubbles: true, cancelable: true });
      document.dispatchEvent(evt);
    };
  });
})();
