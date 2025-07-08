// Authentication and Edit Mode Management
class AuthManager {
    constructor() {
        this.isLoggedIn = false;
        this.sessionKey = 'knectar_edit_session';
        this.init();
    }

    init() {
        // Check if user is already logged in
        this.checkSession();
        
        // If on edit.html, handle login form
        if (window.location.pathname.includes('edit.html')) {
            this.setupLoginForm();
        } else {
            // On other pages, show edit banner if logged in
            this.showEditBanner();
        }
    }

    // Simple hash function for password verification
    async hashPassword(password) {
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    // Verify credentials (you'll need to set your own username and password hash)
    async verifyCredentials(username, password) {
        // IMPORTANT: Replace these with your actual credentials
        // Generate your password hash by running this in browser console:
        // crypto.subtle.digest('SHA-256', new TextEncoder().encode('your_password')).then(hash => console.log(Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('')))
        
        const expectedUsername = 'admin'; // Change this to your desired username
        const expectedPasswordHash = '2d52c696cf01ae1d3da9bb2dd31e0b6915481bd4149aa8f63e1e59dca22cfab5'; // This is the hash for 'password' - CHANGE THIS!
        
        const passwordHash = await this.hashPassword(password);
        
        return username === expectedUsername && passwordHash === expectedPasswordHash;
    }

    setupLoginForm() {
        const form = document.getElementById('loginForm');
        const errorMessage = document.getElementById('errorMessage');
        const successMessage = document.getElementById('successMessage');

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;

            // Hide previous messages
            errorMessage.style.display = 'none';
            successMessage.style.display = 'none';

            try {
                const isValid = await this.verifyCredentials(username, password);
                
                if (isValid) {
                    this.login();
                    successMessage.textContent = 'Login successful! Redirecting...';
                    successMessage.style.display = 'block';
                    
                    // Redirect to home page after successful login
                    setTimeout(() => {
                        window.location.href = 'index.html';
                    }, 1000);
                } else {
                    errorMessage.textContent = 'Invalid username or password';
                    errorMessage.style.display = 'block';
                }
            } catch (error) {
                errorMessage.textContent = 'An error occurred. Please try again.';
                errorMessage.style.display = 'block';
            }
        });
    }

    login() {
        this.isLoggedIn = true;
        const sessionData = {
            loggedIn: true,
            timestamp: Date.now(),
            expiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
        };
        localStorage.setItem(this.sessionKey, JSON.stringify(sessionData));
    }

    logout() {
        this.isLoggedIn = false;
        localStorage.removeItem(this.sessionKey);
        this.hideEditBanner();
        
        // Redirect to home page if on edit page
        if (window.location.pathname.includes('edit.html')) {
            window.location.href = 'index.html';
        }
    }

    checkSession() {
        const sessionData = localStorage.getItem(this.sessionKey);
        
        if (sessionData) {
            try {
                const session = JSON.parse(sessionData);
                const now = Date.now();
                
                if (session.loggedIn && session.expiresAt > now) {
                    this.isLoggedIn = true;
                    return true;
                } else {
                    // Session expired
                    this.logout();
                    return false;
                }
            } catch (error) {
                // Invalid session data
                this.logout();
                return false;
            }
        }
        
        return false;
    }

    showEditBanner() {
        if (!this.isLoggedIn) return;

        // Remove existing banner if present
        this.hideEditBanner();

        // Create edit banner
        const banner = document.createElement('div');
        banner.id = 'edit-banner';
        banner.innerHTML = `
            <div class="edit-banner-content">
                <span>Editing Mode</span>
                <button id="logoutBtn" class="logout-btn">Logout</button>
            </div>
        `;

        // Add banner styles
        const style = document.createElement('style');
        style.textContent = `
            #edit-banner {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                background-color: #FF0000;
                color: white;
                z-index: 10000;
                font-family: 'Karla', sans-serif;
                font-size: 14px;
                font-weight: 500;
            }
            
            .edit-banner-content {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 8px 20px;
                max-width: 1200px;
                margin: 0 auto;
            }
            
            .logout-btn {
                background: none;
                border: 1px solid white;
                color: white;
                padding: 4px 12px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 12px;
                transition: all 0.3s;
            }
            
            .logout-btn:hover {
                background: white;
                color: #FF0000;
            }
        `;

        document.head.appendChild(style);
        document.body.insertBefore(banner, document.body.firstChild);

        // Adjust layout for banner
        const mainContent = document.querySelector('.main-content');
        const sidebar = document.querySelector('.sidebar');
        
        if (mainContent) {
            mainContent.style.marginTop = '40px';
        }
        
        if (sidebar) {
            sidebar.style.top = '40px';
            sidebar.style.height = 'calc(100vh - 40px)';
        }

        // Add logout functionality
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                this.logout();
            });
        }
    }

    hideEditBanner() {
        const banner = document.getElementById('edit-banner');
        if (banner) {
            banner.remove();
        }
        
        // Restore original layout
        const mainContent = document.querySelector('.main-content');
        const sidebar = document.querySelector('.sidebar');
        
        if (mainContent) {
            mainContent.style.marginTop = '';
        }
        
        if (sidebar) {
            sidebar.style.top = '';
            sidebar.style.height = '';
        }
    }
}

// Initialize authentication when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.authManager = new AuthManager();
    });
} else {
    // DOM is already loaded
    window.authManager = new AuthManager();
}

// Export for potential use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AuthManager;
} 