/**
 * Unit tests for skillProjectCounts.js — the Skill → project
 * matching behind Interactive Skills (live counts, never
 * hardcoded). Run with `npm test` (node --test, no runner
 * dependency). CI runs the same `test` script; see ci.yml.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeKey,
  getRepoKeys,
  countReposForSkill,
  skillCounts,
  findSkillByKey,
} from './skillProjectCounts.js';

test('normalizeKey: aliases canonicalize display names', () => {
  assert.equal(normalizeKey('C++'), 'cpp');
  assert.equal(normalizeKey('C#'), 'csharp');
  assert.equal(normalizeKey('Node.js'), 'nodejs');
  assert.equal(normalizeKey('Tailwind CSS'), 'tailwindcss');
  assert.equal(normalizeKey('HTML5'), 'html');
  assert.equal(normalizeKey('MySQL'), 'mysql');
});

test('normalizeKey: C++ and C stay distinct (never strip to one key)', () => {
  assert.equal(normalizeKey('C++'), 'cpp');
  assert.equal(normalizeKey('C'), 'c');
  assert.notEqual(normalizeKey('C++'), normalizeKey('C'));
});

test('normalizeKey: plain names lowercase + trim; non-strings are empty', () => {
  assert.equal(normalizeKey('Python'), 'python');
  assert.equal(normalizeKey('  React  '), 'react');
  assert.equal(normalizeKey(null), '');
  assert.equal(normalizeKey(undefined), '');
  assert.equal(normalizeKey(42), '');
});

test('getRepoKeys: languages + topics, C++ language and cpp topic collapse', () => {
  const keys = getRepoKeys({
    languages: ['Python', 'C++'],
    topics: ['cpp', 'machine-learning'],
  });
  assert.ok(keys.has('python'));
  assert.ok(keys.has('cpp'));
  assert.ok(keys.has('machine-learning'));
  assert.equal([...keys].filter((k) => k === 'cpp').length, 1);
});

test('getRepoKeys: primary language is the fallback only when languages[] is absent', () => {
  assert.ok(getRepoKeys({ language: 'R' }).has('r'));
  assert.ok(!getRepoKeys({ languages: [], language: 'R' }).has('r'));
  assert.equal(getRepoKeys({}).size, 0);
});

test('getRepoKeys: extraLanguages replaces languages[] (and the primary)', () => {
  const keys = getRepoKeys({ languages: ['Python'], language: 'Java' }, ['Go']);
  assert.ok(keys.has('go'));
  assert.ok(!keys.has('python'));
  assert.ok(!keys.has('java'));
});

test('countReposForSkill: counts by language and by topic', () => {
  const repos = [
    { name: 'a', languages: ['Python'] },
    { name: 'b', languages: ['Java'] },
    { name: 'c', languages: ['Python', 'R'] },
    { name: 'd', languages: [], topics: ['react'] },
  ];
  assert.equal(countReposForSkill('Python', repos), 2);
  assert.equal(countReposForSkill('Java', repos), 1);
  assert.equal(countReposForSkill('React', repos), 1);
  assert.equal(countReposForSkill('Go', repos), 0);
});

test('countReposForSkill: C++ and C count separately', () => {
  const repos = [
    { name: 'a', languages: ['C++'] },
    { name: 'b', languages: ['C'] },
  ];
  assert.equal(countReposForSkill('C++', repos), 1);
  assert.equal(countReposForSkill('C', repos), 1);
});

test('countReposForSkill: hyphenated topics count (C3 regression)', () => {
  /* GitHub topics use hyphens ('sql-server', 'tailwind-css') while
     the skill display names canonicalize without them ('sqlserver',
     'tailwindcss') — a repo tagged with the hyphenated topic must
     still count for the skill. */
  const repos = [
    { name: 'a', languages: [], topics: ['sql-server'] },
    { name: 'b', languages: [], topics: ['tailwind-css'] },
    { name: 'c', languages: ['SQL Server'] },
    { name: 'd', languages: ['Tailwind CSS'] },
  ];
  assert.equal(countReposForSkill('SQL Server', repos), 2);
  assert.equal(countReposForSkill('Tailwind CSS', repos), 2);
  assert.equal(normalizeKey('sql-server'), 'sqlserver');
  assert.equal(normalizeKey('tailwind-css'), 'tailwindcss');
});

test('getRepoKeys: null / non-object repo matches nothing (W3)', () => {
  assert.equal(getRepoKeys(null).size, 0);
  assert.equal(getRepoKeys(undefined).size, 0);
  assert.equal(getRepoKeys('not-an-object').size, 0);
  assert.equal(countReposForSkill('Python', [null, { name: 'a', languages: ['Python'] }]), 1);
});

test('countReposForSkill: langMap extras count; empty skill / repos count 0', () => {
  const repos = [{ name: 'oct-c8', language: 'Jupyter Notebook' }];
  const langMap = { 'oct-c8': ['Python', 'R'] };
  assert.equal(countReposForSkill('Python', repos, langMap), 1);
  assert.equal(countReposForSkill('', repos), 0);
  assert.equal(countReposForSkill('Python', []), 0);
});

test('skillCounts: only curated skills appear — a repo language never becomes a skill', () => {
  const skills = { Programming: ['Python', 'R'], Web: ['React'] };
  const repos = [{ name: 'oct-c8', languages: ['Jupyter Notebook', 'Python'] }];
  const counts = skillCounts(skills, repos);
  assert.equal(counts.get('Python'), 1);
  assert.equal(counts.get('R'), 0);
  assert.equal(counts.get('React'), 0);
  assert.ok(!counts.has('Jupyter Notebook'));
});

test('findSkillByKey: reverse lookup by canonical key', () => {
  const skills = { Programming: ['C++', 'Python'], Web: ['React'] };
  assert.equal(findSkillByKey('cpp', skills), 'C++');
  assert.equal(findSkillByKey('react', skills), 'React');
  assert.equal(findSkillByKey('go', skills), null);
  assert.equal(findSkillByKey('', skills), null);
});
