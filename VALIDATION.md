# Release validation — v1.2.3

Checked on 18 November 2026 against Webflow staging.

## Automated checks

- `npm run check`: syntax, manifest ownership, sticky entry stability, dynamic-year rollover and footer geometry tests pass.
- Footer tests exercise entry tint, deeper glyph overlap, resized document endpoint and frozen navigation geometry.
- `npm run build`: 28 JavaScript modules and 8 stylesheets compiled.
- The restored desktop `lightbox.js` matches v1.2.2 byte for byte.

## Browser checks

- Desktop Projects list: 76.03px labels at 1728px viewport width; 656.63 × 369.35 preview centred vertically at y=424 in an 848px viewport. Horizontal pointer movement changes its x coordinate while its vertical centre remains fixed.
- During list scrolling, posters slide continuously and no preview video plays. At rest, exactly one selected video plays. The opposing project/client tracks agree at the selected row.
- Dragging changes the selected project and remains on `/projects`; clicking a settled preview enters the project. All Projects returns to the list without leftover transition ghosts. Gallery/list switching retains the selected media.
- Gallery scroll shows progressively increasing independent lag on subsequent visible cards, settling back to zero.
- Primary nav: Approach is white at rest on Approach; hovering About makes About white and its peers grey.
- Cursor dot uses a separate visual scale and shared Expo following, with desktop-only display. Velocity rotation decays to neutral.
- Footer: deeper frosted-name overlap and legal-row difference blending inspected in dark and light themes. Final name section ends within subpixel rounding of the viewport bottom.
- Prominent Home buttons retain 24px vertical, 32px right and 36px left padding, measuring 72.4px high with the 12px site radius.
- Loader: Hold tight and Hi there retain the staggered sequence in Delight at 16px. The neutral-800 line expands to the centred Welcome panel, then reveals the page.
- Approach section label remains near 128px from the top while its section scrolls, bounded by the section’s end. About labels are sticky on desktop and static on mobile.
- At 390 × 844, CV rows have zero internal horizontal padding and align at the 24px page gutter. The custom dot is hidden and document scroll width equals 390px.

## Native Webflow changes

- Projects list column sizing/alignment and preview frame geometry.
- Footer entry tint restored to display:block.
- Super Button / Button Large uses `--radius--radius`; generous padding preserved.
- Tablet CV row inset removed and editorial-label positioning updated.
- A Responsive scaling section added to the native Style Guide with Osmo breakpoint values and opt-in usage guidance. Utility pages without a Barba wrapper skip transition initialisation.
- The user’s Jamie clipping/margins and client-logo dimensions retained.

## Scope and limits

Osmo’s tokens are installed and used by the new list, with opt-in utilities for future components. A global body/font-size conversion was deliberately not applied because it would change established page proportions. Existing rem typography remains unchanged.

Responsive validation used Chrome viewport emulation. Physical iPhone/iPad momentum, Safari playback and the subjective feel of the new velocity effects still benefit from device review. The loader’s neutral Welcome ending is the requested adaptation, not a copy of Osmo’s white-screen ending.
