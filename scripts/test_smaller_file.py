#!/usr/bin/env python3
"""
Test script for a smaller file optimization
"""

import requests
import json
import base64
from pathlib import Path

# TinyPNG API Configuration
API_KEY = "xVnmF65CsgT69df5Yk5MVT5C6pkNrD7N"
API_URL = "https://api.tinify.com/shrink"

# Conservative settings
MIN_SIZE_TO_OPTIMIZE = 200 * 1024  # 200KB
MAX_REDUCTION_PERCENT = 30  # 30%

def test_smaller_file():
    """Test with a smaller file that might be reasonable to optimize"""
    print("=== Testing Smaller File Optimization ===")
    
    # Get project root and find a test file
    current_dir = Path(__file__).parent
    project_root = current_dir.parent
    project_tiles_dir = project_root / "project_tiles"
    
    # Find a file that's just above the threshold
    test_file = None
    for file_path in project_tiles_dir.iterdir():
        if file_path.is_file() and file_path.suffix.lower() == '.png':
            size = file_path.stat().st_size
            if MIN_SIZE_TO_OPTIMIZE <= size <= 500 * 1024:  # Between 200KB and 500KB
                test_file = file_path
                break
    
    if not test_file:
        print("No suitable smaller PNG files found to test with.")
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
        
        # Calculate potential savings
        potential_savings = original_size - expected_size
        potential_savings_percent = (potential_savings / original_size) * 100
        
        print(f"Potential savings: {potential_savings} bytes ({potential_savings / 1024:.1f} KB) - {potential_savings_percent:.1f}%")
        
        # Check if reduction would be acceptable
        if potential_savings_percent > MAX_REDUCTION_PERCENT:
            print(f"⚠️  Reduction would be {potential_savings_percent:.1f}% (max {MAX_REDUCTION_PERCENT}%)")
            print("This file would be skipped to preserve quality.")
            return True
        else:
            print(f"✓ Reduction is acceptable ({potential_savings_percent:.1f}% <= {MAX_REDUCTION_PERCENT}%)")
            
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
    success = test_smaller_file()
    if success:
        print("\n✓ Smaller file optimization test completed!")
    else:
        print("\n✗ Smaller file optimization test failed!") 