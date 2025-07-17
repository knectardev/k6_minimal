const fs = require('fs');
const path = require('path');

// Path to menu.json (relative to this script's location)
const menuPath = path.resolve(__dirname, '../data/menu.json');

// Read & parse existing menu.json
let menuData;
try {
  menuData = JSON.parse(fs.readFileSync(menuPath, 'utf8'));
} catch (err) {
  console.error('Failed to read or parse menu.json:', err.message);
  process.exit(1);
}

// Helper to recursively walk the menu structure and update project objects
function updateProjects(items) {
  items.forEach(item => {
    // If this item has a submenu, iterate its projects
    if (Array.isArray(item.submenu)) {
      item.submenu.forEach(project => {
        // Only proceed if a slug exists
        if (!project.slug) return;

        const slug = project.slug;
        project.detailImages = [
          `project_images/${slug}_1.png`,
          `project_images/${slug}_2.png`,
          `project_images/${slug}_3.png`
        ];
      });
    }

    // Recurse into deeper levels if they exist (defensive, in case of nested submenus)
    if (Array.isArray(item.items)) {
      updateProjects(item.items);
    }
  });
}

updateProjects(menuData);

// Write the updated JSON back to disk with 2-space indentation
try {
  fs.writeFileSync(menuPath, JSON.stringify(menuData, null, 2) + '\n', 'utf8');
  console.log('Successfully updated detailImages for all projects in menu.json');
} catch (err) {
  console.error('Failed to write updated menu.json:', err.message);
  process.exit(1);
} 