import { copyFile, mkdir, access } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const webDir = path.join(root, 'www');
const files = ['index.html', 'style.css', 'script.js', 'milestones.js', 'firebase-init.js'];

async function exists(p) {
  try { await access(p); return true; } catch { return false; }
}

async function run(cmd, args) {
  await new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { cwd: root, stdio: 'inherit', shell: false });
    child.on('error', reject);
    child.on('exit', code => code === 0 ? resolve() : reject(new Error(`${cmd} exited with ${code}`)));
  });
}

console.log('Bean Growth: root → www sync');
await mkdir(webDir, { recursive: true });

for (const name of files) {
  const src = path.join(root, name);
  const dst = path.join(webDir, name);
  if (!(await exists(src))) throw new Error(`Missing source file: ${name}`);
  await copyFile(src, dst);
  console.log(`  copied ${name}`);
}

if (await exists(path.join(root, 'android'))) {
  console.log('\nCapacitor: syncing Android project...');
  await run(process.platform === 'win32' ? 'npx.cmd' : 'npx', ['cap', 'sync', 'android']);
  console.log('Android sync complete.');
} else {
  console.log('\nandroid/ not found. Web sync only.');
}

console.log('\nDone. Do not copy a www folder manually.');
