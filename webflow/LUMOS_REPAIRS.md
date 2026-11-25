# Native Lumos layout repairs — 23 November 2026

Webflow owns this site's HTML, CMS bindings, components, responsive geometry and design variables. This repository owns the interaction runtime. This record describes the native changes that accompany v1.3.1.

## Designer grid correction

The native grid template was `repeat(var(--_column-count---value), 1fr)`, with the column-count mode correctly resolving to 12. Designer's generated per-element canvas rule appended eleven additional tracks to that repeat. The resulting grid had **23 tracks**, which narrowed the Home introduction heading to about 480px.

The affected native templates now use explicit `minmax(0, 1fr)` tracks at the intended breakpoint counts. At the same 1103px Designer canvas width, the corrected grid had twelve tracks and the introduction heading measured about 865px. This fixes the native editing canvas as well as the published layout.

Lumos spacing, typography, margins, gutters, themes and variable modes are preserved. Fixed grid counts are now defined in native breakpoint styles: changing a Column Count mode alone will not change these explicit templates.

| Grid family | Desktop | Compact layout |
| --- | --- | --- |
| `layout__grid` | 12 tracks | Existing 4-track tablet grid |
| `edit-grid`, `u-grid`, `u-grid-custom`, `folio-grid` | 12 tracks | Existing full-width child placements |
| `home-hero__layout` | 12 tracks | Flex column from tablet |
| `editorial_layout` | 12 tracks | One track from tablet |
| `editorial__support` | 5 tracks | Flex column from tablet |
| `case__layout` | 12 tracks | Flex column from small |
| `clients__credits`, `clients__list` | 2 tracks | Two tracks |
| `case-index__grid` | 3 tracks | One track from small |
| `footer-legal` | 3 tracks | Existing compact arrangements |
| `error-game` | 12 tracks | Two tracks from small |
| Grid guides | 12 tracks | Four tablet, two tiny |

Navigation's Mobile variant also uses twelve explicit tracks. The remaining variable-repeat declaration is on a flex container and is inactive.

## Shared section patterns

| Section type | Small label | Main heading |
| --- | --- | --- |
| First text section after the hero | Column 1, top aligned | Starts at column 3 |
| Later heading sections | Column 1, bottom aligned to the heading row | Starts at column 5 |

The first pattern covers Home's introduction, About's In short and Approach's How I work. The later pattern covers Home Services and Clients, About Selected clients, and Approach Working together / A few useful answers.

The reusable native hooks are `edit-heading--later`, `edit-label--bottom`, `section-label--bottom` and `section-heading--later`, alongside the existing Services and Clients classes. Bottom labels use relative positioning with automatic top offset. Compact overrides reset placement and alignment so label and heading stack normally.

The runtime no longer forces these bottom labels into sticky, top-aligned rows. List-specific and media-side captions keep their existing layouts. About Selected work retains its media-side caption; its label uses the muted colour and campaign-experience copy uses foreground/white.

## Caption and control repairs

The project-card caption transition had two properties but only one duration/easing entry. Webflow serialized the second entry as `left undefined undefined`, invalidating the transition. Each property now has an explicit duration and easing, preserving the intended one-second curve for both top and left.

The same serialization repair was applied to Home Slide Info and project navigation buttons while retaining their existing timing. Circular project navigation buttons now have an explicit 2.5rem width, height and flex basis.

Gallery/List and the project counter use the same Spacing / space/1 gap. Extra padding and fixed widths were removed from slash elements. Runtime breadcrumbs and counts use the same spacing token.

## Email and footer variants

Both Copy Email variants use a relative, one-line clipped mask. Alternate text is absolutely positioned below the resting line in Designer. Runtime state transforms select the email, hover instruction or copied confirmation within that one slot.

Footer Back To Top enables the shared one-em SVG arrow and rotates it upwards. The old separate up-arrow element and aside background stay hidden. Runtime hover motion uses a small upward lift.

Final QA found that Grid also used the Back To Top variant. A separate **Footer Grid** variant now preserves its text styling and hover while hiding the arrow. Its label, keyboard shortcut and `#layout-grid` hook remain intact.

## Coverage and maintenance

All ten native page trees and 35 shared component definitions were inspected. The populated layouts are Home, Projects, Approach, About, Projects Template, Password and 404. Clients, Services and Project Media templates have empty bodies, so there is no designed layout in those templates to repair.

After future native track changes, reload Designer before measuring its generated rules. Validate the first/later heading patterns at desktop and compact widths. Do not add published-only geometry fixes that leave the native canvas inconsistent.

The full native change record and before/after style data are retained privately with the project owner. The browser observations, automated checks and release runtime are recorded in [VALIDATION.md](../VALIDATION.md).

## 25 November 2026 migration

The native portfolio now uses underscore-separated component classes, shared `u-` utilities and scoped `is-` variants. Earlier sections record the class names used on 23 November. For example, the former `home-hero__layout`, `layout__grid` and `case-index__grid` are now `home_hero_layout`, `layout_grid` and `case_index_grid` respectively.

