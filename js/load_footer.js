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
                    <span class="footer-links">
                        <a href="/privacy-policy.html" class="privacy-link">Privacy Policy</a>
                        <span class="footer-divider" aria-hidden="true">|</span>
                        <a href="https://www.linkedin.com/in/chris-amato/" class="privacy-link" target="_blank" rel="noopener noreferrer">LinkedIn</a>
                    </span>
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
