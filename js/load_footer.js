// load_footer.js – loads shared footer HTML
(function() {
    function setCopyrightYear(root) {
        const year = new Date().getFullYear();
        root.querySelectorAll('.copyright').forEach((el) => {
            el.textContent = `© ${year} Knectar Design Corp.`;
        });
    }

    async function loadFooter() {
        // Prevent duplicate footers
        if (document.querySelector('.site-footer')) {
            return;
        }
        
        try {
            // Use root-absolute path for footer
            const footerPath = '/includes/footer.html';
            
            const response = await fetch(footerPath);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const footerHTML = await response.text();
            
            // Insert footer before closing body tag
            document.body.insertAdjacentHTML('beforeend', footerHTML);
            const footer = document.querySelector('.site-footer');
            if (footer) setCopyrightYear(footer);
        } catch (error) {
            console.warn('Footer loading failed:', error);
            // Prevent duplicate footers in fallback too
            if (document.querySelector('.site-footer')) {
                return;
            }
            // Fallback: create footer directly
            const footer = document.createElement('footer');
            footer.className = 'site-footer';
            footer.innerHTML = `
                <div class="footer-content">
                    <div class="footer-right">
                        <a href="privacy-policy.html" class="privacy-link">Privacy Policy</a>
                        <span class="copyright"></span>
                    </div>
                </div>
            `;
            setCopyrightYear(footer);
            document.body.appendChild(footer);
        }
    }

    // Load footer when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadFooter);
    } else {
        loadFooter();
    }
})();