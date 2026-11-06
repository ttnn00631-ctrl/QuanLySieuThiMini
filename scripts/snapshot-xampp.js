const { execSync, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { loadEnvironment } = require('./environment');

const rootDir = path.resolve(__dirname, '..');
const sqlFile = path.join(rootDir, 'xampp_migration.sql');
const environment = { ...loadEnvironment(rootDir), ...process.env };
const jdbcUrl = environment.DB_URL
  || 'jdbc:mysql://localhost:3306/QuanLySieuThiMini?createDatabaseIfNotExist=true&useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC';

const connection = jdbcUrl.match(/^jdbc:mysql:\/\/(?:\[([^\]]+)\]|([^/:?]+))(?::(\d+))?\/([^?]+)/);
if (!connection) {
  console.error('[Lỗi] DB_URL phải là URL MySQL dạng jdbc:mysql://host:port/database.');
  process.exit(1);
}

let databaseName;
try {
  databaseName = decodeURIComponent(connection[4]);
} catch (error) {
  console.error('[Lỗi] Tên database trong DB_URL không hợp lệ.');
  process.exit(1);
}
if (!/^[A-Za-z0-9_$-]+$/.test(databaseName)) {
  console.error('[Lỗi] Tên database chỉ được chứa chữ, số, dấu gạch dưới, gạch ngang hoặc $.');
  process.exit(1);
}

const mysqlHost = connection[1] || connection[2];
const mysqlPort = environment.MYSQL_PORT || connection[3] || '3306';
const mysqlUsername = environment.DB_USERNAME || 'root';
const mysqlEnv = { ...process.env, MYSQL_PWD: environment.DB_PASSWORD || '' };
const tables = [
  'app_users',
  'customers',
  'mini_mart_products',
  'customer_accounts',
  'assignment_history',
  'maintenance_records',
  'product_reviews',
  'sale_orders',
  'trash_records',
  'customer_repair_requests',
  'product_brands',
];
const possibleDumpPaths = [
  'mysqldump',
  'C:\\xampp\\mysql\\bin\\mysqldump.exe',
  'D:\\xampp\\mysql\\bin\\mysqldump.exe',
  'E:\\xampp\\mysql\\bin\\mysqldump.exe',
  'F:\\xampp\\mysql\\bin\\mysqldump.exe',
  'C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysqldump.exe',
  'C:\\Program Files\\MySQL\\MySQL Server 8.4\\bin\\mysqldump.exe',
];

function findDumpBinary() {
  for (const binary of possibleDumpPaths) {
    try {
      execSync(`"${binary}" --version`, { stdio: 'ignore' });
      return binary;
    } catch (error) {
      continue;
    }
  }
  return null;
}

const dumpBinary = findDumpBinary();
if (!dumpBinary) {
  console.error('[Lỗi] Không tìm thấy mysqldump. Hãy cài MySQL/XAMPP hoặc thêm mysqldump vào PATH.');
  process.exit(1);
}

const dump = spawnSync(dumpBinary, [
  '--host', mysqlHost,
  '--port', mysqlPort,
  '--user', mysqlUsername,
  '--default-character-set=utf8mb4',
  '--no-create-info',
  '--complete-insert',
  '--skip-extended-insert',
  '--skip-add-locks',
  '--skip-comments',
  '--skip-triggers',
  '--single-transaction',
  databaseName,
  ...tables,
], {
  cwd: rootDir,
  encoding: 'utf8',
  env: mysqlEnv,
  maxBuffer: 16 * 1024 * 1024,
});

if (dump.error) {
  console.error(`[Lỗi] Không chạy được mysqldump: ${dump.error.message}`);
  process.exit(1);
}
if (dump.status !== 0) {
  console.error(`[Lỗi] Không xuất được database ${databaseName}: ${dump.stderr.trim()}`);
  process.exit(dump.status || 1);
}

const allowedTables = new Set(tables);
const rowCounts = Object.fromEntries(tables.map(table => [table, 0]));
const insertStatements = [];
for (const line of dump.stdout.split(/\r?\n/)) {
  if (!line.trim()) continue;
  if (line.startsWith('/*!')) continue;
  const match = line.match(/^INSERT INTO `([^`]+)` /);
  if (!match || !allowedTables.has(match[1])) {
    console.error('[Lỗi] mysqldump trả về dữ liệu không đúng định dạng; chưa cập nhật file migration.');
    process.exit(1);
  }
  rowCounts[match[1]] += 1;
  insertStatements.push(line.replace(/^INSERT INTO /, 'INSERT IGNORE INTO '));
}

const snapshotMarker = '-- ====================================================================\n-- DỮ LIỆU KHỞI TẠO (SEED DATA)';
const existingSnapshotMarker = '-- ====================================================================\n-- BẢN CHỤP DATABASE ';
const currentMigration = fs.readFileSync(sqlFile, 'utf8');
const markerIndex = [snapshotMarker, existingSnapshotMarker]
  .map(marker => currentMigration.indexOf(marker))
  .filter(index => index >= 0)
  .sort((left, right) => left - right)[0] ?? -1;
if (markerIndex < 0) {
  console.error('[Lỗi] Không tìm thấy vị trí dữ liệu mẫu trong xampp_migration.sql; chưa ghi file.');
  process.exit(1);
}

const snapshotDate = new Date().toISOString();
const snapshotSection = [
  '-- ====================================================================',
  `-- BẢN CHỤP DATABASE ${databaseName} — xuất lúc ${snapshotDate}`,
  '-- INSERT IGNORE giúp chạy lại migration không ghi đè dữ liệu đã chỉnh sửa.',
  '-- Bản chụp này được dùng để khôi phục dữ liệu khi chạy npm run migrate trên máy mới.',
  '-- File này chứa dữ liệu cá nhân và hash mật khẩu; chỉ lưu/chia sẻ an toàn.',
  '-- ====================================================================',
  'SET @OLD_TIME_ZONE = @@TIME_ZONE;',
  "SET time_zone = '+00:00';",
  ...insertStatements,
  'SET time_zone = @OLD_TIME_ZONE;',
  '',
].join('\n');
const updatedMigration = `${currentMigration.slice(0, markerIndex)}${snapshotSection}`;
const temporarySqlFile = `${sqlFile}.tmp`;

try {
  fs.writeFileSync(temporarySqlFile, updatedMigration, 'utf8');
  fs.renameSync(temporarySqlFile, sqlFile);
} catch (error) {
  try {
    if (fs.existsSync(temporarySqlFile)) fs.unlinkSync(temporarySqlFile);
  } catch (cleanupError) {
    console.error(`[Lỗi] Không dọn được file tạm ${temporarySqlFile}: ${cleanupError.message}`);
  }
  console.error(`[Lỗi] Không ghi được file migration: ${error.message}`);
  process.exit(1);
}

console.log(`✅ Đã cập nhật bản chụp ${databaseName} vào xampp_migration.sql (${snapshotDate}).`);
for (const table of tables) {
  console.log(`   ${table}: ${rowCounts[table]} bản ghi`);
}
