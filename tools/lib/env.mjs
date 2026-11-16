// Közös segédek: .env beolvasás, parancsfuttatás, Python környezet.
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';

export function loadEnv(file = '.env') {
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!m || process.env[m[1]]) continue;
    process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}

export function run(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, {encoding: 'utf8', maxBuffer: 1 << 28, ...opts});
  if (r.error) throw new Error(`${cmd} nem futtatható: ${r.error.message}`);
  if (r.status !== 0 && !opts.okOnFail) {
    throw new Error(`${cmd} ${args.slice(0, 6).join(' ')} ... hibával állt le (${r.status}):\n${(r.stderr || '').slice(-1500)}`);
  }
  return r;
}

export const hossz = (file) =>
  Number(run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=nw=1:nk=1', file]).stdout.trim());

// Projekten belüli Python környezet (.venv). Rendszerre nem telepít.
export function python(csomagok = []) {
  const win = process.platform === 'win32';
  const py = path.join('.venv', win ? 'Scripts/python.exe' : 'bin/python');
  if (!fs.existsSync(py)) {
    const base = win ? 'python' : 'python3';
    console.log('Python környezet létrehozása (.venv)...');
    run(base, ['-m', 'venv', '.venv']);
  }
  for (const cs of csomagok) {
    const modul = cs.replace(/-/g, '_');
    const van = run(py, ['-c', `import ${modul}`], {okOnFail: true}).status === 0;
    if (!van) {
      console.log(`${cs} telepítése a .venv-be...`);
      run(py, ['-m', 'pip', 'install', '-q', cs]);
    }
  }
  return py;
}

export const remotionBrowserArgs = () =>
  process.env.REMOTION_BROWSER ? [`--browser-executable=${process.env.REMOTION_BROWSER}`] : [];
