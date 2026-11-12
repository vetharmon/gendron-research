(() => {
  const MONTREAL = [45.5017, -73.5673];
  const rows = (window.GG_NAMES || []).map((c) => {
    const words = String(c.t || "").split(/\s+/).filter(Boolean);
    while (words.length > 1) {
      const w = words[words.length - 1];
      if (/[A-Za-zÀ-ÿ]/.test(w) && w === w.toUpperCase()) words.pop();
      else break;
    }
    return { given: words.join(" "), full: String(c.t || ""), place: String(c.p || ""), tier: c.tier || "none", url: c.u || "#" };
  });
  const keyOf = (p) => p.split(" (")[0];
  const distEl = document.getElementById("names-dist");
  const tierEl = document.getElementById("names-tier");
  const kmLabel = document.getElementById("names-km-label");
  const summary = document.getElementById("names-summary");
  const namesBody = document.getElementById("names-body");
  const placesBody = document.getElementById("names-places-body");
  const nameEl = document.getElementById("names-name");
  const candBody = document.getElementById("names-candidates-body");
  const TIER_LABEL = { solid: "Solid elimination", likely: "Likely elimination", possible: "Possible elimination", none: "Not eliminated", proposed: "Proposed identity" };
  if (nameEl) {
    const counts = new Map();
    for (const r of rows) counts.set(r.given, (counts.get(r.given) || 0) + 1);
    [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .forEach(([g, n]) => { const o = document.createElement("option"); o.value = g; o.textContent = g + " (" + n + ")"; nameEl.appendChild(o); });
    nameEl.addEventListener("change", render);
  }
  if (!distEl || !tierEl || !namesBody || !placesBody) return;

  function haversineKm(lat1, lon1, lat2, lon2) {
    const R = 6371, t = Math.PI / 180;
    const a = Math.sin((lat2 - lat1) * t / 2) ** 2 +
      Math.cos(lat1 * t) * Math.cos(lat2 * t) * Math.sin((lon2 - lon1) * t / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(a));
  }
  const esc = (s) => s.replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
  let PLACES = null;

  function render() {
    if (!PLACES) return;
    const maxKm = +distEl.value;
    const anyDist = maxKm >= +distEl.max;
    kmLabel.textContent = anyDist ? "all" : "≤ " + maxKm + " km";
    const distOf = (place) => {
      const c = PLACES[keyOf(place)];
      return c ? haversineKm(MONTREAL[0], MONTREAL[1], c[0], c[1]) : null;
    };
    const filtered = rows.filter((r) => {
      if (tierEl.value !== "all" && r.tier !== tierEl.value) return false;
      const d = distOf(r.place);
      return anyDist || (d !== null && d <= maxKm);
    });

    const names = new Map();
    for (const r of filtered) {
      if (!names.has(r.given)) names.set(r.given, { count: 0, parishes: new Set() });
      const n = names.get(r.given);
      n.count++;
      n.parishes.add(keyOf(r.place));
    }
    const nameRows = [...names.entries()].sort((a, b) => b[1].count - a[1].count || a[0].localeCompare(b[0]));
    namesBody.innerHTML = nameRows.length
      ? nameRows.map(([name, n]) => `<tr><td>${esc(name)}</td><td>${n.count}</td><td>${n.parishes.size}</td></tr>`).join("")
      : `<tr><td colspan="3">No candidates match these filters.</td></tr>`;

    const places = new Map();
    for (const r of filtered) places.set(r.place, (places.get(r.place) || 0) + 1);
    const placeRows = [...places.entries()]
      .map(([place, count]) => ({ place, count, km: distOf(place) }))
      .sort((a, b) => (a.km === null ? Infinity : a.km) - (b.km === null ? Infinity : b.km));
    placesBody.innerHTML = placeRows.length
      ? placeRows.map((p) => `<tr><td>${esc(p.place)}</td><td>${p.km === null ? "—" : Math.round(p.km)}</td><td>${p.count}</td></tr>`).join("")
      : `<tr><td colspan="3">No parishes match these filters.</td></tr>`;

    if (candBody) {
      const sel = nameEl ? nameEl.value : "all";
      const cand = filtered.filter((r) => sel === "all" || r.given === sel)
        .map((r) => ({ r, km: distOf(r.place) }))
        .sort((a, b) => (a.km === null ? Infinity : a.km) - (b.km === null ? Infinity : b.km) || a.r.full.localeCompare(b.r.full));
      candBody.innerHTML = cand.length
        ? cand.map(({ r, km }) => `<tr><td><a href="${r.url}">${esc(r.full)}</a></td><td>${esc(r.place)}</td><td>${km === null ? "—" : Math.round(km)}</td><td>${TIER_LABEL[r.tier] || r.tier}</td></tr>`).join("")
        : `<tr><td colspan="4">No candidates match these filters.</td></tr>`;
    }

    summary.textContent = `${filtered.length} of ${rows.length} candidates · ${anyDist ? "any distance" : "≤ " + maxKm + " km"} from Montréal`;
  }

  distEl.addEventListener("input", render);
  tierEl.addEventListener("change", render);
  fetch((window.GG_BASE || "") + "/assets/data/places.json")
    .then((r) => r.json())
    .then((j) => { PLACES = j; distEl.disabled = false; render(); })
    .catch(() => { PLACES = {}; render(); });
})();
