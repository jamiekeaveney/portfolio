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
- `webflow/`: the only site-wide head/footer snippets. Both snippets use the same immutable tested runtime revision. R17 is pinned to `daee9312249bf786a24177644bb40e4f7cc36377`.

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

`assets/js/features/lightbox.js` restores the R8 implementation, the version after the project ancestor z-index correction and before the R9 viewport-player rewrite. The original Flip opening/closing timeline and the fitted inner Bunny player are retained. The only routing addition is a separate conventional player for mobile/tablet; do not apply its dimensions or gesture handling to desktop.

## Interaction ownership

- Footer: the editorial stage stays in normal document flow; only the marquee reveal uses parallax. Its overlap is measured from the lowercase e. Legal text follows the theme foreground.
- Loader: the progress bar collapses to a one-pixel white border and rises with the clipped black curtain. The page enters beneath it. Add **loader-no-overlay** to **loader-wrap** in the Global component to disable the neutral-700 wash; remove that combo class to enable it.
- Projects: gallery uses its original uniform infinite track; no per-card velocity offsets or return staggering. List measures the real gallery frame for identical height and vertical placement, with the same hover inset and no pointer following. Videos play only while hovered or keyboard-focused; settling on a row does not start playback. Gallery/list transfer uses the project media `case-two-step` easing. Text uses the footer navigation 2xl size and 1.3em row height. Client and project tracks still move in opposite directions.
- Touch lightbox: independent from the preserved desktop timeline. Phone video is edge-to-edge and square-cornered. Swipe down/diagonally to dismiss, tap outside, or Escape. Short drags return to rest; native playback controls are excluded from the drag start zone.
- Portrait: A-to-B placement stays independent of a bounded, velocity-based perspective hinge on the inner image. No planar rotation.
- Section labels: 12rem desktop inset. About labels use the existing expo sticky curve. Services uses the smooth sticky controller and its label shares the media's measured displacement. The home Clients label stays in normal flow.
- History: ordinary back/forward parallax navigation returns to the top. Project media returns retain their gallery/list origin.
- Cursor dot removed. Shared pointer sampling remains for the established text/client preview effects.

## Native Webflow structure

Navigation, Footer Wrapper, CTA Section, Footer, Clients Section, Project Lightbox, Projects Browser and Super Button remain shared components. Footer layout uses explicit three/two/one-column breakpoint styles. The obsolete Close button instance and variant are removed. Other button variants have live usages and are retained.

Services uses live CMS collections. Webflow rejects converting that bound section to a component; its CMS context and shared responsive classes are retained. Breakpoints are styles, not duplicate component variants.

## Utility pages and scaling

The 404 is a full-viewport bouncing typographic screen and paddle rally with minimal perimeter controls. The supplied Osmo scaling tokens remain opt-in to avoid changing the established design. At the R16 audit, Style Guide, Licenses and Changelog were no longer present in Webflow's page list.

## Verification

Run `npm run check` and `npm run build`. Check desktop and compact widths, dark/light themes, navigation history, gallery/list/project returns, the two footer stages, and touch-player dismissal. Physical iPhone/iPad gestures still require device verification.

## R17 loader and utility details

The critical first-paint cover is inline in `webflow/head.html`, independent of the CDN bundle. It also sets manual scroll restoration early. Font metrics, footer geometry and restored scroll settle beneath the opaque curtain. Marquees stay paused until the reveal finishes; footer parallax ignores the page-level loader pull. The white progress bar contracts from 8px to `--loader-border-width` (default 1px) over .45s with `expo.out`, then shares the 1.2s page-parallax curve and .8 neutral-700 wash. Loader characters match the hero's .025 stagger, capped at .16s across the word, and 1.25s masked reveal. Navigation waits for the reveal edge.

The portrait hinge has a 26-degree ceiling, velocity gain .012 and 700px perspective; it eases back to zero and hands off between opposite corners without planar rotation. Light secondary text uses neutral RGB values, with separate lighter large labels. The About client list has 3rem native top margin.

The 404 idle glyph uses weight 600 and measured ink bounds at viewport edges. Pong starts at 520–900px/s (viewport dependent), gets faster after each return, and uses a larger ball and paddle. Its score and controls sit on the 12-column perimeter rather than behind the navigation.
