# Candidate documents and translations

Each candidate page groups copies and finding links for the same historical act. One selected source supplies the displayed transcription; its English translation appears alongside it. Separate acts remain separate even when they share an image or register URL.

## Source fields

The `sources` list retains each source's original URL, provenance, transcription, text type and reading notes. Add these presentation fields to non-PRDH source entries:

| Field | Purpose |
| --- | --- |
| `document_id` | Stable group identifier, usually `act-` plus the recorded LAFRANCE act number. Use a distinct identifier when a purported match remains unproved. |
| `document_primary` | Exactly one `true` value per group selects its displayed text. |
| `document_title` | Concise record type and documented date, stored on the selected source. |
| `document_note` | Material qualifications and differences between copies, stored on the selected source. |
| `text_language` | Language of the selected text, such as `fr`, `en` or `mixed`. |
| `translation` | Complete English translation of the selected non-English text, preserving uncertainty. |
| `copy_label` | Optional short link label. The existing source label is the fallback. |

Choose a directly checked original over an unverified counterpart. Prefer the civil copy when both are equally well checked. An archival transcription, partial reading, abstract or index summary retains its own `text_type`; grouping does not turn it into an inspected original.

Translate every clause of the selected text, including witnesses, occupations, signatures and corrections. Preserve uncertain names and conflicting dates. When editing a selected transcription, review its English translation in the same change. An already-English source needs no duplicate translation. A source with no transcription receives no invented text.

An explicit act number normally supports grouping. It does not override an audit finding that the claimed counterpart is a different or still-unmatched act. Conversely, two index entries for twins may represent one physical joint baptism. Record such decisions in `document_note`.

## Biography citations

Biographies use chronological bullets with citations to the supporting document group, for example:

```markdown
- **Marriage:** The proposed adult match married on 18 July 1843. [Marriage](#document-act-13400833)
```

Preserve qualified identifications and conflicting evidence. Research notes can support a statement about the current research, but should not be presented as a newly inspected original. Existing detailed notes appear under `## Evidence notes {#evidence-notes}`; the optional structured search log has the anchor `#search-log`.

## Google research workbook

The workbook's Sources tab retains one row per original source. The group fields and English translation are stored in that row's Extra JSON, alongside its existing transcription and reading notes. Narratives stores the cited Markdown biography and evidence notes. Existing publication flags stay unchanged. Reconcile these fields when updating the site; the workbook does not automatically publish candidate edits.
