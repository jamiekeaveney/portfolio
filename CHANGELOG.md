# Changelog

## 1.2.2 — 18 November 2026

- Restore the R8 desktop lightbox from after the project z-index fix; remove the later player-frame overrides. Keep a separate fitted mobile/tablet dialog with animated Close aligned with Menu.
- Restore Osmo loader easing, three-second fill and staggered bottom messages; reveal the page beneath the dark loader without a full white screen.
- Increase native Super Button Large padding to 1.5em vertically and 2–2.25em horizontally.
- Replace the footer gradient with a real half-height marquee overlap, two sequential desktop parallax reveals and full-panel glass. Keep endpoints correct after resizing and freeze the current layout before page transitions.
- Support light-theme footer colour and readable legal text.
- Animate both dimensions of inline heading media while reserving block space; update that reservation after breakpoint changes.
- Apply the same blur/opacity entrance and exit to all three Approach media items.
- Reveal mobile project-detail media after the destination returns to document flow, avoiding the visible fixed-layout jump.
- Keep mobile marquees travelling in one direction at the document boundary and give the name glyphs right-side breathing room.

Designer edits to the Jamie heading clipping and client-logo sizes are retained.

### Validation

Source/build checks, sticky-entry and year-rollover tests, and footer geometry tests pass. The footer tests cover entry tint, half-height overlap, resizing at the page end, and freezing before navigation. Browser validation is recorded in `VALIDATION.md`.

## 1.2.1 — 18 November 2026

- Use a single viewport-space playhead for the Home showreel, avoiding double scroll lag.
- Restore browser-history positions without replaying Home entrance animations.
- Keep desktop lightbox video, rounded frame and controls in one fitted fixed rectangle. Align mobile Close with Menu.
- Restore navigation current-page and peer-hover colours, and copied-email confirmation.
- Rebuild the loader with navigation-sized wordmarks, bottom messages and an expanding white line.
- Restore desktop first-panel footer parallax and grey entry tint. Restrict the frosted marquee reveal to the lower strip; remove excess document overflow.
- Start the About portrait handoff at viewport centre and retain the heading collapse. Reserve mobile inline-media height.
- Improve standalone button padding, list row spacing, Projects mobile introduction, client-section separation and related-work balance.

Designer edits to the Jamie heading clipping and client-logo sizes are retained. Native Webflow component geometry remains in Webflow; this repository owns the shared interaction code and custom CSS.

### Validation

Source syntax, manifest ownership, build, sticky-entry stability and year-rollover checks passed. Browser checks covered desktop player opening from a scrolled position and resizing, both copy-email controls, current-page navigation, browser Back restoration, portrait handoff, footer document bounds, and mobile layout geometry. Physical iPhone momentum was not tested in this session.
