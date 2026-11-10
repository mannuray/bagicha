#!/usr/bin/env node
/** Fails when src/features/<a> imports anything of src/features/<b> other than its index. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../src/features');
const IMPORT_RE = /(?:import|export)[^'"]*from\s+['"]([^'"]+)['"]/g;
const violations = [];

const featureOf = (file) => {
  const rel = path.relative(root, file);
  return rel.startsWith('..') ? null : rel.split(path.sep)[0];
};

function walk(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (/\.tsx?$/.test(entry.name) && !/\.test\.tsx?$/.test(entry.name)) check(full);
  }
}

function check(file) {
  const own = featureOf(file);
  for (const match of fs.readFileSync(file, 'utf8').matchAll(IMPORT_RE)) {
    const spec = match[1];
    if (!spec.startsWith('.')) continue;
    const target = path.resolve(path.dirname(file), spec);
    const other = featureOf(target);
    if (!other || other === own) continue;
    const inside = path.relative(path.join(root, other), target).replace(/\.(tsx?|js)$/, '');
    if (inside !== '' && inside !== 'index') {
      violations.push(`${path.relative(process.cwd(), file)} -> ${spec}`);
    }
  }
}

walk(root);
if (violations.length) {
  console.error('Sibling features must be imported through their index.ts:');
  for (const v of violations) console.error(`  ${v}`);
  process.exit(1);
}
console.log('feature imports: ok');
