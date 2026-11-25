# Portfolio control polish and performance audit

**Date:** 25 November 2026  
**Publication target:** [Webflow staging](https://jamiekeaveneyportfolio.webflow.io/)  
**Measured runtime revision:** `1ac983f` — Polish native controls and remove idle animation work  
**Final source cleanup revision:** `d60998215ed8a2314e2640c377265c3924c64f43` — published to staging and verified

This record covers the native control repairs, runtime optimisation and measured staging results. It supplements the historical [release validation](../VALIDATION.md) and [native implementation notes](../webflow/LUMOS_REPAIRS.md).

Custom production domains were not published in this pass. The final source cleanup follows the measurement snapshot; the scores below describe the `1ac983f` staging state, not the later revision. Both live asset URLs were verified at the final cleanup revision; the CDN CSS and JavaScript bytes match the local build outputs.

## Changes in the measured staging release

| Area | Change and resulting behaviour |
| --- | --- |
| Approach FAQ | The native `faq_icon` centres its glyph in its existing two-rem square and rotates around the centre. The click handler continues to set accordion state and `aria-expanded`; CSS owns the visual transition. |
| Projects controls | Native button appearance, background, border and padding are reset. Gallery/List and the counter/arrow rail share a two-and-a-half-rem control height and typography tokens. Existing CSS hover, focus and selected states remain. |
| Showreel play affordance | A native decorative `showreel_play_icon` SVG sits outside the hidden full player. Native trigger variables control hover/focus visibility; touch layouts expose it without hover. It hides when the full player is active. The old runtime-created SVG and its duplicate selector rules were removed. |
| Cursor work | The lightbox cursor no longer scans the DOM on a permanent GSAP ticker. Pointer, scroll, resize, route and player-state changes request one batched frame. Unchanged label states and positions are not rewritten. Existing cursor-follow easing and backdrop closing remain. |
| Gallery/List rendering | Settled tracks skip identical paints instead of repeatedly writing the same transforms. Existing movement, wrapping, snapping and view-switch behaviour remain. |
| Marquees | Loops pause outside the viewport and in hidden tabs, retain their phase and respond to reduced-motion changes. |
| Reduced motion | Lenis is disabled for the initial preference and is destroyed/recreated when it changes. Re-creation preserves loader, transition and open-lightbox scroll locks. |
| Accessible interaction | Hidden desktop service comparisons are inert; compact layouts restore interaction. Paragraph SplitText retains exposed text without a prohibited paragraph ARIA label. |

### Final semantic and contrast cleanup

The subsequent source revision `d60998215ed8a2314e2640c377265c3924c64f43` adds the following refinements. Its source checks pass. Published DOM inspection confirms no artificial labels on the generic split phrases on Home, Approach and About, four counter values exposed once, and the final colour values described below.

- SplitText gives a replacement accessible name only to headings. Generic phrases and paragraphs keep their real text; paragraph/span content uses span wrappers. Loader text also uses span wrappers without an artificial accessible name.
- Odometer values expose one visually hidden static text value instead of an unsupported label on a generic element; decorative digit animation remains separate.
- Inactive Projects controls use the shared muted-text token.
- Light-theme muted text resolves to the existing neutral-600 token, preserving the native palette rather than introducing a separate hard-coded colour.

### Preserved design constraints

- The homepage heading and introduction still exit over **40vh of scroll**.
- The showreel expansion path, established cursor-follow easing and page/media transitions are preserved.
- Loader choreography and timing were not shortened in this pass.
- Webflow retains ownership of layout, responsive styling, shared components and design tokens; the repository owns custom runtime behaviour and its compiled assets.
- Changes were published to staging only.

## PageSpeed Insights measurements

These are individual Lighthouse lab runs using PageSpeed Insights, taken against staging after the `1ac983f` asset deployment. They are useful diagnostic samples, not a controlled experiment or real-user percentile measurements.

Performance and accessibility are scores out of 100. LCP, TBT and CLS below are the **mobile-run metrics**; desktop columns show the corresponding score results.

| Page | Performance mobile | Performance desktop | Accessibility mobile | Accessibility desktop | Mobile LCP | Mobile TBT | Mobile CLS |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| [Home](https://pagespeed.web.dev/analysis/https-jamiekeaveneyportfolio-webflow-io/hi2w3eg9qmj51snjpyybf4?form_factor=mobile) | 75 | 97 | 97 | 100 | 6.9 s | 60 ms | 0.023 |
| [Projects](https://pagespeed.web.dev/analysis/https-jamiekeaveneyportfolio-webflow-io-projects/qwfh48gr3e8j27ve5oivox?form_factor=mobile) | 94 | 94 | 100 | 96 | 2.7 s | 10 ms | 0.001 |
| [Sonic the Hedgehog 3](https://pagespeed.web.dev/analysis/https-jamiekeaveneyportfolio-webflow-io-project-sonic-the-hedgehog-3/zfafvvxo54w9rtu49rcuah?form_factor=mobile) | 74 | 99 | 93 | 100 | 7.5 s | 20 ms | 0.002 |
| [Approach](https://pagespeed.web.dev/analysis/https-jamiekeaveneyportfolio-webflow-io-approach/915fnl9ap1dkyj1tk3ws6r?form_factor=mobile) | 82 | 99 | 96 | 96 | 2.2 s | 440 ms | 0 |
| [About](https://pagespeed.web.dev/analysis/https-jamiekeaveneyportfolio-webflow-io-about/03ewtk6g1fo6khia2wz9ak?form_factor=mobile) | 89 | 100 | 93 | 93 | 3.6 s | 50 ms | 0.001 |
| [Ford](https://pagespeed.web.dev/analysis/https-jamiekeaveneyportfolio-webflow-io-project-ford-x-universal/3jqf3ar2kypvs7lvwhujcb?form_factor=mobile) | 90 | 99 | 100 | 100 | 3.3 s | 20 ms | 0 |
| [28 Years Later](https://pagespeed.web.dev/analysis/https-jamiekeaveneyportfolio-webflow-io-project-28-years-later/h3y40v9ar2kmqpbfw67c6i?form_factor=mobile) | 94 | 99 | 100 | 100 | 3.0 s | 10 ms | 0.039 |

Best Practices scored **100 on every measured page/device run**. SEO scored **69** on staging, which carries a `noindex` directive. The production domain requires its own indexing/SEO verification after an authorised publication; the staging score must not be presented as a measured production result.

No Chrome UX Report field data was available for these measurements. In particular, the lab TBT figures are not measured real-user INP, and these samples do not establish a field Core Web Vitals pass.

### Baseline and attribution

An earlier Home sample scored **85 mobile / 97 desktop**, with reported TBT of **150 ms in each run**. The later sample scored **75 mobile / 97 desktop**, with mobile TBT of **60 ms**.

The mobile score decreased while its measured blocking time decreased. Different loading/cache/network conditions and single-run variability prevent attributing the overall score change to this release. The code changes remove specific idle work by construction and regression checks; the PageSpeed samples alone do not quantify a causal performance gain.

### Largest measured payload

The homepage showreel preview transferred approximately **7,624.6 KiB**, roughly **90%** of the measured **8,447 KiB** homepage transfer. The full-screen player is demand-loaded, but its compact preview remains a large initial media cost.

The highest-value next payload improvement is a shorter, lower-bitrate preview with responsive resolutions and an appropriate poster. Keep the full-quality showreel behind explicit playback. Measure the revised preview on mobile before claiming a speed improvement.

Home and Sonic have the slowest mobile LCP samples. Approach has the largest mobile blocking-time sample and warrants a focused initialisation trace after the final accessibility/contrast edits.

## Verified interactions

The following were observed in the published Chrome staging session for this pass.

| Check | Observed result |
| --- | --- |
| Projects Gallery/List repetition | Three complete switching cycles were exercised. |
| Project navigation and counter | Next advanced to Ford with counter `02`. |
| Route return | Opening Ford and returning restored the Projects List view. |
| Showreel hover affordance | One native play icon was present; no runtime icon clones were present. |
| Keyboard video use | Enter activated playback; Escape closed the player and returned focus to the opener. |
| FAQ rotation origin | The measured transform origin was `16px 16px`, the centre of the icon box. |
| Bottom control alignment | Measured desktop control centres shared `y = 788px`. This is a verification coordinate, not a hard-coded layout value. |
| Browser errors | The checked Chrome console was clean. |

These repetitions test interaction continuity; they are not a server-concurrency or traffic-load benchmark.

### Final published verification

The published head and footer both load `d60998215ed8a2314e2640c377265c3924c64f43`. CDN bytes matched the local build: CSS SHA-256 `f116ba22c6f92a165ba29b9ebeecfd472e513f5fa79f62585572c4b6958da465`; JavaScript SHA-256 `e3d6ccd3ca5f1cc53932df59e859dc61b6adaca2f0fa39b4ba2a8d223d95bd6f`.

Final Chrome inspection reconfirmed the transparent, borderless Projects buttons and the shared `788px` control centreline. Light-theme inactive controls and the showreel year both resolve to `rgb(110, 110, 110)`. All four FAQ icons resolve to `16px 16px` transform origins and centred flex alignment. Showreel hover resolves to opacity `1`, with one native icon and no legacy clone. Home and Projects console checks returned no warnings or errors.

About exposes each odometer value (`4+`, `3`, `2`, `12+`) once through static accessible text; all visual digit children are hidden from the accessibility tree. Generic split phrases on Home, About and Approach no longer carry artificial accessible names. The loader options are covered by source checks; these observations do not constitute a full screen-reader certification.

## Source and regression checks

`npm run check`, `npm run build` and `git diff --check` passed for the final source cleanup revision. The measured and final source revisions both include their compiled bundles. These passing source/build checks do not update the earlier PageSpeed measurements.

The new/extended checks cover:

- A burst of pointer events producing one scheduled cursor update, followed by no idle scanner frames.
- A stationary pointer reacting to scrolling, lightbox opening/closing and size/state changes.
- Backdrop close behaviour, keyboard/touch hiding and restoration of the native cursor.
- Route/page observer cleanup, page-cache restoration and no cursor scheduling on compact/coarse layouts.
- Initial/live reduced-motion Lenis teardown, ticker removal and open-lightbox scroll-lock preservation.
- Gallery/List continuity with repeated settled paints skipped.
- Hidden service controls becoming inert on desktop and interactive again in compact layouts.

These fixtures exercise runtime logic. They do not substitute for live layout inspection, device gestures or browser-specific media behaviour.

## Remaining performance and quality work

### 1. Reduce preview media transfer

Optimise the homepage preview first, then inspect the mobile LCP resource on Sonic. Responsive preview files, deliberate posters and viewport-aware loading are likely to offer more useful transfer savings than further compression of small control styles.

### 2. Decide the loader's intended wait

The preserved loader sequence contains approximately **5.4 seconds of animation**: three seconds of progress, 0.8 seconds of collapse, 1.2 seconds of reveal and a 0.4-second final fade. Font readiness can extend preparation. This remains a deliberate perceived-speed trade-off even when the files are cached.

A shorter first-visit sequence or a minimal repeat-visit sequence is a future design decision. No such timing change was included here.

### 3. Complete accessibility validation, then rerun

The source refinements and final published DOM/contrast checks are complete. The table records the earlier accessibility scores; no later score is claimed. A full screen-reader pass and fresh automated scoring should accompany the next media optimisation release. Automated accessibility scores are useful checks; they do not certify full keyboard, screen-reader or visual accessibility.

### 4. Profile the remaining animation work

Some persistent animation work remains:

- Footer parallax still measures geometry on a GSAP ticker while the desktop page is mounted.
- Desktop section labels still perform geometry reads and translation writes while mounted.
- Project-detail cursor tracking, shared pointer-angle decay and client-preview rotation retain their existing tickers.
- Gallery/List skip unchanged paints but retain their existing ticker lifecycle.

These are focused follow-up opportunities, not evidence that the whole runtime should be replaced. A near-viewport gate or demand-driven scheduling can reduce work where a trace confirms meaningful cost. Preserve animation continuity and existing route cleanup when changing ownership.

### 5. Complete device and publication checks

At this record's measurement boundary:

- A `390 × 844` viewport override was attempted, but the browser still reported a width of `1728px` after the override and reload. The override was reset. This attempt does not establish narrow-layout visual validation; the independent mobile PageSpeed lab runs remain valid.
- No Safari, Firefox, physical iPhone or physical iPad verification is claimed for this pass.
- The final DOM and computed contrast states were verified in Chrome. A complete screen-reader audit and fresh automated accessibility scoring remain separate checks.
- Custom production domains remain unpublished; final production URLs, indexing and asset pins must be checked only after an authorised publication.

## Assessment

The site has a coherent split between native CSS states and JavaScript behaviour. Ordinary hover/focus appearance should continue to use native trigger variables and CSS. JavaScript remains appropriate for clipboard results, video playback, cursor coordinates and coordinated scroll/media transitions.

The measured desktop scores are strong, and the repaired controls remove visible interaction defects. The remaining submission priorities are mobile media loading, a complete accessibility/device pass, the loader's perceived wait and a real-device/browser pass. This record does not establish an Awwwards outcome or a guaranteed production-readiness pass.
