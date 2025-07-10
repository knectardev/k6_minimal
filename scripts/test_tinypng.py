#!/usr/bin/env python3
"""
Simple test script to verify TinyPNG API connection
"""

import requests
import base64
import json

# TinyPNG API Configuration
API_KEY = "xVnmF65CsgT69df5Yk5MVT5C6pkNrD7N"
API_URL = "https://api.tinify.com/shrink"

def test_api_connection():
    """Test the TinyPNG API connection"""
    print("Testing TinyPNG API connection...")
    
    # Create a simple test image (1x1 pixel PNG)
    test_image_data = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\tpHYs\x00\x00\x0b\x13\x00\x00\x0b\x13\x01\x00\x9a\x9c\x18\x00\x00\x00\x0cIDATx\x9cc```\x00\x00\x00\x04\x00\x01\xf6\x178U\x00\x00\x00\x00IEND\xaeB`\x82'
    
    # Proper Basic auth encoding
    auth_string = f"api:{API_KEY}"
    auth_bytes = auth_string.encode('ascii')
    auth_b64 = base64.b64encode(auth_bytes).decode('ascii')
    
    headers = {
        'Authorization': f'Basic {auth_b64}'
    }
    
    try:
        print(f"Making request to: {API_URL}")
        print(f"Auth header: Basic {auth_b64[:20]}...")
        
        response = requests.post(API_URL, data=test_image_data, headers=headers, timeout=10)
        
        print(f"Response status: {response.status_code}")
        print(f"Response headers: {dict(response.headers)}")
        
        if response.status_code == 201:
            print("✓ API connection successful!")
            print(f"Compression count: {response.headers.get('Compression-Count', 'Unknown')}")
            return True
        else:
            print(f"✗ API connection failed: {response.status_code}")
            print(f"Response text: {response.text}")
            return False
            
    except requests.exceptions.Timeout:
        print("✗ Request timed out")
        return False
    except requests.exceptions.RequestException as e:
        print(f"✗ Request failed: {e}")
        return False
    except Exception as e:
        print(f"✗ Unexpected error: {e}")
        return False

if __name__ == "__main__":
    success = test_api_connection()
    if success:
        print("\nAPI test passed! Ready to run optimization script.")
    else:
        print("\nAPI test failed! Please check your API key and internet connection.") 