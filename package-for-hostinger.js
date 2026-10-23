const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = __dirname;
const appApi = path.join(rootDir, 'app', 'api');
const appApiBackup = path.join(rootDir, 'app', '_api_temp_backup');
const nextConfigPath = path.join(rootDir, 'next.config.mjs');

const originalNextConfig = fs.readFileSync(nextConfigPath, 'utf8');

console.log('--- Memulai Persiapan Paket Hostinger ---');

let buildOk = false;

try {
  // 1. Pindahkan API folder sementara
  if (fs.existsSync(appApi)) {
    fs.renameSync(appApi, appApiBackup);
    console.log('✓ app/api dialihkan sementara untuk static export');
  }

  // 2. Terapkan config static export
  const exportConfig = `/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
`;
  fs.writeFileSync(nextConfigPath, exportConfig, 'utf8');
  console.log('✓ next.config.mjs diset output: export');

  // 3. Jalankan next build
  console.log('✓ Menjalankan Next.js build...');
  execSync('npm run build', { cwd: rootDir, stdio: 'inherit' });
  buildOk = true;
} catch (err) {
  console.error('Build export gagal:', err);
} finally {
  // Kembalikan api dan next.config.mjs
  if (fs.existsSync(appApiBackup)) {
    fs.renameSync(appApiBackup, appApi);
    console.log('✓ app/api dikembalikan normal');
  }
  fs.writeFileSync(nextConfigPath, originalNextConfig, 'utf8');
  console.log('✓ next.config.mjs dikembalikan normal');
}

if (!buildOk) {
  console.error('Proses dibatalkan karena build gagal');
  process.exit(1);
}

const outDir = path.join(rootDir, 'out');
if (!fs.existsSync(outDir)) {
  console.error('Folder out/ tidak ditemukan!');
  process.exit(1);
}

// 4. Buat folder api/inventory dan api/rooms dengan PHP handlers
const apiInvDir = path.join(outDir, 'api', 'inventory');
const apiRoomsDir = path.join(outDir, 'api', 'rooms');

fs.mkdirSync(apiInvDir, { recursive: true });
fs.mkdirSync(apiRoomsDir, { recursive: true });

// Salin inventory.json
const sourceJson = path.join(rootDir, 'lib', 'inventory.json');
const targetJson = path.join(apiInvDir, 'inventory.json');
if (fs.existsSync(sourceJson)) {
  fs.copyFileSync(sourceJson, targetJson);
  console.log('✓ inventory.json disalin ke out/api/inventory/');
}

// PHP API Inventory Handler
const phpInventoryScript = `<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if (\$_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

\$dataFile = __DIR__ . '/inventory.json';

if (!file_exists(\$dataFile)) {
    file_put_contents(\$dataFile, json_encode([]));
}

if (\$_SERVER['REQUEST_METHOD'] === 'GET') {
    \$content = file_get_contents(\$dataFile);
    echo \$content ? \$content : '[]';
    exit;
}

if (\$_SERVER['REQUEST_METHOD'] === 'POST') {
    \$raw = file_get_contents('php://input');
    \$newItem = json_decode(\$raw, true);

    if (!\$newItem || !isset(\$newItem['kode'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Data tidak valid']);
        exit;
    }

    \$content = file_get_contents(\$dataFile);
    \$items = json_decode(\$content, true);
    if (!is_array(\$items)) {
        \$items = [];
    }

    \$idxFound = -1;
    foreach (\$items as \$idx => \$item) {
        if (isset(\$item['kode']) && \$item['kode'] === \$newItem['kode']) {
            \$idxFound = \$idx;
            break;
        }
    }

    if (\$idxFound >= 0) {
        \$items[\$idxFound] = \$newItem;
    } else {
        \$items[] = \$newItem;
    }

    file_put_contents(\$dataFile, json_encode(\$items, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    echo json_encode(['success' => true, 'item' => \$newItem]);
    exit;
}
?>`;

