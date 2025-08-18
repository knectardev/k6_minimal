/**
 * Enhanced Lazy Loading with Intersection Observer
 * Provides better performance than basic loading="lazy"
 */

document.addEventListener('DOMContentLoaded', function() {
    // Check if Intersection Observer is supported
    if (!('IntersectionObserver' in window)) {
        console.log('Intersection Observer not supported, falling back to basic lazy loading');
        return;
    }

    // Configuration for the observer
    const lazyImageOptions = {
        root: null,
        rootMargin: '50px 0px', // Start loading 50px before image enters viewport
        threshold: 0.01
    };

    // Intersection Observer callback
    function handleIntersection(entries, observer) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const element = entry.target;
                
                if (element.tagName === 'IMG') {
                    loadImage(element);
                } else if (element.tagName === 'VIDEO') {
                    loadVideo(element);
                } else if (element.tagName === 'SOURCE') {
                    loadSource(element);
                }
                
                observer.unobserve(element);
            }
        });
    }

    // Load image function
    function loadImage(img) {
        if (img.dataset.src) {
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
        }
        
        if (img.dataset.srcset) {
            img.srcset = img.dataset.srcset;
            img.removeAttribute('data-srcset');
        }
        
        img.classList.add('lazy-loaded');
        
        // Add fade-in effect
        img.addEventListener('load', () => {
            img.style.opacity = '1';
        });
    }

    // Load video function
    function loadVideo(video) {
        if (video.dataset.src) {
            video.src = video.dataset.src;
            video.removeAttribute('data-src');
        }
        
        video.classList.add('lazy-loaded');
        
        // Preload metadata only
        video.preload = 'metadata';
    }

    // Load source function (for picture elements)
    function loadSource(source) {
        if (source.dataset.srcset) {
            source.srcset = source.dataset.srcset;
            source.removeAttribute('data-srcset');
        }
    }

    // Create the observer
    const lazyImageObserver = new IntersectionObserver(handleIntersection, lazyImageOptions);

    // Function to observe new elements
    function observeLazyElements() {
        // Observe images with data-src
        document.querySelectorAll('img[data-src]:not(.lazy-loaded)').forEach(img => {
            img.style.opacity = '0';
            img.style.transition = 'opacity 0.3s ease-in-out';
            lazyImageObserver.observe(img);
        });

        // Observe videos with data-src
        document.querySelectorAll('video[data-src]:not(.lazy-loaded)').forEach(video => {
            lazyImageObserver.observe(video);
        });

        // Observe source elements with data-srcset
        document.querySelectorAll('source[data-srcset]:not(.lazy-loaded)').forEach(source => {
            lazyImageObserver.observe(source);
        });
    }

    // Initial observation
    observeLazyElements();

    // Re-observe when new content is added (for dynamic galleries)
    const mutationObserver = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
            if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                // Small delay to ensure DOM is stable
                setTimeout(observeLazyElements, 100);
            }
        });
    });

    // Start observing DOM changes
    mutationObserver.observe(document.body, {
        childList: true,
        subtree: true
    });

    // Expose function for manual triggering
    window.observeLazyElements = observeLazyElements;
});

/**
 * CSS for lazy loading effects (to be added to main CSS)
 */
const lazyLoadingCSS = `
/* Lazy loading placeholder effect */
img[data-src] {
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    animation: loading 1.5s infinite;
}

@keyframes loading {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
}

/* Fade-in effect for loaded images */
.lazy-loaded {
    opacity: 1 !important;
}

/* Smooth transitions */
img, video {
    transition: opacity 0.3s ease-in-out;
}
`;

// Inject CSS if not already present
if (!document.getElementById('lazy-loading-styles')) {
    const style = document.createElement('style');
    style.id = 'lazy-loading-styles';
    style.textContent = lazyLoadingCSS;
    document.head.appendChild(style);
}

