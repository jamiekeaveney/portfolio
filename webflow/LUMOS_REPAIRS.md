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
