#!/usr/bin/env node

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Configuration dari environment variables
const config = {
  host: process.env.DB_HOST || 'db.fkqfdwxunnymmsutbeuu.supabase.co',
  port: process.env.DB_PORT || '5432',
  database: process.env.DB_NAME || 'postgres',
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD,
  backupDir: process.env.BACKUP_DIR || './backup'
};

// Validasi environment variables
function validateConfig() {
  if (!config.password) {
    console.error('❌ Error: DB_PASSWORD environment variable is required');
    console.log('Please set DB_PASSWORD in your .env file');
    process.exit(1);
  }
  
  console.log('✅ Configuration validated');
}

// Membuat direktori backup jika belum ada
function ensureBackupDirectory() {
  if (!fs.existsSync(config.backupDir)) {
    try {
      fs.mkdirSync(config.backupDir, { recursive: true });
      console.log(`✅ Created backup directory: ${config.backupDir}`);
    } catch (error) {
      console.error(`❌ Error creating backup directory: ${error.message}`);
      process.exit(1);
    }
  } else {
    console.log(`✅ Backup directory exists: ${config.backupDir}`);
  }
}

// Generate nama file backup berdasarkan timestamp
function generateBackupFilename() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hour = String(now.getHours()).padStart(2, '0');
  const minute = String(now.getMinutes()).padStart(2, '0');
  
  return `backup-${year}-${month}-${day}_${hour}-${minute}.sql`;
}

// Menjalankan pg_dump
function performBackup() {
  const filename = generateBackupFilename();
  const filePath = path.join(config.backupDir, filename);
  
  console.log(`🚀 Starting database backup...`);
  console.log(`📁 Backup file: ${filePath}`);
  
  const pgDumpCommand = `pg_dump -h ${config.host} -p ${config.port} -U ${config.username} -d ${config.database} --no-password --verbose --clean --if-exists --create`;
  
  const env = {
    ...process.env,
    PGPASSWORD: config.password
  };
  
  const childProcess = exec(pgDumpCommand, { env }, (error, stdout, stderr) => {
    if (error) {
      console.error(`❌ Backup failed: ${error.message}`);
      process.exit(1);
    }
    
    if (stderr && !stderr.includes('NOTICE')) {
      console.warn(`⚠️ Warning: ${stderr}`);
    }
  });
  
  // Redirect output ke file
  const writeStream = fs.createWriteStream(filePath);
  childProcess.stdout.pipe(writeStream);
  
  childProcess.on('close', (code) => {
    if (code === 0) {
      // Cek ukuran file untuk memastikan backup berhasil
      const stats = fs.statSync(filePath);
      const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
      
      console.log(`✅ Backup completed successfully!`);
      console.log(`📊 File size: ${fileSizeInMB} MB`);
      console.log(`📍 Location: ${filePath}`);
      console.log(`⏰ Completed at: ${new Date().toLocaleString('id-ID')}`);
      
      // Cleanup old backups (keep last 7 days)
      cleanupOldBackups();
      
    } else {
      console.error(`❌ Backup process exited with code ${code}`);
      
      // Hapus file backup yang gagal jika ada
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log('🗑️ Removed incomplete backup file');
      }
      
      process.exit(1);
    }
  });
}

// Cleanup backup lama (simpan 7 hari terakhir)
function cleanupOldBackups() {
  try {
    const files = fs.readdirSync(config.backupDir);
    const backupFiles = files.filter(file => file.startsWith('backup-') && file.endsWith('.sql'));
    
    if (backupFiles.length <= 7) {
      console.log(`📋 Total backup files: ${backupFiles.length} (no cleanup needed)`);
      return;
    }
    
    // Sort berdasarkan tanggal modifikasi (terlama dulu)
    const fileStats = backupFiles.map(file => ({
      name: file,
      path: path.join(config.backupDir, file),
      mtime: fs.statSync(path.join(config.backupDir, file)).mtime
    }));
    
    fileStats.sort((a, b) => a.mtime - b.mtime);
    
    // Hapus file lama, sisakan 7 terbaru
    const filesToDelete = fileStats.slice(0, fileStats.length - 7);
    
    filesToDelete.forEach(file => {
      fs.unlinkSync(file.path);
      console.log(`🗑️ Deleted old backup: ${file.name}`);
    });
    
    console.log(`🧹 Cleanup completed. Kept ${Math.min(7, fileStats.length)} most recent backups`);
    
  } catch (error) {
    console.warn(`⚠️ Cleanup warning: ${error.message}`);
  }
}

// Main function
function main() {
  console.log('🔄 PostgreSQL Database Backup Script');
  console.log('=====================================');
  
  try {
    validateConfig();
    ensureBackupDirectory();
    performBackup();
  } catch (error) {
    console.error(`❌ Unexpected error: ${error.message}`);
    process.exit(1);
  }
}

// Handle termination gracefully
process.on('SIGINT', () => {
  console.log('\n⏹️ Backup process interrupted by user');
  process.exit(1);
});

process.on('SIGTERM', () => {
  console.log('\n⏹️ Backup process terminated');
  process.exit(1);
});

// Run the script
if (require.main === module) {
  main();
}

module.exports = { main, config };
