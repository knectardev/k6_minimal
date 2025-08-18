#!/usr/bin/env node

/**
 * Image Optimization Script
 * Converts PNG/JPG images to WebP format while maintaining quality
 * Only processes images that don't already have WebP versions
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const DIRECTORIES = ['project_images', 'project_tiles'];
const SUPPORTED_FORMATS = ['.png', '.jpg', '.jpeg'];
const WEBP_QUALITY = 85; // High quality setting
const MAX_WIDTH = 1920; // Max width for optimization

console.log('🖼️  Starting image optimization...');

// Check if we can use sharp (preferred) or fall back to other tools
let useSharp = false;
try {
    require.resolve('sharp');
    useSharp = true;
    console.log('✅ Using Sharp for image processing');
} catch (e) {
    console.log('⚠️  Sharp not available, will attempt to use system tools');
}

/**
 * Convert image to WebP using Sharp (Node.js library)
 */
async function convertWithSharp(inputPath, outputPath) {
    const sharp = require('sharp');
    
    await sharp(inputPath)
        .resize(MAX_WIDTH, null, { 
            withoutEnlargement: true,
            fit: 'inside'
        })
        .webp({ 
            quality: WEBP_QUALITY,
            effort: 6 // Higher effort for better compression
        })
        .toFile(outputPath);
}

/**
 * Convert image to WebP using system cwebp tool
 */
function convertWithCWebP(inputPath, outputPath) {
    const cmd = `cwebp -q ${WEBP_QUALITY} -resize ${MAX_WIDTH} 0 "${inputPath}" -o "${outputPath}"`;
    execSync(cmd, { stdio: 'ignore' });
}

/**
 * Get file size in KB
 */
function getFileSizeKB(filePath) {
    const stats = fs.statSync(filePath);
    return Math.round(stats.size / 1024);
}

/**
 * Process a single image file
 */
async function processImage(inputPath) {
    const ext = path.extname(inputPath).toLowerCase();
    if (!SUPPORTED_FORMATS.includes(ext)) {
        return;
    }

    const dir = path.dirname(inputPath);
    const basename = path.basename(inputPath, ext);
    const webpPath = path.join(dir, `${basename}.webp`);

    // Skip if WebP version already exists
    if (fs.existsSync(webpPath)) {
        console.log(`⏭️  Skipping ${path.basename(inputPath)} (WebP exists)`);
        return;
    }

    const originalSize = getFileSizeKB(inputPath);
    
    try {
        if (useSharp) {
            await convertWithSharp(inputPath, webpPath);
        } else {
            convertWithCWebP(inputPath, webpPath);
        }

        if (fs.existsSync(webpPath)) {
            const webpSize = getFileSizeKB(webpPath);
            const savings = Math.round(((originalSize - webpSize) / originalSize) * 100);
            console.log(`✅ ${path.basename(inputPath)}: ${originalSize}KB → ${webpSize}KB (${savings}% smaller)`);
        }
    } catch (error) {
        console.error(`❌ Failed to convert ${path.basename(inputPath)}:`, error.message);
    }
}

/**
 * Process all images in a directory
 */
async function processDirectory(dirPath) {
    if (!fs.existsSync(dirPath)) {
        console.log(`⚠️  Directory ${dirPath} doesn't exist, skipping`);
        return;
    }

    console.log(`\n📁 Processing ${dirPath}/`);
    const files = fs.readdirSync(dirPath);
    
    for (const file of files) {
        const filePath = path.join(dirPath, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isFile()) {
            await processImage(filePath);
        }
    }
}

/**
 * Main execution
 */
async function main() {
    // Check for required dependencies
    if (!useSharp) {
        try {
            execSync('cwebp -version', { stdio: 'ignore' });
            console.log('✅ Found cwebp system tool');
        } catch (e) {
            console.error('❌ Neither Sharp nor cwebp found. Please install one of:');
            console.error('   npm install sharp');
            console.error('   OR install WebP tools: https://developers.google.com/speed/webp/download');
            process.exit(1);
        }
    }

    let totalProcessed = 0;
    
    for (const dir of DIRECTORIES) {
        await processDirectory(dir);
    }

    console.log('\n🎉 Image optimization complete!');
    console.log('\n📋 Next steps:');
    console.log('   1. Test your site to ensure WebP images load correctly');
    console.log('   2. Consider removing original PNG/JPG files if satisfied with WebP quality');
    console.log('   3. Monitor page load times for improvement');
}

// Handle both direct execution and module import
if (require.main === module) {
    main().catch(console.error);
}

module.exports = { processImage, processDirectory };
