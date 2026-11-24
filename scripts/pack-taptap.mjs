import fs from 'node:fs/promises';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
const webDir = path.join(distDir, 'web');
const zipPath = path.join(distDir, 'stargrid-arsenal-collab-taptap-h5.zip');

async function copyRecursive(src, dest) {
  const stat = await fs.stat(src);
  if (stat.isDirectory()) {
    await fs.mkdir(dest, { recursive: true });
    const entries = await fs.readdir(src);
    for (const entry of entries) {
      await copyRecursive(path.join(src, entry), path.join(dest, entry));
    }
  } else {
    await fs.mkdir(path.dirname(dest), { recursive: true });
    await fs.copyFile(src, dest);
  }
}

async function main() {
  await fs.rm(webDir, { recursive: true, force: true });
  await fs.mkdir(webDir, { recursive: true });

  await fs.copyFile(path.join(rootDir, 'index.html'), path.join(webDir, 'index.html'));
  await copyRecursive(path.join(rootDir, 'shared'), path.join(webDir, 'shared'));
  await copyRecursive(path.join(rootDir, 'src'), path.join(webDir, 'src'));

  const pyScript = [
    'import os, zipfile, sys',
    'src, dst = sys.argv[1], sys.argv[2]',
    'with zipfile.ZipFile(dst, "w", zipfile.ZIP_DEFLATED) as zf:',
    '    for base, _, files in os.walk(src):',
    '        for f in sorted(files):',
    '            full = os.path.join(base, f)',
    '            rel = os.path.relpath(full, src).replace("\\\\", "/")',
    '            zf.write(full, rel)',
  ].join('\n');

  execFileSync('python', ['-c', pyScript, webDir, zipPath], { stdio: 'inherit' });
  const stat = await fs.stat(zipPath);
  console.log(`TapTap H5 package generated: ${zipPath} (${stat.size} bytes)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
