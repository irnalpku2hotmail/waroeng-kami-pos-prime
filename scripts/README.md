
# Database Backup Scripts

Script Node.js untuk backup otomatis database PostgreSQL Supabase menggunakan `pg_dump`.

## Features

- ✅ Backup otomatis database PostgreSQL Supabase
- ✅ Nama file berdasarkan timestamp (backup-2025-07-09_14-30.sql)
- ✅ Konfigurasi menggunakan environment variables (.env)
- ✅ Auto-create direktori backup
- ✅ Cleanup otomatis backup lama (simpan 7 hari terakhir)
- ✅ Logging lengkap dengan status dan ukuran file
- ✅ Error handling dan validasi

## Prerequisites

1. **Node.js** (>= 14.0.0)
2. **pg_dump** - PostgreSQL client tools
   ```bash
   # Ubuntu/Debian
   sudo apt-get install postgresql-client
   
   # macOS
   brew install postgresql
   
   # Windows
   # Download dari https://www.postgresql.org/download/windows/
   ```

## Installation

1. Masuk ke direktori scripts:
   ```bash
   cd scripts
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy dan edit file environment:
   ```bash
   cp .env.example .env
   ```

4. Edit file `.env` dengan kredensial database Anda:
   ```env
   DB_HOST=db.fkqfdwxunnymmsutbeuu.supabase.co
   DB_PORT=5432
   DB_NAME=postgres
   DB_USERNAME=postgres
   DB_PASSWORD=your_actual_password_here
   BACKUP_DIR=./backup
   ```

## Usage

### Manual Backup
```bash
npm run backup
```

### Menggunakan Cron untuk Backup Otomatis

1. Edit crontab:
   ```bash
   crontab -e
   ```

2. Tambahkan entry untuk backup harian pada jam 2 pagi:
   ```bash
   0 2 * * * cd /path/to/your/project/scripts && npm run backup >> backup.log 2>&1
   ```

3. Atau backup setiap 6 jam:
   ```bash
   0 */6 * * * cd /path/to/your/project/scripts && npm run backup >> backup.log 2>&1
   ```

### Contoh Output

```
🔄 PostgreSQL Database Backup Script
=====================================
✅ Configuration validated
✅ Backup directory exists: ./backup
🚀 Starting database backup...
📁 Backup file: ./backup/backup-2025-07-09_14-30.sql
✅ Backup completed successfully!
📊 File size: 2.45 MB
📍 Location: ./backup/backup-2025-07-09_14-30.sql
⏰ Completed at: 9/7/2025 14:30:25
📋 Total backup files: 3 (no cleanup needed)
```

## Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `DB_HOST` | Hostname database | `db.fkqfdwxunnymmsutbeuu.supabase.co` |
| `DB_PORT` | Port database | `5432` |
| `DB_NAME` | Nama database | `postgres` |
| `DB_USERNAME` | Username database | `postgres` |
| `DB_PASSWORD` | Password database | **Required** |
| `BACKUP_DIR` | Direktori penyimpanan backup | `./backup` |

## File Structure

```
scripts/
├── backup-database.js     # Script backup utama
├── package.json          # Dependencies dan scripts
├── .env.example          # Template environment variables
├── .env                  # Environment variables (buat sendiri)
├── README.md             # Dokumentasi ini
└── backup/               # Direktori backup (auto-created)
    ├── backup-2025-07-09_14-30.sql
    ├── backup-2025-07-08_14-30.sql
    └── ...
```

## Security Notes

- ⚠️ Jangan commit file `.env` ke repository
- ⚠️ Pastikan direktori backup memiliki permission yang tepat
- ⚠️ Password database disimpan dalam environment variable
- ⚠️ File backup berisi data sensitif, amankan dengan proper permission

## Troubleshooting

### Error: pg_dump command not found
```bash
# Install PostgreSQL client tools
sudo apt-get install postgresql-client  # Ubuntu/Debian
brew install postgresql                  # macOS
```

### Error: DB_PASSWORD environment variable is required
```bash
# Pastikan file .env ada dan berisi DB_PASSWORD
echo "DB_PASSWORD=your_password_here" >> .env
```

### Error: connection refused
```bash
# Cek koneksi database
psql -h db.fkqfdwxunnymmsutbeuu.supabase.co -p 5432 -U postgres -d postgres
```

### Backup file kosong atau kecil
- Cek kredensial database di file `.env`
- Pastikan user memiliki permission untuk read database
- Cek log error untuk detail masalah

## Monitoring

Script akan membuat log dengan informasi:
- Status backup (berhasil/gagal)
- Ukuran file backup
- Lokasi file backup
- Waktu selesai backup
- Informasi cleanup file lama

Untuk monitoring yang lebih baik, redirect output ke log file:
```bash
npm run backup >> backup.log 2>&1
```
