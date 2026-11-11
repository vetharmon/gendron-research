# PRDH cards branch

This branch adds an original presentation of previously saved research. It does not deploy or change candidate assessments.

- Every candidate layout, including the separate C127 proposed-identity layout, gets a right-hand record panel and formatted cards immediately below the write-up.
- The searchable index uses the same components and structured facts. Reference-only cards and missing categories remain visible.
- Card identifiers are separated by individual/family/event type. Source filenames and recovery methods stay attached to facts. No screenshots or full copied PRDH exports are committed.
- OCR remains explicitly unreviewed. Most family child tables still need transcription; they are not presented as complete. C226/C138's existing family dossier supplies its twelve-child table.
- The saved 1851 burial assertion on C127's old individual and family cards is explicitly disputed and omitted from accepted date fields.
- The Bible gallery uses the six historical pages and exterior photograph shared in June 2026. No affidavit, email body, contact details, or original email PDF is committed. Web images preserve the historical writing; they are not retouched. The source pages were visually inspected before selection.

`assets/data/prdh-research-cards.json` is the editable publication data. Each card carries `facts`, `participants`, `children`, `notes`, `sources`, `recovery`, and an optional `warning`. `coverage` associates records with candidates and preserves the basis of inferred matches. Updating cards does not require opening PRDH again.

The exporter in `scripts/build_prdh_cards.py` accepts the private recovery JSON as input. That private input is not in the repository. Hand-reviewed additions should be reflected in the exporter or preserved when regenerating. This branch's GitHub action builds Jekyll without deploying.

## Validation in this workspace

- JavaScript syntax and structured-data integrity passed. Both candidate layouts include the panels exactly once.
- A Liquid-compatible local renderer produced 283 candidate/family pages plus the card index and Bible gallery. This is a preview render, not a native Jekyll build.
- DOM checks passed for C001, C127, C226 and C243, including missing-card states, the C127 burial warning, C226's twelve children, index filtering/pagination, and all candidate/card references.
- All six Bible pages and the exterior image were visually inspected; the gallery excludes affidavit and email content.
- Native Chromium could not launch because the environment blocks its Unix socket. Browser layout screenshots are therefore not verified. The branch-only Jekyll workflow has not run because pushing the public branch was blocked by automatic approval review.
