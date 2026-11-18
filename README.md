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
- `webflow/`: the only site-wide head/footer snippets. Both snippets use the same short, immutable release tag (`v1.2.0`).

The empty CSS/JS placeholders and checked-in `node_modules` from the previous structure have been removed. `npm ci` restores build dependencies locally.

## Webflow integration

Keep Webflow's native GSAP integrations enabled: GSAP, ScrollTrigger, Flip, SplitText and CustomEase. Webflow loads those before the custom footer. Barba and Lenis are pinned in the footer snippet. The app includes the Dublin clock, Clarity initialisation and the former Global runtime scripts. Font smoothing is in the shared CSS.

Runtime/CSS embeds in Global, Home, Projects and About have been migrated. CMS-bound video markup stays in Webflow because it needs each item's field bindings. Those markup embeds are not duplicate script owners.

Layout refinements are native Webflow styles and variants, not a second HTML site in this repository. The footer uses Footer Navigation, Copy Email Footer and Footer Back To Top variants of Super Button. Their sliding motion inherits the existing Super Button behaviour; interaction colours live in the shared CSS.

## Release

Run `./release.sh` from a clean `main` checkout. It checks the source, builds, commits a patch version and pushes a matching tag. Update **both** Webflow snippets to that tag, publish staging and verify before publishing custom domains. A GitHub push alone does not change Webflow's pinned asset URLs.

## Motion and responsive behaviour

Desktop uses Lenis and subtle Expo sticky landings. Scroll-driven media Flips use a 0.22-second catch-up. The related-project footer eases only on entry; its final progress window remains pinned. The Approach horizontal section has no extra sticky easing.

Mobile and tablet use native scrolling and ordinary stacked footer panels. Cursor-follow UI and pointer hover motion are disabled there. The menu fits its content, leaving an outside dismissal area.

Only elements with `data-current-year` update automatically. `data-year-template` accepts `{year}` and `{short}`; historical CMS project years are deliberately unchanged.

## Regression checks

- At desktop width: Home → project → Home; Projects gallery ↔ list; project → Projects; About client → project → About at the top of About.
- Refresh and resize desktop → tablet → desktop; verify nav visibility, hero width reveal, showreel scroll animation and one active project/client pair.
- Lightbox: open, play/pause, close from the black letterbox or Escape; on mobile use Close. Confirm black fills the viewport and no lower collection item overlaps.
- At 390, 768 and 991 CSS pixels: check full-width 9:10 cards, captions below media without hover transforms, service-heading masks, content-height menu and outside-tap dismissal.
- Footer: copy email, Super Button hover, back to top, copyright placement, frosted first panel over the marquee and project scroll-to-next completion.

Browser emulation does not replace a final physical iPhone/iPad touch-scroll check.
