const fs = require('fs');
const path = require('path');

// Cleanup script to remove excessive backup files
function cleanupBackups() {
  const dataDir = path.join(__dirname, '..', 'data');
  const backupFiles = fs.readdirSync(dataDir)
    .filter(file => file.startsWith('menu_backup') && file.endsWith('.json'))
    .map(file => ({
      name: file,
      path: path.join(dataDir, file),
      time: fs.statSync(path.join(dataDir, file)).mtime.getTime()
    }))
    .sort((a, b) => b.time - a.time); // Sort by newest first

  console.log(`Found ${backupFiles.length} backup files`);

  if (backupFiles.length <= 3) {
    console.log('No cleanup needed - only', backupFiles.length, 'backup files exist');
    return;
  }

  const filesToDelete = backupFiles.slice(3);
  console.log(`Removing ${filesToDelete.length} old backup files...`);

  filesToDelete.forEach(file => {
    try {
      fs.unlinkSync(file.path);
      console.log('✓ Removed:', file.name);
    } catch (error) {
      console.error('✗ Failed to remove:', file.name, error.message);
    }
  });

  console.log(`Cleanup complete. Kept ${backupFiles.length - filesToDelete.length} most recent backups.`);
}

// Run cleanup if this script is executed directly
if (require.main === module) {
  cleanupBackups();
}

module.exports = { cleanupBackups }; 