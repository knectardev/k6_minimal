// Image Loading Enhancement Script
// Provides progressive loading, skeleton states, and page loader

document.addEventListener('DOMContentLoaded', function() {
    // Page loader functionality
    function initPageLoader() {
        // Create page loader if it doesn't exist
        if (!document.querySelector('.page-loader')) {
            const loader = document.createElement('div');
            loader.className = 'page-loader';
            loader.innerHTML = `
                <div class="loader-content">
                    <div class="loader-spinner"></div>
                    <div>Loading...</div>
                </div>
            `;
            document.body.appendChild(loader);
        }

        // Hide loader when DOM and critical resources are ready
        function hideLoader() {
            const loader = document.querySelector('.page-loader');
            if (loader) {
                loader.classList.add('hidden');
                setTimeout(() => loader.remove(), 500);
            }
        }

        // Detect if we are on the home page (index.html or root).
        const isHome = /(?:^|\/)(index\.html)?$/.test(window.location.pathname);

        // Hide loader after DOM is ready and menu is loaded (much faster than waiting for all images)
        let checkCount = 0;
        function checkAndHideLoader() {
            checkCount++;
            
            // Wait for menu data to be available (critical for page functionality)
            if (window.__MENU_DATA && (!isHome || window.__HOME_MEDIA_READY)) {
                setTimeout(hideLoader, 200); // Small delay for smooth transition once everything important is ready
                return; // Exit the function to prevent further checks
            } else if (checkCount > 60) { // Failsafe: hide after 3 seconds max (60 * 50ms)
                console.warn('Menu data not loaded, hiding loader anyway');
                hideLoader();
                return; // Exit the function to prevent further checks
            } else {
                setTimeout(checkAndHideLoader, 50); // Check again soon
            }
        }

        // Start checking once DOM is ready (don't wait for images)
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', checkAndHideLoader);
        } else {
            checkAndHideLoader();
        }
    }

    // Enhanced lazy loading for images
    function initLazyLoading() {
        // Use Intersection Observer for better performance
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        
                        // Add loading class
                        img.classList.add('loading');
                        
                        // Create new image to preload
                        const newImg = new Image();
                        newImg.onload = () => {
                            img.src = newImg.src;
                            img.classList.remove('loading');
                            img.classList.add('loaded');
                            
                            // Hide skeleton
                            const skeleton = img.previousElementSibling;
                            if (skeleton && skeleton.classList.contains('image-skeleton')) {
                                skeleton.style.display = 'none';
                            }
                        };
                        
                        newImg.onerror = () => {
                            img.classList.remove('loading');
                            const skeleton = img.previousElementSibling;
                            if (skeleton && skeleton.classList.contains('image-skeleton')) {
                                skeleton.style.display = 'none';
                            }
                        };
                        
                        newImg.src = img.dataset.src || img.src;
                        observer.unobserve(img);
                    }
                });
            }, {
                rootMargin: '50px' // Start loading 50px before image enters viewport
            });

            // Observe all lazy images
            document.querySelectorAll('img[loading="lazy"]').forEach(img => {
                imageObserver.observe(img);
            });
        }
    }

    // Progressive image loading for project gallery
    function enhanceProjectGallery() {
        const projectImages = document.querySelectorAll('.project-gallery-item img, .people-gallery-item img');
        
        projectImages.forEach(img => {
            if (!img.complete) {
                // Add skeleton if image isn't loaded
                const skeleton = document.createElement('div');
                skeleton.className = img.closest('.people-gallery-item') ? 'image-skeleton circle' : 'image-skeleton';
                skeleton.style.position = 'absolute';
                skeleton.style.top = '0';
                skeleton.style.left = '0';
                skeleton.style.width = '100%';
                skeleton.style.height = '100%';
                skeleton.style.zIndex = '1';
                
                img.parentElement.style.position = 'relative';
                img.parentElement.insertBefore(skeleton, img);
                
                img.addEventListener('load', () => {
                    skeleton.style.display = 'none';
                    img.style.opacity = '1';
                });
                
                img.addEventListener('error', () => {
                    skeleton.style.display = 'none';
                });
                
                img.style.opacity = '0';
                img.style.transition = 'opacity 0.3s ease-in-out';
            }
        });
    }

    // Initialize all loading enhancements
    initPageLoader();
    initLazyLoading();
    
    // Enhance existing galleries with a small delay to ensure they're rendered
    setTimeout(enhanceProjectGallery, 100);
    
    // Re-enhance when new content is added (for dynamic galleries)
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                const hasImages = Array.from(mutation.addedNodes).some(node => 
                    node.nodeType === 1 && (node.tagName === 'IMG' || node.querySelector('img'))
                );
                if (hasImages) {
                    setTimeout(enhanceProjectGallery, 50);
                }
            }
        });
    });
    
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
});

// Preload only essential images (logo only)
function preloadCriticalImages() {
    const criticalImages = [
        '/assets/logo.svg'
    ];
    
    criticalImages.forEach(src => {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'image';
        link.href = src;
        document.head.appendChild(link);
    });
}

// Run preload immediately
preloadCriticalImages(); 