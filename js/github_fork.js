// Injects the lower-left floating actions: a "Contact Us" CTA (red pill) and an
// icon-only "Fork on GitHub" link. Loaded on every page by js/load_menu.js.
(function() {
    const repoUrl = 'https://github.com/knectardev/k6_minimal';
    const contactUrl = '/contact.html';

    // Do not show a "Contact Us" CTA on the contact pages themselves
    const path = window.location.pathname.toLowerCase();
    const onContactPage = /\/contact(_confirmation)?\.html$/.test(path) || /\/contact\/?$/.test(path);

    const wrap = document.createElement('div');
    wrap.className = 'floating-actions';

    if (!onContactPage) {
        const cta = document.createElement('a');
        cta.href = contactUrl;
        cta.className = 'github-fork-btn cta-contact';
        cta.textContent = 'Contact Us';
        wrap.appendChild(cta);
    }

    const forkLink = document.createElement('a');
    forkLink.href = repoUrl;
    forkLink.target = '_blank';
    forkLink.rel = 'noopener noreferrer';
    forkLink.className = 'github-fork-icon';
    forkLink.setAttribute('aria-label', 'Fork on GitHub');
    forkLink.title = 'Fork on GitHub';
    // Git fork glyph (Octicons "repo-forked", MIT)
    forkLink.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true" focusable="false"><path d="M5 5.372v.878c0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75v-.878a2.25 2.25 0 1 1 1.5 0v.878a2.25 2.25 0 0 1-2.25 2.25h-1.5v2.128a2.251 2.251 0 1 1-1.5 0V8.5h-1.5A2.25 2.25 0 0 1 3.5 6.25v-.878a2.25 2.25 0 1 1 1.5 0ZM5 3.25a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Zm6.75.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm-3 8.75a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Z"></path></svg>
    `;
    wrap.appendChild(forkLink);

    document.body.appendChild(wrap);
})();
