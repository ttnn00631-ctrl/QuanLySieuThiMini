/**
 * Script tự động chạy migration cho XAMPP MySQL
 * Cách dùng: node ./scripts/migrate-xampp.js hoặc npm run migrate
 */
const { execFileSync, execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const { loadEnvironment } = require('./environment');

const rootDir = path.resolve(__dirname, '..');
const sqlFile = path.join(rootDir, 'xampp_migration.sql');
const environment = { ...loadEnvironment(rootDir), ...process.env };
const jdbcUrl = environment.DB_URL
  || 'jdbc:mysql://localhost:3306/QuanLySieuThiMini?createDatabaseIfNotExist=true&useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC';

const mysqlConnection = jdbcUrl.match(/^jdbc:mysql:\/\/(?:\[([^\]]+)\]|([^/:?]+))(?::(\d+))?\/([^?]+)/);
if (!mysqlConnection) {
  console.error('[Lỗi] DB_URL phải là URL MySQL dạng jdbc:mysql://host:port/database.');
  process.exit(1);
}

let databaseName;
try {
  databaseName = decodeURIComponent(mysqlConnection[4]);
} catch (error) {
  console.error('[Lỗi] Tên database trong DB_URL không hợp lệ.');
  process.exit(1);
}
if (!/^[A-Za-z0-9_$-]+$/.test(databaseName)) {
  console.error('[Lỗi] Tên database chỉ được chứa chữ, số, dấu gạch dưới, gạch ngang hoặc $.');
  process.exit(1);
}

const mysqlHost = mysqlConnection[1] || mysqlConnection[2];
const mysqlPort = environment.MYSQL_PORT || mysqlConnection[3] || '3306';
const mysqlUsername = environment.DB_USERNAME || 'root';
const mysqlEnv = { ...process.env };
mysqlEnv.MYSQL_PWD = environment.DB_PASSWORD || '';

if (!fs.existsSync(sqlFile)) {
  console.error(`[Lỗi] Không tìm thấy file migration: ${sqlFile}`);
  process.exit(1);
}

// Tìm binary mysql.exe từ các đường dẫn XAMPP phổ biến hoặc PATH
const possibleMysqlPaths = [
  'mysql',
  'C:\\xampp\\mysql\\bin\\mysql.exe',
  'D:\\xampp\\mysql\\bin\\mysql.exe',
  'E:\\xampp\\mysql\\bin\\mysql.exe',
  'F:\\xampp\\mysql\\bin\\mysql.exe',
  'C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysql.exe',
  'C:\\Program Files\\MySQL\\MySQL Server 8.4\\bin\\mysql.exe',
];

function findMysqlBinary() {
  for (const bin of possibleMysqlPaths) {
    try {
      execSync(`"${bin}" --version`, { stdio: 'ignore' });
      return bin;
    } catch (e) {
      // Tiếp tục tìm
    }
  }
  return null;
}

console.log('========================================================');
console.log('  NẠP CƠ SỞ DỮ LIỆU SIÊU THỊ MINI CHO XAMPP (MySQL)');
console.log('========================================================\n');

const mysqlBin = findMysqlBinary();

if (mysqlBin) {
  console.log(`[1/3] Tìm thấy MySQL client tại: ${mysqlBin}`);
  console.log(`[2/3] Đang nạp schema và dữ liệu mẫu vào database ${databaseName}...`);

  try {
    const sourceSql = fs.readFileSync(sqlFile, 'utf8');
    const originalCreateDatabase = 'CREATE DATABASE IF NOT EXISTS `QuanLySieuThiMini`';
    const originalUseDatabase = 'USE `QuanLySieuThiMini`;';
    if (!sourceSql.includes(originalCreateDatabase) || !sourceSql.includes(originalUseDatabase)) {
      throw new Error('Không tìm thấy khai báo database dự kiến trong xampp_migration.sql.');
    }
    const quotedDatabaseName = `\`${databaseName}\``;
    const sqlContent = sourceSql
      .replace(originalCreateDatabase, `CREATE DATABASE IF NOT EXISTS ${quotedDatabaseName}`)
      .replace(originalUseDatabase, `USE ${quotedDatabaseName};`);
    const mysqlArgs = ['-u', mysqlUsername, '-h', mysqlHost, '--port', mysqlPort, '--default-character-set=utf8mb4'];
    const proc = spawn(mysqlBin, mysqlArgs, {
      cwd: rootDir,
      env: mysqlEnv,
      stdio: ['pipe', 'inherit', 'inherit'],
    });

    proc.stdin.write(sqlContent);
    proc.stdin.end();

    proc.on('close', (code) => {
      if (code === 0) {
        console.log('\n[3/3] Kiểm tra số lượng bản ghi thực tế trong CSDL:');
        try {
          const query = `USE \`${databaseName.replace(/`/g, '``')}\`; SELECT 'Tài khoản người dùng (app_users)' AS Bang, COUNT(*) AS SoLuong FROM app_users UNION ALL SELECT 'Hàng hóa siêu thị (mini_mart_products)', COUNT(*) FROM mini_mart_products UNION ALL SELECT 'Khách hàng thành viên (customers)', COUNT(*) FROM customers UNION ALL SELECT 'Bình luận đánh giá (product_reviews)', COUNT(*) FROM product_reviews UNION ALL SELECT 'Hóa đơn thanh toán (sale_orders)', COUNT(*) FROM sale_orders UNION ALL SELECT 'Hãng sản phẩm (product_brands)', COUNT(*) FROM product_brands;`;
          const stats = execFileSync(mysqlBin, [...mysqlArgs, '-e', query], { encoding: 'utf8', env: mysqlEnv });
          console.log(stats);
          console.log(`✅ [THÀNH CÔNG] Dữ liệu đã được nạp vào MySQL (${databaseName})!`);
          console.log(`👉 Bạn có thể xem trên phpMyAdmin: http://localhost/phpmyadmin -> chọn database "${databaseName}"\n`);
        } catch (e) {
          console.error('\n❌ Đã nạp SQL nhưng không đọc được số lượng dữ liệu từ MySQL:', e.message);
          process.exitCode = 1;
        }
      } else {
        console.warn(`\n⚠️ Quá trình nạp kết thúc với mã lỗi: ${code}`);
        process.exitCode = code || 1;
        printManualGuide();
      }
    });

    proc.on('error', (err) => {
      console.warn('\n⚠️ Lỗi khi chạy lệnh mysql:', err.message);
      process.exitCode = 1;
      printManualGuide();
    });
  } catch (err) {
    console.warn('\n⚠️ Lỗi khi đọc file SQL:', err.message);
    process.exitCode = 1;
    printManualGuide();
  }
} else {
  console.log('⚠️ Không tìm thấy lệnh mysql trong PATH hoặc thư mục C:\\xampp\\mysql\\bin\\');
  process.exitCode = 1;
  printManualGuide();
}

function printManualGuide() {
  console.log('\n--- HƯỚNG DẪN IMPORT TRỰC TIẾP TRÊN PHPMYADMIN ---');
  console.log('1. Mở XAMPP Control Panel và nhấn "Start" ở mục MySQL.');
  console.log('2. Mở trình duyệt vào: http://localhost/phpmyadmin');
  console.log('3. Chọn thẻ "Import" (Nhập) ở thanh menu trên cùng.');
  console.log(`4. Chọn file: ${sqlFile}`);
  console.log('5. Nhấn nút "Import" (hoặc "Thực hiện") ở cuối trang.');
  console.log('--------------------------------------------------\n');
}
