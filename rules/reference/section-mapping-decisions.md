# Section Mapping Decisions

For each distinct section/component in the spec (Figma node, mockup region, or described feature), apply this decision ladder. Stop at the first match — default to the simplest option that works. For file structures, existing styles/mods, and the build-pipeline rule, see [blocks.md](.claude/chisel/reference/blocks.md).

## Platform questions (answer first)

Before applying the ladder, answer these four for the section/feature — the answers determine where the work belongs:

1. **Content management** — editor-managed, code-managed, or mixed?
2. **Reuse** — reusable across multiple pages, or one-off?
3. **Data shape** — static, relational (CPT/taxonomy), or query-driven?
4. **Interaction** — needs custom interaction (tabs, accordion, slider) or AJAX?

## Recommended feature-building sequence

When implementing a feature end-to-end, follow this order — it prevents costly rework (e.g., styling before templates stabilize, or building blocks before the data model exists):

1. **Design tokens** — update `theme.json` and `src/design/` if new tokens are required
2. **Content model** — CPTs, taxonomies, ACF fields, options pages
3. **View model** — Timber class additions and Twig context
4. **Templates** — page, archive, single, components, partials
5. **Editor experience** — blocks or patterns
6. **Styling** — SCSS in the right ITCSS layer
7. **Behavior** — JS modules, sliders, filters, AJAX
8. **Compile and QA** — ask the user to run `npm run build-scripts` (see CLAUDE.md "Before completing any task")

## Quick pick

| Need                                | Approach               | Skill                                                                 | Example                         |
| ----------------------------------- | ---------------------- | --------------------------------------------------------------------- | ------------------------------- |
| Simple text/image section           | Core blocks directly   | —                                                                     | No custom code                  |
| Visual variant of a core block      | Block style            | [extend-core-block](.claude/skills/chisel-extend-core-block/SKILL.md) | Button colors, spacer sizes     |
| Extra toggle/setting on a block     | Block mod              | [extend-core-block](.claude/skills/chisel-extend-core-block/SKILL.md) | Disable bottom margin           |
| Layout section with standard blocks | Pattern                | [create-pattern](.claude/skills/chisel-create-pattern/SKILL.md)       | Hero, CTA, features grid        |
| Repeatable field-driven content     | ACF block              | [create-acf-block](.claude/skills/chisel-create-acf-block/SKILL.md)   | Slider, team grid, testimonials |
| Complex interactive component       | Custom WP block        | [create-block](.claude/skills/chisel-create-block/SKILL.md)           | Accordion, tabs, carousel       |
| Entity-like repeating content       | CPT + CPT-driven block | [create-cpt](.claude/skills/chisel-create-cpt/SKILL.md)               | Case studies, team, portfolio   |

## Block decision ladder

1. **Pure core blocks** — section is just headings + paragraphs + image + buttons → use core blocks directly inside a pattern. No custom code.
2. **Core block + block style** — section is a core block (button, spacer, quote) with a color/size variant → add `registerBlockStyle()` entry in `src/scripts/editor/blocks-styles.js` and style in `src/styles/blocks/_core-{name}.scss`. Use [extend-core-block](.claude/skills/chisel-extend-core-block/SKILL.md).
3. **Core block + mod (toggle)** — on/off behavior (hide margin, reverse columns, invert colors) → block mod filter in `src/scripts/editor/mods/`. Use [extend-core-block](.claude/skills/chisel-extend-core-block/SKILL.md).
4. **Pattern** — layout composed of several blocks (hero, features grid, CTA band, testimonials, logo strip, FAQ list, pricing table) → use [create-pattern](.claude/skills/chisel-create-pattern/SKILL.md). **Default for most section layouts.**
5. **ACF block** — anything beyond a pure pattern that needs structured editor fields (slider, team grid, testimonials carousel, logo grid with links, stats counters, hero with file/image/link fields). **Default custom-block choice in Chisel.** Use [create-acf-block](.claude/skills/chisel-create-acf-block/SKILL.md).
6. **Custom WP (native React) block** — STOP AND ASK THE USER FIRST. Reserve for cases where ACF fields genuinely can't express what the editor canvas needs (in-canvas interactive state, drag-to-reorder, `<InnerBlocks>` composability where editors place arbitrary nested blocks, performance-critical server-render unsuitability). State the specific justification before proposing native React. Use [create-block](.claude/skills/chisel-create-block/SKILL.md) only after user approval.

> **Editability note:** Patterns are fully editable in the WP editor — they're composed of native blocks. "Editable in admin" is not a reason to choose ACF block over pattern. Choose ACF block (rung 5) when content has structured fields the editor should fill via a form (single instance OR repeating with a fixed shape).
>
> **ACF vs native React (rung 5 vs 6):** ACF is the default. Native React requires user approval AND a documented exception — interactive editor canvas, true `<InnerBlocks>` composability, or performance need that rules out server rendering. A slider that's only interactive on the frontend, tabs that only toggle visibility on the frontend, an accordion whose expand/collapse runs in vanilla JS — all of these are ACF blocks with frontend JS. Native React is for editor-canvas interactivity, not frontend interactivity.

## Shared components rule

Before creating anything new, check existing patterns/blocks for reuse. **Figma mode**: check the "Shared / cross-phase" section of the effort's `ai-progress/changes/{NN}-{task-name}/ROADMAP.md`. **Other modes**: skim `patterns/` and `src/blocks*/` for matching slugs. If the current section matches an existing pattern/block, reuse it — don't create `hero-2` when `hero` exists.

If the existing component needs a variation, prefer:

1. Adding a block style or modifier class
2. Adding a pattern variant flag (not a new pattern)
3. Creating a new pattern only if the structure genuinely differs

If you reuse, record the current screen under the component's "used by" list (Figma mode: in the roadmap's "Shared / cross-phase" section).

## CPT decision

Create a CPT when ALL three apply:

1. Spec shows multiple instances of the same content shape (portfolio items, team, case studies, services, events, locations)
2. User wants editors to manage them individually
3. There is a single-view page or an archive/listing

**Do NOT** create a CPT for:

- One-off pages
- Homepage sections
- Content that only appears inside a pattern

When you do create one:

- Use [create-cpt](.claude/skills/chisel-create-cpt/SKILL.md)
- Default Gutenberg-enabled (`editor` in supports, `show_in_rest: true`)
- ACF metaboxes only for WooCommerce products — never regular CPTs
- Per-entry layout: block template (seed blocks) + custom/ACF blocks for unique sections

## Header / footer / global elements

- Site-wide header/footer are Twig templates, not patterns. Use [adapt-header-footer](.claude/skills/chisel-adapt-header-footer/SKILL.md).
- Do NOT build header/footer as a block pattern unless user explicitly wants block-based site editing.

## Forms

- Use Gravity Forms (already integrated — `src/styles/gravity-forms.scss`)
- Form designs → configure GF form → embed via `[gravityform]` shortcode or GF block → scope styles in `_p-{pattern-slug}.scss`
