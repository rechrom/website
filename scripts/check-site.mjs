import { readFile, readdir, stat } from 'node:fs/promises';
import { resolve, dirname, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../public');
const html = await readFile(resolve(root, 'index.html'), 'utf8');
const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
if (new Set(ids).size !== ids.length) throw new Error('Duplicate HTML IDs');
const files = [];
async function collect(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) await collect(path);
    else files.push(path);
  }
}
await collect(root);
let references = 0;
for (const path of files.filter(path => /\.(html|css|svg)$/.test(path))) {
  const source = (await readFile(path, 'utf8')).replace(/url\(\s*(["'])data:[\s\S]*?\1\s*\)/g, '');
  const pattern = path.endsWith('.css')
    ? /url\(\s*["']?([^\s)"']+)["']?\s*\)/g
    : /\b(?:src|href)="([^"]+)"/g;
  const values = [...source.matchAll(pattern)].map(match => match[1]);
  for (const value of values) {
    if (/^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(value)) continue;
    if (value.startsWith('#')) {
      if (path.endsWith('.html') && !ids.includes(value.slice(1))) {
        throw new Error(`Missing anchor ${value}`);
      }
      continue;
    }
    const name = decodeURIComponent(value.split(/[?#]/)[0]);
    if (!name) continue;
    const target = name.startsWith('/') ? resolve(root, '.' + name) : resolve(dirname(path), name);
    const within = relative(root, target);
    if (within.startsWith('..' + sep) || within === '..') throw new Error(`Asset escapes public: ${value}`);
    if (!(await stat(target)).isFile()) throw new Error(`Missing asset ${value}`);
    references++;
  }
}
console.log(`Site checked: ${files.length} files, ${references} asset references, ${ids.length} unique IDs.`);
