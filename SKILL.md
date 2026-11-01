---
name: readme-unslop
description: Lint a README for AI-generated tells (emoji headings, badge walls, filler words, empty Roadmap/Contributing, fake Screenshots) and rewrite it so it reads like a person who cares wrote it. Use when asked to review, clean up or "de-slop" a README or docs file.
---

# readme-unslop

## Steps

1. Run the linter from this repo on the target file:
   `node readme-unslop.js --json README.md`
   (zero dependencies; Node 18+). Without the file, read `readme-unslop.js` in this folder.
2. Read the findings. Each has a line, a rule name and a suggested fix. The score is a prompt to reread, not a verdict.
3. Before rewriting, collect real facts from the repo: what the project does, the actual install and run commands, a real example output, and what is missing or broken. Never invent any of these. If you can't find one, ask the user or say it is unknown.
4. Edit the README:
   - A cared-for README has a real, runnable example, an honest note on what isn't done, and no empty boilerplate.
   - Delete sections that have nothing real in them (Roadmap, Contributing, Screenshots with no image) instead of filling them with stock text.
   - Strip emoji from headings, cut badges to build status and license, replace filler words with a concrete claim or number.
   - Keep every true fact, command and link. Don't change meaning, license text or credits.
5. Re-run the linter. Aim for under 30, but don't contort honest text to chase a number. Report the before/after score and list what you removed, so the user can undo any of it.

## Don't

- Don't claim the README was or wasn't written by AI; the tool can't know.
- Don't add new marketing claims, features or benchmarks.
