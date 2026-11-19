# Jamie Keaveney — portfolio runtime

The Webflow Designer owns the HTML, CMS bindings, responsive layout, grid, typography and component variants. This repository owns the shared interaction CSS and JavaScript. There is one compiled stylesheet and one compiled script; do not paste the feature files into Webflow embeds as well.

## Build

Requires Node.js 20 or later.

```sh
npm ci
npm run check
npm run build
```

`manifest.json` is the explicit loading order. `dist/css/site.css` and `dist/js/app.min.js` are the deployable outputs. Commit the outputs with their source changes so that jsDelivr can serve an immutable Git commit or release tag.

## Structure

- `assets/js/core/`: shared bootstrap, Barba/Lenis page transitions and Dublin clock.
- `assets/js/features/`: one file per interaction, including navigation, projects, media transitions, lightbox, copy email, reveals, services and footer parallax.
- `assets/js/vendor/sticky-library.js`: adapted Alpacka sticky implementation; copyright and licence in `THIRD_PARTY_NOTICES.md`.
- `assets/css/base/site.css`: site tokens, shared utilities and migrated state-manager rules.
- `assets/css/components/`: loader, navigation, video player, projects and interaction states.
- `webflow/`: the only site-wide head/footer snippets. Both snippets use the same immutable tested runtime revision. R15 is currently pinned to `a280cabb9f32a691a159f5b6af81616c87412bcd`; a named GitHub release tag is pending browser reconnection.

The empty CSS/JS placeholders and checked-in `node_modules` from the previous structure have been removed. `npm ci` restores build dependencies locally.

## Webflow integration

Keep Webflow's native GSAP integrations enabled: GSAP, ScrollTrigger, Flip, SplitText and CustomEase. Webflow loads those before the custom footer. Barba and Lenis are pinned in the footer snippet. The app includes the Dublin clock, Clarity initialisation and the former Global runtime scripts. Font smoothing is in the shared CSS.

Runtime/CSS embeds in Global, Home, Projects and About have been migrated. CMS-bound video markup stays in Webflow because it needs each item's field bindings. Those markup embeds are not duplicate script owners.

Layout refinements are native Webflow styles and variants, not a second HTML site in this repository. The footer uses Footer Navigation, Copy Email Footer and Footer Back To Top variants of Super Button. Their sliding motion inherits the existing Super Button behaviour; interaction colours live in the shared CSS.

## Release

Run `./release.sh` from a clean `main` checkout. It checks the source, builds, updates both snippet files to a patch version and pushes a matching tag. Copy the refreshed **head and footer snippets** into Webflow, publish staging and verify before publishing custom domains. A GitHub push alone does not change Webflow's pinned asset URLs.

## Motion and responsive behaviour

Desktop uses Lenis and subtle Expo sticky landings. Scroll-driven media uses one viewport-coordinate playhead with a 0.18-second catch-up. Scroll compensation is immediate, avoiding a second vertical lag. The related-project footer eases only on entry; its final progress window remains pinned. The Approach horizontal section has no extra sticky easing.

Mobile and tablet use native scrolling and ordinary stacked footer panels. Cursor-follow UI and pointer hover motion are disabled there. The menu fits its content, leaving an outside dismissal area.

Only elements with `data-current-year` update automatically. `data-year-template` accepts `{year}` and `{short}`; historical CMS project years are deliberately unchanged.

## Desktop lightbox restoration

`assets/js/features/lightbox.js` restores the R8 implementation, the version after the project ancestor z-index correction and before the R9 viewport-player rewrite. The original Flip opening/closing timeline and the fitted inner Bunny player are retained. The only routing addition is a separate conventional player for mobile/tablet; do not apply its dimensions or Close UI to desktop.

## Footer geometry

