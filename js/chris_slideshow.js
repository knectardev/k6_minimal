// Chris Amato photo slideshow
// Cycles through four images located in about/me while keeping the circle styling defined in CSS.

document.addEventListener('DOMContentLoaded', () => {
    // Get both slideshow image elements
    const img1 = document.getElementById('chris-photo-1');
    const img2 = document.getElementById('chris-photo-2');
    if (!img1 || !img2) {
        console.log('Chris slideshow: Image elements not found');
        return;
    }

    // Array of image paths (relative to about.html)
    const images = [
        'about/me/chris_amato_1a.png',
        'about/me/chris_amato_2a.png',
        'about/me/chris_amato_3a.png',
        'about/me/chris_amato_4a.png'
    ];

    let index = 0;
    let showingFirst = true;

    // Preload images to avoid flicker
    images.forEach(src => { 
        const img = new Image(); 
        img.src = src;
        img.onerror = () => console.log('Failed to load image:', src);
        img.onload = () => console.log('Successfully loaded image:', src);
    });

    // --- Fade configuration ---
    const fadeDuration = 300; // ms for fade
    img1.style.transition = `opacity ${fadeDuration}ms ease-in-out`;
    img2.style.transition = `opacity ${fadeDuration}ms ease-in-out`;

    // Set initial images (img1 already has src from HTML)
    img2.src = images[1];
    img1.style.opacity = 1;
    img2.style.opacity = 0;

    // Cross-fade function
    const switchImage = () => {
        const nextIndex = (index + 1) % images.length;
        console.log('Switching to image:', images[nextIndex], 'index:', nextIndex);
        if (showingFirst) {
            img2.src = images[nextIndex];
            img2.style.zIndex = 2;
            img1.style.zIndex = 1;
            img2.style.opacity = 1;
            img1.style.opacity = 0;
        } else {
            img1.src = images[nextIndex];
            img1.style.zIndex = 2;
            img2.style.zIndex = 1;
            img1.style.opacity = 1;
            img2.style.opacity = 0;
        }
        index = nextIndex;
        showingFirst = !showingFirst;
    };

    setInterval(switchImage, 2000);
}); 