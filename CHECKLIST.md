# Template-Builder Readiness Checklist

This checklist defines what is required to support this repository as a sellable template-builder project, with clear specifications and measurable success criteria.

| #   | Checklist Item                      | Defined Specification                                                                                                                                                                  | Success Criteria                                                                                                                           |
| --- | ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | Commercial licensing clearance      | The project has explicit written rights to sell/distribute commercially, covering all source files and dependencies.                                                                   | A signed commercial permission or replacement license is stored in repo docs and no file-level license conflicts remain.                   |
| 2   | Product identity in template config | Update template.conf with production template name, author, and finalized layout labels (no placeholder branding).                                                                     | Template appears with final brand name/author in Squarespace Developer Mode and passes internal naming conventions.                        |
| 3   | Template metadata completeness      | Define all required layout/navigation/style declarations in template.conf, including final stylesheet order and optional feature flags.                                                | No missing or unused config keys; local dev and Squarespace runtime load without config warnings or errors.                                |
| 4   | Global shell robustness             | Ensure site.region includes stable header, navigation, main content, footer, and script loading behavior for authenticated and public users.                                           | Core site shell renders correctly on homepage, collection list, collection item, and static pages in both logged-in and logged-out states. |
| 5   | Variant system productization       | Replace manual variant file swapping in blocks/home-active.block with documented, buyer-safe configuration toggles.                                                                    | A non-developer can switch approved variants using documented settings without editing template files.                                     |
| 6   | Style editor and tweak coverage     | Add buyer-facing controls for colors, typography, spacing, buttons, header/footer, and section rhythm (mapped to LESS variables and style editor settings).                            | Every key visual token can be changed via settings; no manual code edits are required for standard branding customization.                 |
| 7   | Typography and asset compliance     | Define allowed font strategy and asset rules in assets/README.md, including file-size/format constraints and fallback behavior.                                                        | Font and icon assets load correctly, remain within documented limits, and degrade gracefully when unavailable.                             |
| 8   | Content model completeness          | Ensure each supported collection type has valid .conf plus .list/.item templates; validate blog implementation in collections/blog.conf, collections/blog.list, collections/blog.item. | All supported collection types can be created and rendered without missing template errors.                                                |
| 9   | Static page coverage                | Define required static templates (home/about/contact/legal, etc.) and implement or organize in pages.                                                                                  | Required page archetypes can be added by end users and match product design and behavior expectations.                                     |
| 10  | Responsive behavior standards       | Define breakpoint system and layout rules for mobile/tablet/desktop including navigation, hero, cards, forms, and blog templates.                                                      | No horizontal overflow, broken navigation, or unreadable typography at agreed viewport widths.                                             |
| 11  | Accessibility baseline              | Enforce semantic structure, heading hierarchy, keyboard navigation, visible focus states, color contrast, alt text handling, and reduced motion behavior.                              | Manual accessibility QA passes documented checklist; no blocking accessibility defects remain in critical flows.                           |
| 12  | Script performance and safety       | Audit scripts/site.js and scripts/guards.js for dependency reliability, failure handling, and non-blocking behavior.                                                                   | Site remains functional when optional scripts fail; no render-blocking regressions are introduced by custom scripts.                       |
| 13  | QA test matrix and sign-off         | Create repeatable QA checklist for page types, user states, browsers, and devices; include regression checks for layout, forms, navigation, and scripts.                               | Test matrix is completed with sign-off artifacts and zero unresolved critical/high defects.                                                |
| 14  | Buyer documentation package         | Publish buyer docs: install/setup, customization guide, variant guide, known limits, troubleshooting, and update/migration guide.                                                      | A first-time buyer can install and customize the template using docs only, without developer intervention.                                 |
| 15  | Release and versioning process      | Define semantic version policy, changelog format, release gates, and rollback procedure for template updates.                                                                          | Every release includes version tag, changelog, validation record, and reproducible rollback path.                                          |
| 16  | Support and policy docs             | Add support scope, response policy, compatibility policy, and legal docs for buyers (EULA/terms/refund where applicable).                                                              | Commercial delivery package includes complete policy set and no ambiguity about support boundaries.                                        |
| 17  | Commercial readiness gate           | Add final go-live checklist requiring legal, QA, docs, and packaging completion before public sale.                                                                                    | Launch is blocked unless all mandatory gate items are marked complete and approved.                                                        |

## Optional Tracking Fields

Use this section if you want to track completion in-repo.

| Item # | Owner | Status      | Evidence Link | Notes |
| ------ | ----- | ----------- | ------------- | ----- |
| 1      |       | Not Started |               |       |
| 2      |       | Not Started |               |       |
| 3      |       | Not Started |               |       |
| 4      |       | Not Started |               |       |
| 5      |       | Not Started |               |       |
| 6      |       | Not Started |               |       |
| 7      |       | Not Started |               |       |
| 8      |       | Not Started |               |       |
| 9      |       | Not Started |               |       |
| 10     |       | Not Started |               |       |
| 11     |       | Not Started |               |       |
| 12     |       | Not Started |               |       |
| 13     |       | Not Started |               |       |
| 14     |       | Not Started |               |       |
| 15     |       | Not Started |               |       |
| 16     |       | Not Started |               |       |
| 17     |       | Not Started |               |       |