fs.writeFileSync(path.join(apiInvDir, 'index.php'), phpInventoryScript, 'utf8');
console.log('✓ PHP handler untuk /api/inventory dibuat');

// PHP API Rooms Handler
const phpRoomsScript = `<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if (\$_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

\$dataFile = __DIR__ . '/rooms.json';

if (!file_exists(\$dataFile)) {
    \$defaultRooms = [
        "Ruang Kantor Yayasan",
        "Lab TJKT 1",
        "Lab TJKT 2",
        "Lab TJKT 3",
        "Ruang Guru",
        "Ruang Kepala Sekolah",
        "Ruang TU"
    ];
    file_put_contents(\$dataFile, json_encode(\$defaultRooms, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
}

if (\$_SERVER['REQUEST_METHOD'] === 'GET') {
    echo file_get_contents(\$dataFile);
    exit;
}

if (\$_SERVER['REQUEST_METHOD'] === 'POST') {
    \$raw = file_get_contents('php://input');
    \$payload = json_decode(\$raw, true);

    if (isset(\$payload['rooms']) && is_array(\$payload['rooms'])) {
        file_put_contents(\$dataFile, json_encode(\$payload['rooms'], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
        echo json_encode(['success' => true]);
        exit;
    }

    http_response_code(400);
    echo json_encode(['error' => 'Data ruangan tidak valid']);
    exit;
}
?>`;

fs.writeFileSync(path.join(apiRoomsDir, 'index.php'), phpRoomsScript, 'utf8');
console.log('✓ PHP handler untuk /api/rooms dibuat');

// 5. Buat .htaccess Apache / LiteSpeed untuk Hostinger
const htaccessContent = `<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /

  # API routes redirection to index.php
  RewriteRule ^api/inventory/?$ api/inventory/index.php [QSA,L]
  RewriteRule ^api/rooms/?$ api/rooms/index.php [QSA,L]

  # Existing files and dirs
  RewriteCond %{REQUEST_FILENAME} -f [OR]
  RewriteCond %{REQUEST_FILENAME} -d
  RewriteRule ^ - [L]

  # Clean URL for /qr
  RewriteCond %{DOCUMENT_ROOT}/qr.html -f
  RewriteRule ^qr/?$ qr.html [L]

  # Clean URL for /a/[kode]
  RewriteCond %{DOCUMENT_ROOT}/a/$1.html -f
  RewriteRule ^a/([^/]+)/?$ a/$1.html [L]

  # Fallback for dynamic query or client routes
  RewriteRule ^a/([^/]+)/?$ a/[kode].html [L]
  RewriteRule ^ index.html [L]
</IfModule>
`;

fs.writeFileSync(path.join(outDir, '.htaccess'), htaccessContent, 'utf8');
console.log('✓ .htaccess Hostinger dibuat');

// 6. Buat file index placeholder instruksi
console.log('✓ Mempersiapkan arsip ZIP Hostinger...');
const zipName = 'inventaris-alaqsyar-hostinger.zip';
const zipPath = path.join(rootDir, zipName);
const downloadsZipPath = path.join('C:\\Users\\ariel\\Downloads', zipName);

try {
  // Menggunakan PowerShell Compress-Archive
  execSync(`powershell -Command "Compress-Archive -Path '${outDir}\\*' -DestinationPath '${zipPath}' -Force"`, { stdio: 'inherit' });
  console.log('✓ ZIP berhasil dibuat di: ' + zipPath);
  
  // Salin juga ke Downloads agar user sangat mudah menemukan
  fs.copyFileSync(zipPath, downloadsZipPath);
  console.log('✓ ZIP juga disalin ke folder Downloads Anda: ' + downloadsZipPath);
} catch (e) {
  console.error('Gagal membuat ZIP otomatis:', e);
}

console.log('--- SELESAI! Paket Hostinger Siap Diupload ---');
