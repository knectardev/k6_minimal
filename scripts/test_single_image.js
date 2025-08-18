#!/usr/bin/env node

/**
 * Simple test to convert one image to WebP
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Testing single image conversion...');

// Check if we can use sharp
let useSharp = false;
try {
    require.resolve('sharp');
    useSharp = true;
    console.log('✅ Sharp available');
} catch (e) {
    console.log('⚠️  Sharp not available, that\'s ok');
}

/**
 * Convert image to WebP using Sharp
 */
async function convertWithSharp(inputPath, outputPath) {
    const sharp = require('sharp');
    
    const info = await sharp(inputPath)
        .webp({ 
            quality: 85,
            effort: 6
        })
        .toFile(outputPath);
    
    return info;
}

/**
 * Get file size in KB
 */
function getFileSizeKB(filePath) {
    const stats = fs.statSync(filePath);
    return Math.round(stats.size / 1024);
}

async function testSingleImage() {
    // Find the first PNG file in project_tiles (they tend to be smaller)
    const tilesDir = 'project_tiles';
    
    if (!fs.existsSync(tilesDir)) {
        console.error('❌ project_tiles directory not found');
        return;
    }
    
    const files = fs.readdirSync(tilesDir);
    const pngFile = files.find(f => f.toLowerCase().endsWith('.png'));
    
    if (!pngFile) {
        console.error('❌ No PNG files found in project_tiles');
        return;
    }
    
    const inputPath = path.join(tilesDir, pngFile);
    const baseName = path.basename(pngFile, '.png');
    const outputPath = path.join(tilesDir, `${baseName}_test.webp`);
    
    console.log(`📁 Testing with: ${pngFile}`);
    
    const originalSize = getFileSizeKB(inputPath);
    console.log(`📏 Original size: ${originalSize}KB`);
    
    if (!useSharp) {
        console.log('❌ Cannot test without Sharp library');
        console.log('💡 Run: npm install sharp');
        return;
    }
    
    try {
        const info = await convertWithSharp(inputPath, outputPath);
        
        if (fs.existsSync(outputPath)) {
            const webpSize = getFileSizeKB(outputPath);
            const savings = Math.round(((originalSize - webpSize) / originalSize) * 100);
            
            console.log(`✅ Conversion successful!`);
            console.log(`📦 WebP size: ${webpSize}KB`);
            console.log(`💾 Space saved: ${savings}%`);
            console.log(`📝 Output: ${outputPath}`);
            
            // Clean up test file
            fs.unlinkSync(outputPath);
            console.log('🧹 Cleaned up test file');
        }
    } catch (error) {
        console.error('❌ Conversion failed:', error.message);
    }
}

testSingleImage().catch(console.error);

