// Tide Market — the hand-in program for make.fun's best card game bounty.
//
// The job: gather this repository's game/ and screenshots/ into the output
// directory and write dossier.json, the summary the judge reads, using the
// vendored make.fun library. Runs on Node 22 with the standard library only.
//
//   MAKEFUN_OUTPUT_DIR=out node main.ts
//
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output. The program
// runs twice and both runs must write identical bytes, so nothing here reads
// the clock, the environment (beyond the output dir), or any mutable state:
// it copies files and lets buildDossier do the summarizing.

import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

// The repository root is the directory holding this file.
const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Start from a clean output directory so a stale file from an earlier run
// can never leak into the hand-in.
rmSync(outputDir, { recursive: true, force: true });
mkdirSync(outputDir, { recursive: true });

// The playable game: plain static files under game/.
cpSync(join(repoRoot, 'game'), join(outputDir, 'game'), { recursive: true });

// The maker's screenshots of the game itself, first by name is the cover.
mkdirSync(join(outputDir, 'screenshots'), { recursive: true });
if (existsSync(join(repoRoot, 'screenshots'))) {
  cpSync(join(repoRoot, 'screenshots'), join(outputDir, 'screenshots'), { recursive: true });
}

// The dossier the judge reads: byte-for-byte what the vendored library
// writes from the copied game/ and screenshots/. The caps mirror the
// scorer's own: at most 4 screenshots of 256 KiB, game/ at most 993 files
// and 48 MiB, paths at most 1000 bytes, dossier text at most 160 KiB.
const dossier = buildDossier(outputDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
});
writeFileSync(join(outputDir, 'dossier.json'), dossier);
