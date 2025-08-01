#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

class ComprehensiveRedirectMapper {
  constructor() {
    this.menuData = null;
    this.redirects = {
      exact: {},
      patterns: {},
      wildcards: {}
    };
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

  // Extract all project slugs and their labels
  extractProjectSlugs() {
    const projects = [];
    
    this.menuData.forEach(category => {
      if (category.submenu && Array.isArray(category.submenu)) {
        category.submenu.forEach(project => {
          if (project.slug) {
            projects.push({
              slug: project.slug,
              label: project.label,
              menuDisplayName: project.menuDisplayName,
              category: category.label
            });
          }
        });
      }
    });
    
    return projects;
  }

  // Create comprehensive redirect mappings
  createComprehensiveRedirects() {
    const projects = this.extractProjectSlugs();
    console.log(`📋 Processing ${projects.length} projects for redirect mapping`);

    // Main page redirects
    this.addExactRedirect('/', '/index.html');
    this.addExactRedirect('/home', '/index.html');
    this.addExactRedirect('/about', '/about.html');
    this.addExactRedirect('/contact', '/contact.html');
    this.addExactRedirect('/projects', '/projects.html');
    this.addExactRedirect('/blog', '/blog.html');
    this.addExactRedirect('/tools', '/tools.html');
    this.addExactRedirect('/portfolio', '/projects.html');
    this.addExactRedirect('/work', '/projects.html');
    this.addExactRedirect('/our-work', '/projects.html');
    this.addExactRedirect('/clients', '/about.html');
    this.addExactRedirect('/clients-partners', '/about.html');
    this.addExactRedirect('/services', '/tools.html');
    this.addExactRedirect('/talk-to-us', '/contact.html');
    this.addExactRedirect('/contact-us', '/contact.html');
    this.addExactRedirect('/knectar-blog', '/blog.html');

    // Legacy service pages
    this.addExactRedirect('/drupal-web-development-portfolio', '/projects.html');
    this.addExactRedirect('/professional-web-development-partners', '/about.html');
    this.addExactRedirect('/web-development-services', '/tools.html');
    this.addExactRedirect('/drupal-web-development-blog', '/blog.html');
    this.addExactRedirect('/web-development-clients-and-web-design-partners', '/about.html');

    // Privacy policy
    this.addExactRedirect('/privacy-policy', '/index.html');
    this.addExactRedirect('/privacy-policy/', '/index.html');

    // Portfolio category pages
    this.addExactRedirect('/portfolio-category/drupal', '/projects.html#higher-education');
    this.addExactRedirect('/portfolio-category/education-web-development', '/projects.html#higher-education');
    this.addExactRedirect('/portfolio-category/non-profit-web-development', '/projects.html#nonprofit');
    this.addExactRedirect('/portfolio-category/corporate', '/projects.html#corporate');
    this.addExactRedirect('/portfolio-category/e-commerce', '/projects.html#e-commerce');
    this.addExactRedirect('/portfolio-category/magento-web-development', '/projects.html#e-commerce');
    this.addExactRedirect('/portfolio-category/shopify', '/projects.html#e-commerce');

    // Blog category and tag pages
    this.addExactRedirect('/category/drupal-website-development', '/blog.html');
    this.addExactRedirect('/category/magento-web-development', '/blog.html');
    this.addExactRedirect('/category/uncategorized', '/blog.html');
    this.addExactRedirect('/category/web-development-process', '/blog.html');
    this.addExactRedirect('/category/api-integration', '/blog.html');
    this.addExactRedirect('/category/salesforce-integration', '/blog.html');
    this.addExactRedirect('/category/magento-tips-and-tricks', '/blog.html');
    this.addExactRedirect('/category/hubspot-integration', '/blog.html');
    this.addExactRedirect('/category/web-programming', '/blog.html');

    // Tag pages
    this.addExactRedirect('/tag/development', '/blog.html');
    this.addExactRedirect('/tag/drupal', '/blog.html');
    this.addExactRedirect('/tag/hubspot', '/blog.html');
    this.addExactRedirect('/tag/magento', '/blog.html');
    this.addExactRedirect('/tag/process', '/blog.html');
    this.addExactRedirect('/tag/programming', '/blog.html');
    this.addExactRedirect('/tag/project-management', '/blog.html');
    this.addExactRedirect('/tag/salesforce', '/blog.html');
    this.addExactRedirect('/tag/specifications', '/blog.html');
    this.addExactRedirect('/tag/web-development', '/blog.html');
    this.addExactRedirect('/tag/web-development-process', '/blog.html');

    // Author pages
    this.addExactRedirect('/author/chris', '/about.html');
    this.addExactRedirect('/author/michael', '/about.html');

    // Blog pagination
    this.addExactRedirect('/drupal-web-development-blog/page/2', '/blog.html');
    this.addExactRedirect('/drupal-web-development-blog/page/3', '/blog.html');
    this.addExactRedirect('/tag/development/page/2', '/blog.html');

    // Individual blog posts (date-based URLs)
    this.addExactRedirect('/2016/03/02/drupal-hubspot-integration', '/projects.html?category=Blog%20Posts');
    this.addExactRedirect('/2016/03/02/drupal-hubspot-integration/', '/projects.html?category=Blog%20Posts');
    this.addExactRedirect('/2016/03/02/linkit-target-module-released-on-drupal-org', '/projects.html?category=Blog%20Posts');
    this.addExactRedirect('/2016/03/02/linkit-target-module-released-on-drupal-org/', '/projects.html?category=Blog%20Posts');
    this.addExactRedirect('/2016/03/02/the-frightful-tale-of-the-magento-upgrade-path-of-doom', '/projects.html?category=Blog%20Posts');
    this.addExactRedirect('/2016/03/02/the-frightful-tale-of-the-magento-upgrade-path-of-doom/', '/projects.html?category=Blog%20Posts');
    this.addExactRedirect('/2016/03/02/the-ez-speedy-make-me-a-grid-for-admin-method', '/projects.html?category=Blog%20Posts');
    this.addExactRedirect('/2016/03/02/the-ez-speedy-make-me-a-grid-for-admin-method/', '/projects.html?category=Blog%20Posts');
    this.addExactRedirect('/2016/03/02/the-definitive-magento-controller', '/projects.html?category=Blog%20Posts');
    this.addExactRedirect('/2016/03/02/the-definitive-magento-controller/', '/projects.html?category=Blog%20Posts');
    this.addExactRedirect('/2015/12/22/extraordinary-geometry-a-study-in-webgl', '/projects.html?category=Blog%20Posts');
    this.addExactRedirect('/2015/12/22/extraordinary-geometry-a-study-in-webgl/', '/projects.html?category=Blog%20Posts');
    this.addExactRedirect('/2015/12/18/magento-shipping', '/projects.html?category=Blog%20Posts');
    this.addExactRedirect('/2015/12/18/magento-shipping/', '/projects.html?category=Blog%20Posts');
    this.addExactRedirect('/2015/12/11/multi-store-magento-websites', '/projects.html?category=Blog%20Posts');
    this.addExactRedirect('/2015/12/11/multi-store-magento-websites/', '/projects.html?category=Blog%20Posts');
    this.addExactRedirect('/2015/12/11/standing-up-to-a-torrent', '/projects.html?category=Blog%20Posts');
    this.addExactRedirect('/2015/12/11/standing-up-to-a-torrent/', '/projects.html?category=Blog%20Posts');
    this.addExactRedirect('/2015/11/30/knectars-new-vision-for-drupal-blocks', '/projects.html?category=Blog%20Posts');
    this.addExactRedirect('/2015/11/30/knectars-new-vision-for-drupal-blocks/', '/projects.html?category=Blog%20Posts');
    this.addExactRedirect('/2015/11/23/streamlining-deployments-beanstalk', '/projects.html?category=Blog%20Posts');
    this.addExactRedirect('/2015/11/23/streamlining-deployments-beanstalk/', '/projects.html?category=Blog%20Posts');
    this.addExactRedirect('/2015/11/16/order-the-order-campaign-drupal-calculator-tool', '/projects.html?category=Blog%20Posts');
    this.addExactRedirect('/2015/11/16/order-the-order-campaign-drupal-calculator-tool/', '/projects.html?category=Blog%20Posts');
    this.addExactRedirect('/2015/11/09/web-development-exhibit-fractal-nature', '/projects.html?category=Blog%20Posts');
    this.addExactRedirect('/2015/11/09/web-development-exhibit-fractal-nature/', '/projects.html?category=Blog%20Posts');
    this.addExactRedirect('/2019/10/04/how-to-budget-for-a-web-development-project', '/projects.html?category=Blog%20Posts');
    this.addExactRedirect('/2019/10/04/how-to-budget-for-a-web-development-project/', '/projects.html?category=Blog%20Posts');
    this.addExactRedirect('/2016/06/29/website-hosting-service-why-knectar-loves-pantheon', '/projects.html?category=Blog%20Posts');
    this.addExactRedirect('/2016/06/29/website-hosting-service-why-knectar-loves-pantheon/', '/projects.html?category=Blog%20Posts');
    this.addExactRedirect('/2016/05/18/4-questions-ask-before-starting-web-development-project', '/projects.html?category=Blog%20Posts');
    this.addExactRedirect('/2016/05/18/4-questions-ask-before-starting-web-development-project/', '/projects.html?category=Blog%20Posts');
    this.addExactRedirect('/2016/05/12/why-we-chose-drupal-insights-from-a-web-development-company', '/projects.html?category=Blog%20Posts');
    this.addExactRedirect('/2016/05/12/why-we-chose-drupal-insights-from-a-web-development-company/', '/projects.html?category=Blog%20Posts');
    this.addExactRedirect('/2016/05/04/web-development-to-spec-or-not-to-spec', '/projects.html?category=Blog%20Posts');
    this.addExactRedirect('/2016/05/04/web-development-to-spec-or-not-to-spec/', '/projects.html?category=Blog%20Posts');
    this.addExactRedirect('/2016/04/27/custom-website-development-discovery', '/projects.html?category=Blog%20Posts');
    this.addExactRedirect('/2016/04/27/custom-website-development-discovery/', '/projects.html?category=Blog%20Posts');
    this.addExactRedirect('/2016/03/02/unit-testing-magentos-translation', '/projects.html?category=Blog%20Posts');
    this.addExactRedirect('/2016/03/02/unit-testing-magentos-translation/', '/projects.html?category=Blog%20Posts');
    this.addExactRedirect('/2016/03/02/salesforce-integration-for-drupal', '/projects.html?category=Blog%20Posts');
    this.addExactRedirect('/2016/03/02/salesforce-integration-for-drupal/', '/projects.html?category=Blog%20Posts');
    this.addExactRedirect('/2016/03/02/maintaining-magento-media', '/projects.html?category=Blog%20Posts');
    this.addExactRedirect('/2016/03/02/maintaining-magento-media/', '/projects.html?category=Blog%20Posts');
    this.addExactRedirect('/2020/03/23/knectar-receives-another-5-star-review-on-clutch-profile', '/projects.html?category=Blog%20Posts');
    this.addExactRedirect('/2020/03/23/knectar-receives-another-5-star-review-on-clutch-profile/', '/projects.html?category=Blog%20Posts');

    // Portfolio pagination
    this.addExactRedirect('/portfolio-category/corporate/page/2', '/projects.html');
    this.addExactRedirect('/portfolio-category/drupal/page/2', '/projects.html');
    this.addExactRedirect('/portfolio-category/drupal/page/3', '/projects.html');
    this.addExactRedirect('/portfolio-category/education-web-development/page/2', '/projects.html');

    // Service-specific pages
    this.addExactRedirect('/web-development-services/drupal-web-development', '/tools.html');
    this.addExactRedirect('/shopify-web-development-services', '/tools.html');
    this.addExactRedirect('/web-development-services/magento-development-services', '/tools.html');
    this.addExactRedirect('/magento-web-development-services', '/tools.html');
    this.addExactRedirect('/web-development-services/magento-web-development-services', '/tools.html');
    this.addExactRedirect('/web-development-services/website-maintenance', '/tools.html');
    this.addExactRedirect('/web-development-services/salesforce-integration', '/tools.html');
    this.addExactRedirect('/web-development-services/website-technical-consultation-and-strategy', '/tools.html');
    this.addExactRedirect('/web-development-services/post-launch-website-maintenance-plan', '/tools.html');
    this.addExactRedirect('/shopify-support-e-commerce-business', '/tools.html');

    // Portfolio filter pages
    this.addExactRedirect('/drupal-web-development-portfolio/?portfolio-category=corporate', '/projects.html');
    this.addExactRedirect('/drupal-web-development-portfolio/?portfolio-category=drupal', '/projects.html');
    this.addExactRedirect('/drupal-web-development-portfolio/?portfolio-category=e-commerce', '/projects.html');
    this.addExactRedirect('/drupal-web-development-portfolio/?portfolio-category=education-web-development', '/projects.html');
    this.addExactRedirect('/drupal-web-development-portfolio/?portfolio-category=magento-web-development', '/projects.html');
    this.addExactRedirect('/drupal-web-development-portfolio/?portfolio-category=non-profit-web-development', '/projects.html');
    this.addExactRedirect('/drupal-web-development-portfolio/?portfolio-category=shopify', '/projects.html');

    // Project-specific redirects
    this.mapProjectRedirects(projects);

    // Wildcard redirects for unmatched content
    this.addWildcardRedirect('/category/*', '/blog.html');
    this.addWildcardRedirect('/tag/*', '/blog.html');
    this.addWildcardRedirect('/author/*', '/about.html');
    this.addWildcardRedirect('/portfolio-category/*', '/projects.html');
    this.addWildcardRedirect('/web-development-services/*', '/tools.html');
    this.addWildcardRedirect('/drupal-web-development-portfolio/*', '/projects.html');
    
    // Date-based blog post patterns (YYYY/MM/DD/*)
    this.addWildcardRedirect('/2015/*', '/projects.html?category=Blog%20Posts');
    this.addWildcardRedirect('/2016/*', '/projects.html?category=Blog%20Posts');
    this.addWildcardRedirect('/2017/*', '/projects.html?category=Blog%20Posts');
    this.addWildcardRedirect('/2018/*', '/projects.html?category=Blog%20Posts');
    this.addWildcardRedirect('/2019/*', '/projects.html?category=Blog%20Posts');
    this.addWildcardRedirect('/2020/*', '/projects.html?category=Blog%20Posts');
    this.addWildcardRedirect('/2021/*', '/projects.html?category=Blog%20Posts');
    this.addWildcardRedirect('/2022/*', '/projects.html?category=Blog%20Posts');
    this.addWildcardRedirect('/2023/*', '/projects.html?category=Blog%20Posts');
    this.addWildcardRedirect('/2024/*', '/projects.html?category=Blog%20Posts');
    this.addWildcardRedirect('/2025/*', '/projects.html?category=Blog%20Posts');

    console.log(`✅ Created ${Object.keys(this.redirects.exact).length} exact redirects`);
    console.log(`✅ Created ${Object.keys(this.redirects.wildcards).length} wildcard redirects`);
  }

  // Map specific project redirects
  mapProjectRedirects(projects) {
    const projectMappings = {
      // Fox Chase Cancer Center variations
      'fox-chase-new-user-friendly-drupal-site': 'fox-chase-cancer-research',
      'fox-chase-cancer-center': 'fox-chase-cancer-research',
      
      // Isabella Stewart Gardner Museum variations
      'isabella-stewart-gardner-museum': 'the-isabella-stewart-gardner-museum',
      
      // Glenmede Trust Company variations
      'design-refresh-glenmede-trust-company': 'glenmede-trust-company',
      'glenmede-drupal-website-development-ma': 'glenmede-trust-company',
      'glenmedes-smooth-new-drupal-site': 'glenmede-trust-company',
      
      // Chemex variations
      'chemexs-new-sleek-and-modern-site': 'chemex-coffee-maker',
      'chemex-coffeemaker': 'chemex-coffee-maker',
      
      // UMass variations
      'umass-humanities-and-fine-arts': 'university-of-massachusetts-amherst',
      'umass-humanities-and-fine-arts-new-user-friendly-site': 'university-of-massachusetts-amherst',
      
      // SMMA variations
      'smma-long-format-drupal-website': 'smma-architecture',
      
      // SACI Florence variations
      'saci-florence': 'studio-arts-consortium-international-saci-florence',
      
      // MIT variations
      'university-web-design-mit': 'mit',
      'mit-university-web-development': 'mit',
      'new-mit-deshpande-center-drupal-site': 'mit',
      
      // SmartLabs variations
      'website-planning-smartlabs': 'smartlabs',
      
      // UMass Summer variations
      'drupal-higher-education-case-study-umass-summer': 'university-of-massachusetts-amherst',
      
      // Anheuser Busch variations
      'anheuser-busch-inbev-new-mi-modelo-application': 'ab_inbev',
      
      // Temple variations
      'temples-new-responsive-drupal-site': 'lewis-katz-school-of-medicine-temple-university',
      
      // Jack Daniels variations
      'jack-daniels-new-back-end-drupal-architecture': 'jack-daniels',
      'jack-daniels-website-project': 'jack-daniels',
      
      // Crocker Communications
      'crocker-communications-responsive-user-friendly-site': 'crocker-communications',
      
      // Sparx Hockey
      'quick-efficient-build-of-sparx-hockey-static-site': 'sparx-hockey',
      
      // Pioneer Valley Books
      'new-shopify-plus-site-pioneer-valley-books': 'pioneer-valley-books',
      
      // Deans Beans
      'ecommerce-case-study-deans-beans': 'deans-beans',
      
      // Sleep Studio
      'sleep-studio-ecommerce-web-design': 'sleep-studio',
      'new-sleep-studio-site-built-for-e-commerce': 'sleep-studio',
      
      // Wentworth Institute
      'wentworth-institute-education-web-design': 'wentworth-institute-of-technology',
      'wentworth-institute-of-technology-digital-viewbook': 'wentworth-institute-of-technology',
      
      // Eze Software
      'the-new-fully-responsive-eze-software-site': 'eze-software',
      
      // Riverbend
      'riverbends-corporate-drupal-website': 'riverbend-animal-hospital',
      'riverbend-animal-hospital-site-built-on-drupal-platform': 'riverbend-animal-hospital',
      
      // OPM
      'corporate-web-development-opm': 'office-of-personnel-management',
      
      // Forsyth
      'forsyths-new-drupal-site': 'forsyth-institute',
      
      // AIER
      'american-institute-for-economic-research-drupal-7-redesign': 'aier-american-institute-for-economic-research',
      
      // Oxford Performance Materials
      'oxford-performance-materials-for-growing-business': 'oxford-performance-materials',
      
      // Pioneer Valley Books
      'pioneer-valley-books-new-magento-site': 'pioneer-valley-books',
      
      // Kavli Institute
      'kavli-institute-for-brain-science-web-development-trifecta': 'kavli-institute',
      'kavli-institute-university-web-development': 'kavli-institute',
      
      // Way Finders
      'way-finders': 'way-finders',
      
      // HubSpot Integration
      'hubspot-integration-cornerstone-software': 'cornerstone-software',
      
      // UMass Continuing Education
      'university-massachusetts-continuing-professional-education': 'university-of-massachusetts-amherst',
      
      // Guardair
      'guardair-shopify-websites': 'guardair'
    };

    // Create redirects for each project mapping
    Object.entries(projectMappings).forEach(([legacySlug, newSlug]) => {
      // Check if the new slug exists in our current projects
      const projectExists = projects.find(p => p.slug === newSlug);
      
      if (projectExists) {
        // Portfolio page redirects
        this.addExactRedirect(`/portfolio/${legacySlug}`, `/project.html?item=${newSlug}`);
        this.addExactRedirect(`/portfolio/${legacySlug}/`, `/project.html?item=${newSlug}`);
        
        // Case study page redirects
        this.addExactRedirect(`/case-studies/${legacySlug}`, `/project.html?item=${newSlug}`);
        this.addExactRedirect(`/case-studies/${legacySlug}/`, `/project.html?item=${newSlug}`);
        
        // Work page redirects
        this.addExactRedirect(`/work/${legacySlug}`, `/project.html?item=${newSlug}`);
        this.addExactRedirect(`/work/${legacySlug}/`, `/project.html?item=${newSlug}`);
      } else {
        // If project doesn't exist, redirect to projects page
        this.addExactRedirect(`/portfolio/${legacySlug}`, '/projects.html');
        this.addExactRedirect(`/portfolio/${legacySlug}/`, '/projects.html');
        this.addExactRedirect(`/case-studies/${legacySlug}`, '/projects.html');
        this.addExactRedirect(`/case-studies/${legacySlug}/`, '/projects.html');
        this.addExactRedirect(`/work/${legacySlug}`, '/projects.html');
        this.addExactRedirect(`/work/${legacySlug}/`, '/projects.html');
      }
    });

    // Add redirects for projects that exist in current menu
    projects.forEach(project => {
      // Direct slug matches
      this.addExactRedirect(`/${project.slug}`, `/project.html?item=${project.slug}`);
      this.addExactRedirect(`/${project.slug}/`, `/project.html?item=${project.slug}`);
      
      // Portfolio path matches
      this.addExactRedirect(`/portfolio/${project.slug}`, `/project.html?item=${project.slug}`);
      this.addExactRedirect(`/portfolio/${project.slug}/`, `/project.html?item=${project.slug}`);
      
      // Case study path matches
      this.addExactRedirect(`/case-studies/${project.slug}`, `/project.html?item=${project.slug}`);
      this.addExactRedirect(`/case-studies/${project.slug}/`, `/project.html?item=${project.slug}`);
      
      // Work path matches
      this.addExactRedirect(`/work/${project.slug}`, `/project.html?item=${project.slug}`);
      this.addExactRedirect(`/work/${project.slug}/`, `/project.html?item=${project.slug}`);
    });
  }

  // Add exact redirect
  addExactRedirect(from, to) {
    this.redirects.exact[from] = to;
  }

  // Add wildcard redirect
  addWildcardRedirect(pattern, destination) {
    this.redirects.wildcards[pattern] = destination;
  }

  // Save redirects to file
  saveRedirects() {
    const redirectsData = {
      redirects: this.redirects,
      metadata: {
        description: "Comprehensive 301 redirects from legacy Knectar site to new site",
        generated_at: new Date().toISOString(),
        total_exact: Object.keys(this.redirects.exact).length,
        total_wildcards: Object.keys(this.redirects.wildcards).length,
        source: "Xenu site crawl analysis"
      }
    };

    const redirectsPath = path.join(__dirname, '..', 'redirects.json');
    fs.writeFileSync(redirectsPath, JSON.stringify(redirectsData, null, 2));
    console.log(`💾 Comprehensive redirects saved to: redirects.json`);

    return redirectsPath;
  }

  // Print summary
  printSummary() {
    console.log('\n📊 Comprehensive Redirect Summary');
    console.log('==================================');
    console.log(`✅ Exact redirects: ${Object.keys(this.redirects.exact).length}`);
    console.log(`✅ Wildcard redirects: ${Object.keys(this.redirects.wildcards).length}`);
    console.log(`📈 Total redirects: ${Object.keys(this.redirects.exact).length + Object.keys(this.redirects.wildcards).length}`);

    console.log('\n🔗 Sample Exact Redirects:');
    const sampleExact = Object.entries(this.redirects.exact).slice(0, 10);
    sampleExact.forEach(([from, to], index) => {
      console.log(`   ${index + 1}. ${from} → ${to}`);
    });

    console.log('\n🔗 Sample Wildcard Redirects:');
    const sampleWildcards = Object.entries(this.redirects.wildcards).slice(0, 5);
    sampleWildcards.forEach(([pattern, destination], index) => {
      console.log(`   ${index + 1}. ${pattern} → ${destination}`);
    });
  }
}

// CLI interface
async function main() {
  console.log('🗺️  Comprehensive Redirect Mapper');
  console.log('==================================\n');

  const mapper = new ComprehensiveRedirectMapper();
  
  // Load data
  if (!mapper.loadMenuData()) {
    process.exit(1);
  }

  // Create comprehensive redirects
  mapper.createComprehensiveRedirects();
  
  // Save results
  mapper.saveRedirects();
  
  // Print summary
  mapper.printSummary();
}

if (require.main === module) {
  main();
}

module.exports = ComprehensiveRedirectMapper; 