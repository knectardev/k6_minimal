#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

class UrlMapper {
  constructor() {
    this.menuData = null;
    this.legacyUrls = null;
    this.mappings = [];
    this.unmapped = [];
  }

  // Load menu data
  loadMenuData() {
    try {
      const menuPath = path.join(__dirname, '..', 'data', 'menu.json');
      this.menuData = JSON.parse(fs.readFileSync(menuPath, 'utf8'));
      console.log(`✅ Loaded menu data with ${this.menuData.length} categories`);
      return true;
    } catch (error) {
      console.error('❌ Failed to load menu data:', error.message);
      return false;
    }
  }

  // Load legacy site inventory
  loadLegacyInventory(filename = 'legacy_site_inventory.json') {
    try {
      const inventoryPath = path.join(__dirname, '..', filename);
      this.legacyUrls = JSON.parse(fs.readFileSync(inventoryPath, 'utf8'));
      console.log(`✅ Loaded legacy inventory with ${this.legacyUrls.urls.length} URLs`);
      return true;
    } catch (error) {
      console.error('❌ Failed to load legacy inventory:', error.message);
      return false;
    }
  }

  // Extract all project slugs from menu data
  extractProjectSlugs() {
    const slugs = [];
    
    this.menuData.forEach(category => {
      if (category.submenu && Array.isArray(category.submenu)) {
        category.submenu.forEach(project => {
          if (project.slug) {
            slugs.push({
              slug: project.slug,
              label: project.label,
              menuDisplayName: project.menuDisplayName,
              category: category.label
            });
          }
        });
      }
    });
    
    return slugs;
  }

  // Create mapping rules
  createMappingRules() {
    const rules = [];
    const projectSlugs = this.extractProjectSlugs();
    
    // Main page mappings
    rules.push({
      pattern: /^\/$|^\/home$/i,
      destination: '/index.html',
      type: 'exact',
      description: 'Homepage'
    });

    rules.push({
      pattern: /^\/about$/i,
      destination: '/about.html',
      type: 'exact',
      description: 'About page'
    });

    rules.push({
      pattern: /^\/contact$/i,
      destination: '/contact.html',
      type: 'exact',
      description: 'Contact page'
    });

    rules.push({
      pattern: /^\/projects?$/i,
      destination: '/projects.html',
      type: 'exact',
      description: 'Projects page'
    });

    rules.push({
      pattern: /^\/blog$/i,
      destination: '/blog.html',
      type: 'exact',
      description: 'Blog page'
    });

    rules.push({
      pattern: /^\/tools$/i,
      destination: '/tools.html',
      type: 'exact',
      description: 'Tools page'
    });

    // Project-specific mappings
    projectSlugs.forEach(project => {
      // Direct slug matches
      rules.push({
        pattern: new RegExp(`^/${project.slug}$`, 'i'),
        destination: `/project.html?item=${project.slug}`,
        type: 'exact',
        description: `Project: ${project.label}`,
        project: project
      });

      // Portfolio path matches
      rules.push({
        pattern: new RegExp(`^\/portfolio\/${project.slug.replace(/-/g, '[-_]')}$`, 'i'),
        destination: `/project.html?item=${project.slug}`,
        type: 'exact',
        description: `Portfolio: ${project.label}`,
        project: project
      });

      // Case study path matches
      rules.push({
        pattern: new RegExp(`^\/case-studies\/${project.slug.replace(/-/g, '[-_]')}$`, 'i'),
        destination: `/project.html?item=${project.slug}`,
        type: 'exact',
        description: `Case study: ${project.label}`,
        project: project
      });

      // Work path matches
      rules.push({
        pattern: new RegExp(`^\/work\/${project.slug.replace(/-/g, '[-_]')}$`, 'i'),
        destination: `/project.html?item=${project.slug}`,
        type: 'exact',
        description: `Work: ${project.label}`,
        project: project
      });
    });

    // Category mappings
    this.menuData.forEach(category => {
      if (category.label) {
        const categorySlug = category.label.toLowerCase().replace(/\s+/g, '-');
        rules.push({
          pattern: new RegExp(`^\/${categorySlug}$`, 'i'),
          destination: `/projects.html#${categorySlug}`,
          type: 'exact',
          description: `Category: ${category.label}`
        });
      }
    });

    // Wildcard mappings
    rules.push({
      pattern: /^\/blog\//i,
      destination: '/blog.html',
      type: 'wildcard',
      description: 'Blog posts'
    });

    rules.push({
      pattern: /^\/case-studies\//i,
      destination: '/projects.html',
      type: 'wildcard',
      description: 'Case studies'
    });

    rules.push({
      pattern: /^\/portfolio\//i,
      destination: '/projects.html',
      type: 'wildcard',
      description: 'Portfolio items'
    });

    rules.push({
      pattern: /^\/work\//i,
      destination: '/projects.html',
      type: 'wildcard',
      description: 'Work items'
    });

    return rules;
  }

