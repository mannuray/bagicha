#!/usr/bin/env node
/**
 * Fails when a module under src/modules/<a> imports a sibling module's
 * internals (anything other than src/modules/<b>/index).
 */
const fs = require('fs');
const path = require('path');

const MODULES = path.resolve(__dirname, '../src/modules');
const IMPORT_RE = /(?:import|export)[^'"]*from\s+['"]([^'"]+)['"]/g;
const violations = [];

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.name.endsWith('.ts') && !entry.name.endsWith('.spec.ts')) check(full);
  }
}

function moduleOf(file) {
  const rel = path.relative(MODULES, file);
  return rel.startsWith('..') ? null : rel.split(path.sep)[0];
}

function check(file) {
  const own = moduleOf(file);
  const source = fs.readFileSync(file, 'utf8');
  for (const match of source.matchAll(IMPORT_RE)) {
    const spec = match[1];
    if (!spec.startsWith('.')) continue;
    const target = path.resolve(path.dirname(file), spec);
    const other = moduleOf(target);
    if (!other || other === own) continue;
    const inside = path.relative(path.join(MODULES, other), target);
    if (inside !== '' && inside !== 'index') {
      violations.push(`${path.relative(process.cwd(), file)} -> ${spec}`);
    }
  }
}

walk(MODULES);
if (violations.length) {
  console.error('Sibling modules must be imported through their index.ts:');
  for (const v of violations) console.error(`  ${v}`);
  process.exit(1);
}
console.log('module imports: ok');
