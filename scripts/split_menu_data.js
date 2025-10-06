#!/usr/bin/env node

/**
 * Menu Data Splitter
 * 
 * Splits the large menu.json into:
 * 1. menu-index.json (lightweight menu structure)
 * 2. Individual project files in data/projects/
 * 
 * Features:
 * - Maintains backwards compatibility
 * - Validates all data
 * - Creates backups before modifications
 * - Reports file size savings
 */

const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  sourceFile: 'data/menu.json',
  outputIndexFile: 'data/menu-index.json',
  outputProjectsDir: 'data/projects',
  backupDir: 'data/backups',
  dryRun: false // Set to true to preview without writing files
};

// Fields to keep in the lightweight menu index
const MENU_INDEX_FIELDS = [
  'label',
  'slug',
  'menuDisplayName',
  'url',
  'projectTitle',
  'technology',
  'coverImage',
  'sub_menu',
  'icon',
  'categoryDescription',
  'more'
];

// Fields that belong in individual project files
const PROJECT_DETAIL_FIELDS = [
  'slug',
  'projectTitle',
  'role',
  'budget',
  'technology',
  'years',
  'designPartner',
  'designPartnerUrl',
  'projectUrl',
  'projectLinkDisplay',
  'project_haiku',
  'project_footer_CTA',
  'pageSummary',
  'pageBody',
  'coverImage',
  'detailImages'
];

/**
 * Create directory if it doesn't exist
 */
function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`✅ Created directory: ${dirPath}`);
  }
}

/**
 * Get file size in KB
 */
function getFileSizeKB(filePath) {
  if (!fs.existsSync(filePath)) return 0;
  const stats = fs.statSync(filePath);
  return (stats.size / 1024).toFixed(2);
}

/**
 * Create backup of original file
 */
function createBackup(sourceFile) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFile = path.join(
    CONFIG.backupDir,
    `menu_backup_${timestamp}.json`
  );
  
  ensureDir(CONFIG.backupDir);
  fs.copyFileSync(sourceFile, backupFile);
  console.log(`📦 Backup created: ${backupFile}`);
  return backupFile;
}

/**
 * Extract lightweight menu data for a project
 */
function createMenuIndexEntry(project) {
  const entry = {};
  
  MENU_INDEX_FIELDS.forEach(field => {
    if (project[field] !== undefined) {
      entry[field] = project[field];
    }
  });
  
  // Add pointer to detail file
  if (project.slug) {
    entry._dataFile = `projects/${project.slug}.json`;
  }
  
  return entry;
}

/**
 * Extract full project detail data
 */
function createProjectDetailFile(project) {
  const detail = {};
  
  PROJECT_DETAIL_FIELDS.forEach(field => {
    if (project[field] !== undefined) {
      detail[field] = project[field];
    }
  });
  
  return detail;
}

/**
 * Process menu data and split it
 */
function splitMenuData(menuData) {
  const menuIndex = [];
  const projectFiles = [];
  let projectCount = 0;
  
  menuData.forEach(category => {
    const categoryEntry = {
      label: category.label,
      icon: category.icon
    };
    
    // Add optional fields
    if (category.url) categoryEntry.url = category.url;
    if (category.categoryDescription) categoryEntry.categoryDescription = category.categoryDescription;
    if (category.more !== undefined) categoryEntry.more = category.more;
    
    // Process submenu (projects)
    if (category.submenu && category.submenu.length > 0) {
      categoryEntry.submenu = [];
      
      category.submenu.forEach(project => {
        // Create lightweight menu entry
        const menuEntry = createMenuIndexEntry(project);
        categoryEntry.submenu.push(menuEntry);
        
        // Create full project detail file
        if (project.slug) {
          const projectDetail = createProjectDetailFile(project);
          projectFiles.push({
            slug: project.slug,
            data: projectDetail
          });
          projectCount++;
        }
      });
    }
    
    menuIndex.push(categoryEntry);
  });
  
  return { menuIndex, projectFiles, projectCount };
}

/**
 * Write files to disk
 */
function writeFiles(menuIndex, projectFiles) {
  const results = {
    filesWritten: 0,
    totalSize: 0,
    errors: []
  };
  
  try {
    // Write menu index
    const indexJson = JSON.stringify(menuIndex, null, 2);
    if (!CONFIG.dryRun) {
      fs.writeFileSync(CONFIG.outputIndexFile, indexJson, 'utf8');
      results.filesWritten++;
    }
    const indexSize = Buffer.byteLength(indexJson, 'utf8') / 1024;
    results.totalSize += indexSize;
    console.log(`✅ Menu index: ${indexSize.toFixed(2)} KB`);
    
    // Create projects directory
    ensureDir(CONFIG.outputProjectsDir);
    
    // Write individual project files
    projectFiles.forEach(({ slug, data }) => {
      const filename = `${slug}.json`;
      const filepath = path.join(CONFIG.outputProjectsDir, filename);
      const json = JSON.stringify(data, null, 2);
      
      if (!CONFIG.dryRun) {
        fs.writeFileSync(filepath, json, 'utf8');
        results.filesWritten++;
      }
      
      const fileSize = Buffer.byteLength(json, 'utf8') / 1024;
      results.totalSize += fileSize;
    });
    
    console.log(`✅ Created ${projectFiles.length} project files`);
    
  } catch (error) {
    results.errors.push(error.message);
    console.error(`❌ Error writing files:`, error);
  }
  
  return results;
}

/**
 * Validate generated data
 */