  // Map a single URL
  mapUrl(urlPath, rules) {
    for (const rule of rules) {
      if (rule.type === 'exact' && rule.pattern.test(urlPath)) {
        return {
          originalPath: urlPath,
          destination: rule.destination,
          type: 'exact',
          description: rule.description,
          project: rule.project || null
        };
      } else if (rule.type === 'wildcard' && rule.pattern.test(urlPath)) {
        return {
          originalPath: urlPath,
          destination: rule.destination,
          type: 'wildcard',
          description: rule.description,
          project: rule.project || null
        };
      }
    }
    
    return null;
  }

  // Process all legacy URLs
  processUrls() {
    const rules = this.createMappingRules();
    console.log(`📋 Created ${rules.length} mapping rules`);

    this.legacyUrls.urls.forEach(urlData => {
      const mapping = this.mapUrl(urlData.path, rules);
      
      if (mapping) {
        this.mappings.push(mapping);
      } else {
        this.unmapped.push({
          path: urlData.path,
          fullUrl: urlData.fullUrl
        });
      }
    });

    console.log(`✅ Mapped ${this.mappings.length} URLs`);
    console.log(`❌ ${this.unmapped.length} URLs unmapped`);
  }

  // Generate redirects.json content
  generateRedirectsJson() {
    const exact = {};
    const patterns = {};
    const wildcards = {};

    this.mappings.forEach(mapping => {
      if (mapping.type === 'exact') {
        exact[mapping.originalPath] = mapping.destination;
      } else if (mapping.type === 'wildcard') {
        // Convert exact path to wildcard pattern
        const wildcardPattern = mapping.originalPath.replace(/\/[^\/]+$/, '/*');
        wildcards[wildcardPattern] = mapping.destination;
      }
    });

    return {
      redirects: {
        exact,
        patterns,
        wildcards
      },
      metadata: {
        description: "Auto-generated 301 redirects from legacy site mapping",
        generated_at: new Date().toISOString(),
        total_mappings: this.mappings.length,
        unmapped_urls: this.unmapped.length,
        source: "legacy_site_inventory.json"
      }
    };
  }

  // Save results
  saveResults() {
    // Save mappings
    const mappingsPath = path.join(__dirname, '..', 'url_mappings.json');
    const mappingsData = {
      generated_at: new Date().toISOString(),
      total_mapped: this.mappings.length,
      total_unmapped: this.unmapped.length,
      mappings: this.mappings,
      unmapped: this.unmapped
    };
    
    fs.writeFileSync(mappingsPath, JSON.stringify(mappingsData, null, 2));
    console.log(`💾 Mappings saved to: url_mappings.json`);

    // Generate and save redirects.json
    const redirectsData = this.generateRedirectsJson();
    const redirectsPath = path.join(__dirname, '..', 'redirects.json');
    fs.writeFileSync(redirectsPath, JSON.stringify(redirectsData, null, 2));
    console.log(`💾 Redirects saved to: redirects.json`);

    return { mappingsPath, redirectsPath };
  }

  // Print summary
  printSummary() {
    console.log('\n📊 Mapping Summary');
    console.log('==================');
    console.log(`✅ Mapped URLs: ${this.mappings.length}`);
    console.log(`❌ Unmapped URLs: ${this.unmapped.length}`);
    console.log(`📈 Success Rate: ${((this.mappings.length / (this.mappings.length + this.unmapped.length)) * 100).toFixed(1)}%`);

    if (this.mappings.length > 0) {
      console.log('\n🔗 Sample Mappings:');
      this.mappings.slice(0, 10).forEach((mapping, index) => {
        console.log(`   ${index + 1}. ${mapping.originalPath} → ${mapping.destination} (${mapping.description})`);
      });
    }

    if (this.unmapped.length > 0) {
      console.log('\n❓ Sample Unmapped URLs:');
      this.unmapped.slice(0, 10).forEach((url, index) => {
        console.log(`   ${index + 1}. ${url.path}`);
      });
    }
  }
}

// CLI interface
async function main() {
  console.log('🗺️  URL Mapping Tool');
  console.log('===================\n');

  const mapper = new UrlMapper();
  
  // Load data
  if (!mapper.loadMenuData()) {
    process.exit(1);
  }
  
  if (!mapper.loadLegacyInventory()) {
    console.log('⚠️  No legacy inventory found. Run the scraper first:');
    console.log('   node scripts/scrape_legacy_site.js');
    process.exit(1);
  }

  // Process URLs
  mapper.processUrls();
  
  // Save results
  mapper.saveResults();
  
  // Print summary
  mapper.printSummary();
}

if (require.main === module) {
  main();
}

module.exports = UrlMapper; 