# Leonida Trophy Guide — GTA VI

[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/suaib777/gta6-trophy-guide-01/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/suaib777/gta6-trophy-guide-01/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01)

An offline guide and tracker for all 55 Grand Theft Auto VI trophies on PlayStation 5 — built for the [make.fun bounty](https://make.fun/bounty/gta6-trophy-guide-01) of the same name.

## What it is

- **Every trophy, as PlayStation publishes it** — official name, description and grade (1 platinum, 2 gold, 6 silver, 46 bronze), with the 28 hidden trophies marked.
- **A guide for each trophy, in our own words** — what to do, where and how, and when it can be missed — with the source cited beside it (PowerPyx, PushSquare, KeenGamer, Exophase). A source is cited, never copied.
- **A roadmap to the platinum** — three stages (story ~60–80h, 100% checklist ~100h, Strangers & Freaks + cleanup ~10h), built from the official descriptions, with the one missable trophy flagged: **Positive Mental Attitude** (the Chapter 1 meditation at Jason's house).
- **A tracker** — a checklist saved in the browser (localStorage), export to a JSON file and import back, filters by kind (story / missable / collectibles / activities / online) and by grade, text search, progress stats (earned count, points out of 1350, per-grade counts), and a spoiler setting that hides story trophy names and descriptions until they are earned.
- **Fully offline** — static files under `app/`, no build step, no network requests at run time, no Rockstar logo or official artwork.

## Run it

```sh
node serve.ts
# then open http://localhost:8080
```

## Hand it in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
# writes out/app/, out/screenshots/ and out/dossier.json
```

## Layout

- `app/index.html` — the page: header with progress, missable warning, roadmap, controls, trophy list and detail panel.
- `app/style.css` — the look (system fonts only).
- `app/app.js` — the tracker: data loading, filters, spoiler mode, export/import, detail panel.
- `app/data/trophies.json` — the 55 trophies: official name/description/grade, points, secret flag, kind, missable flag, chapter/mission, guide and sources.
- `app/data/roadmap.json` — the three-stage roadmap, the missable warning and the save/cheat tips.
- `main.ts` — copies `app/` and `screenshots/` to the output and writes `dossier.json` with the vendored make.fun library.
- `screenshots/` — 4 screenshots of the real app (see `shots.json` for the views).
- `serve.ts` — a tiny static server for local testing.

## Sources

The official list comes from Exophase / PSNProfiles. The per-trophy methods were researched from PowerPyx's GTA 6 Trophy Guide & Roadmap, PushSquare's GTA 6 Trophy Guide & Roadmap and KeenGamer's GTA 6 Trophy Guide & Platinum Roadmap, and rewritten in our own words with a citation beside each guide. One method is still unconfirmed in every source (Ten Pin) and is labelled as such in the guide.

## License

MIT — see `LICENSE`.
