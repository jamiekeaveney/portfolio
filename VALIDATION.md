# Release validation — v1.2.4 / R15

Checked on 19 November 2026 against Webflow staging. Runtime revision: `a280cabb9f32a691a159f5b6af81616c87412bcd`.

## Automated checks

- `npm run check`: source syntax, manifest ownership, sticky entry stability, dynamic-year rollover, footer geometry and gallery continuity checks pass.
- Gallery tests execute the actual spacing controller in forward and reverse motion, assert that gaps never shrink below the base gap, compare equivalent repeated cards and check reduced-motion settling.
- Footer tests cover no entry tint, overlap, resized document endpoint and navigation freezing.
- `npm run build`: 29 JavaScript modules and 9 stylesheets compiled.
- The restored desktop `lightbox.js` is byte-identical to v1.2.3.

## Browser checks

- Desktop Home mid-page refresh restored the Work section at approximately 3510px scroll, with the loader removed and no fixed page styles remaining.
- Services label remains at 160px from the top while the service media and descriptions change.
- Footer at 1348px content width measured a 272.26px overlap from the actual font metrics. Legal text computed white with normal blending. Entry tint is disabled.
- Large Super Button instances computed 20px vertical and 28px horizontal padding after removing the conflicting native shorthand.
- Projects list at 1728px: 34.56px labels and 432 × 243px preview. At 1363px: smaller centred preview fits between the text columns.
- List preview → Sonic project → All Projects returns to the saved list position without a leftover media ghost. Gallery/list switching settles correctly; arrows and wheel input remain active after navigation.
- Gallery forward motion expanded gaps above the base spacing. Reverse/loop invariants are covered by the controller tests.
- New 404: navigation visible; Play, Pause and Resume update correctly. Court and text respond correctly in light and dark themes.
- Style Guide: actual component instances, neutral palette and native typography visible. CMS example cards are in normal flow at approximately 407 × 516px on desktop; inert gallery controls are hidden. No horizontal overflow observed.

## Native Webflow changes

- Smaller padding on Button Large, preserving the shared radius.
- Footer legal row uses normal blending; entry tint hidden.
- Rebuilt Style Guide with current classes and real Super Button, Navigation, Projects Browser and Footer Wrapper instances.
- Built the native 404 shell, with a local paddle rally / DVD idle runtime.
- Licenses and Changelog set to draft and included in the staging unpublish. Final removal from Designer remains pending.

## Delivery and limits

Published only to `jamiekeaveneyportfolio.webflow.io`; custom domains were not published. The external runtime is pinned to the immutable tested commit. The connected Designer browser became unavailable during QA, so a named GitHub release/tag and final Designer page deletion remain pending. Source and compiled files are committed through the GitHub connection.

Browser checks in this pass were desktop Chrome. Final mobile viewport and physical iPhone/iPad touch testing could not be repeated after the connected browser became unavailable. Mobile rules retain native scrolling, static section labels and stacked footer panels. Osmo scaling remains opt-in to preserve the existing site proportions.