Desktop has two reveals. The editorial panel enters with parallax and no grey tint. Its entire surface is translucent glass. Canvas font metrics measure the midpoint of the actual lowercase e and use that as the name overlap, avoiding a percentage guess. That overlap follows the page until the panel bottom enters the viewport; the second reveal then resolves to zero offset at the document end. Both stages read current DOM geometry, so earlier pins and resizing cannot leave an outdated endpoint. Before a page is fixed for navigation, the footer freezes its current offset.

Mobile/tablet keeps ordinary stacked sections and a constant marquee direction. The legal row is positioned over the glass outside its isolated backdrop-filter context, with plain white text and normal blending, as requested. A placeholder preserves its original layout.

## Loader

Uses the supplied Osmo Logo Reveal Loader's three-second CustomEase curve, progress fill, logo wipe and character-message timings. Both messages are retained. The white progress line grows into a flat Welcome panel with black text. The Welcome stays in place while a bottom-to-top clip reveals the page, with only a 0.07-second hold after expansion. Page preparation and saved scroll restoration happen underneath the panel; intro animations start during its exit. The logo and Welcome use `sitenav__wordmark`; the staggered messages use the site’s base size and letter-spacing tokens, with the wordmark’s 0.008-second character stagger.

## Regression checks

- At desktop width: Home → project → Home; Projects gallery ↔ list; project → Projects; About client → project → About at the top of About.
- Refresh and resize desktop → tablet → desktop; verify nav visibility, hero width reveal, showreel scroll animation and one active project/client pair.
- Lightbox: open, play/pause, close from the black letterbox or Escape; on mobile use Close. Confirm black fills the viewport and no lower collection item overlaps.
- At 390, 768 and 991 CSS pixels: check full-width 9:10 cards, captions below media without hover transforms, service-heading masks, content-height menu and outside-tap dismissal.
- Footer: copy email, Super Button hover, back to top, copyright placement, frosted first panel over the marquee and project scroll-to-next completion.

Browser emulation does not replace a final physical iPhone/iPad touch-scroll check.

## Pointer and Projects motion

`pointer-motion.js` provides a shared pointer sample and a maximum four-degree velocity angle. The white difference-blended dot uses the same 0.35-second Expo following response as text cursors. Its visual scale is on a pseudo-element, separate from GSAP translation. It shrinks while a text follower is visible and is disabled on tablet/touch.

The desktop list has opposing text tracks and a horizontally following 16:9 preview. Selected posters toggle without vertical travel; after 140ms at rest, the selected preview fades into video. Pointer movement affects the preview only inside its central viewing band. Its actual x position is frozen and restored for layout and project transitions. A drag threshold separates dragging from clicking the preview. Gallery spacing expands with absolute velocity, up to 55% of card pitch. Offsets are derived from viewport position, not card index, so equivalent loop copies agree and reverse movement cannot collapse gaps. A restrained return stagger complements the existing project Flip transition. Reduced motion disables the velocity swing.

## Scaling

The supplied Osmo breakpoint tokens are in `assets/css/base/scaling.css` and documented on `/info/styleguide`. They are available for opt-in components; the established page dimensions remain in rem/vw. `.osmo-scale` and `.osmo-container` are opt-in utilities. The existing root/body size and rem-based page design remain unchanged; applying a global body scale would alter the established layouts. Keep full-viewport media outside a capped container.

## Section labels

Editorial and CV labels use bounded native sticky positioning. Home section labels with a short header parent follow the section bounds without changing their grid layout. The desktop top inset is 10rem. Welcome releases at its button; Selected clients releases before the Selected work caption, which then takes over. Services keeps its label above the media. Labels freeze with the outgoing page during navigation; mobile uses normal document flow.

## Utility pages

`/404` combines a quiet bouncing 404 idle screen with a pointer, touch and keyboard paddle rally. Play/pause, Escape, reduced motion and page visibility are handled locally. The native Style Guide uses current typography, neutral swatches, real Super Button variants, the CMS Projects Browser and shared Navigation/Footer components. Its CMS cards are displayed in normal flow rather than mounting a second full-screen slider. Licenses and Changelog are set to draft; their final deletion requires the Designer browser.
