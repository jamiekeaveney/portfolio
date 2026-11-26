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

- `assets/js/core/`: shared bootstrap, Barba/Lenis page transitions, scroll-media motion settings and Dublin clock.
- `assets/js/features/`: one file per interaction, including navigation, projects, media transitions, lightbox, copy email, reveals, services and footer parallax.
- `assets/js/vendor/sticky-library.js`: adapted Alpacka sticky implementation; copyright and licence in `THIRD_PARTY_NOTICES.md`.
- `assets/css/base/site.css`: shared layout and component styles. The native Webflow Global Styles component owns Lumos trigger and state rules.
- `assets/css/components/`: loader, navigation, video player, projects and interaction states.
- `webflow/` contains the site-wide head and footer snippets. Each pins the same immutable Git commit for the generated CSS and JavaScript. Update the complete pair together in Webflow. `webflow/LUMOS_REPAIRS.md` records the native system and staging checks.

The empty CSS/JS placeholders and checked-in `node_modules` from the previous structure have been removed. `npm ci` restores build dependencies locally.

## Webflow integration

Keep Webflow's native GSAP integrations enabled: GSAP, ScrollTrigger, Flip, SplitText and CustomEase. Webflow loads those before the custom footer. Barba and Lenis are pinned in the footer snippet. The app includes the Dublin clock and the site’s shared interaction scripts. Font smoothing is in the shared CSS.

Runtime/CSS embeds in Global, Home, Projects and About have been migrated. CMS-bound video markup stays in Webflow because it needs each item's field bindings. Those markup embeds are not duplicate script owners.

Edit layout and Button variants in Webflow. Footer Navigation, Copy Email Footer and Footer Back To Top share the Button component. The native variants own the label and arrow motion and interaction colours. Global Styles supplies the hover, keyboard and status values that those styles consume.

## Release

Run `./release.sh` from a clean `main` checkout. It checks and builds the source, updates both Webflow snippets and pushes one immutable `release-X.Y.Z` tag with the release commit. The script checks for existing release branches and tags before assigning a version. Paste the updated snippets into Webflow and verify staging before publishing to custom domains.

## Motion and responsive behaviour

Desktop uses Lenis and subtle Expo sticky landings. Scroll-driven media uses one viewport-coordinate playhead with a 0.18-second catch-up. Scroll compensation is immediate, avoiding a second vertical lag. The related-project footer eases only on entry; its final progress window remains pinned. The Approach horizontal section has no extra sticky easing.

The Home showreel and About portrait share `assets/js/core/scroll-media-motion.js`: a 32-degree ceiling, velocity gain `.015`, `43.75rem` perspective, `.6` pitch ratio, response `10` and `.18` scrub. Their existing placement paths and edge attenuation stay with their respective sections.

Mobile and tablet use native scrolling and ordinary stacked footer panels. Project-card entry and return use the standard page-parallax transition; media FLIP is reserved for desktop with a fine pointer and hover support. Cursor-follow UI and pointer hover motion are disabled on compact/touch layouts. The menu fits its content, leaving an outside dismissal area.

Only elements with `data-current-year` update automatically. `data-year-template` accepts `{year}` and `{short}`; historical CMS project years are deliberately unchanged.

## Desktop lightbox restoration

`assets/js/features/lightbox.js` restores the R8 implementation, the version after the project ancestor z-index correction and before the R9 viewport-player rewrite. The original Flip opening/closing timeline and the fitted inner Bunny player are retained. Desktop and touch players share the on-demand video source loader. Native HLS runs directly where supported. Browsers that need MediaSource load the pinned HLS adapter when the player opens. The desktop dialog keeps keyboard focus within its controls and returns it to the opener on close.

## Interaction ownership

