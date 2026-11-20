# KUTA website QA report

Review date: November 20, 2026 (Asia/Manila)

Tested the production build of the local QA changes. The public KUTA site was checked separately with read-only requests.

## Findings and fixes

| Severity | Location | Issue | Fix |
| --- | --- | --- | --- |
| High | Administrator dashboard, record editor and storage | Saving an edit could lose an author's suffix or link to a different author with the same given and family names. A legacy author with only one recorded name also blocked an otherwise valid edit. | Accept and preserve optional suffixes, keep legacy single-name authors editable, and include the suffix when matching or creating the author record. |
| Medium | Register, 360 px in Firefox and WebKit | The long academic program options could widen the form beyond the viewport in both orientations. | Constrain the form's grid column to the available width. |
| Medium | Register and Forgot password | After the form replaced the submit controls with a verification-code or password field, keyboard focus could be left behind. A long school address could also run beyond the form. | Move focus to the new field or confirmation when each step opens. Allow long addresses to wrap. |
| Medium | Sign-in and registration forms, slow WebKit page startup | Text typed before the form finished initializing could disappear. The browser could also focus a required field underneath the sticky header. | Enable the account controls when initialization finishes. Bring a focused invalid field into view below the header. |
| Medium | Administrator dashboard in narrow Firefox | The page footer could cover the floating save confirmation and block its Dismiss button. | Put the save confirmation alongside the form controls. Keep it available until dismissed or the next save begins. |
| Medium | Administrator record and review forms | The text inside the wrapped form labels could change the exposed name when a populated field was rendered again. | Give the affected selects and textareas stable accessible names and expose formatting instructions separately as descriptions. |
| Medium | Research paper details | An unavailable paper displayed a “not found” message with a successful HTTP response. Pending-paper titles could also say “not found” in the browser tab for an administrator who could view the record. | Use the framework's 404 response and give visitors an archive return link. Resolve the browser title using the same access rules as the page. |
| Medium | Full paper dialog | Escape could leave focus in the wrong place on the detail page. A hidden PDF viewer could fetch its document before the dialog opened. The empty message referenced a PDF even when no file existed. | Restore focus to the exact opening control, load the PDF viewer only while the dialog is open, and give an accurate empty or failure message. |
| Medium | Research keyword chips | “+N more” applied a single keyword filter while the label implied it would show more keywords. | Make it expand and collapse the remaining chips. Individual chips still apply a keyword filter. |
| Medium | Shared header and Favorites background checks | An unsigned visitor generated recurring unauthorized responses and console errors during normal browsing. | Use an optional session probe that reports a signed-out state successfully. Existing routes that require authentication still reject unauthenticated access. |
| Medium | Shared keyboard navigation in WebKit | The default keyboard sequence could skip the “Skip to content” link. | Give the skip link an explicit first tab stop. |
| Medium | Favorites and research loading placeholders | An accessible name on a generic loading container was invalid in WebKit. Some labeled groups also lacked a group role. | Hide decorative placeholders from assistive technology, keep the existing live loading status, and give the labeled groups a group role. |
| Medium | All pages | The site canceled the native context menu, blocking normal copy, link, and browser actions. | Restore the native context menu. The separate, existing developer-tools shortcut behavior was preserved. |
| Low | Home, learning module | The no-JavaScript fallback put a style tag inside the page body. | Put the fallback style in the document head and keep the static learning content in the body. |
| Low | Home, FAQ, About, shared footer, Favorites, account forms, and admin | Outdated Google sign-in instructions, an FAQ claiming the archive was empty, a footer saying archive records were still pending, a contact heading with no contact information, and inconsistent labels and singular/plural copy. | Use the current SLSU account flow and archive status, polish labels and copy, and keep the original About anchor working as “Explore.” FAQ years use the archive's year range. |
| Low | Forgot password | The page fell back to the general site title and indexing instructions. | Give it a password-reset title and the private-page indexing setting. |

