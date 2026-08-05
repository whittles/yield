---
name: Althoff Woodshop Calculators
description: Shop-floor cut planning for hobbyist woodworkers — measured, printable, honest about the material.
colors:
  page: "#f5f4f0"
  surface: "#ffffff"
  surface-alt: "#f3f3f3"
  rule: "#e5e3de"
  ink: "#121212"
  ink-secondary: "#4b5563"
  ink-muted: "#656c78"
  header-ground: "#242833"
  header-ink-muted: "#a3abb8"
  accent: "#121212"
  accent-hover: "#2d2d2d"
  success: "#166534"
  success-ground: "#dcfce7"
  warning: "#92400e"
  warning-ground: "#fef3c7"
  danger: "#991b1b"
  danger-ground: "#fee2e2"
  timber-face: "#e8d5b0"
  timber-edge: "#d4a84b"
  timber-core: "#8b6914"
  timber-waste: "#cfcabc"
typography:
  display:
    fontFamily: "Assistant, system-ui, sans-serif"
    fontSize: "1.875rem"
    fontWeight: 700
    lineHeight: 1.2
  headline:
    fontFamily: "Assistant, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: 1.33
  title:
    fontFamily: "Assistant, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: 1.5
  body:
    fontFamily: "Assistant, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.43
  label:
    fontFamily: "Assistant, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.33
    letterSpacing: "0.025em"
  measure:
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace"
    fontSize: "0.875rem"
    fontWeight: 600
    lineHeight: 1.43
rounded:
  sm: "2px"
  md: "4px"
  lg: "8px"
  xl: "12px"
  pill: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "20px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.surface}"
    rounded: "{rounded.md}"
    padding: "0 32px"
    height: "48px"
  button-primary-hover:
    backgroundColor: "{colors.accent-hover}"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "0 20px"
    height: "44px"
  icon-button:
    backgroundColor: "transparent"
    textColor: "{colors.ink-muted}"
    rounded: "{rounded.md}"
    height: "44px"
    width: "44px"
  input-field:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "0 8px"
    height: "40px"
  input-field-invalid:
    backgroundColor: "{colors.danger-ground}"
    textColor: "{colors.ink}"
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "20px"
  card-header:
    backgroundColor: "{colors.surface-alt}"
    textColor: "{colors.ink}"
    padding: "12px 20px"
  tab-active:
    backgroundColor: "{colors.header-ground}"
    textColor: "{colors.surface}"
    height: "44px"
    padding: "0 20px"
  tab-rest:
    backgroundColor: "{colors.header-ground}"
    textColor: "{colors.header-ink-muted}"
---

# Design System: Althoff Woodshop Calculators

## Overview

**Creative North Star: "The Shop Drawing"**

A working technical drawing pinned above a bench. Measured, annotated, honest
about scale, made to be read at arm's length by someone with sawdust on their
hands. Warm paper rather than clinical white; real rules rather than decorative
lines; a scale you can hold a tape measure against. Nothing on the page that a
machinist would resent as ornament.

The system is quiet because the data is loud. Board dimensions, fence settings,
and cut sequences are the content; the interface is the paper they are printed
on. Where the eye should go is decided by the numbers, not by the chrome — which
is why the finished dimension is the heaviest thing in a cut row and the
surrounding table is nearly weightless. Colour is spent almost entirely on the
material itself: the timber tones in the diagrams are the only saturated thing
on most screens, and they carry meaning rather than decoration.

Two viewing conditions are equally real and the system serves both without
forking: a screen at planning time, and a sheet of paper at cutting time. A
decision that reads well on screen but prints badly is a failed decision. The
printed sheet is not an export of the interface — it is the same drawing, set
for paper.

**Key Characteristics:**

