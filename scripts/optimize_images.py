#!/usr/bin/env python3
"""
Image Optimization Script using TinyPNG API
Optimizes all project tile images to reduce file sizes while maintaining quality.
"""

import os
import requests
import json
import base64
from pathlib import Path
import time

# TinyPNG API Configuration
API_KEY = "xVnmF65CsgT69df5Yk5MVT5C6pkNrD7N"
API_URL = "https://api.tinify.com/shrink"

# Supported image formats
SUPPORTED_FORMATS = {'.png', '.jpg', '.jpeg', '.webp'}

# Exclude these files from optimization
EXCLUDE_FILES = {
    'desktop.ini',  # Windows system file
    'sample_tile1.png',  # Sample files
    'sample_tile2.png',
}

def get_project_root():
    """Get the project root directory"""
    current_dir = Path(__file__).parent
    return current_dir.parent

def get_image_files(project_tiles_dir):
    """Get all image files that should be optimized"""
    image_files = []
    
    for file_path in project_tiles_dir.iterdir():
        if file_path.is_file():
            # Skip excluded files
            if file_path.name in EXCLUDE_FILES:
                print(f"Skipping excluded file: {file_path.name}")
                continue
                
            # Check if it's a supported image format
            if file_path.suffix.lower() in SUPPORTED_FORMATS:
                image_files.append(file_path)
    
    return image_files

def optimize_image(file_path, api_key):
    """Optimize a single image using TinyPNG API"""
    try:
        # Read the image file
        with open(file_path, 'rb') as f:
            image_data = f.read()
        
        # Get original file size
        original_size = len(image_data)
        
        print(f"Optimizing: {file_path.name} ({original_size / 1024:.1f} KB)")
        
        # Make API request with proper Basic auth encoding
        # TinyPNG uses "api:" prefix for the username
        auth_string = f"api:{api_key}"
        auth_bytes = auth_string.encode('ascii')
        auth_b64 = base64.b64encode(auth_bytes).decode('ascii')
        
        headers = {
            'Authorization': f'Basic {auth_b64}'
        }
        
        response = requests.post(API_URL, data=image_data, headers=headers)
        
        if response.status_code == 201:
            # Success - get optimized image data
            optimized_data = response.content
            
            # Get compression info
            compression_count = response.headers.get('Compression-Count', 'Unknown')
            print(f"  Compression count: {compression_count}")
            
            # Calculate savings
            optimized_size = len(optimized_data)
            savings = original_size - optimized_size
            savings_percent = (savings / original_size) * 100
            
            print(f"  Original: {original_size / 1024:.1f} KB")
            print(f"  Optimized: {optimized_size / 1024:.1f} KB")
            print(f"  Savings: {savings / 1024:.1f} KB ({savings_percent:.1f}%)")
            
            # Write optimized image back to file
            with open(file_path, 'wb') as f:
                f.write(optimized_data)
            
            print(f"  ✓ Successfully optimized {file_path.name}")
            return True, original_size, optimized_size
            
        else:
            print(f"  ✗ Failed to optimize {file_path.name}: {response.status_code}")
            if response.text:
                print(f"    Error: {response.text}")
            return False, 0, 0
            
    except Exception as e:
        print(f"  ✗ Error optimizing {file_path.name}: {str(e)}")
        return False, 0, 0

def main():
    """Main function to optimize all project tile images"""
    print("=== Project Tile Image Optimization ===")
    print(f"Using TinyPNG API key: {API_KEY[:8]}...")
    print()
    
    # Get project root and project_tiles directory
    project_root = get_project_root()
    project_tiles_dir = project_root / "project_tiles"
    
    if not project_tiles_dir.exists():
        print(f"Error: Project tiles directory not found at {project_tiles_dir}")
        return
    
    # Get all image files
    image_files = get_image_files(project_tiles_dir)
    
    if not image_files:
        print("No image files found to optimize.")
        return
    
    print(f"Found {len(image_files)} image files to optimize:")
    for img_file in image_files:
        print(f"  - {img_file.name}")
    print()
    
    # Statistics
    total_original_size = 0
    total_optimized_size = 0
    successful_optimizations = 0
    failed_optimizations = 0
    
    # Optimize each image
    for i, image_file in enumerate(image_files, 1):
        print(f"[{i}/{len(image_files)}] ", end="")
        
        success, original_size, optimized_size = optimize_image(image_file, API_KEY)
        
        if success:
            total_original_size += original_size
            total_optimized_size += optimized_size
            successful_optimizations += 1
        else:
            failed_optimizations += 1
        
        # Add a small delay to be respectful to the API
        time.sleep(0.5)
        print()
    
    # Print summary
    print("=== Optimization Summary ===")
    print(f"Successfully optimized: {successful_optimizations} files")
    print(f"Failed optimizations: {failed_optimizations} files")
    
    if successful_optimizations > 0:
        total_savings = total_original_size - total_optimized_size
        total_savings_percent = (total_savings / total_original_size) * 100
        
        print(f"Total original size: {total_original_size / 1024 / 1024:.2f} MB")
        print(f"Total optimized size: {total_optimized_size / 1024 / 1024:.2f} MB")
        print(f"Total space saved: {total_savings / 1024 / 1024:.2f} MB ({total_savings_percent:.1f}%)")
    
    print("Optimization complete!")

if __name__ == "__main__":
    main() 