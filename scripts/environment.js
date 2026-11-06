const fs = require('fs');
const path = require('path');

function loadEnvironment(rootDir) {
  const environment = {};
  const envPath = path.join(rootDir, '.env');
  if (!fs.existsSync(envPath)) return environment;

  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!match) continue;

    let value = match[2];
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    } else {
      value = value.replace(/\s+#.*$/, '').trim();
    }
    environment[match[1]] = value;
  }

  return environment;
}

module.exports = { loadEnvironment };
