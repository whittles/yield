# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

**Primary: the hobbyist woodworker in a home shop.** A weekend woodworker with a
modest machine set — table saw, planer, often a jointer and bandsaw — working in
a garage or basement. They buy lumber in small quantities, so waste is money out
of their own pocket rather than a line item. They plan at a desk or on a phone,
then work at the machine.

The two contexts are different and both matter: planning (seated, deliberate,
willing to enter detail) and cutting (standing at a saw, hands dirty, glancing
at a phone or a taped-up printout, easily interrupted).

## Product Purpose

Turn a list of lumber you already own and a list of parts you need into an
efficient cut plan, with the milling steps spelled out.

Three tools:

- **Yield Planner** — assign parts to boards, minimise waste, produce a cut
  diagram and step-by-step cut instructions.
- **Resaw Planner** — the full milling sequence for kumiko-style thin strips:
  crosscuts, bandsaw fence settings, drum-sander targets, table-saw rips, yield.
- **Box Planner** — open-top storage bins with a dado bottom; cut list plus the
  minimum sheet needed.

Success is a woodworker cutting expensive hardwood with confidence, and not
discovering a mistake after the cut.

## Positioning

**Zero friction.** Free, instant, no account, no install, no paywall, no email
capture. Competing optimizers gate behind sign-up or desktop software; this one
opens in a browser and works immediately, including on a phone in the shop.

Supporting mechanism (real, but not the headline the user leads with): the
solver models actual milling rather than treating boards as flat rectangles —
per-condition allowances for rough / skip-planed / S3S / S4S, kerf, per-face
planing loss, and optional resawing of thick stock into slabs.

## Operating Context

- Lumber arrives in one of four surface conditions — rough, skip-planed, S3S,
  S4S — and each loses a different amount of thickness and width during milling.
  Nominal dimensions are never finished dimensions.
- Machine sequence is real and ordered: miter saw → jointer → bandsaw → planer →
  drum sander → table saw → hand plane. Instructions that ignore this ordering
  are not actionable.
- Work happens away from the computer. The printed sheet gets taped to a wall or
  carried to the machine, and gets sawdust on it.
- Cuts are irreversible and the material is expensive. Users need to be able to
  check the tool's arithmetic, not just trust it.
- Sheet goods have real thicknesses that differ from nominal — "½-inch" plywood
  is usually 15/32".

## Capabilities and Constraints

**Confirmed constraints — future work must not break these:**

- **Free, no login, no account.** No auth, no paywall, no email capture, no
  server-side account state.
- **Fractions are the input language.** Woodworkers think in `1 3/4"`, not
  `1.75`. Fraction input and fraction output stay the primary contract; a
  decimal-only form is a regression. (Decimals are accepted as a convenience.)
- **Print is a first-class output**, not an afterthought. Every tool must
  produce a sheet that works under shop light.
- **Fully client-side.** No backend; nothing leaves the browser. localStorage
  plus JSON import/export is the whole persistence story, and it deploys as
  static files.

**Stack** (existing, not a fresh decision): Vue 3 + Vite + Pinia + vue-router
with hash history + Tailwind. Deployed static.

**Terminology** used throughout and expected by users: kerf, board foot, resaw,
skip-planed, S3S/S4S, dado, snipe, slab, offcut, blank, crosscut, rip.

**Open / undecided:** no cost-per-board-foot input exists, so the tool cannot
tell a user whether a given waste percentage actually matters in money. Whether
to add it is undecided.

## Brand Commitments

- **Althoff Woodshop** is the publisher; the tools live under its name and link
  back to althoffwoodshop.com. Logo at `public/logo.png`.
- Voice, as established by the existing copy and kept deliberately: plainly
  spoken, practical, shop-floor rather than corporate. It uses real trade
  vocabulary without apologising for it, and explains a term at the point of use
  rather than in a glossary. It states arithmetic openly so the reader can check
  it.
- The tools are labelled **beta**, and results are described as algorithmically
  generated with a standing instruction to verify before cutting. This
  disclaimer is a product commitment, not decoration — do not quietly remove it.

## Evidence on Hand

- Real, working solvers: `src/solver.js`, `src/resawSolver.js`,
  `src/binSolver.js`, `src/toolboxSolver.js`.
- Brand asset: `public/logo.png` (500×500).
- Live deployment at yield.redgamut.com.
- **No** testimonials, user counts, case studies, press, benchmarks, or pricing
  exist. Future work must not fabricate them.

## Product Principles

1. **The plan is the product.** The artifact a woodworker carries to the saw —
   on screen or on paper — is the deliverable. Everything else is supporting
   accounting.
2. **Show the arithmetic.** The next action is irreversible and the material is
   expensive, so state how a number was reached and let the user audit it rather
   than asking for trust.
3. **Never report success on incomplete work.** Silently dropping a part,
   showing a stale plan, or rounding away a problem is worse than an error
   message, because the user acts on it at the saw.
4. **Assume the shop, not the desk.** One-handed phone use, interruption,
   printed output, and dirty hands are the real conditions, not edge cases.
5. **Nominal is not finished.** Every dimension the tool reports must be honest
   about which one it is.

## Accessibility & Inclusion

Free public tool, so the audience is unbounded and it should be usable by
anyone. WCAG 2.1 AA is the working standard: every control programmatically
labelled, 4.5:1 contrast for body text, keyboard-operable throughout, status
conveyed by more than colour, and diagrams given text equivalents — the SVG cut
diagram is the app's primary output and must not be an assistive-tech dead zone.
