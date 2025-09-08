# Scripts Directory

This directory contains utility scripts for maintaining and optimizing the Knectar portfolio website.

## Sitemap Generator

### Overview
The sitemap generator (`generate_sitemap.js`) automatically creates a `sitemap.xml` file based on the current project structure and menu data.

### Usage

#### Command Line (Node.js)
```bash
node scripts/generate_sitemap.js
```

#### NPM Script
```bash
npm run generate-sitemap
```

#### Windows Batch File
```bash
scripts/generate_sitemap.bat
```

### Features
- **Automatic Discovery**: Reads project data from `data/menu.json`
- **Smart Categorization**: Automatically categorizes projects by type
- **SEO Optimized**: Sets appropriate priorities and change frequencies
- **Current Date**: Uses today's date as the lastmod value
- **Comprehensive**: Includes all main pages and project pages

### Configuration
The script uses the following configuration (editable in the script):
- **Base URL**: `https://www.knectar.com`
- **Menu File**: `data/menu.json`
- **Output File**: `sitemap.xml`

### Project Categories
Projects are automatically categorized and assigned appropriate priorities:
- **Higher Education** (0.8 priority)
- **Intranets & Portals** (0.8 priority)
- **Web & iOS Apps** (0.7 priority)
- **Informational** (0.7 priority)
- **E-Commerce** (0.7 priority)
- **Programming & Technical** (0.6 priority)
- **Music & Art** (0.6 priority)

### When to Run
Run the sitemap generator whenever you:
- Add new projects to `data/menu.json`
- Add new main pages to the site
- Change the site structure
- Want to update the lastmod dates

### Output
The script generates a valid XML sitemap that can be submitted to search engines like Google Search Console.

## Other Scripts

- `optimize_images.js` - Image optimization utility
- `cleanup_backups.js` - Clean up backup files
- `fix_favicon.js` - Fix favicon references
- `test_single_image.js` - Test image optimization on single files
- `update_detail_images.js` - Update project detail images
