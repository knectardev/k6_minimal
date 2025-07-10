#!/usr/bin/env python3
"""
Debug script to investigate TinyPNG API response
"""

import requests
import base64
from pathlib import Path
import json

# TinyPNG API Configuration
API_KEY = "xVnmF65CsgT69df5Yk5MVT5C6pkNrD7N"
API_URL = "https://api.tinify.com/shrink"

def debug_api_response():
    """Debug the API response to see what's actually being returned"""
    print("=== Debugging TinyPNG API Response ===")
    
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
    print(f"Original size: {test_file.stat().st_size} bytes")
    
    # Read the file
    with open(test_file, 'rb') as f:
        image_data = f.read()
    
    print(f"Read {len(image_data)} bytes from file")
    
    # Make API request
    auth_string = f"api:{API_KEY}"
    auth_bytes = auth_string.encode('ascii')
    auth_b64 = base64.b64encode(auth_bytes).decode('ascii')
    
    headers = {
        'Authorization': f'Basic {auth_b64}'
    }
    
    print("Making API request...")
    response = requests.post(API_URL, data=image_data, headers=headers, timeout=30)
    
    print(f"Response status: {response.status_code}")
    print(f"Response headers: {dict(response.headers)}")
    print(f"Response content length: {len(response.content)} bytes")
    
    # Check if it's JSON (error response) or binary (image data)
    try:
        json_response = response.json()
        print("Response is JSON (likely error):")
        print(json.dumps(json_response, indent=2))
    except:
        print("Response is binary (image data)")
        print(f"First 100 bytes: {response.content[:100]}")
        
        # Check if it looks like a valid image
        if response.content.startswith(b'\x89PNG'):
            print("✓ Response appears to be a valid PNG file")
        elif response.content.startswith(b'\xff\xd8\xff'):
            print("✓ Response appears to be a valid JPEG file")
        elif response.content.startswith(b'RIFF'):
            print("✓ Response appears to be a valid WebP file")
        else:
            print("✗ Response doesn't appear to be a valid image file")
            print(f"Magic bytes: {response.content[:8].hex()}")

if __name__ == "__main__":
    debug_api_response() 