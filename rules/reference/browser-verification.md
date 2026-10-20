# Browser Verification

The **rendered** half of verification. `npx chisel-verify` reads files; this opens the page. Between
them they cover what a static check can't reach — seeded page content, JS that throws, an image that
404s, spacing that drifted from the spec.

**This is not a test suite.** Chisel ships no test framework and the toolkit does not add one — no
Jest, no PHPUnit, no Playwright spec files, no `npm test`. What the theme produces is markup and SCSS
driven by a design spec, and the failures that matter are visual. An assertion that "the hero renders
a heading" passes while the section looks wrong. So: no assertions, no fixtures, no CI job. One
scripted look at the real page, by the agent, before the work is handed to the user.

**It does not replace the user's eyes (HARD RULE).** A screenshot you took is evidence for *you* —
it lets you catch obvious drift before the handoff instead of after. It never ticks a
`Done when · Manual` item. Those stay `[ ]` until the user confirms them.
→ [CLAUDE.md "Manual checks are the user's"](CLAUDE.md#change-tracking)

## Prerequisite: the site URL

Nothing in the theme records where the site is served. **Ask once, then write it down** — a
`**Site URL:**` line at the top of `context/INDEX.md`:

```markdown
**Site URL:** http://xfive-co.test
```

Read it from there every session. If it isn't recorded yet, ask for it and add the line; never guess
a URL from the folder name, and never re-ask a question the file already answers.

## Availability

Browser verification needs Playwright MCP (`browser_navigate`, `browser_snapshot`,
`browser_take_screenshot`, `browser_console_messages`, `browser_resize` — tool names carry the
server's prefix, which varies by install).

**Optional, unlike `xfive-mcp-chisel`.** If the tools aren't in your list, say so once and fall back
to asking the user for a screenshot — exactly what the skills did before. Don't stop the phase, and
don't ask the user to install anything mid-build. Report it as *not checked*, never as *passed*.

## The pass

Run it after the build compiles and before you summarize the phase.

1. **`browser_navigate`** to the page you just changed. Not the homepage by reflex — the URL where
   the section actually lives.
2. **`browser_console_messages`** — read it before looking at anything. A `view.js` that throws on
   load leaves the section half-initialized, and it looks like a CSS bug until you read the console.
   Any error is a finding; warnings get judged.
3. **`browser_take_screenshot`** at the spec's primary viewport. Compare against the spec crop
   (Figma `get_screenshot`, the mockup, or the written description). Check spacing steps, colors,
   font sizes, alignment.
4. **`browser_resize`** to mobile and screenshot again. Breakpoint names and their pixel values live
   in `src/design/tools/_breakpoints.scss` — read them rather than assuming 768.
5. **`browser_snapshot`** — the accessibility tree. Cheap and it catches what a picture doesn't:
   an image with no alt text, a nav toggle with no accessible name, a heading level that skipped a
   step, a link whose only label is "read more".

Close the browser when you're done with it.

## Other pages the change shows up on

The pass above opens the page the change was made on. A change to something shared (a token value,
a base style, a component, the header) also lands on pages nobody opened, and that's where a
regression hides. [chisel-code-review](.claude/skills/chisel-code-review/SKILL.md) lists those places
under **Also shows**; this is where they get opened.

**Before.** Ahead of the first edit (right after the go-ahead in a phase, after triage in a quick
fix), check what the work will touch. Anything shared → screenshot one real page for each place
that shows it, at the primary viewport, while it's still unchanged. Name the files `before-{page}`
and keep them outside the theme, so they can never be staged.

**After.** Once the review is back, open every page on its **Also shows** list, plus every page you
took a before shot of. For each one: console first, then a screenshot at the primary viewport,
compared with its before shot. Add mobile only where the change affects layout.

- **Unexpected difference** → you caused it. Fix it in this phase; it's not a finding.
- **Intended difference** (the new button style, now everywhere) → fine, but name the page in the
  summary so the user looks.
- **No before shot** → check the console and obvious breakage only, and say there was nothing to
  compare against.

**Review skipped** → there's no **Also shows** list. Open the changed page and any page with a
before shot, and report the rest of the site as *not checked*.

## What this catches that `chisel-verify` cannot

- **Seeded page content.** Content pushed through MCP lives in the database, so the script never
  reads it. A bad preset class, a literal hex, an `customOverlayColor` in a seeded section is
  invisible to every static check and obvious in the render.
- **Broken asset URLs.** A pattern whose image reference didn't survive the seed renders a blank
  box, not an error.
- **JS that throws.** Nothing in the SCSS/markup checks touches runtime.
- **Drift.** Spacing that reads fine in the markup and wrong on screen.
- **Breakage on other pages.** A shared style or component changed for one page and shifted another.

Conversely, a clean browser pass proves nothing about token slugs, helper definitions, pattern
four-way sync, or `core/` staying untouched. **Run both.**
→ [chisel-verify](.claude/skills/chisel-verify/SKILL.md)

## The editor canvas

Checking how a block behaves *inside* the editor needs an authenticated session, which this pass
doesn't set up. Editor behaviour stays a `Done when · Manual` item for the user — say so explicitly
rather than letting a clean frontend pass imply the editor was checked.

## Reporting

Fold the result into the phase summary as its own line, in the same three-way split the checklist
uses:

```text
Automated:  chisel-verify clean · build-scripts passed (user-run)
Rendered:   /about at 1440 + 390 — no console errors, hero gap 8px tight vs the crop (fixed)
Also shows: /contact, /blog (button style): /contact matches its before shot, /blog card buttons wrapped (fixed)
Manual:     editor behaviour of the slider block · the copy in section 3
```

When the tools weren't available: `Rendered: not checked — Playwright MCP unavailable`.

## Anti-patterns

- ❌ Ticking a `Done when · Manual` item because you took a screenshot.
- ❌ Reporting "verified" when only `chisel-verify` ran and the page was never opened.
- ❌ Reporting "verified" when only the page was opened and `chisel-verify` never ran.
- ❌ Screenshotting the homepage when the change landed on another page.
- ❌ Opening only the changed page when the code review listed others.
- ❌ Taking the before shots after building. (Then there's nothing to compare against.)
- ❌ Skipping the console read because the screenshot looked right.
- ❌ Stopping the phase because Playwright MCP isn't installed. (It's optional. Say so and move on.)
- ❌ Asking for the site URL again after it's in `INDEX.md`.
- ❌ Adding a test framework, spec files, or an `npm test` script to the theme.

## Related

- The static half, and what each check means → [chisel-verify](.claude/skills/chisel-verify/SKILL.md)
- Where the list of other pages comes from → [chisel-code-review](.claude/skills/chisel-code-review/SKILL.md)
- Where this sits in a screen's done gate → [screen-build-order.md](.claude/chisel/reference/screen-build-order.md#verification-checklist)
- Where this sits in a phase → [chisel-change-implement](.claude/skills/chisel-change-implement/SKILL.md)
- The Figma section-by-section visual diff → [chisel-figma-to-chisel](.claude/skills/chisel-figma-to-chisel/SKILL.md)
- Why seeded content is invisible to the script → [mcp-workflow.md](.claude/chisel/reference/mcp-workflow.md)
