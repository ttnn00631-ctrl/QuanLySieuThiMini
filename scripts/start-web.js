/**
 * Script khởi chạy đồng thời Backend (Spring Boot) và Frontend (React Vite)
 * Chạy bằng lệnh: npm run web
 * Sử dụng 100% module tích hợp của Node.js, không cần npm install thêm thư viện ngoài.
 */
const { spawn } = require('child_process');
const http = require('http');
const os = require('os');
const path = require('path');
const { loadEnvironment } = require('./environment');

const rootDir = path.resolve(__dirname, '..');
const backendDir = path.join(rootDir, 'backend');
const frontendDir = path.join(rootDir, 'frontend');
const isWin = process.platform === 'win32';
const applicationEnv = { ...loadEnvironment(rootDir), ...process.env };
const datasourceUrl = applicationEnv.DB_URL
  || 'jdbc:mysql://localhost:3306/QuanLySieuThiMini?createDatabaseIfNotExist=true&useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC';
const databaseName = datasourceUrl.startsWith('jdbc:mysql:') ? 'MySQL / XAMPP' : 'H2';
const requiredApiContractVersion = '5';

console.log('================================================================');
console.log('  🚀 KHỞI ĐỘNG HỆ THỐNG QUẢN LÝ SIÊU THỊ MINI (ĐỒ ĂN VẶT - ĐỒ CHƠI)');
console.log('================================================================\n');

function checkPort(port, callback) {
  let completed = false;
  const finish = (isUp) => {
    if (completed) return;
    completed = true;
    callback(isUp);
  };
  const req = http.get(`http://localhost:${port}/`, (res) => {
    res.resume();
    finish(true);
  });
  req.on('error', () => {
    finish(false);
  });
  req.setTimeout(1500, () => {
    req.destroy();
    finish(false);
  });
}

function checkBackendStatus(port) {
  return new Promise((resolve, reject) => {
    http.get(`http://localhost:${port}/api/system/database`, (res) => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', chunk => { body += chunk; });
      res.on('end', () => {
        if (res.statusCode !== 200) {
          reject(new Error(`Backend không xác nhận được database (HTTP ${res.statusCode})`));
          return;
        }
        try {
          resolve(JSON.parse(body));
        } catch (error) {
          reject(error);
        }
      });
    }).on('error', reject);
  });
}

async function verifyBackendConfiguration() {
  const status = await checkBackendStatus(8080);
  if (status.database !== databaseName) {
    throw new Error(`Backend đang dùng ${status.database}, nhưng cấu hình hiện tại yêu cầu ${databaseName}.`);
  }
  if (status.apiContractVersion !== requiredApiContractVersion) {
    throw new Error('Backend đang chạy phiên bản cũ hoặc không tương thích với giao diện hiện tại.');
  }
  console.log(`✅ Backend tương thích, đang dùng đúng database: ${status.database}.`);
}

function waitForBackend(maxAttempts = 120, interval = 1000) {
  let attempts = 0;
  return new Promise((resolve) => {
    const timer = setInterval(() => {
      attempts++;
      checkPort(8080, (isUp) => {
        if (isUp || attempts >= maxAttempts) {
          clearInterval(timer);
          resolve(isUp);
        }
      });
    }, interval);
  });
}

const processes = [];

