# Release validation — v1.2.2

Checked on 18 November 2026 against Webflow staging.

## Automated checks

- `npm run check`: source syntax, manifest ownership, sticky entry stability and dynamic-year rollover pass.
- Footer controller tests: first-stage offset/tint, half-height name overlap, resized document endpoint and frozen navigation geometry pass.
- `npm run build`: 27 JavaScript modules and 6 CSS files compiled successfully.

## Browser checks

- Desktop lightbox on Home and Sonic: full-viewport black root, fitted rounded inner video and controls inside the player. Open/close restored from the R8 source after the project z-index fix. Resized from 1728 × 904 to 1365 × 768; the 1024 × 576 video remained inside the latter viewport.
- At 390 × 844, the mobile dialog filled the viewport. Close and Menu shared a right edge at 365.99px and top at 24px; Menu was hidden while the player was open and returned after closing.
- Mobile Home → Sonic: the finished media occupied y=482.18–674.55 and the description section began at y=722.55. The destination detail section stays hidden until normal document flow is restored.
- Footer at 1365 × 768: the name finished at the viewport bottom within subpixel rounding. At the start of the second reveal, roughly half the name section overlapped the glass. First-stage offset/tint responded correctly after responsive resizing.
- Light theme: copyright, Back to top and marquee remained visible with dark theme ink on the light surface.
- Approach first media entered partially transparent and blurred, using the same entrance/exit timeline as the following items.
- Mobile heading media reserved its final block space; the reservation updated after changing to tablet width.
- Mobile marquee retained its direction at the page end and after additional downward wheel input.
- All three Home prominent buttons measured 24px vertical padding, 32px right and 36px left, with a 72.4px total height at the tested desktop size.
- No JavaScript errors were captured during the final browser pass.

## Native Webflow changes

- Super Button / Button Large: 1.5em vertical padding, 2em right, 2.25em left and 1em gap.
- Tablet editorial hero: twelve explicit grid columns and a full-width title. This prevents desktop arrow placement from creating implicit columns outside the four-column tablet grid.
- The user's Jamie heading clipping/margin edits and client-logo sizing were retained.

## Limits

Responsive checks use Chrome viewport emulation, not a physical iPhone or iPad. Native touch momentum and Safari-specific playback still require a device check. Loader timing matches the supplied resource in code; its dark parallax exit is the requested adaptation, not an identical white-screen ending.
