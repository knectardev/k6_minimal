#!/usr/bin/env node

/**
 * Sitemap Generator for Knectar Portfolio
 * 
 * This script automatically generates a sitemap.xml file based on the current
 * project structure and menu.json data.
 * 
 * Usage:
 *   node scripts/generate_sitemap.js
 *   npm run generate-sitemap
 */

const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  baseUrl: 'https://www.knectar.com',
  lastmod: new Date().toISOString().split('T')[0], // YYYY-MM-DD format
  menuFile: 'data/menu.json',
  outputFile: 'sitemap.xml'
};

// Priority and change frequency mappings
const PAGE_CONFIG = {
  'index.html': { priority: '1.0', changefreq: 'weekly' },
  'about.html': { priority: '0.9', changefreq: 'monthly' },
  'services.html': { priority: '0.8', changefreq: 'monthly' },
  'projects.html': { priority: '0.9', changefreq: 'weekly' },
  'lines.html': { priority: '0.6', changefreq: 'monthly' },
  'contact.html': { priority: '0.8', changefreq: 'monthly' },
  'contact_confirmation.html': { priority: '0.3', changefreq: 'yearly' },
  'privacy-policy.html': { priority: '0.3', changefreq: 'yearly' },
  'resume/resume_static.html': { priority: '0.7', changefreq: 'monthly' }
};

// Pretty URL mappings for main pages
const PRETTY_URLS = {
  'about.html': '/about/',
  'services.html': '/services/'
};

// Project categories and their priorities
const PROJECT_CATEGORIES = {
  'Higher Education': { priority: '0.8', changefreq: 'monthly' },
  'Intranets & Portals': { priority: '0.8', changefreq: 'monthly' },
  'Web & iOS Apps': { priority: '0.7', changefreq: 'monthly' },
  'Informational': { priority: '0.7', changefreq: 'monthly' },
  'E-Commerce': { priority: '0.7', changefreq: 'monthly' },
  'Programming & Technical': { priority: '0.6', changefreq: 'monthly' },
  'Music & Art': { priority: '0.6', changefreq: 'monthly' }
};

/**
 * Generate XML for a single URL entry
 */
function generateUrlEntry(loc, priority, changefreq) {
  return `  <url>
    <loc>${loc}</loc>
    <lastmod>${CONFIG.lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
}

/**
 * Get all project slugs from menu.json
 */
function getProjectSlugs() {
  try {
    const menuData = JSON.parse(fs.readFileSync(CONFIG.menuFile, 'utf8'));
    const projects = [];
    
    function extractProjects(items) {
      items.forEach(item => {
        if (item.url && item.url.includes('project.html?item=')) {
          const slug = item.slug;
          if (slug) {
            projects.push({
              slug: slug,
              url: `/project/${slug}/`, // Use pretty URL instead of parameterized URL
              category: getProjectCategory(item)
            });
          }
        }
        if (item.submenu) {
          extractProjects(item.submenu);
        }
      });
    }
    
    extractProjects(menuData);
    return projects;
  } catch (error) {
    console.error('Error reading menu.json:', error.message);
    return [];
  }
}

/**
 * Determine project category based on menu structure
 */
function getProjectCategory(item) {
  // This is a simplified approach - you might want to enhance this
  // based on your actual menu structure
  const higherEdKeywords = ['university', 'college', 'school', 'institute'];
  const ecommerceKeywords = ['books', 'brewing', 'hockey', 'coffee'];
  const techKeywords = ['module', 'door'];
  const artKeywords = ['sculpture', 'pen-plotting', 'vases', 'p5'];
  
  const slug = item.slug.toLowerCase();
  
  if (higherEdKeywords.some(keyword => slug.includes(keyword))) {
    return 'Higher Education';
  } else if (ecommerceKeywords.some(keyword => slug.includes(keyword))) {
    return 'E-Commerce';
  } else if (techKeywords.some(keyword => slug.includes(keyword))) {
    return 'Programming & Technical';
  } else if (artKeywords.some(keyword => slug.includes(keyword))) {
    return 'Music & Art';
  } else if (slug.includes('app') || slug.includes('music')) {
    return 'Web & iOS Apps';
  } else if (slug.includes('municipal') || slug.includes('wholesale')) {
    return 'Intranets & Portals';
  } else {
    return 'Informational';
  }
}

/**
 * Generate the complete sitemap XML
 */
function generateSitemap() {
  const urls = [];
  
  // Add main site pages
  console.log('Adding main site pages...');
  Object.entries(PAGE_CONFIG).forEach(([file, config]) => {
    let url;
    if (file === 'index.html') {
      url = CONFIG.baseUrl + '/';
    } else if (PRETTY_URLS[file]) {
      url = CONFIG.baseUrl + PRETTY_URLS[file];
    } else {
      url = CONFIG.baseUrl + '/' + file;
    }
    urls.push(generateUrlEntry(url, config.priority, config.changefreq));
  });
  
  // Add project pages
  console.log('Adding project pages...');
  const projects = getProjectSlugs();
  const projectsByCategory = {};
  
  // Group projects by category
  projects.forEach(project => {
    if (!projectsByCategory[project.category]) {
      projectsByCategory[project.category] = [];
    }
    projectsByCategory[project.category].push(project);
  });
  
  // Add projects organized by category
  Object.entries(projectsByCategory).forEach(([category, categoryProjects]) => {
    const config = PROJECT_CATEGORIES[category] || { priority: '0.7', changefreq: 'monthly' };
    categoryProjects.forEach(project => {
      const url = CONFIG.baseUrl + project.url;
      urls.push(generateUrlEntry(url, config.priority, config.changefreq));
    });
  });
  
  // Add category pages
  const categoryToSlug = {
    'Higher Education': 'higher-education',
    'Intranets & Portals': 'intranets-&-portals',
    'Web & iOS Apps': 'web-&-ios-apps',
    'Informational': 'informational',
    'E-Commerce': 'e-commerce',
    'Music & Art': 'music-&-art'
  };
  
  Object.entries(PROJECT_CATEGORIES).forEach(([categoryLabel, config]) => {
    if (categoryLabel !== 'All') { // Exclude 'All' category from sitemap
      const slug = categoryToSlug[categoryLabel] || categoryLabel.toLowerCase().replace(/\s+/g, '-');
      const url = `${CONFIG.baseUrl}/projects/${encodeURIComponent(slug)}/`;
      urls.push(generateUrlEntry(url, config.priority, config.changefreq));
    }
  });
  
  // Generate final XML
  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;
  
  return sitemapXml;
}

/**
 * Main execution
 */
function main() {
  console.log('🚀 Generating sitemap.xml...');
  
  try {
    // Check if menu.json exists
    if (!fs.existsSync(CONFIG.menuFile)) {
      console.error(`❌ Error: ${CONFIG.menuFile} not found`);
      process.exit(1);
    }
    
    // Generate sitemap
    const sitemapXml = generateSitemap();
    
    // Write to file
    fs.writeFileSync(CONFIG.outputFile, sitemapXml, 'utf8');
    
    console.log(`✅ Sitemap generated successfully: ${CONFIG.outputFile}`);
    console.log(`📅 Last modified: ${CONFIG.lastmod}`);
    console.log(`🌐 Base URL: ${CONFIG.baseUrl}`);
    
    // Count URLs
    const urlCount = (sitemapXml.match(/<url>/g) || []).length;
    console.log(`📊 Total URLs: ${urlCount}`);
    
  } catch (error) {
    console.error('❌ Error generating sitemap:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { generateSitemap, getProjectSlugs };