function cleanup() {
  console.log('\n🛑 Đang dừng toàn bộ hệ thống...');
  processes.forEach((proc) => {
    if (proc && !proc.killed) {
      if (isWin) {
        try {
          spawn('taskkill', ['/pid', proc.pid, '/f', '/t']);
        } catch (e) {}
      } else {
        proc.kill('SIGINT');
      }
    }
  });
  process.exit();
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

// 1. Kiểm tra xem Backend có đang chạy sẵn không
checkPort(8080, async (isBackendAlreadyUp) => {
  if (isBackendAlreadyUp) {
    console.log('ℹ️ Backend đã chạy tại http://localhost:8080; đang xác nhận database và phiên bản...');
    try {
      await verifyBackendConfiguration();
    } catch (error) {
      console.error(`❌ ${error.message}`);
      console.error('   Hãy dừng backend cũ rồi chạy lại npm run web để đồng bộ phiên bản và dữ liệu.');
      process.exitCode = 1;
      return;
    }
    startFrontend();
  } else {
    console.log('[1/2] ☕ Đang khởi động Spring Boot Backend (Port 8080)...');
    const mvnCmd = isWin ? 'mvnw.cmd' : './mvnw';
    const backendProc = spawn(mvnCmd, ['spring-boot:run'], {
      cwd: backendDir,
      env: applicationEnv,
      shell: true,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    processes.push(backendProc);

    let started = false;

    backendProc.stdout.on('data', (data) => {
      const msg = data.toString();
      if (!started && (msg.includes('Started AssetManagerApplication') || msg.includes('Tomcat started on port 8080'))) {
        started = true;
        console.log('✅ [Backend] Khởi động thành công (Port 8080)!');
      } else if (msg.includes('ERROR') || msg.includes('Access denied') || msg.includes('Exception')) {
        process.stdout.write(`[Backend] ${msg}`);
      }
    });

    backendProc.stderr.on('data', (data) => {
      process.stderr.write(`[Backend-Lỗi] ${data.toString()}`);
    });

    backendProc.on('close', (code) => {
      if (code !== 0 && code !== null) {
        console.log(`⚠️ [Backend] Đã dừng với mã: ${code}`);
      }
    });

    // Chờ backend sẵn sàng rồi mới bật frontend để không bị lỗi trắng trang / mất dữ liệu
    process.stdout.write('⏳ Đang chờ Backend khởi động và nạp dữ liệu');
    const progressTimer = setInterval(() => {
      if (!started) process.stdout.write('.');
    }, 1000);

    const backendReady = await waitForBackend();
    clearInterval(progressTimer);
    console.log('\n');

    if (!backendReady) {
      console.error('❌ Backend chưa sẵn sàng sau 120 giây. Kiểm tra Java 21 và log lỗi phía trên.');
      process.exitCode = 1;
      cleanup();
      return;
    }

    try {
      await verifyBackendConfiguration();
    } catch (error) {
      console.error(`❌ ${error.message}`);
      process.exitCode = 1;
      cleanup();
      return;
    }

    startFrontend();
  }
});

// 2. Khởi động Frontend
function startFrontend() {
  console.log('[2/2] ⚛️ Đang khởi động React Frontend (Port 5173)...');
  const npmCmd = isWin ? 'npm.cmd' : 'npm';
  const frontendProc = spawn(npmCmd, ['run', 'dev'], {
    cwd: frontendDir,
    shell: true,
    stdio: 'inherit',
  });

  processes.push(frontendProc);

  frontendProc.on('close', (code) => {
    if (code !== 0 && code !== null) {
      console.log(`⚠️ [Frontend] Đã dừng với mã: ${code}`);
    }
  });

  console.log('\n================================================================');
  console.log('  🌐 Giao diện Web:   http://localhost:5173');
  const lanAddresses = Object.values(os.networkInterfaces())
    .flatMap(interfaces => interfaces || [])
    .filter(address => address.family === 'IPv4' && !address.internal)
    .map(address => address.address);
  lanAddresses.forEach(address => console.log(`  📱 Điện thoại:      http://${address}:5173`));
  console.log('  ⚙️ Backend REST:    http://localhost:8080');
  console.log(`  🗄️ Cơ sở dữ liệu:   ${databaseName}`);
  console.log('  📑 Swagger Docs:    http://localhost:8080/docs');
  console.log('  🔑 Tài khoản mẫu:   cashier / 123  |  fixer / 123');
  console.log('  (Nhấn Ctrl+C để dừng toàn bộ)');
  console.log('================================================================\n');
}
