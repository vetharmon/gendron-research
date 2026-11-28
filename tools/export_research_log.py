#!/usr/bin/env python3
"""Export the public research log from the 'Gendron Research Log' workbook.

Reads the Log and Candidates tabs through the Google Sheets CLI, keeps only
Log rows with Publish = TRUE and only the public columns (Date, Candidate,
Name, Researcher, Source / Place checked, Search / Action, Outcome), joins
each candidate's baptism, place and tier from the Candidates tab, and writes
assets/data/research_log.json for the site's research-log page.

Privacy gate: Publish = FALSE rows never leave the workbook. Run this after
logging new research or changing Publish flags, then commit the JSON.
Requires: /opt/hatch/bin/hatch_gws_cli with the Google Sheets connection.
"""
import json, subprocess, sys, datetime

CLI = "/opt/hatch/bin/hatch_gws_cli"
WORKBOOK = "1qKiRp9tKqCHYS0IPVqWJMWhNaoYXMWU57u3bm-66q9k"
OUT = "assets/data/research_log.json"

def request(command, params):
    r = subprocess.run([CLI, "sheets", "spreadsheets", *command,
                        "--params", json.dumps(params),
                        "--format", "json"], capture_output=True, text=True)
    if r.returncode != 0:
        sys.exit(f"read failed for {command}: {r.stdout} {r.stderr}")
    return json.loads(r.stdout)

def get(rng):
    return request(["values", "get"], {"spreadsheetId": WORKBOOK, "range": rng}).get("values", [])

def cell(row, i):
    value = row[i] if len(row) > i else ""
    if isinstance(value, bool):
        return "TRUE" if value else "FALSE"
    return str(value).strip() if value is not None else ""

metadata = request(["get"], {"spreadsheetId": WORKBOOK, "fields": "sheets.properties"})
row_counts = {s["properties"]["title"]: s["properties"]["gridProperties"]["rowCount"]
              for s in metadata.get("sheets", [])}
for required in ("Candidates", "Log"):
    if required not in row_counts:
        sys.exit(f"missing sheet metadata: {required}")

cand_rows = get(f"Candidates!A2:H{row_counts['Candidates']}")
cands = {}
for r in cand_rows:
    cid = cell(r, 0)
    if cid:
        cands[cid] = {"name": cell(r, 1), "baptism": cell(r, 2),
                      "place": cell(r, 3), "tier": cell(r, 4)}

entries = []
for r in get(f"Log!A2:H{row_counts['Log']}"):
    if cell(r, 7) != "TRUE":
        continue
    cid = cell(r, 1)
    meta = cands.get(cid, {})
    entries.append({
        "date": cell(r, 0), "candidate": cid,
        "name": cell(r, 2) or meta.get("name", ""),
        "researcher": cell(r, 3), "source": cell(r, 4),
        "action": cell(r, 5), "outcome": cell(r, 6),
        "baptism": meta.get("baptism", ""), "place": meta.get("place", ""),
        "tier": meta.get("tier", ""),
    })

doc = {"generated": datetime.date.today().isoformat(), "count": len(entries),
       "entries": entries}
with open(OUT, "w") as f:
    json.dump(doc, f, ensure_ascii=False, indent=1)
print(f"wrote {OUT}: {len(entries)} published entries")
