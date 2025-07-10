#!/usr/bin/env python3
"""
Single Image Optimization Script using TinyPNG API
Tests optimization on one file before processing all images.
"""

import os
import requests
import base64
from pathlib import Path
import time

# TinyPNG API Configuration
API_KEY = "xVnmF65CsgT69df5Yk5MVT5C6pkNrD7N"
API_URL = "https://api.tinify.com/shrink"

def get_project_root():
    """Get the project root directory"""
    current_dir = Path(__file__).parent
    return current_dir.parent

def optimize_single_image(file_path, api_key):
    """Optimize a single image using TinyPNG API"""
    try:
        # Read the image file
        with open(file_path, 'rb') as f:
            image_data = f.read()
        
        # Get original file size
        original_size = len(image_data)
        
        print(f"Testing optimization on: {file_path.name}")
        print(f"Original size: {original_size / 1024:.1f} KB")
        
        # Make API request with proper Basic auth encoding
        auth_string = f"api:{api_key}"
        auth_bytes = auth_string.encode('ascii')
        auth_b64 = base64.b64encode(auth_bytes).decode('ascii')
        
        headers = {
            'Authorization': f'Basic {auth_b64}'
        }
        
        print("Making API request...")
        response = requests.post(API_URL, data=image_data, headers=headers, timeout=30)
        
        if response.status_code == 201:
            # Success - get optimized image data
            optimized_data = response.content
            
            # Get compression info
            compression_count = response.headers.get('Compression-Count', 'Unknown')
            print(f"Compression count: {compression_count}")
            
            # Calculate savings
            optimized_size = len(optimized_data)
            savings = original_size - optimized_size
            savings_percent = (savings / original_size) * 100
            
            print(f"Optimized size: {optimized_size / 1024:.1f} KB")
            print(f"Space saved: {savings / 1024:.1f} KB ({savings_percent:.1f}%)")
            
            # Ask user if they want to overwrite the file
            print(f"\nDo you want to overwrite {file_path.name} with the optimized version?")
            print("Type 'yes' to proceed, anything else to skip:")
            user_input = input().strip().lower()
            
            if user_input == 'yes':
                # Write optimized image back to file
                with open(file_path, 'wb') as f:
                    f.write(optimized_data)
                print(f"✓ Successfully optimized and overwrote {file_path.name}")
                return True
            else:
                print("Skipped overwriting file.")
                return True
            
        else:
            print(f"✗ Failed to optimize {file_path.name}: {response.status_code}")
            if response.text:
                print(f"Error: {response.text}")
            return False
            
    except Exception as e:
        print(f"✗ Error optimizing {file_path.name}: {str(e)}")
        return False

def main():
    """Main function to test optimization on one file"""
    print("=== Single Image Optimization Test ===")
    print(f"Using TinyPNG API key: {API_KEY[:8]}...")
    print()
    
    # Get project root and project_tiles directory
    project_root = get_project_root()
    project_tiles_dir = project_root / "project_tiles"
    
    if not project_tiles_dir.exists():
        print(f"Error: Project tiles directory not found at {project_tiles_dir}")
        return
    
    # Find a good test file (small PNG)
    test_file = None
    for file_path in project_tiles_dir.iterdir():
        if file_path.is_file() and file_path.suffix.lower() == '.png':
            # Pick a reasonably sized file for testing
            if file_path.stat().st_size < 500 * 1024:  # Less than 500KB
                test_file = file_path
                break
    
    if not test_file:
        print("No suitable test file found. Looking for any PNG file...")
        for file_path in project_tiles_dir.iterdir():
            if file_path.is_file() and file_path.suffix.lower() == '.png':
                test_file = file_path
                break
    
    if not test_file:
        print("No PNG files found to test with.")
        return
    
    print(f"Testing with file: {test_file.name}")
    print(f"File size: {test_file.stat().st_size / 1024:.1f} KB")
    print()
    
    # Test optimization
    success = optimize_single_image(test_file, API_KEY)
    
    if success:
        print("\n✓ Test completed successfully!")
        print("You can now run the full optimization script if desired.")
    else:
        print("\n✗ Test failed. Please check the error messages above.")

if __name__ == "__main__":
    main() 