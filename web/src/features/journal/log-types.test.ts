import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { memoryKeyValueStore } from '../../lib/storage';
import { loadDraft } from './draft';
import { FLOWER_LOGGABLE, LOG_TYPES, logTypeSchema, TREE_LOGGABLE } from './log-types';

describe('journal entry types: one list, the backend\'s', () => {
  it('matches the LogType enum in the Prisma schema exactly', () => {
    const schema = readFileSync(resolve(__dirname, '../../../../backend/prisma/schema.prisma'), 'utf8');
    const body = /enum LogType \{([\s\S]*?)\}/.exec(schema)?.[1] ?? '';
    const backend = body
      .split('\n')
      .map((line) => line.replace(/\/\/.*$/, '').trim())
      .filter(Boolean);
    expect([...LOG_TYPES].sort()).toEqual(backend.sort());
  });

  it('what trees and flowers can log are real types', () => {
    for (const type of [...TREE_LOGGABLE, ...FLOWER_LOGGABLE]) expect(logTypeSchema.safeParse(type).success).toBe(true);
    expect(FLOWER_LOGGABLE).not.toContain('HARVEST');
  });

  it('a saved draft with an unknown type is discarded, not trusted', () => {
    const kv = memoryKeyValueStore();
    kv.set('bagicha.draft.moment.p1', JSON.stringify({ type: 'NOPE', content: 'x' }));
    expect(loadDraft('p1', kv)).toBeNull();
  });
});