The spelling of Felisicimo E. Santiago matches the university’s published listing, even though the underlying filename uses a different spelling. [SLSU Gumaca campus directory](https://www.slsu.edu.ph/slsu-gumaca/)

## Checklist

| Area | Reviewed |
| --- | --- |
| Shared shell | Logo and primary, mobile, and footer navigation. Skip link, tab order, focus rings, sticky header, theme switch, color-vision choices, account menus, sign-out, scrolling, and Escape behavior. |
| Home | Search label and submission, hero and footer links, statistics, program marquee links, all paper-part, search-example, and sample-citation tabs, tab keyboard controls and panel height, sample copy, and the no-JavaScript learning content. |
| Research list | Search, author, program, year, and sort fields. Submit and clear. Keyword filter, chip expansion, result/card links, abstract show/hide/expansion, cite and favorites controls, and role-dependent access. |
| Paper details | Back link, keywords and metadata, guest sign-in return link, abstract and citation access, citation formats and reference-number field, copy and download controls, full-paper dialog, PDF access, and missing-paper response. |
| Year, Programs, About, FAQ | Year and program destinations, counts and accessible names, About jump links and portraits, FAQ accordion keyboard states, back-to-top link and search call to action. |
| Account | Required fields, institutional email, all registration fields, invalid sign-in and successful sign-in, verification fields, resend cooldown, invalid code, reset password form, keyboard focus, and sign-out. |
| Favorites | Saved-record and empty states, remove action, focus after removal, archive return link, loading, retry, pagination, and stale response regression. |
| Admin | Search and review selectors, record inputs and notes, required validation, category read-only state, add/edit/cancel/delete, author suffixes, PDF validation and download, batch template, preview, confirmation, Escape and import report. |
| Links and markup | Destination and fragment scan. No shipped external new-tab links were found in the reviewed public templates. Rendered HTML checks covered nesting, attributes, duplicate IDs and references. CSS parsing covered app and component stylesheets. |
| Accessibility and layout | Labels, roles, headings, accessible names, image alternatives, keyboard focus, dialog focus return, text contrast where assessable, visible-control hit testing, clipping, horizontal overflow, initial layout shifts and console messages. |

## Browser and link evidence

- **480 page and role checks** across Chrome, Edge, Firefox, and WebKit. Each ran at 360, 768, 1024 and 1440 px widths, once portrait and once landscape, for 15 page/role combinations. The 360 px landscape viewport was 360 × 280. Light mode was tested in portrait and dark mode in landscape. No unexpected console warnings, initial viewport control obstructions, horizontal overflow, duplicate IDs, broken loaded images or violations in the configured axe scans remained in that matrix.
- **120 post-fix page and role checks** in the four browser environments scrolled enabled controls into view and checked their click targets. The additional **32 dashboard checks** repeated this at every width and orientation after fixing the covered save confirmation.
- **32 registration checks** covered the same browser and viewport matrix. A separate WebKit test delayed the page scripts, checked that the controls started disabled, and confirmed at 360 × 280 that the first invalid field became focused and fully visible below the header.
- **All 19 learning tabs were retested** on the final build at 360 and 1440 px in all four environments. The eight paper parts, three search examples, and eight citation formats each activated their corresponding panel without changing the panel stack height. Home and End keyboard selection and copying the selected sample citation also passed.
- The final interactive rerun passed **24 of 24 groups** covering the learning tabs, sign-in, sign-out, registration, verification, resend cooldown, and password reset at 360 and 1440 px in all four environments. The earlier targeted rerun also passed the dashboard, research filters and citations, FAQ and anchor, and navigation flows after their fixes.
- **80 rendered local link targets** returned the expected page or fragment. The separate public check passed **11 live routes and all 19 published paper links**.
- The targeted rendered HTML validator and CSS parser reported no remaining findings. TypeScript, production build, lint, auth HTTP, record-import, and Favorites unit checks passed. The learning fallback worked with JavaScript disabled, and the native context-menu event was allowed on form fields.
- The lowest measured contrast across 474 sampled locations in both themes and all three color-vision settings was **4.98:1**.

## Coverage limits

The workstation runs Windows. WebKit was tested as the Safari engine; native Safari and physical iOS/Android browser runs were unavailable. Phone and tablet results are viewport or touch emulations. Registration and password-reset screens used test responses for email delivery, with separate local account and code lifecycle tests. No production email was sent and no live archive records were edited. This report covers the routes, roles, controls, fixtures, and states listed above.