- Footer: the editorial stage stays in normal document flow; only the marquee reveal uses parallax. Its overlap is measured from the lowercase e. Legal text follows the theme foreground. Back to top reuses the shared button arrow, rotated upwards at `1em`.
- Loader: the progress bar collapses to a one-pixel white border and rises with the clipped black curtain. The page enters beneath it. The loader creates its neutral overlay in the shared transition timeline.
- Projects: gallery uses its original uniform infinite track; no per-card velocity offsets or return staggering. List measures the real gallery frame for identical height and vertical placement, with the same 16:9 inset hover frame and no pointer kick, rotation or following. List clones retain the original video/poster markup. Only the current desktop gallery card participates in keyboard navigation and the accessibility tree. Videos play only while the active card is hovered or keyboard-focused; settling on a row does not start playback. Gallery/list transfer uses the project media `case-two-step` easing. Text uses the footer navigation 2xl size and 1.3em row height. Client and project tracks still move in opposite directions.
- Touch lightbox: independent from the preserved desktop timeline. Phone video is edge-to-edge and square-cornered. Swipe down/diagonally to dismiss, tap outside, or Escape. Short drags return to rest; native playback controls are excluded from the drag start zone.
- Copy email: the email, hover instruction and copied confirmation share one clipped text slot. Alternate labels are absolutely positioned with combo-class specificity, so native variants cannot place them back in normal flow.
- Card captions: native `top` and `left` transitions each have an explicit duration and easing; both coordinates animate with the media hover.
- Project title: detached travelling words follow the case navigation's live opacity while their movement continues, including when a fast scroll starts the footer fade mid-flight.
- Section headings: the first text section after the hero starts its main copy at column 3 with a top-aligned label. Later sections start the copy at column 5 with a bottom-aligned label. Labels use the muted theme colour and main heading copy uses the foreground colour.
- Separators: Gallery/List, project breadcrumbs and both counters use the same `--control-separator-gap`, backed by Lumos spacing, on either side of the slash.
- History: ordinary back/forward parallax navigation returns to the top. Desktop media returns retain their gallery/list origin; compact/touch project returns follow the ordinary parallax path.
- Cursor dot removed. Shared pointer sampling remains for the established text/client preview effects.

## Native Webflow structure

Navigation, Footer, Footer Content, Footer Wordmark, Section Clients, Project Lightbox, Projects Browser and Button are shared Webflow components. Footer Content contains the directory, which has three columns on desktop, two on tablet and one on small phones. Footer Wordmark and the legal links have their own responsive layout. The Button variants expose their text, icon, destination and interaction settings in Designer.

Native grid templates use explicit `minmax(0, 1fr)` tracks at their intended breakpoint counts. Webflow Designer was expanding `repeat(var(--_column-count---value), 1fr)` with extra helper tracks, producing 23 columns in a 12-column layout. Explicit tracks avoid that serialization issue while preserving Lumos variable collections, modes, margins, gutters, typography, spacing and theme tokens. Keep this geometry in native styles so it remains editable and visible in Designer.

Services uses live CMS collections. Webflow rejects converting that bound section to a component; its CMS context and shared responsive classes are retained. Breakpoints are styles, not duplicate component variants.

## Utility pages and scaling

The 404 is a full-viewport bouncing typographic screen and paddle rally with minimal perimeter controls. The supplied Osmo scaling tokens remain opt-in to avoid changing the established design. The draft Style Guide in Webflow contains the current typography, colour, spacing and grid examples.

## Verification

Run `npm run check` and `npm run build`. Check desktop and compact widths, dark/light themes, navigation history, gallery/list/project returns, the two footer stages, and touch-player dismissal. Physical iPhone/iPad gestures still require device verification.

## Loader and utility details

The critical first-paint cover is inline in `webflow/head.html`, independent of the CDN bundle. It also sets manual scroll restoration early. Font metrics, footer geometry and restored scroll settle beneath the opaque curtain. Marquees stay paused until the reveal finishes; footer parallax ignores the page-level loader pull. The white progress bar contracts from 8px to `--loader-border-width` (default 1px) over .45s with `expo.out`, then shares the 1.2s page-parallax curve and .8 neutral-700 wash. Loader characters match the hero's .025 stagger, capped at .16s across the word, and 1.25s masked reveal. Navigation waits for the reveal edge.

Light secondary text uses neutral RGB values, with separate lighter large labels. The About client list has 3rem native top margin.

The 404 idle glyph uses weight 600 and measured ink bounds at viewport edges. Pong starts at 520–900px/s (viewport dependent), gets faster after each return, and uses a larger ball and paddle. Its score and controls sit on the 12-column perimeter rather than behind the navigation.
