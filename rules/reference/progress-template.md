# Progress files (ai-progress/) — all modes

The format and procedure for progress files is owned by the **`chisel-plan` skill** — see [.claude/skills/chisel-plan/SKILL.md](.claude/skills/chisel-plan/SKILL.md). The same layout serves **every mode** (Figma import, static-asset, prompt, rebuild, migration); only the roadmap's `## Source` block and the typical phase set differ per mode — both covered by the skill.

That skill covers:

- When to create progress files (thresholds)
- Files & layout (`ai-progress/INDEX.md` + `ai-progress/FINDINGS.md` at the root, plus a per-task `ai-progress/changes/{NN}-{task-name}/` folder holding `ROADMAP.md` + `LOG.md` (multi-phase) + `phase-NN-{slug}.md`; single-phase work → just `ROADMAP.md` inside its folder, log/checklist inline)
- One roadmap per task/goal; never one monolithic file; never mixed modes; completed tasks stay put (Done in INDEX, no archive/ folder)
- Format templates (INDEX with Active/Done, FINDINGS, roadmap with mode-appropriate `## Source` + `## Decisions`, LOG, phase file, single-phase roadmap)
- Typical phase sets per mode (Figma single-/multi-screen, greenfield feature, rebuild, refactor)
- Hard rules (roadmap = router with one-line outcomes, one status per phase + one per task, insert-don't-renumber, absolute dates, incidental findings → FINDINGS.md, files beat memory but code beats files, etc.)
- Procedure for create / update / session start + end — phase files written up front, checklists filled at each phase's gate
- Anti-patterns
