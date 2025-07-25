#!/usr/bin/env python3
"""
Google Drive Access Script for Project Research and Content Generation

This script provides temporary access to Google Drive for:
- Browsing and searching files
- Downloading files for research
- Uploading generated content
- Managing file permissions temporarily

Requirements:
- Google Cloud Project with Drive API enabled
- Service account credentials or OAuth2 setup
- Required Python packages (see requirements.txt)

Usage:
    python google_drive_access.py --help
    python google_drive_access.py list --folder-id "folder_id"
    python google_drive_access.py download --file-id "file_id" --output "local_path"
    python google_drive_access.py upload --file "local_path" --folder-id "folder_id"
    python google_drive_access.py search --query "search_term"
"""

import os
import sys
import argparse
import json
import tempfile
import shutil
from datetime import datetime, timedelta
from typing import List, Dict, Optional, Any
from pathlib import Path

# Google Drive API imports
try:
    from google.oauth2.credentials import Credentials
    from google.oauth2 import service_account
    from google_auth_oauthlib.flow import InstalledAppFlow
    from google.auth.transport.requests import Request
    from googleapiclient.discovery import build
    from googleapiclient.http import MediaFileUpload, MediaIoBaseDownload
    from googleapiclient.errors import HttpError
except ImportError as e:
    print(f"Missing required Google API packages: {e}")
    print("Please install: pip install google-auth google-auth-oauthlib google-auth-httplib2 google-api-python-client")
    sys.exit(1)

# Configuration
SCOPES = ['https://www.googleapis.com/auth/drive']
CREDENTIALS_FILE = 'credentials.json'
TOKEN_FILE = 'token.json'
SERVICE_ACCOUNT_FILE = 'service-account.json'

