---
layout: default
title: About this research
permalink: /about/
---
# About this research

This site examines the proposed identification of Franklin Jondro of Missouri as François Gendron, born and baptized at Châteauguay, Québec, on 6 September 1823.

The register covers Gendron and Gendreau baptismal entries from 1816–1830. Each candidate has a permanent C-series ID, a biography, an assessment, and source references.

## Assessments

- **Eliminated:** a childhood death or a separate adult identity distinguishes the candidate from Franklin. C154 is excluded because original records identify the family as Gautron dit Larochelle; his later life remains unknown. Duplicate index entries are not counted as eliminations.
- **Likely eliminated:** the later record is a probable match, with a specific identification question still to resolve.
- **Possible elimination:** a later record is under review; the candidate remains possible.
- **Needs work:** research has not yet established a later identity or an elimination.
- **Proposed identity:** C127, the 1823 Châteauguay François. No located record directly connects his baptism to Franklin's Missouri life.

{% assign counted = site.candidates | where_exp: 'c', "c.category != 'index-error'" %}
The register contains **{{ site.candidates | size }} entries representing {{ counted | size }} distinct candidates**: **{{ counted | where: 'tier', 'solid' | size }} eliminated**, **{{ counted | where: 'tier', 'likely' | size }} likely eliminated**, **{{ counted | where: 'tier', 'possible' | size }} possible eliminations**, **{{ counted | where: 'tier', 'none' | size }} needing work**, and **{{ counted | where: 'tier', 'proposed' | size }} proposed identity**. C270 duplicates C200 and is excluded from these counts.

## Sources and method

Candidates are compared through baptism, burial, marriage, and census records. Parents, spouses, children, occupations, and places connect records across a person's life. Name and age discrepancies are noted with the relevant evidence.

Document descriptions are summaries. Quotations are identified in the text. Source links lead to the original provider, including BAnQ, FamilySearch, Library and Archives Canada, Généalogie Québec, and PRDH-IGD. Some require an account or subscription.

Register and census scans remain with their providers. The [family Bible gallery]({{ '/family-bible/' | relative_url }}) contains photographs from the family collection. Parish photographs are credited individually.

[Family records]({{ '/families/' | relative_url }}) collect related households and their sources. The [research log]({{ '/research-log/' | relative_url }}) records searches for candidates still under investigation.
