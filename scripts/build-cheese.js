// ねこのチーズ工房（neko-cheese-kobo/）をビルドして、Next.js の public/cheese に置く。
// これで同じ Vercel プロジェクトの /cheese でゲームが遊べる。
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const app = path.join(root, 'neko-cheese-kobo');
const out = path.join(root, 'public', 'cheese');
const run = (cmd) => execSync(cmd, { cwd: app, stdio: 'inherit' });

run('npm ci --no-audit --no-fund');
run('npm run build -- --base=/cheese/');
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.cpSync(path.join(app, 'dist'), out, { recursive: true });
console.log('ねこのチーズ工房 → public/cheese');