class GoogleDriveAccess:
    """Main class for Google Drive operations"""
    
    def __init__(self, credentials_path: Optional[str] = None, service_account: bool = False):
        """
        Initialize Google Drive access
        
        Args:
            credentials_path: Path to credentials file
            service_account: Whether to use service account authentication
        """
        self.service = None
        self.credentials_path = credentials_path or CREDENTIALS_FILE
        self.service_account = service_account
        self._authenticate()
    
    def _authenticate(self):
        """Authenticate with Google Drive API"""
        creds = None
        
        if self.service_account:
            # Service account authentication
            if os.path.exists(SERVICE_ACCOUNT_FILE):
                creds = service_account.Credentials.from_service_account_file(
                    SERVICE_ACCOUNT_FILE, scopes=SCOPES
                )
            else:
                raise FileNotFoundError(f"Service account file not found: {SERVICE_ACCOUNT_FILE}")
        else:
            # OAuth2 authentication
            if os.path.exists(TOKEN_FILE):
                creds = Credentials.from_authorized_user_file(TOKEN_FILE, SCOPES)
            
            # If no valid credentials available, let user log in
            if not creds or not creds.valid:
                if creds and creds.expired and creds.refresh_token:
                    creds.refresh(Request())
                else:
                    if not os.path.exists(self.credentials_path):
                        raise FileNotFoundError(
                            f"Credentials file not found: {self.credentials_path}\n"
                            "Please download credentials from Google Cloud Console"
                        )
                    
                    flow = InstalledAppFlow.from_client_secrets_file(
                        self.credentials_path, SCOPES
                    )
                    creds = flow.run_local_server(port=0)
                
                # Save credentials for next run
                with open(TOKEN_FILE, 'w') as token:
                    token.write(creds.to_json())
        
        self.service = build('drive', 'v3', credentials=creds)
    
    def list_files(self, folder_id: Optional[str] = None, page_size: int = 50) -> List[Dict]:
        """
        List files in Google Drive
        
        Args:
            folder_id: ID of folder to list (None for root)
            page_size: Number of files to return per page
            
        Returns:
            List of file metadata dictionaries
        """
        try:
            query = f"'{folder_id}' in parents" if folder_id else None
            results = self.service.files().list(
                q=query,
                pageSize=page_size,
                fields="nextPageToken, files(id, name, mimeType, size, modifiedTime, parents)"
            ).execute()
            
            files = results.get('files', [])
            
            if not files:
                print(f"No files found{' in specified folder' if folder_id else ''}")
            else:
                print(f"Found {len(files)} files:")
                for file in files:
                    size = file.get('size', 'Unknown')
                    modified = file.get('modifiedTime', 'Unknown')
                    print(f"  - {file['name']} (ID: {file['id']}, Size: {size}, Modified: {modified})")
            
            return files
            
        except HttpError as error:
            print(f"An error occurred: {error}")
            return []
    
    def search_files(self, query: str, page_size: int = 50) -> List[Dict]:
        """
        Search for files in Google Drive
        
        Args:
            query: Search query string
            page_size: Number of files to return per page
            
        Returns:
            List of matching file metadata dictionaries
        """
        try:
            results = self.service.files().list(
                q=f"name contains '{query}' or fullText contains '{query}'",
                pageSize=page_size,
                fields="nextPageToken, files(id, name, mimeType, size, modifiedTime, parents)"
            ).execute()
            
            files = results.get('files', [])
            
            if not files:
                print(f"No files found matching '{query}'")
            else:
                print(f"Found {len(files)} files matching '{query}':")
                for file in files:
                    size = file.get('size', 'Unknown')
                    modified = file.get('modifiedTime', 'Unknown')
                    print(f"  - {file['name']} (ID: {file['id']}, Size: {size}, Modified: {modified})")
            
            return files
            
        except HttpError as error:
            print(f"An error occurred: {error}")
            return []
    
    def download_file(self, file_id: str, output_path: str) -> bool:
        """
        Download a file from Google Drive
        
        Args:
            file_id: ID of the file to download
            output_path: Local path to save the file
            
        Returns:
            True if successful, False otherwise
        """
        try:
            # Get file metadata
            file_metadata = self.service.files().get(fileId=file_id).execute()
            file_name = file_metadata.get('name', 'unknown_file')
            
            print(f"Downloading: {file_name}")
            
            # Create output directory if it doesn't exist
            output_dir = os.path.dirname(output_path)
            if output_dir and not os.path.exists(output_dir):
                os.makedirs(output_dir)
            
            # Download the file
            request = self.service.files().get_media(fileId=file_id)
            with open(output_path, 'wb') as f:
                downloader = MediaIoBaseDownload(f, request)
                done = False
                while done is False:
                    status, done = downloader.next_chunk()
                    if status:
                        print(f"Download {int(status.progress() * 100)}%")
            
            print(f"Downloaded: {file_name} -> {output_path}")
            return True
            
        except HttpError as error:
            print(f"An error occurred: {error}")
            return False
    
    def upload_file(self, file_path: str, folder_id: Optional[str] = None, 
                   filename: Optional[str] = None) -> Optional[str]:
        """
        Upload a file to Google Drive
        
        Args:
            file_path: Local path to the file to upload
            folder_id: ID of the folder to upload to (None for root)
            filename: Custom filename (None to use original name)
            
        Returns:
            File ID if successful, None otherwise
        """
        try:
            if not os.path.exists(file_path):
                print(f"File not found: {file_path}")
                return None
            
            file_name = filename or os.path.basename(file_path)
            print(f"Uploading: {file_name}")
            
            # Prepare file metadata
            file_metadata = {'name': file_name}
            if folder_id:
                file_metadata['parents'] = [folder_id]
            
            # Create media upload
            media = MediaFileUpload(file_path, resumable=True)
            
            # Upload the file
            file = self.service.files().create(
                body=file_metadata,
                media_body=media,
                fields='id'
            ).execute()
            
            print(f"Uploaded: {file_name} (ID: {file.get('id')})")
            return file.get('id')
            
        except HttpError as error:
            print(f"An error occurred: {error}")
            return None
    
    def create_temp_folder(self, name: str = None) -> Optional[str]:
        """
        Create a temporary folder for project work
        
        Args:
            name: Name of the folder (default: timestamp-based name)
            
        Returns:
            Folder ID if successful, None otherwise
        """
        try:
            if not name:
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                name = f"temp_project_{timestamp}"
            
            file_metadata = {
                'name': name,
                'mimeType': 'application/vnd.google-apps.folder'
            }
            
            file = self.service.files().create(
                body=file_metadata,
                fields='id'
            ).execute()
            
            print(f"Created temporary folder: {name} (ID: {file.get('id')})")
            return file.get('id')
            
        except HttpError as error:
            print(f"An error occurred: {error}")
            return None
    
    def delete_file(self, file_id: str) -> bool:
        """
        Delete a file from Google Drive
        
        Args:
            file_id: ID of the file to delete
            
        Returns:
            True if successful, False otherwise
        """
        try:
            self.service.files().delete(fileId=file_id).execute()
            print(f"Deleted file: {file_id}")
            return True
            
        except HttpError as error:
            print(f"An error occurred: {error}")
            return False
    
    def get_file_info(self, file_id: str) -> Optional[Dict]:
        """
        Get detailed information about a file
        
        Args:
            file_id: ID of the file
            
        Returns:
            File metadata dictionary or None if error
        """
        try:
            file = self.service.files().get(
                fileId=file_id,
                fields="id,name,mimeType,size,modifiedTime,createdTime,parents,webViewLink,webContentLink"
            ).execute()
            
            print(f"File Info for {file['name']}:")
            for key, value in file.items():
                print(f"  {key}: {value}")
            
            return file
            
        except HttpError as error:
            print(f"An error occurred: {error}")
            return None

