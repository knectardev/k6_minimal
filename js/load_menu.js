// load_menu.js – builds sidebar from JSON data then loads main site script

(function() {
  const MENU_JSON = 'data/menu.json';

  async function fetchMenuData() {
    try {
      const res = await fetch(MENU_JSON);
      if (!res.ok) throw new Error('Menu JSON fetch failed');
      return await res.json();
    } catch (err) {
      console.warn('Menu JSON unavailable, using inline data');
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

    // Try full match including query string first
    let link = document.querySelector(`.main-nav .submenu a[href='${full}']`);

    // Fallback: match by file name only
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
    if (item.url) a.href = item.url; else a.href = '#';
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
        subA.textContent = sub.label;
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
    // dynamically load auth script first, then main site script
    const authScript = document.createElement('script');
    authScript.src = 'js/auth.js';
    document.body.appendChild(authScript);
    
    authScript.onload = () => {
      // Load main site script after auth script
      const mainScript = document.createElement('script');
      mainScript.src = 'js/script.js';
      document.body.appendChild(mainScript);
      mainScript.onload = () => {
        const evt = new Event('DOMContentLoaded', { bubbles: true, cancelable: true });
        document.dispatchEvent(evt);
      };
    };
  });
})(); 