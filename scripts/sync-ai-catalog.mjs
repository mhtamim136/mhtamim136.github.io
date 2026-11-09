/**
 * sync-ai-catalog.mjs — single source of truth for the agent catalog.
 *
 * Canonical file: public/ai-catalog.json. This copies it to the two
 * discovery locations (public/.well-known/ai-catalog.json and
 * public/.well-known/ard.json) so the three served copies can never
 * drift apart when the manifest is edited in one place.
 *
 * Runs in `prebuild` (before every build) and via
 * `npm run sync-catalog`. Fails loudly if the canonical file is
 * missing — a missing manifest must never silently produce empty
 * copies. The copies are byte-identical by construction.
 */
import { copyFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const canonical = path.join(projectRoot, 'public', 'ai-catalog.json');
const targets = [
  path.join(projectRoot, 'public', '.well-known', 'ai-catalog.json'),
  path.join(projectRoot, 'public', '.well-known', 'ard.json'),
];

if (!existsSync(canonical)) {
  console.error(
    '[sync-catalog] canonical public/ai-catalog.json is missing — refusing to write copies'
  );
  process.exit(1);
}
for (const target of targets) copyFileSync(canonical, target);
console.log('[sync-catalog] synced 2 copies from public/ai-catalog.json');
