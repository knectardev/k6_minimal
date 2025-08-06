// load_menu.js – Centralized script for consent, analytics, and menu loading.

(function() {
    // --- PART 1: IMMEDIATE EXECUTION ---
    // This part of the script runs immediately when the file is parsed by the browser.
    // It is responsible for setting up consent management and analytics.

    // 1. Silktide Cookie Consent Banner Injection
    // Dynamically injects the banner to ensure it's the first thing the user sees.
    (function() {
        const head = document.head;

        // Add the CSS file
        const cssLink = document.createElement('link');
        cssLink.rel = 'stylesheet';
        cssLink.id = 'silktide-consent-manager-css';
        cssLink.href = '/cookies-banner/silktide-consent-manager.css';
        head.appendChild(cssLink);

        // Add the main banner script
        const bannerScript = document.createElement('script');
        bannerScript.src = '/cookies-banner/silktide-consent-manager.js';
        head.appendChild(bannerScript);
        
        // Add the configuration script after the main banner script has loaded
        bannerScript.onload = function() {
            const configScript = document.createElement('script');
            configScript.innerHTML = `
                silktideCookieBannerManager.updateCookieBannerConfig({
                  background: { showBackground: true },
                  cookieIcon: { position: "bottomRight" },
                  cookieTypes: [
                    { id: "necessary", name: "Necessary", description: "<p>These cookies are necessary for the website to function properly and cannot be switched off.</p>", required: true },
                    {
                      id: "analytical", name: "Analytical", description: "<p>These cookies help us improve the site by tracking which pages are most popular.</p>", required: false,
                      onAccept: function() {
                        if (typeof gtag === 'function') { gtag('consent', 'update', { analytics_storage: 'granted' }); }
                        if (typeof dataLayer !== 'undefined') { dataLayer.push({ 'event': 'consent_accepted_analytical' }); }
                      },
                      onReject: function() {
                        if (typeof gtag === 'function') { gtag('consent', 'update', { analytics_storage: 'denied' }); }
                      }
                    },
                    {
                      id: "advertising", name: "Advertising", description: "<p>These cookies are used to deliver advertising that is more relevant to you.</p>", required: false,
                      onAccept: function() {
                        if (typeof gtag === 'function') { gtag('consent', 'update', { ad_storage: 'granted', ad_user_data: 'granted', ad_personalization: 'granted' }); }
                        if (typeof dataLayer !== 'undefined') { dataLayer.push({ 'event': 'consent_accepted_advertising' }); }
                      },
                      onReject: function() {
                        if (typeof gtag === 'function') { gtag('consent', 'update', { ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' }); }
                      }
                    }
                  ],
                  text: {
                    banner: {
                      description: "<p>We use cookies on our site to enhance your user experience, provide personalized content, and analyze our traffic. <a href=\\"privacy-policy.html\\" target=\\"_blank\\">Cookie Policy.</a></p>",
                      acceptAllButtonText: "Accept all",
                      rejectNonEssentialButtonText: "Reject non-essential",
                      preferencesButtonText: "Preferences"
                    },
                    preferences: {
                      title: "Customize your cookie preferences",
                      description: "<p>We respect your right to privacy. You can choose not to allow some types of cookies.</p>"
                    }
                  }
                });
            `;
            head.appendChild(configScript);
        };
    })();

    // 2. Google Tag Manager
    // This also needs to run immediately to set up the dataLayer.
    (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
    new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
    j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
    'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
    })(window,document,'script','dataLayer','GTM-MQ8X9HLL');
    // End Google Tag Manager


    // --- PART 2: DEFERRED EXECUTION ---
    // This part of the script waits until the main HTML document has been fully loaded
    // before attempting to build the menu, which requires the DOM to be ready.
    document.addEventListener('DOMContentLoaded', function() {
        const MENU_JSON = 'data/menu.json';
        const CACHE_KEY = 'menu_json_cache';
        const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

        async function fetchMenuData() {
            try {
                const cachedItem = localStorage.getItem(CACHE_KEY);
                if (cachedItem) {
                    const cached = JSON.parse(cachedItem);
                    if (Date.now() - cached.timestamp < CACHE_DURATION) {
                        return cached.data;
                    }
                }
                const response = await fetch(MENU_JSON, { cache: 'no-cache' });
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                const data = await response.json();
                localStorage.setItem(CACHE_KEY, JSON.stringify({ data: data, timestamp: Date.now() }));
                return data;
            } catch (error) {
                console.warn('Fetching fresh menu data failed, falling back to cache or default.', error);
                const cachedItem = localStorage.getItem(CACHE_KEY);
                if (cachedItem) return JSON.parse(cachedItem).data;
                return window.__MENU_FALLBACK || [];
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

            setActiveFromURL();
        }

        function buildItem(item) {
            const li = document.createElement('li');
            li.classList.add('menu-item-parent');
            const a = document.createElement('a');
            a.href = item.url || `projects.html?category=${encodeURIComponent(item.label)}`;
            a.innerHTML = `<img src="assets/${item.icon}" class="nav-icon" alt="">${item.label.toUpperCase()}`;
            if (item.submenu) a.classList.add('menu-parent');
            li.appendChild(a);

            if (item.submenu) {
                const subUl = document.createElement('ul');
                subUl.className = 'submenu';
                item.submenu.forEach(sub => {
                    if (sub.sub_menu === false) return;
                    const subLi = document.createElement('li');
                    const subA = document.createElement('a');
                    subA.href = sub.url;
                    subA.textContent = sub.menuDisplayName || sub.label || sub.projectTitle || '';
                    subLi.appendChild(subA);
                    subUl.appendChild(subLi);
                });
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

        function setActiveFromURL() {
            const pathPart = window.location.pathname.split('/').pop() + window.location.search;
            const links = Array.from(document.querySelectorAll('.main-nav a'));
            let bestMatch = null;

            links.forEach(link => {
                const linkPath = link.getAttribute('href').split('/').pop();
                if (linkPath === pathPart) {
                    bestMatch = link;
                }
            });

            if (!bestMatch) {
                const category = new URLSearchParams(window.location.search).get('category');
                if (category) {
                    bestMatch = links.find(a => a.textContent.trim().toUpperCase() === category.toUpperCase());
                }
            }

            if (bestMatch) {
                const parentLi = bestMatch.closest('li.menu-item-parent');
                if (parentLi) {
                    parentLi.classList.add('active');
                    const sub = parentLi.querySelector('.submenu');
                    if (sub) sub.style.display = 'block';

                    if (!bestMatch.classList.contains('menu-parent')) {
                        const childLi = bestMatch.closest('li');
                        if (childLi) childLi.classList.add('active-sub');
                    }
                }
            }
        }

        fetchMenuData().then(menuData => {
            window.__MENU_DATA = menuData;
            buildMenu(menuData);
        }).then(() => {
            const mainScript = document.createElement('script');
            mainScript.src = 'js/script.js';
            document.body.appendChild(mainScript);
            mainScript.onload = () => {
                const githubForkScript = document.createElement('script');
                githubForkScript.src = 'js/github_fork.js';
                document.body.appendChild(githubForkScript);
            };
        });
    });

})();
