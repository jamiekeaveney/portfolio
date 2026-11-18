# Changelog

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