def main():
    """Main function to handle command line arguments"""
    parser = argparse.ArgumentParser(
        description="Google Drive Access for Project Research and Content Generation",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # List files in root directory
  python google_drive_access.py list
  
  # List files in specific folder
  python google_drive_access.py list --folder-id "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
  
  # Search for files
  python google_drive_access.py search --query "project research"
  
  # Download a file
  python google_drive_access.py download --file-id "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms" --output "./downloads/file.pdf"
  
  # Upload a file
  python google_drive_access.py upload --file "./local_file.pdf" --folder-id "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
  
  # Create temporary folder
  python google_drive_access.py create-folder --name "research_project_2024"
  
  # Get file information
  python google_drive_access.py info --file-id "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
        """
    )
    
    parser.add_argument('--credentials', help='Path to credentials file')
    parser.add_argument('--service-account', action='store_true', 
                       help='Use service account authentication')
    
    subparsers = parser.add_subparsers(dest='command', help='Available commands')
    
    # List command
    list_parser = subparsers.add_parser('list', help='List files')
    list_parser.add_argument('--folder-id', help='Folder ID to list (default: root)')
    list_parser.add_argument('--page-size', type=int, default=50, help='Number of files per page')
    
    # Search command
    search_parser = subparsers.add_parser('search', help='Search for files')
    search_parser.add_argument('query', help='Search query')
    search_parser.add_argument('--page-size', type=int, default=50, help='Number of files per page')
    
    # Download command
    download_parser = subparsers.add_parser('download', help='Download a file')
    download_parser.add_argument('--file-id', required=True, help='File ID to download')
    download_parser.add_argument('--output', required=True, help='Output file path')
    
    # Upload command
    upload_parser = subparsers.add_parser('upload', help='Upload a file')
    upload_parser.add_argument('--file', required=True, help='Local file path to upload')
    upload_parser.add_argument('--folder-id', help='Folder ID to upload to (default: root)')
    upload_parser.add_argument('--filename', help='Custom filename')
    
    # Create folder command
    folder_parser = subparsers.add_parser('create-folder', help='Create a folder')
    folder_parser.add_argument('--name', help='Folder name (default: timestamp-based)')
    
    # Delete command
    delete_parser = subparsers.add_parser('delete', help='Delete a file')
    delete_parser.add_argument('--file-id', required=True, help='File ID to delete')
    
    # Info command
    info_parser = subparsers.add_parser('info', help='Get file information')
    info_parser.add_argument('--file-id', required=True, help='File ID to get info for')
    
    args = parser.parse_args()
    
    if not args.command:
        parser.print_help()
        return
    
    try:
        # Initialize Google Drive access
        drive = GoogleDriveAccess(
            credentials_path=args.credentials,
            service_account=args.service_account
        )
        
        # Execute command
        if args.command == 'list':
            drive.list_files(args.folder_id, args.page_size)
        elif args.command == 'search':
            drive.search_files(args.query, args.page_size)
        elif args.command == 'download':
            drive.download_file(args.file_id, args.output)
        elif args.command == 'upload':
            drive.upload_file(args.file, args.folder_id, args.filename)
        elif args.command == 'create-folder':
            drive.create_temp_folder(args.name)
        elif args.command == 'delete':
            drive.delete_file(args.file_id)
        elif args.command == 'info':
            drive.get_file_info(args.file_id)
    
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main() 