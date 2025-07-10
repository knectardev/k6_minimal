#!/usr/bin/env python3
"""
Test script for the fixed optimization process
"""

import requests
import json
import base64
from pathlib import Path

# TinyPNG API Configuration
API_KEY = "xVnmF65CsgT69df5Yk5MVT5C6pkNrD7N"
API_URL = "https://api.tinify.com/shrink"

def test_fixed_optimization():
    """Test the fixed optimization process"""
    print("=== Testing Fixed Optimization Process ===")
    
    # Get project root and find a test file
    current_dir = Path(__file__).parent
    project_root = current_dir.parent
    project_tiles_dir = project_root / "project_tiles"
    
    # Find a test file
    test_file = project_tiles_dir / "bezier.png"
    
    if not test_file.exists():
        print(f"Test file not found: {test_file}")
        return
    
    print(f"Testing with: {test_file.name}")
    original_size = test_file.stat().st_size
    print(f"Original size: {original_size} bytes ({original_size / 1024:.1f} KB)")
    
    # Read the file
    with open(test_file, 'rb') as f:
        image_data = f.read()
    
    # Make API request
    auth_string = f"api:{API_KEY}"
    auth_bytes = auth_string.encode('ascii')
    auth_b64 = base64.b64encode(auth_bytes).decode('ascii')
    
    headers = {
        'Authorization': f'Basic {auth_b64}'
    }
    
    print("Step 1: Uploading image to TinyPNG...")
    response = requests.post(API_URL, data=image_data, headers=headers, timeout=30)
    
    if response.status_code == 201:
        result = response.json()
        optimized_url = result['output']['url']
        expected_size = result['output']['size']
        
        print(f"✓ Upload successful!")
        print(f"Expected optimized size: {expected_size} bytes ({expected_size / 1024:.1f} KB)")
        print(f"Optimization URL: {optimized_url}")
        
        # Download the optimized image
        print("Step 2: Downloading optimized image...")
        download_response = requests.get(optimized_url, timeout=30)
        
        if download_response.status_code == 200:
            optimized_data = download_response.content
            actual_size = len(optimized_data)
            
            print(f"✓ Download successful!")
            print(f"Actual downloaded size: {actual_size} bytes ({actual_size / 1024:.1f} KB)")
            
            if actual_size == expected_size:
                print("✓ Size verification passed!")
                
                # Check if it's a valid image
                if optimized_data.startswith(b'\x89PNG'):
                    print("✓ Downloaded data appears to be a valid PNG file")
                    
                    # Calculate savings
                    savings = original_size - actual_size
                    savings_percent = (savings / original_size) * 100
                    
                    print(f"Space saved: {savings} bytes ({savings / 1024:.1f} KB) - {savings_percent:.1f}%")
                    
                    # Ask if user wants to overwrite the file
                    print(f"\nDo you want to overwrite {test_file.name} with the optimized version?")
                    print("Type 'yes' to proceed, anything else to skip:")
                    user_input = input().strip().lower()
                    
                    if user_input == 'yes':
                        with open(test_file, 'wb') as f:
                            f.write(optimized_data)
                        print(f"✓ Successfully overwrote {test_file.name}")
                    else:
                        print("Skipped overwriting file.")
                    
                    return True
                else:
                    print("✗ Downloaded data doesn't appear to be a valid PNG file")
                    print(f"First 8 bytes: {optimized_data[:8].hex()}")
                    return False
            else:
                print(f"✗ Size mismatch! Expected {expected_size}, got {actual_size}")
                return False
        else:
            print(f"✗ Download failed: {download_response.status_code}")
            return False
    else:
        print(f"✗ Upload failed: {response.status_code}")
        if response.text:
            print(f"Error: {response.text}")
        return False

if __name__ == "__main__":
    success = test_fixed_optimization()
    if success:
        print("\n✓ Fixed optimization test passed!")
    else:
        print("\n✗ Fixed optimization test failed!") 