- Warm off-white ground (#f5f4f0), never pure white at page level
- Near-black as the only accent; no brand hue competing with the material
- Timber tones reserved for wood, waste, and offcuts — never for UI state
- Measurements set in monospace at heavier weight than their own labels
- 1px warm rules and tonal steps carry structure; shadow is used sparingly
- Every diagram is measurable: scale rules, grain direction, honest proportion
- Print is a first-class render, not a stylesheet afterthought

## Colors

A warm neutral ground with a single near-black accent, so that the only
saturated colour on screen belongs to the wood.

### Primary

- **Ink** (#121212): The accent and the primary text colour, deliberately the
  same value. Primary buttons, active states, headings, and body copy all use
  it. There is no brand hue — the near-black *is* the accent, which is what
  keeps the timber tones legible as the only real colour in the room.
- **Ink Hover** (#2d2d2d): The single hover step for accent surfaces. Lifts just
  enough to register a press target without becoming a second colour.

### Secondary

- **Slate Ground** (#242833): The header band and the Resaw calculate button. A
  cool, dark, slightly blue-shifted neutral that separates persistent chrome
  from the working page without introducing a hue.
- **Header Muted** (#a3abb8): Secondary text and inactive tabs on the slate
  band. Measured at 7.4:1 against Slate Ground.

### Tertiary

The timber palette. These describe **material**, never interface state, and
never appear on a control.

- **Timber Face** (#e8d5b0): The flat sawn face of a board — the ground colour
  of a cross-section diagram.
- **Timber Edge** (#d4a84b): End grain and edge treatment; the warmer, more
  saturated step.
- **Timber Core** (#8b6914): The darkest timber tone, for outlines and heartwood.
- **Timber Waste** (#cfcabc): The desaturated tone behind the waste hatch.
  Deliberately drained of warmth — waste is the absence of usable material and
  should read that way.
- **Part tones** (#c9b183, #a9bfa2, #a7b6c9, #cbb0a1, #b9c2a0, #c3a9b6, #a6c1bd,
  #d0c3a0): Eight muted tones assigned to parts by a hash of the part label, so
  identical parts always match. Chosen to stay legible under a dark numeral and
  to remain distinguishable as greys on a monochrome laser printer.

### Neutral

- **Paper** (#f5f4f0): The page ground. Warm off-white, never #ffffff — the
  drawing is on paper, not on a screen.
- **Card** (#ffffff): Raised working surfaces. Pure white here is legitimate
  because it reads as a sheet laid on the paper.
- **Card Alt** (#f3f3f3): Section headers, table footers, and zebra rows. The
  quietest available step down from Card.
- **Rule** (#e5e3de): Every border in the system. Warm-tinted so it belongs to
  the paper rather than sitting on top of it.
- **Ink Secondary** (#4b5563) and **Ink Muted** (#656c78): The two supporting
  text steps, at 6.9:1 and 4.8:1 on Paper.

### Status

- **Success** (#166534) on **Success Ground** (#dcfce7)
- **Warning** (#92400e) on **Warning Ground** (#fef3c7)
- **Danger** (#991b1b) on **Danger Ground** (#fee2e2)

### Named Rules

**The Material-Only Rule.** Timber tones describe wood. A button, a badge, a
banner, or a state indicator may never borrow one. The moment a UI control turns
timber-coloured, the diagrams stop reading as material.

**The Measured Contrast Rule.** Every text colour in this system is measured
against the three grounds it can land on (#f5f4f0, #f3f3f3, #ffffff) and clears
4.5:1 on all three. `#6b7280` was the previous muted token and measured 4.39:1
on Paper — close enough to look fine and still fail. Never introduce a grey
without checking it against Paper specifically; it is the darkest ground and the
one that fails first.

**The No-Colour-Alone Rule.** Yield severity, validation state, and every other
status is carried by text or an icon in addition to colour. A red 16% and a
green 84% must be distinguishable in greyscale and to a screen reader.

## Typography

**Display / Body Font:** Assistant (with system-ui, sans-serif)
**Measure Font:** system monospace stack (ui-monospace, SFMono-Regular, Menlo)

**Character:** One humanist sans doing all the prose work, paired with a
monospace reserved strictly for measurements. Assistant is plain and slightly
condensed — it stays out of the way and sets small sizes cleanly, which matters
in dense tables. The monospace is not a costume for "technical": it earns its
place because fractions and dimensions must align in columns and be compared
digit by digit.

### Hierarchy

- **Display** (700, 1.875rem / 30px, 1.2): Home page title only.
- **Headline** (700, 1.5rem / 24px, 1.33): One per tool view — the view's `h1`.
- **Title** (600, 1rem / 16px, 1.5): Card and section headings.
- **Body** (400, 0.875rem / 14px, 1.43): Default running text and table cells.
- **Label** (500, 0.75rem / 12px, 1.33, +0.025em, uppercase): Column headers and
  field labels. Uppercase is reserved for this role.
- **Measure** (600 monospace, 0.875rem / 14px): Every dimension, fence setting,
  board-foot figure, and fraction.

### Named Rules

**The Dimension-Outweighs-Its-Label Rule.** A measurement is always set heavier
and no smaller than the label naming it. The finished dimension in a cut row is
the heaviest cell in that row, on screen (600 weight, ink) and on paper (700,
11pt, #1a1a1a). The failure this prevents is real and was shipped: the number
you cut to used to be the faintest text on the page.

**The Fractions-As-Written Rule.** Measurements render as fractions to 32nds
(`1 3/4"`, `15/32"`), never as decimals, unless the value does not resolve to a
clean fraction. Decimals are an input convenience, not an output format.

**The One Uppercase Role Rule.** Only Label is uppercase. Headings, buttons, and
body copy are sentence case. Uppercase is a structural signal for "this names a
column or a field", and loses that meaning if it spreads.

## Layout

A single centred column, `max-w-5xl` (64rem) for the tool views and `max-w-4xl`
(56rem) for Home, with 16px gutters. Content stacks in cards separated by 24px.
Within a card, related controls sit 8–12px apart and groups separate at 20px.

The breakpoint that matters is Tailwind's `sm` (640px), and it is a genuine
fork rather than a reflow: below it, every data table becomes a stack of cards
with the measurement as the card's headline. Tables are never horizontally
scrolled as the primary mobile strategy — a cut list you have to swipe sideways
at the saw is unusable. Wide content that must stay tabular is contained in its
own `overflow-x-auto` scroller so the page body never scrolls horizontally.

Long forms sticky-dock their primary action to the bottom edge on small screens.
The Resaw form runs roughly 6,000px on a phone; a Calculate button that scrolls
away is a Calculate button that does not exist.

Print is a distinct layout, not a hidden-elements version of the screen: the
board sheets lead, the accounting tables follow after a page break, chrome is
removed, and a fixed footer repeats the project name and page number on every
sheet.

### Named Rules

**The Thumb-Reach Rule.** Any control a user touches in the shop is at least
44×44px. Dense table inputs may relax to 40px tall because they are struck
deliberately while planning, but every button, delete control, tab, and primary
action holds 44.

**The No-Sideways-Page Rule.** `document.scrollWidth` never exceeds
`clientWidth` at any viewport down to 320px. Inner scroll containers are fine;
a page that pans is not.

## Elevation & Depth

Predominantly tonal. Structure comes from 1px warm rules (#e5e3de) and the
three-step tonal ramp of Paper → Card Alt → Card, in the manner of a drawing
where lines and paper weight do the work.

Cards carry one very soft ambient shadow to lift them off the warm ground — the
sheet-on-paper reading the North Star asks for. It is deliberately below the
threshold of looking like a "card UI": if the shadow is the first thing you
notice, it is too strong. Genuinely floating elements — the print button, the
sticky mobile action bar — take a stronger shadow because they overlap content
and need to be read as above it.

### Shadow Vocabulary

- **Sheet** (`box-shadow: 0 1px 2px rgba(36, 40, 51, 0.04), 0 1px 1px rgba(36, 40, 51, 0.03)`):
  Resting cards and panels. Ambient, not structural.
- **Lifted** (`box-shadow: 0 6px 16px -4px rgba(36, 40, 51, 0.18), 0 2px 6px -2px rgba(36, 40, 51, 0.10)`):
  Elements that overlap page content — the floating print action, the sticky
  action bar.

### Named Rules

**The Tinted-Shadow Rule.** Shadows are cast in the header's slate
(rgba(36, 40, 51, …)), never in pure black. Neutral-black shadow on a warm
ground reads as dirt.

**The Flat-On-Paper Rule.** All shadow is suppressed in print. Paper has its own
depth; a printed drop shadow is toner spent on nothing.

## Shapes

Small, restrained radii throughout: 4px on controls, 8px on cards, 12px on the
Home tool cards, and a pill only on the floating print action, where the shape
signals "this floats" rather than "this is a panel".

Borders are the primary form-defining device and are always 1px. No coloured
left-borders on callouts, no heavy outlines, no zero-blur block shadows. Status
panels are identified by a tinted ground plus a 1px border in the status hue at
low opacity, not by a bar down one edge.

Diagrams are the exception to the restraint and follow drawing conventions
rather than UI conventions: square corners, 0.75–1.25px strokes, hatch fills for
waste, dashed outlines for keepable offcuts, and a tick-marked scale rule along
the top edge.

## Components

### Buttons

- **Shape:** Gently rounded (4px), except the floating print action (pill).
- **Primary:** Ink ground (#121212), white text, 48px tall, 32px horizontal
  padding. Full width below `sm`.
- **Secondary:** Card ground with a 1px Rule border, ink text, 44px tall.
- **Icon button:** 44×44px, transparent at rest, Ink Muted glyph; on hover the
  glyph goes Danger and the ground goes Danger Ground at 50% for destructive
  actions.
- **Hover / Focus:** Colour transition only, 150ms. Focus shows the global ring
  (2px solid #121212, 2px offset).
- **Disabled:** 40% opacity and `not-allowed`, always accompanied by a sentence
  below the button naming what to fix. A disabled control that will not say why
  is a dead end.

### Cards / Containers

- **Corner Style:** 8px (12px for Home tool cards).
- **Background:** Card (#ffffff) on the Paper page ground.
- **Header:** Card Alt (#f3f3f3) strip with a Title-weight heading on the left
  and a Label-weight clarifier on the right.
- **Shadow Strategy:** Sheet (see Elevation).
- **Border:** 1px Rule.
- **Internal Padding:** 20px.

### Inputs / Fields

- **Style:** Card ground, 1px Rule border, 4px radius, 40px tall. Always
  visibly a field — never a transparent borderless cell that only reveals
  itself on hover.
- **Focus:** Global focus ring.
- **Error:** Danger border with a Danger Ground tint at 40%, `aria-invalid`, and
  a plain-language message directly beneath the field naming both the problem
  and the fix.
- **Labels:** Every field has a programmatic label. In dense tables the visible
  column header carries the visual label and the field carries a composed
  `aria-label` ("Length of 8/4 leg stock, in inches").

### Navigation

Persistent slate band with the brand at left and Export / Import / Reset at
right. Beneath it a real `<nav>` with a tab row: 44px tall, Label-weight,
2px bottom border on the active tab, `aria-current="page"` on the active link.
Tabs are links, not buttons. On small screens the row scrolls horizontally
within its own container.

### Data tables

- Label-weight uppercase column headers, `scope="col"`, a visually hidden
  `<caption>` naming the table.
- Zebra rows at Card Alt 60%.
- Totals in a `<tfoot>` with a 2px top rule.
- Below `sm` the table is replaced — not reflowed — by cards.

### Signature component: the cut diagram

The system's defining artifact and the thing the whole product exists to
produce. It is a drawing, so it obeys drawing rules rather than chart rules:

- **True proportion, always.** A 96×8 board renders as a 12:1 strip. Never clamp
  one axis to fit a container; on narrow screens the diagram scrolls at a
  legible scale instead of being squashed.
- **A scale rule** along the top edge, ticked and labelled in inches at a step
  chosen so labels never crowd, so the drawing can be checked against a tape.
- **Grain drawn across the whole face**, over the parts as well as the waste,
  because the wood does not stop at a cut line. Faint (17–30% opacity) so it
  reads as material rather than as rule lines.
- **Waste as real regions**, computed by subtracting placed cuts from the board
  face and drawn as a hatch only where waste actually is — so it can be pointed
  at and measured.
- **Keepable offcuts** outlined in a dashed rule and labelled with their
  dimensions.
- **Numbered parts**, with the number repeated on the chip in the cut table.
  Colour supports identity; the number carries it.
- **`role="img"` with a `<title>` and a `<desc>`** enumerating every part in cut
  order and every usable offcut.

## Do's and Don'ts

### Do:

- **Do** check every new grey against Paper (#f5f4f0), not white. It is the
  darkest ground and the first to fail 4.5:1.
- **Do** set measurements in the monospace face at 600 weight, heavier than the
  label naming them.
- **Do** render fractions to 32nds and let the caller own the inch mark, so
  `12"` never becomes `12""`.
- **Do** give every diagram a `<title>` and a `<desc>` that names its content in
  order. The diagram is the product's primary output.
- **Do** hold 44×44px on anything touched in the shop; 40px is the floor for
  dense planning-time table inputs only.
- **Do** replace tables with cards below 640px, with the measurement as the
  card's headline.
- **Do** state why a disabled control is disabled, in a sentence beneath it.
- **Do** design the print sheet as its own layout: plan first, accounting last,
  repeating footer with a page number.

### Don't:

- **Don't** use a timber tone on a control, badge, or banner. Those colours mean
  wood.
- **Don't** introduce a second accent hue. Near-black plus the material is the
  whole story.
- **Don't** carry state in colour alone — pair it with text or an icon.
- **Don't** use emoji or Unicode glyphs as icons. Icons come from
  `src/components/Icon.vue`, drawn on a 24px grid at 1.5 stroke.
- **Don't** style a field as transparent-until-hover. Editable things must look
  editable, and read-only figures must not.
- **Don't** distort a diagram's aspect ratio to fit a container.
- **Don't** put a coloured left-border on a callout, or a zero-blur block shadow
  on anything.
- **Don't** let a shadow be the first thing you notice on a resting card.
- **Don't** print a drop shadow.