Use the draft **Style Guide** in Designer to inspect the portfolio’s type, spacing, theme and grid examples. The shared **Global Styles** component supplies the responsive container rules on the populated page templates. Native `u-container` establishes inline-size containment. Five About sections and the Working Method section on Approach also use `u-query-container`, so their responsive flags follow the width available to each section. Fixed editorial compositions retain explicit native tracks because a variable repeat previously produced extra tracks on the Designer canvas. The About client grid uses `auto-fill` with a 7.5rem minimum. The related-project grid uses its container’s responsive column settings and stacks on compact screens.

The runtime keeps the 24 November motion settings, including the homepage text exit over 40vh of scroll. When changing the generated CSS or JavaScript, run `npm run check` and `npm run build`, fetch the immutable CDN assets, then update both complete Webflow site-level custom-code blocks from `webflow/head.html` and `webflow/footer.html` in the same staging release. The head owns first-paint loader classes that the shared runtime also uses.

Staging was checked on Home, Projects, Approach, About, all three published project pages, Password and 404 at 1366px and 390px. The release bundle is `ac8435cc9e1dfcc5325957efe6d9537a678bb7a8`.

### 25 November 2026 · Native button and interaction cleanup

The Webflow Button component and the shared Global Styles component now own the rollover system. Set `data-trigger` on the interactive element. Its text and icon inherit that state. Desktop navigation uses `hover-other focus-other` within a group to dim peers while only the hovered or keyboard-focused item moves its own label. Set `data-state` for native current links, pressed controls or checked inputs as appropriate. Gallery and List are native buttons with `aria-pressed`.

Footer email has three native label positions for the address, Copy Email and confirmation. The clipboard handler sets `data-copy-status="copied"` after a successful write. Back to Top uses the native up-arrow SVG and its own rollover. The footer invitation is a heading. The runtime no longer assigns generated trigger classes or repairs link semantics at startup.

Use `--site--margin`, `--site--gutter` and `--site--column-count` for their respective layout measurements, and the Typography collection for shared family, size and letter spacing. The Projects CMS gallery's native card and track are `work_card_wrap` and `work_gallery_track`. Native CMS video embeds use `media_video` on their video elements for fill and cover sizing. Their CMS media URLs and playback settings remain available to the player. The shared showreel preview uses `showreel_poster`. Earlier entries record historical selector names.

This earlier staging build used `8f764cff329dcee6ac5d135ef41e4573fc94a095` in both Webflow custom-code snippets.

### Production-readiness checks

The Home work and services sections display their first class, `section_wrap`, in Navigator. Use the shared native `u-section` utility for their section spacing. The portfolio has 527 native styles, including the draft Style Guide, and 119 variables across 12 collections. All Webflow Classic events and action lists were removed.

Project search and sharing previews use the Projects collection's Name, Project Summary and Thumbnail fields. Client names come from the Clients reference. The Services collection feeds the Home listings and has its detail template disabled.

The gallery exposes its current desktop card to keyboard and screen-reader navigation. Full players load video on demand and share the playback adapter. About’s client previews request a responsive poster on hover. The current asset commit is recorded in `head.html` and `footer.html`.

### 25 November 2026 · Control polish and idle work

The FAQ icon's native `faq_icon` class centres its glyph in the existing two-rem square with an explicit centre transform origin. The existing attribute-driven CSS rotation and timing remain unchanged.

Projects Gallery/List controls use a two-and-a-half-rem-high native rail to share the counter/arrow centreline. The `nav_link` class resets button appearance, background, borders and padding; its labels retain the existing CSS current, hover and focus states. Both rails use the same typography token. The view controls have a labelled `group` role and native pressed buttons.

Project Lightbox now contains a native decorative `showreel_play_icon` SVG, outside the hidden full player. The card's `data-trigger="hover focus"` drives its opacity through the Global Styles trigger variables. It appears on touch layouts without requiring hover and hides while the full player is active. Project hero media retains its existing cursor label. The runtime no longer clones a play SVG or carries the old `jk_play_icon` selectors.

The cursor controller schedules hit tests only after pointer, scroll, viewport, route or player-state changes. Gallery and List skip identical resting paints. Marquees pause outside the viewport and in hidden tabs. Reduced-motion changes disable Lenis and stop marquee movement. Hidden desktop service comparisons are inert; compact layouts restore their interaction. Paragraph SplitText keeps real text exposed without a prohibited paragraph ARIA label. Loader choreography and the forty-vh homepage text exit are preserved.

### 25 November 2026 · Final semantics and contrast

Source revision `d60998215ed8a2314e2640c377265c3924c64f43` reserves SplitText replacement accessible names for headings. Generic phrases and paragraphs retain their real text; paragraph/span content and loader messages use span wrappers. Odometer values expose one visually hidden static value while the animated digit layers remain decorative.

Inactive Projects controls consume the shared muted-text token. Light-theme muted text uses the existing neutral-600 token. The native palette and the existing CSS hover, focus and selected states remain the owners of appearance.

`npm run check`, `npm run build` and `git diff --check` pass for this cleanup. Staging publication and final Chrome DOM/contrast verification are complete; both asset pins and CDN content match this revision. The [performance audit](../validation/portfolio-polish-2026-11-25.md) contains the PageSpeed report links and explicitly associates those measurements with the earlier `1ac983f` runtime. The unsuccessful narrow-viewport override is recorded separately from the valid mobile lab runs. No custom production domains were published in this pass.
