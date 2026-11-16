// A src/sztorik/*.tsx fájlokból legenerálja a src/sztorik/index.ts nyilvántartást (render és típusellenőrzés előtt fut).
import fs from 'node:fs';
import path from 'node:path';

export function sztoriLista() {
  const dir = 'src/sztorik';
  fs.mkdirSync(dir, {recursive: true});
  const fajlok = fs.readdirSync(dir).filter((f) => f.endsWith('.tsx')).sort();
  const nev = (f) => '_' + f.replace(/\.tsx$/, '').replace(/[^a-zA-Z0-9]/g, '_');
  const tartalom = [
    '// AUTOMATIKUSAN GENERÁLT (tools/sztori-lista.mjs) – ne szerkeszd kézzel.',
    "import React from 'react';",
    ...fajlok.map((f) => `import ${nev(f)} from './${f.replace(/\.tsx$/, '')}';`),
    '',
    'export const sztorik: Record<string, React.FC> = {',
    ...fajlok.map((f) => `  '${f.replace(/\.tsx$/, '')}': ${nev(f)},`),
    '};',
    '',
  ].join('\n');
  const ki = path.join(dir, 'index.ts');
  if (!fs.existsSync(ki) || fs.readFileSync(ki, 'utf8') !== tartalom) fs.writeFileSync(ki, tartalom);
  return fajlok.map((f) => f.replace(/\.tsx$/, ''));
}

if (process.argv[1]?.endsWith('sztori-lista.mjs')) console.log(sztoriLista().join('\n') || '(nincs sztori)');
