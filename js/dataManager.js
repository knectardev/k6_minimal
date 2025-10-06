/**
 * Menu Data Manager
 * 
 * Provides lazy-loading capability for menu and project data.
 * Maintains full backwards compatibility with legacy menu.json system.
 * 
 * Features:
 * - Loads lightweight menu-index.json (19KB) instead of full menu.json (305KB)
 * - Lazy-loads individual project data only when needed
 * - Graceful fallback to legacy menu.json if new files don't exist
 * - Caching to prevent duplicate requests
 * - Feature flag controlled via localStorage
 * 
 * Usage:
 *   // Enable new system (for testing)
 *   localStorage.setItem('useMenuIndex', 'true');
 *   
 *   // Disable and use legacy system
 *   localStorage.removeItem('useMenuIndex');
 */

class MenuDataManager {
  constructor() {
    this.menuIndex = null;
    this.projectCache = new Map();
    this.useLegacyMode = false;
    this.legacyData = null;
    
    // Check feature flag
    this.enabled = localStorage.getItem('useMenuIndex') === 'true';
    
    if (this.enabled) {
      console.log('🚀 MenuDataManager: New lazy-loading system enabled');
    } else {
      console.log('📦 MenuDataManager: Using legacy menu.json (new system disabled)');
    }
  }

  /**
   * Load menu structure (lightweight or legacy)
   * @returns {Promise<Array>} Menu data array
   */
  async loadMenuIndex() {
    // If feature is disabled, don't even try
    if (!this.enabled) {
      console.log('📦 Loading legacy menu.json (feature disabled)');
      return this.loadLegacyMenu();
    }

    try {
      console.log('⚡ Attempting to load menu-index.json...');
      const response = await fetch('/data/menu-index.json');
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      this.menuIndex = await response.json();
      console.log(`✅ Loaded menu-index.json: ${this.menuIndex.length} categories`);
      return this.menuIndex;
      
    } catch (error) {
      console.warn('⚠️ Failed to load menu-index.json:', error.message);
      console.log('📦 Falling back to legacy menu.json...');
      return this.loadLegacyMenu();
    }
  }

  /**
   * Load legacy menu.json (fallback)
   * @returns {Promise<Array>} Menu data array
   */
  async loadLegacyMenu() {
    this.useLegacyMode = true;
    
    try {
      const response = await fetch('/data/menu.json');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      this.legacyData = await response.json();
      console.log('✅ Loaded legacy menu.json');
      return this.legacyData;
      
    } catch (error) {
      console.error('❌ Failed to load menu.json:', error);
      throw error;
    }
  }

  /**
   * Load individual project data
   * @param {string} slug - Project slug
   * @returns {Promise<Object|null>} Project data object
   */
  async loadProjectData(slug) {
    if (!slug || slug.trim() === '') {
      console.warn('⚠️ loadProjectData called with empty slug');
      return null;
    }

    // Check cache first
    if (this.projectCache.has(slug)) {
      console.log(`💾 Using cached data for: ${slug}`);
      return this.projectCache.get(slug);
    }

    // If in legacy mode or feature disabled, extract from full menu data
    if (this.useLegacyMode || !this.enabled) {
      return this.extractFromLegacy(slug);
    }

    // Try to load individual project file
    try {
      console.log(`⚡ Loading project data: ${slug}`);
      const response = await fetch(`/data/projects/${slug}.json`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Merge with menu index data to get complete project info
      const menuEntry = this.findInMenuIndex(slug);
      const mergedData = { ...menuEntry, ...data };
      
      // Cache it
      this.projectCache.set(slug, mergedData);
      console.log(`✅ Loaded project: ${slug}`);
      
      return mergedData;
      
    } catch (error) {
      console.warn(`⚠️ Failed to load project file for ${slug}:`, error.message);
      console.log('📦 Falling back to legacy data extraction...');
      
      // Fallback to legacy extraction
      return this.extractFromLegacy(slug);
    }
  }

  /**
   * Find project in menu index
   * @param {string} slug - Project slug
   * @returns {Object|null} Menu index entry
   */
  findInMenuIndex(slug) {
    if (!this.menuIndex) return null;
    
    for (const category of this.menuIndex) {
      if (category.submenu) {
        const project = category.submenu.find(p => p.slug === slug);
        if (project) return project;
      }
    }
    return null;
  }

  /**
   * Extract project data from legacy menu.json
   * @param {string} slug - Project slug
   * @returns {Object|null} Project data
   */
  extractFromLegacy(slug) {
    // Use global legacy data if available
    const menuData = this.legacyData || window.__MENU_DATA;
    
    if (!menuData) {
      console.error('❌ No legacy menu data available');
      return null;
    }

    for (const category of menuData) {
      if (category.submenu) {
        const project = category.submenu.find(p => p.slug === slug);
        if (project) {
          console.log(`✅ Extracted from legacy data: ${slug}`);
          // Cache it for future requests
          this.projectCache.set(slug, project);
          return project;
        }
      }
    }
    
    console.warn(`⚠️ Project not found in legacy data: ${slug}`);
    return null;
  }

  /**
   * Preload multiple projects (optional optimization)
   * @param {Array<string>} slugs - Array of project slugs
   * @returns {Promise<Array>} Array of project data
   */
  async preloadProjects(slugs) {
    if (!Array.isArray(slugs) || slugs.length === 0) {
      return [];
    }

    console.log(`📥 Preloading ${slugs.length} projects...`);
    const promises = slugs.map(slug => this.loadProjectData(slug));
    return Promise.all(promises);
  }

  /**
   * Clear cache (useful for testing)
   */
  clearCache() {
    this.projectCache.clear();
    console.log('🗑️ Cache cleared');
  }

  /**
   * Get cache statistics
   * @returns {Object} Cache stats
   */
  getCacheStats() {
    return {
      size: this.projectCache.size,
      enabled: this.enabled,
      useLegacyMode: this.useLegacyMode,
      projects: Array.from(this.projectCache.keys())
    };
  }

  /**
   * Enable the new system (for testing)
   */
  static enable() {
    localStorage.setItem('useMenuIndex', 'true');
    console.log('✅ New menu system enabled. Reload the page to apply.');
  }

  /**
   * Disable the new system (revert to legacy)
   */
  static disable() {
    localStorage.removeItem('useMenuIndex');
    console.log('📦 Reverted to legacy menu.json. Reload the page to apply.');
  }

  /**
   * Check if new system is enabled
   * @returns {boolean}
   */
  static isEnabled() {
    return localStorage.getItem('useMenuIndex') === 'true';
  }
}

// Create global instance
window.menuDataManager = new MenuDataManager();

// Expose utility functions globally for console debugging
window.enableNewMenuSystem = MenuDataManager.enable;
window.disableNewMenuSystem = MenuDataManager.disable;

// Log instructions for developers
if (typeof console !== 'undefined') {
  console.log('%c💡 Menu Data Manager Available', 'color: #4CAF50; font-weight: bold');
  console.log('%cTo test the new lazy-loading system:', 'color: #666');
  console.log('%c  enableNewMenuSystem()  - Enable and reload', 'color: #2196F3');
  console.log('%c  disableNewMenuSystem() - Disable and reload', 'color: #2196F3');
  console.log('%c  menuDataManager.getCacheStats() - View cache stats', 'color: #2196F3');
}

