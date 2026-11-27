// npm run play  →  starts the game server + a free Cloudflare quick tunnel,
// then opens the host screen on the public https link.
const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const HOST_KEY = process.env.HOST_KEY || '7x';

function findCloudflared() {
  const local = path.join(__dirname, 'bin', process.platform === 'win32' ? 'cloudflared.exe' : 'cloudflared');
  if (fs.existsSync(local)) return local;
  const candidates = [
    'C:\\Program Files (x86)\\cloudflared\\cloudflared.exe',
    'C:\\Program Files\\cloudflared\\cloudflared.exe',
  ];
  for (const c of candidates) if (fs.existsSync(c)) return c;
  try {
    execSync(process.platform === 'win32' ? 'where cloudflared' : 'which cloudflared', { stdio: 'ignore' });
    return 'cloudflared';
  } catch {
    return null;
  }
}

const cf = findCloudflared();
if (!cf) {
  console.log('\n❌ cloudflared مش متسطّب.');
  console.log('   افتحي PowerShell كـ Administrator واكتبي:');
  console.log('   winget install --id Cloudflare.cloudflared -e\n');
  console.log('   أو نزّلي cloudflared-windows-amd64.exe من:');
  console.log('   https://github.com/cloudflare/cloudflared/releases/latest');
  console.log('   وسمّيه cloudflared.exe وحطيه في فولدر bin جوه المشروع.\n');
  process.exit(1);
}

const server = spawn(process.execPath, [path.join(__dirname, 'server.js')], { stdio: 'inherit', env: { ...process.env, PORT } });
// http2 instead of the default QUIC (UDP) — many office networks block UDP
const tunnel = spawn(cf, ['tunnel', '--no-autoupdate', '--protocol', 'http2', '--url', `http://localhost:${PORT}`]);

let publicUrl = null;
let shown = false;
console.log('⏳ بنجهّز اللينك الأونلاين…');
const onOutput = (buf) => {
  const text = String(buf);
  const m = text.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/);
  if (m && !publicUrl) publicUrl = m[0];
  if (/\bERR\b/.test(text)) process.stdout.write('⚠️  ' + text);
  // open only once the tunnel is actually connected to Cloudflare (avoids Error 1033)
  if (publicUrl && !shown && /Registered tunnel connection/i.test(text)) {
    shown = true;
    const hostUrl = `${publicUrl}/host?key=${HOST_KEY}`;
    console.log('\n==============================================');
    console.log('🌍 اللعبة أونلاين!');
    console.log(`   شاشة الهوست: ${hostUrl}`);
    console.log('   (الـ QR على الشاشة بيفتح اللينك ده للاعبين)');
    console.log('   سيبي الـ terminal ده مفتوح طول اللعبة — Ctrl+C للإيقاف');
    console.log('==============================================\n');
    // short pause so the new DNS name propagates before opening the browser
    setTimeout(() => {
      const open = process.platform === 'win32' ? `start "" "${hostUrl}"` : process.platform === 'darwin' ? `open "${hostUrl}"` : `xdg-open "${hostUrl}"`;
      try { execSync(open); } catch {}
    }, 3000);
  }
};
tunnel.stdout.on('data', onOutput);
tunnel.stderr.on('data', onOutput);
tunnel.on('exit', (code) => { console.log(`tunnel stopped (${code})`); server.kill(); process.exit(code || 0); });

const stop = () => { tunnel.kill(); server.kill(); process.exit(0); };
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
