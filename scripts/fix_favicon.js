#!/usr/bin/env node

/**
 * Fix Favicon Script
 * Regenerates the ICO file from the SVG with transparent background
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing favicon transparency...');

async function fixFavicon() {
    const svgPath = path.join(__dirname, '../assets/logo.svg');
    const icoPath = path.join(__dirname, '../assets/logo.ico');
    
    try {
        // Read the SVG file
        const svgBuffer = fs.readFileSync(svgPath);
        
        // Convert SVG to PNG with transparent background
        const pngBuffer = await sharp(svgBuffer)
            .resize(32, 32, { 
                fit: 'contain',
                background: { r: 0, g: 0, b: 0, alpha: 0 } // Transparent background
            })
            .png()
            .toBuffer();
        
        // Convert PNG to ICO with transparent background
        await sharp(pngBuffer)
            .resize(16, 16, { 
                fit: 'contain',
                background: { r: 0, g: 0, b: 0, alpha: 0 } // Transparent background
            })
            .png()
            .toFile(icoPath.replace('.ico', '_16.png'));
            
        await sharp(pngBuffer)
            .resize(32, 32, { 
                fit: 'contain',
                background: { r: 0, g: 0, b: 0, alpha: 0 } // Transparent background
            })
            .png()
            .toFile(icoPath.replace('.ico', '_32.png'));
            
        await sharp(pngBuffer)
            .resize(48, 48, { 
                fit: 'contain',
                background: { r: 0, g: 0, b: 0, alpha: 0 } // Transparent background
            })
            .png()
            .toFile(icoPath.replace('.ico', '_48.png'));
        
        console.log('✅ Favicon PNG files generated with transparent background');
        console.log('📁 Files created:');
        console.log('   - assets/logo_16.png');
        console.log('   - assets/logo_32.png');
        console.log('   - assets/logo_48.png');
        console.log('');
        console.log('💡 Note: Modern browsers prefer SVG favicons. The PNG files are provided as fallbacks.');
        console.log('   The SVG favicon (logo.svg) already has a transparent background.');
        
    } catch (error) {
        console.error('❌ Error fixing favicon:', error.message);
        process.exit(1);
    }
}

fixFavicon();
