#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const REDIRECTS_FILE = path.join(__dirname, '..', 'redirects.json');

// Load current redirects
function loadRedirects() {
  try {
    if (fs.existsSync(REDIRECTS_FILE)) {
      return JSON.parse(fs.readFileSync(REDIRECTS_FILE, 'utf8'));
    }
  } catch (error) {
    console.error('Error loading redirects:', error.message);
  }
  
  return {
    redirects: {
      exact: {},
      patterns: {},
      wildcards: {}
    },
    metadata: {
      description: "301 redirect configuration for Knectar portfolio site",
      last_updated: new Date().toISOString().split('T')[0],
      version: "1.0"
    }
  };
}

// Save redirects
function saveRedirects(config) {
  try {
    config.metadata.last_updated = new Date().toISOString().split('T')[0];
    fs.writeFileSync(REDIRECTS_FILE, JSON.stringify(config, null, 2));
    console.log('✅ Redirects saved successfully');
  } catch (error) {
    console.error('❌ Error saving redirects:', error.message);
  }
}

// Add a redirect
function addRedirect(type, from, to) {
  const config = loadRedirects();
  
  if (!config.redirects[type]) {
    console.error(`❌ Invalid redirect type: ${type}. Use 'exact', 'patterns', or 'wildcards'`);
    return;
  }
  
  config.redirects[type][from] = to;
  saveRedirects(config);
  console.log(`✅ Added ${type} redirect: ${from} → ${to}`);
}

// Remove a redirect
function removeRedirect(type, from) {
  const config = loadRedirects();
  
  if (!config.redirects[type]) {
    console.error(`❌ Invalid redirect type: ${type}`);
    return;
  }
  
  if (config.redirects[type][from]) {
    delete config.redirects[type][from];
    saveRedirects(config);
    console.log(`✅ Removed ${type} redirect: ${from}`);
  } else {
    console.log(`⚠️  No ${type} redirect found for: ${from}`);
  }
}

// List all redirects
function listRedirects() {
  const config = loadRedirects();
  
  console.log('\n📋 Current Redirects:\n');
  
  Object.entries(config.redirects).forEach(([type, redirects]) => {
    if (Object.keys(redirects).length > 0) {
      console.log(`\n${type.toUpperCase()}:`);
      Object.entries(redirects).forEach(([from, to]) => {
        console.log(`  ${from} → ${to}`);
      });
    }
  });
  
  console.log(`\n📅 Last updated: ${config.metadata.last_updated}`);
}

// Validate redirects
function validateRedirects() {
  const config = loadRedirects();
  let isValid = true;
  
  console.log('\n🔍 Validating redirects...\n');
  
  Object.entries(config.redirects).forEach(([type, redirects]) => {
    Object.entries(redirects).forEach(([from, to]) => {
      // Check if destination starts with /
      if (!to.startsWith('/')) {
        console.log(`❌ ${type}: ${from} → ${to} (destination should start with /)`);
        isValid = false;
      }
      
      // Check for circular redirects
      if (from === to) {
        console.log(`❌ ${type}: ${from} → ${to} (circular redirect)`);
        isValid = false;
      }
    });
  });
  
  if (isValid) {
    console.log('✅ All redirects are valid');
  }
  
  return isValid;
}

// CLI interface
function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  switch (command) {
    case 'add':
      if (args.length !== 4) {
        console.log('Usage: node manage_redirects.js add <type> <from> <to>');
        console.log('Types: exact, patterns, wildcards');
        console.log('Example: node manage_redirects.js add exact /old-page /new-page');
        return;
      }
      addRedirect(args[1], args[2], args[3]);
      break;
      
    case 'remove':
      if (args.length !== 3) {
        console.log('Usage: node manage_redirects.js remove <type> <from>');
        console.log('Example: node manage_redirects.js remove exact /old-page');
        return;
      }
      removeRedirect(args[1], args[2]);
      break;
      
    case 'list':
      listRedirects();
      break;
      
    case 'validate':
      validateRedirects();
      break;
      
    default:
      console.log('📖 Redirect Management Tool\n');
      console.log('Commands:');
      console.log('  add <type> <from> <to>     - Add a redirect');
      console.log('  remove <type> <from>       - Remove a redirect');
      console.log('  list                       - List all redirects');
      console.log('  validate                   - Validate redirects\n');
      console.log('Types:');
      console.log('  exact      - Exact path matches');
      console.log('  patterns   - Pattern matches');
      console.log('  wildcards  - Wildcard patterns (use *)\n');
      console.log('Examples:');
      console.log('  node manage_redirects.js add exact /old-about /about.html');
      console.log('  node manage_redirects.js add wildcards /old-blog/* /blog.html');
      console.log('  node manage_redirects.js remove exact /old-about');
      console.log('  node manage_redirects.js list');
      console.log('  node manage_redirects.js validate');
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  loadRedirects,
  saveRedirects,
  addRedirect,
  removeRedirect,
  listRedirects,
  validateRedirects
}; 