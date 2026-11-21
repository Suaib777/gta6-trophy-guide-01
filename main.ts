// Hand-in program for the Leonida Trophy Guide (Node 22, standard library only).
// The guide itself is the static app/ folder: index.html plus its module, stylesheet
// and data files, no build step, nothing fetched from the network. This program copies
// app/ and screenshots/ next to this file into the output directory (MAKEFUN_OUTPUT_DIR
// outside the grader, /output inside it) and writes dossier.json there with the
// vendored make.fun library, which is the summary the judge reads. The vendor file
// must stay exactly as shipped: the scorer rebuilds the dossier with its own copy
// and requires the two to match byte for byte.
import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// The gate takes 3 or 4 screenshots, each at most 256 KiB: refuse early, with a
// plain message, rather than handing in an entry the scorer would reject.
const shotsDir = join(repoRoot, 'screenshots');
const shots = existsSync(shotsDir)
  ? readdirSync(shotsDir).filter((name) => !name.startsWith('.') && statSync(join(shotsDir, name)).isFile())
  : [];
if (shots.length < 3 || shots.length > 4) {
  throw new Error(`expected 3 or 4 screenshots, found ${shots.length}`);
}
for (const name of shots) {
  if (statSync(join(shotsDir, name)).size > 262144) {
    throw new Error(`screenshot ${name} is over the 256 KiB cap`);
  }
}

mkdirSync(outputDir, { recursive: true });
cpSync(join(repoRoot, 'app'), join(outputDir, 'app'), { recursive: true });
mkdirSync(join(outputDir, 'screenshots'), { recursive: true });
cpSync(shotsDir, join(outputDir, 'screenshots'), { recursive: true });

// Caps from the gate (reference/gate.json): the dossier text is capped at 160 KiB,
// screenshots at 4 files of 256 KiB, app/ at 993 files and 48 MiB. buildDossier
// refuses an entry past any of them, so a bad hand-in fails here, loudly.
writeFileSync(
  join(outputDir, 'dossier.json'),
  buildDossier(outputDir, { text_max_bytes: 163840, screenshots: { max: 4, max_bytes: 262144 }, app_max_files: 993, app_max_bytes: 50331648 }),
);

console.log(`handed in ${shots.length} screenshots (${shots.join(', ')}) to ${outputDir}`);