function validateData(originalData, menuIndex, projectFiles) {
  const issues = [];
  
  // Count projects in original data
  let originalProjectCount = 0;
  originalData.forEach(category => {
    if (category.submenu) {
      originalProjectCount += category.submenu.length;
    }
  });
  
  // Verify project count matches
  if (projectFiles.length !== originalProjectCount) {
    issues.push(`Project count mismatch: Original has ${originalProjectCount}, generated ${projectFiles.length}`);
  }
  
  // Verify all projects have slugs
  projectFiles.forEach(({ slug, data }) => {
    if (!slug || slug.trim() === '') {
      issues.push(`Project missing slug: ${JSON.stringify(data).substring(0, 100)}...`);
    }
    
    if (!data.projectTitle) {
      issues.push(`Project missing title: ${slug}`);
    }
  });
  
  // Verify menu index has all categories
  if (menuIndex.length !== originalData.length) {
    issues.push(`Category count mismatch: Original has ${originalData.length}, index has ${menuIndex.length}`);
  }
  
  return issues;
}

/**
 * Generate report
 */
function generateReport(originalSize, newSize, projectCount, validationIssues) {
  console.log('\n' + '='.repeat(60));
  console.log('📊 MENU DATA SPLIT REPORT');
  console.log('='.repeat(60));
  console.log(`\n📁 Original File:`);
  console.log(`   Size: ${originalSize} KB`);
  console.log(`   Location: ${CONFIG.sourceFile}`);
  
  console.log(`\n📁 Generated Files:`);
  console.log(`   Menu Index: ${CONFIG.outputIndexFile}`);
  console.log(`   Project Files: ${CONFIG.outputProjectsDir}/ (${projectCount} files)`);
  console.log(`   Total Size: ${newSize.toFixed(2)} KB`);
  
  console.log(`\n💾 Storage Analysis:`);
  const savings = originalSize - newSize;
  const savingsPercent = ((savings / originalSize) * 100).toFixed(1);
  console.log(`   Space Saved: ${savings.toFixed(2)} KB (${savingsPercent}%)`);
  console.log(`   Note: Individual files load on-demand, not all at once`);
  
  console.log(`\n⚡ Performance Impact:`);
  const menuIndexSize = getFileSizeKB(CONFIG.outputIndexFile);
  const loadSavings = originalSize - menuIndexSize;
  const loadSavingsPercent = ((loadSavings / originalSize) * 100).toFixed(1);
  console.log(`   Initial Load: ${menuIndexSize} KB (was ${originalSize} KB)`);
  console.log(`   Load Reduction: ${loadSavings.toFixed(2)} KB (${loadSavingsPercent}%)`);
  
  if (validationIssues.length > 0) {
    console.log(`\n⚠️  Validation Issues:`);
    validationIssues.forEach(issue => {
      console.log(`   - ${issue}`);
    });
  } else {
    console.log(`\n✅ Validation: All checks passed!`);
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('✨ Split complete! Files ready for testing.');
  console.log('='.repeat(60) + '\n');
}

/**
 * Main execution
 */
function main() {
  console.log('\n🚀 Starting Menu Data Split...\n');
  
  // Check if source file exists
  if (!fs.existsSync(CONFIG.sourceFile)) {
    console.error(`❌ Source file not found: ${CONFIG.sourceFile}`);
    process.exit(1);
  }
  
  // Get original file size
  const originalSize = getFileSizeKB(CONFIG.sourceFile);
  console.log(`📄 Reading ${CONFIG.sourceFile} (${originalSize} KB)...`);
  
  // Create backup
  if (!CONFIG.dryRun) {
    createBackup(CONFIG.sourceFile);
  }
  
  // Load menu data
  let menuData;
  try {
    const rawData = fs.readFileSync(CONFIG.sourceFile, 'utf8');
    menuData = JSON.parse(rawData);
  } catch (error) {
    console.error(`❌ Error reading menu.json:`, error);
    process.exit(1);
  }
  
  // Split the data
  console.log(`\n🔪 Splitting data...`);
  const { menuIndex, projectFiles, projectCount } = splitMenuData(menuData);
  console.log(`   Found ${projectCount} projects across ${menuIndex.length} categories`);
  
  // Validate before writing
  console.log(`\n🔍 Validating data...`);
  const validationIssues = validateData(menuData, menuIndex, projectFiles);
  
  if (validationIssues.length > 0 && !CONFIG.dryRun) {
    console.log(`⚠️  Validation issues found. Review before proceeding:`);
    validationIssues.forEach(issue => console.log(`   - ${issue}`));
    console.log(`\nTo proceed anyway, set dryRun to false and run again.`);
    process.exit(1);
  }
  
  // Write files
  console.log(`\n📝 Writing files...`);
  const { filesWritten, totalSize, errors } = writeFiles(menuIndex, projectFiles);
  
  if (errors.length > 0) {
    console.error(`❌ Errors occurred during file writing:`, errors);
    process.exit(1);
  }
  
  // Generate report
  generateReport(parseFloat(originalSize), totalSize, projectCount, validationIssues);
  
  console.log(`\n📋 Next Steps:`);
  console.log(`   1. Review the generated files in data/projects/`);
  console.log(`   2. Check menu-index.json for completeness`);
  console.log(`   3. Test locally before deploying`);
  console.log(`   4. Original menu.json remains unchanged as fallback\n`);
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { splitMenuData, createMenuIndexEntry, createProjectDetailFile };


