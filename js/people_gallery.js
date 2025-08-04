// People Gallery Component
// Automatically loads all images from about folder and displays them in a circular grid

document.addEventListener('DOMContentLoaded', function() {
    // Only run on about page
    if (!window.location.pathname.includes('about.html')) {
        return;
    }

    // Mapping of image filenames to LinkedIn profiles
    const peopleToLinkedInMap = {
        'nate_jasper.jpg': 'https://www.linkedin.com/in/nate-jasper-62328213/',
        'Kristina_Chester.jpg': 'https://www.linkedin.com/in/kristinachester/',
        'Nathan_Kirschbaum.jpg': 'https://www.linkedin.com/in/nathankirschbaum/',
        'Josh_Beauregard .jpg': 'https://www.linkedin.com/in/joshuabeauregard/',
        'Liz_LaBrocca.jpg': 'https://www.linkedin.com/in/liz-labrocca/',
        'dara_virks.jpg': 'https://www.linkedin.com/in/dara-virks/',
        'Dan_Surdyka.jpg': 'https://www.linkedin.com/in/dan-surdyka-3908a268/',
        'Jeff_Gnatek.jpg': 'https://www.linkedin.com/in/gneek/',
        'Jacob_Geryk.jpg': 'https://www.linkedin.com/in/jacob-geryk-a330aab6/',
        'michael_zaremba.jpg': 'https://www.linkedin.com/in/michael-zaremba-pmi-acp-7b4b8814/',
        'Karina_Laurenitis.jpg': 'https://www.linkedin.com/in/karina-laurenitis-3b225b56/',
        'pavlo_tyshchenko.jpg': 'https://www.linkedin.com/in/paveltyshchenko/',
        'kelli_allard.jpg': 'https://www.linkedin.com/in/kelli-allard-licsw-064410a/',
        'derek_allard.jpg': 'https://www.linkedin.com/in/derekallard/',
        'Janet_Bennett.jpg': 'https://www.linkedin.com/in/janetbennett1/',
        'Aaron_Taylor-Waldman.jpg': 'https://www.linkedin.com/in/aarontw/',
        'Karl_Nislow.jpg': 'https://www.linkedin.com/in/karlnislow/',
        'allie_thorpe.jpg': 'https://www.linkedin.com/in/alliethorpe/',
        'Jeff_Hobbs.jpg': 'https://www.linkedin.com/in/jeffehobbs01/',
        'Stephan_Smith.jpg': 'https://www.linkedin.com/in/stephansmithbc93/',
        'Don_Magri.jpg': 'https://www.linkedin.com/in/donmagri/',
        'Bill_Bither.jpg': 'https://www.linkedin.com/in/billbither/',
        'Jesse_Mayhew.jpg': 'https://www.linkedin.com/in/jessemayhew/',
        'Adam_Mack.jpg': 'https://www.linkedin.com/in/adam-mack-908827a/',
        'Alfred_Nutile.png': 'https://www.linkedin.com/in/alfrednutile/',
        'Amber_l_Krasinski.jpg': 'https://www.linkedin.com/in/amberkrasinski/',
        'Kelly_Albrecht.jpg': 'https://www.linkedin.com/in/kellyalbrecht/',
        'Nat_Trienens.jpg': 'https://www.linkedin.com/in/ntrienens/',
        'Will_Trienens.jpg': 'https://www.linkedin.com/in/wtrienens/',
        'Jason_Mark.jpg': 'https://www.linkedin.com/in/jasonondesign/',
        'matthew_wimmer.jpg': 'https://www.linkedin.com/in/mrwimmer/',
        'Justin_Wellman.png': 'https://www.linkedin.com/in/justinwellman/',
        'Kristen_Beam.jpg': 'https://www.linkedin.com/in/kristen-beam/',
        'Lauren_Vajda.jpg': 'https://www.linkedin.com/in/laurenvajda/',
        'Noah_Smith.jpg': 'https://www.linkedin.com/in/noahwsmith/',
        'Katharine_Reisbig .jpg': 'https://www.linkedin.com/in/katsby/',
        'Nick_D_Amico.jpg': 'https://www.linkedin.com/in/gneek/',
        'Zeke_Tierkel.jpg': 'https://www.linkedin.com/in/zeke-tierkel/',
        'shikha_kumar2.png': 'https://www.linkedin.com/in/shikha-kumar-0325042a/',
        'chintan_kotadia.jpg': 'https://www.linkedin.com/in/chintan-kotadia/',
        'Michael_Kusek.jpg': 'https://www.linkedin.com/in/michaelkusek/',
        'muhammad_akhtar.jpg': 'https://www.linkedin.com/in/akhtardaha/'
    };

    // Get all people images (excluding about.png which is not a person)
    const allPeopleImages = Object.keys(peopleToLinkedInMap);

    // Function to shuffle array randomly
    function shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    // Function to get display name from filename
    function getDisplayName(filename) {
        // Remove file extension and replace underscores/hyphens with spaces
        let name = filename.replace(/\.(jpg|jpeg|png)$/i, '');
        name = name.replace(/[_-]/g, ' ');
        
        // Handle special cases
        if (name === 'shikha kumar2') return 'Shikha Kumar';
        if (name === 'Josh Beauregard ') return 'Josh Beauregard';
        if (name === 'Katharine Reisbig ') return 'Katharine Reisbig';
        
        // Convert to proper case
        return name.split(' ').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        ).join(' ');
    }

    // Create the people gallery
    function createPeopleGallery() {
        // Find the people gallery container
        const galleryContainer = document.getElementById('people-gallery-grid');
        if (!galleryContainer) {
            console.warn('People gallery container not found');
            return;
        }

        // Shuffle the people images for random display order
        const shuffledPeopleImages = shuffleArray(allPeopleImages);

        // Create gallery items
        const galleryHTML = shuffledPeopleImages.map(imageFile => {
            const linkedInUrl = peopleToLinkedInMap[imageFile] || '#';
            const displayName = getDisplayName(imageFile);
            const imagePath = `about/${imageFile}`;
            
            return `
                <div class="people-gallery-wrapper">
                    <a href="${linkedInUrl}" 
                       class="people-gallery-item" 
                       target="_blank" 
                       rel="noopener noreferrer"
                       title="${displayName}">
                        <img src="${imagePath}" alt="${displayName}" loading="lazy">
                    </a>
                    <span class="people-tooltip">${displayName}</span>
                </div>
            `;
        }).join('');

        galleryContainer.innerHTML = galleryHTML;
        
        // Add click tracking for analytics (optional)
        galleryContainer.addEventListener('click', function(e) {
            const link = e.target.closest('.people-gallery-item');
            if (link && link.href !== '#') {
                // console.log(`Clicked on ${link.title} - ${link.href}`);
            }
        });
    }

    // Initialize the gallery
    createPeopleGallery();
}); 