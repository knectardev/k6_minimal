// Project Gallery Component
// Randomly selects 16 images from project_images folder and displays them in a grid

document.addEventListener('DOMContentLoaded', function() {
    // Mapping of image/video filenames to project slugs
    const mediaToProjectMap = {
        'ab_inbev_1.png': 'ab_inbev',
        'ab_inbev_2.png': 'ab_inbev',
        'aier-american-institute-for-economic-research_1.png': 'aier-american-institute-for-economic-research',
        'aier-american-institute-for-economic-research_2.png': 'aier-american-institute-for-economic-research',
        'carnegie-mellon-university_1.png': 'carnegie-mellon-university',
        'carnegie-mellon-university_2.png': 'carnegie-mellon-university',
        'carnegie-mellon-university_3.png': 'carnegie-mellon-university',
        'carv-resource-management_1.png': 'carv-resource-management',
        'carv-resource-management_2.png': 'carv-resource-management',
        'carv-resource-management_3.png': 'carv-resource-management',
        'carv-resource-management_4.png': 'carv-resource-management',
        'chemex-coffee-maker_1.png': 'chemex-coffee-maker',
        'chemex-coffee-maker_2.png': 'chemex-coffee-maker',
        'chemex-coffee-maker_3.png': 'chemex-coffee-maker',
        'chemex-coffee-maker_4.png': 'chemex-coffee-maker',
        'clarkson-university_1.png': 'clarkson-university',
        'clarkson-university_2.png': 'clarkson-university',
        'clarkson-university_3.png': 'clarkson-university',
        'dog-door_1.png': 'dog-door',
        'dog-door_2.png': 'dog-door',
        'dog-door_3.png': 'dog-door',
        'fox-chase-cancer-research_1.png': 'fox-chase-cancer-research',
        'fox-chase-cancer-research_2.png': 'fox-chase-cancer-research',
        'fox-chase-cancer-research_3.png': 'fox-chase-cancer-research',
        'glassica-app_1.png': 'glassica-app',
        'glassica-app_2.png': 'glassica-app',
        'glassica-app_3.png': 'glassica-app',
        'guardair_1.png': 'guardair',
        'guardair_2.png': 'guardair',
        'guardair_3.png': 'guardair',
        'jack-daniels_1.png': 'jack-daniels',
        'jack-daniels_2.png': 'jack-daniels',
        'jack-daniels_3.png': 'jack-daniels',
        'kettering-university_1.png': 'kettering-university',
        'kettering-university_2.png': 'kettering-university',
        'kettering-university_3.png': 'kettering-university',
        'la-jolla-country-day-school_1.png': 'la-jolla-country-day-school',
        'la-jolla-country-day-school_2.png': 'la-jolla-country-day-school',
        'la-jolla-country-day-school_3.png': 'la-jolla-country-day-school',
        'lanshin_1.png': 'lanshin',
        'lanshin_2.png': 'lanshin',
        'lanshin_3.png': 'lanshin',
        'lewis-katz-school-of-medicine-temple-university_1.png': 'lewis-katz-school-of-medicine-temple-university',
        'lewis-katz-school-of-medicine-temple-university_2.png': 'lewis-katz-school-of-medicine-temple-university',
        'lewis-katz-school-of-medicine-temple-university_3.png': 'lewis-katz-school-of-medicine-temple-university',
        'lim-college_1.png': 'lim-college',
        'lim-college_2.png': 'lim-college',
        'lim-college_3.png': 'lim-college',
        'madison-country-day-school_1.png': 'madison-country-day-school',
        'madison-country-day-school_2.png': 'madison-country-day-school',
        'madison-country-day-school_3.png': 'madison-country-day-school',
        'massachusetts-municipal-wholesale-electric-company_1.png': 'massachusetts-municipal-wholesale-electric-company',
        'massachusetts-municipal-wholesale-electric-company_2.png': 'massachusetts-municipal-wholesale-electric-company',
        'massachusetts-municipal-wholesale-electric-company_3.png': 'massachusetts-municipal-wholesale-electric-company',
        'mit_1.png': 'mit',
        'mit_2.png': 'mit',
        'mit_3.png': 'mit',
        'monadnock-media_1.png': 'monadnock-media',
        'monadnock-media_2.png': 'monadnock-media',
        'monadnock-media_3.png': 'monadnock-media',
        'music-app-experiments_1.png': 'music-app-experiments',
        'music-app-experiments_2.png': 'music-app-experiments',
        'music-app-experiments_3.png': 'music-app-experiments',
        'music-app-experiments_4.png': 'music-app-experiments',
        'northeastern-illinois-university_1.png': 'northeastern-illinois-university',
        'northeastern-illinois-university_2.png': 'northeastern-illinois-university',
        'northeastern-illinois-university_3.png': 'northeastern-illinois-university',
        'p5-projects_1.png': 'p5-projects',
        'p5-projects_2.png': 'p5-projects',
        'p5-projects_3.png': 'p5-projects',
        'paragraphs-stats-module_1.png': 'paragraphs-stats-module',
        'pen-plotting-works_1.mp4': 'pen-plotting-works',
        'pen-plotting-works_2.png': 'pen-plotting-works',
        'pen-plotting-works_3.png': 'pen-plotting-works',
        'pioneer-valley-books_1.png': 'pioneer-valley-books',
        'pioneer-valley-books_2.png': 'pioneer-valley-books',
        'pioneer-valley-books_3.png': 'pioneer-valley-books',
        'robert-rauschenberg-foundation_1.png': 'robert-rauschenberg-foundation',
        'robert-rauschenberg-foundation_2.png': 'robert-rauschenberg-foundation',
        'robert-rauschenberg-foundation_3.png': 'robert-rauschenberg-foundation',
        'sculpture-works_1.png': 'sculpture-works',
        'sculpture-works_2.mp4': 'sculpture-works',
        'sculpture-works_3.png': 'sculpture-works',
        'sculpture-works_4.png': 'sculpture-works',
        'smartlabs_1.png': 'smartlabs',
        'smartlabs_2.png': 'smartlabs',
        'smartlabs_3.png': 'smartlabs',
        'smma-architecture_1.png': 'smma-architecture',
        'smma-architecture_2.png': 'smma-architecture',
        'smma-architecture_3.png': 'smma-architecture',
        'sparx-hockey_1.png': 'sparx-hockey',
        'sparx-hockey_2.png': 'sparx-hockey',
        'sparx-hockey_3.png': 'sparx-hockey',
        'strudelizer_1.png': 'strudelizer',
        'studio-arts-consortium-international-saci-florence_1.png': 'studio-arts-consortium-international-saci-florence',
        'studio-arts-consortium-international-saci-florence_2.png': 'studio-arts-consortium-international-saci-florence',
        'studio-arts-consortium-international-saci-florence_3.png': 'studio-arts-consortium-international-saci-florence',
        'the-isabella-stewart-gardner-museum_1.png': 'the-isabella-stewart-gardner-museum',
        'the-isabella-stewart-gardner-museum_2.png': 'the-isabella-stewart-gardner-museum',
        'the-isabella-stewart-gardner-museum_3.png': 'the-isabella-stewart-gardner-museum',
        'the-isabella-stewart-gardner-museum_4.png': 'the-isabella-stewart-gardner-museum',
        'thing-y_1.png': 'thing-y',
        'thing-y_2.mp4': 'thing-y',
        'thing-y_3.png': 'thing-y',
        'thing-y_4.png': 'thing-y',
        'trillium-brewing_1.png': 'trillium-brewing',
        'trillium-brewing_2.png': 'trillium-brewing',
        'trillium-brewing_3.png': 'trillium-brewing',
        'university-of-massachusetts-amherst_1.png': 'university-of-massachusetts-amherst',
        'university-of-massachusetts-amherst_2.png': 'university-of-massachusetts-amherst',
        'university-of-massachusetts-amherst_3.png': 'university-of-massachusetts-amherst',
        'vases_1.png': 'vases',
        'vases_2.png': 'vases',
        'vases_3.png': 'vases',
        'vases_4.png': 'vases',
        'way-finders_1.png': 'way-finders',
        'way-finders_2.png': 'way-finders',
        'way-finders_3.png': 'way-finders',
        'way-finders_4.png': 'way-finders',
        'yale-center-for-british-art_1.png': 'yale-center-for-british-art',
        'yale-center-for-british-art_2.png': 'yale-center-for-british-art',
        'yale-center-for-british-art_3.png': 'yale-center-for-british-art'
    };

    // List of available project media (excluding screenshots and non-media files)
    const projectMedia = Object.keys(mediaToProjectMap);

    // Function to check if a file is a video
    function isVideoFile(filename) {
        return filename.toLowerCase().endsWith('.mp4');
    }

    // Function to create media element (video or image)
    function createMediaElement(mediaFile, alt) {
        if (isVideoFile(mediaFile)) {
            return `<video src="project_images/${mediaFile}" 
                           alt="${alt}" 
                           autoplay 
                           muted 
                           loop 
                           playsinline 
                           preload="metadata">
                        Your browser does not support the video tag.
                    </video>`;
        } else {
            return `<img src="project_images/${mediaFile}" alt="${alt}" loading="lazy">`;
        }
    }

    // Function to shuffle array and get random selection
    function shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    // Get 16 random media items
    const selectedMedia = shuffleArray(projectMedia).slice(0, 16);

    // Create the project gallery section
    const projectGallerySection = document.createElement('section');
    projectGallerySection.className = 'project-gallery-section';
    projectGallerySection.innerHTML = `
        <div class="project-gallery-header">
            <h2 class="project-gallery-title">Project Gallery</h2>
            <button class="refresh-gallery-btn" aria-label="Refresh gallery with new random images">
                <img src="assets/refresh.svg" alt="Refresh" class="refresh-icon">
            </button>
        </div>
        <div class="project-gallery-grid">
            ${selectedMedia.map(mediaFile => {
                const projectSlug = mediaToProjectMap[mediaFile];
                const projectUrl = projectSlug ? `project.html?item=${projectSlug}` : '#';
                const projectTitle = projectSlug ? projectSlug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Project';
                const altText = `Project ${mediaFile.replace(/\.(png|mp4)$/, '')}`;
                return `
                    <div class="project-gallery-wrapper">
                        <a href="${projectUrl}" class="project-gallery-item">
                            ${createMediaElement(mediaFile, altText)}
                        </a>
                        <span class="project-tooltip">${projectTitle}</span>
                    </div>
                `;
            }).join('')}
        </div>
    `;

    // Remove any existing project gallery sections to prevent duplication
    const existingGalleries = document.querySelectorAll('.project-gallery-section');
    existingGalleries.forEach(gallery => gallery.remove());

    // Insert the gallery after the intro-text section
    const introText = document.querySelector('.intro-text');
    if (introText) {
        introText.parentNode.insertBefore(projectGallerySection, introText.nextSibling);
    }

    // Add click functionality to refresh button
    const refreshBtn = projectGallerySection.querySelector('.refresh-gallery-btn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', function() {
            const galleryGrid = projectGallerySection.querySelector('.project-gallery-grid');
            // Start fade out
            galleryGrid.classList.add('fade-out');
            galleryGrid.classList.remove('fade-in');
            setTimeout(() => {
                // Get new random selection
                const newSelectedMedia = shuffleArray(projectMedia).slice(0, 16);
                // Update the gallery grid
                galleryGrid.innerHTML = newSelectedMedia.map(mediaFile => {
                    const projectSlug = mediaToProjectMap[mediaFile];
                    const projectUrl = projectSlug ? `project.html?item=${projectSlug}` : '#';
                    const projectTitle = projectSlug ? projectSlug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Project';
                    const altText = `Project ${mediaFile.replace(/\.(png|mp4)$/, '')}`;
                    return `
                        <div class="project-gallery-wrapper fade-in-item">
                            <a href="${projectUrl}" class="project-gallery-item">
                                ${createMediaElement(mediaFile, altText)}
                            </a>
                            <span class="project-tooltip">${projectTitle}</span>
                        </div>
                    `;
                }).join('');
                // Staggered fade-in
                const items = galleryGrid.querySelectorAll('.fade-in-item');
                items.forEach((item, idx) => {
                    setTimeout(() => {
                        item.classList.add('visible');
                    }, 40 * idx);
                });
                // Start fade in
                galleryGrid.classList.remove('fade-out');
                galleryGrid.classList.add('fade-in');
            }, 300); // match the CSS transition duration
        });
    }
}); 