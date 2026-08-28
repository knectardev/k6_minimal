// load_footer.js – injects shared footer synchronously (no fetch race)
(function () {
    function copyrightText() {
        return `© ${new Date().getFullYear()} Knectar Design Corp.`;
    }

    function populateCopyright(root) {
        root.querySelectorAll('.copyright').forEach((el) => {
            el.textContent = copyrightText();
        });
    }

    function buildFooter() {
        const footer = document.createElement('footer');
        footer.className = 'site-footer';
        footer.innerHTML = `
            <div class="footer-content">
                <div class="footer-right">
                    <a href="/privacy-policy.html" class="privacy-link">Privacy Policy</a>
                    <span class="copyright">${copyrightText()}</span>
                </div>
            </div>
        `;
        return footer;
    }

    function ensureFooter() {
        const existing = document.querySelector('.site-footer');
        if (existing) {
            populateCopyright(existing);
            return;
        }

        if (!document.body) return;
        document.body.appendChild(buildFooter());
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', ensureFooter);
    } else {
        ensureFooter();
    }
})();
