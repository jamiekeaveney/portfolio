# v1.2.5 — 19 November 2026

- Border-line loader reveal with optional neutral-700 wash; removed Welcome panel.
- Removed cursor dot, gallery velocity spacing, and first-stage footer parallax.
- Shared gallery/list card styling, fixed centred preview and footer-sized list rows.
- Native responsive footer grid repair, smaller button corners, and minimal full-viewport 404.
- Services sticky synchronisation, larger label inset, delayed Approach media, mobile marquee direction.
- Velocity-based portrait perspective, animated nav layout across routes, top-based ordinary history transitions.
- Light-theme contrast and hover repairs; independent touch video swipe dismissal.

# v1.2.4 — 19 November 2026

- White clipped Welcome loader; shared message typography/stagger and earlier page preparation, including restored scroll positions.
- Smaller cursor hover, refined button padding and bounded 10rem sticky section labels.
- Measured half-glyph footer overlap, no entry tint, plain white legal text.
- Continuous direction-safe gallery spacing and calmer, smaller list previews with position-aware dissolving transitions.
- Native 404 paddle game and rebuilt Style Guide with live components. Licenses/Changelog moved to draft pending Designer deletion.
- Runtime pinned to tested commit; named release tag pending browser reconnection.

# Changelog

## 1.2.3 — 18 November 2026

- Refine the approved footer: deeper glass overlap, repeated-name spacing, grey entry tint and effective difference blending for the legal row in both themes.
- Add a shared white cursor dot, subtle preview/portrait velocity swing and progressive gallery-card lag.
- Redesign desktop Projects list with large edge-aligned labels and a horizontally following 16:9 poster-to-video preview. Preserve opposing client movement, snapping, dragging and project transitions.
- Use the site corner radius for prominent buttons, correct primary-nav hover highlighting and remove mobile CV row insets.
- Introduce a neutral-800 Welcome loader panel using the existing site typography and Osmo message cadence.
- Add bounded desktop section labels and opt-in Osmo scaling tokens, documented in the native Style Guide.
- Preserve the restored desktop lightbox implementation unchanged.

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
