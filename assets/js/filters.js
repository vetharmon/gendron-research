(() => {
  const q = document.getElementById("search"),
    s = document.getElementById("status"),
    f = document.getElementById("francois"),
    d = document.getElementById("dist"),
    dout = document.getElementById("dist-out"),
    rows = [...document.querySelectorAll("#results tr")],
    count = document.getElementById("count"),
    empty = document.getElementById("empty"),
    sum = {
      total: document.getElementById("sum-total"),
      solid: document.getElementById("sum-solid"),
      likely: document.getElementById("sum-likely"),
      possible: document.getElementById("sum-possible"),
      open: document.getElementById("sum-open"),
      proposed: document.getElementById("sum-proposed")
    },
    all = sum.total ? {
      total: sum.total.textContent,
      solid: sum.solid.textContent,
      likely: sum.likely.textContent,
      possible: sum.possible.textContent,
      open: sum.open.textContent,
      proposed: sum.proposed.textContent
    } : null;
  // Accent- and apostrophe-insensitive matching: "Francois" finds "François",
  // "Chateauguay" finds "Châteauguay".
  const norm = (x) => x.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/’/g, "'").toLocaleLowerCase();
  rows.forEach((tr) => { tr.dataset.nsearch = norm(tr.dataset.search || ""); });
  function stats() {
    if (!all) return;
    if (f.checked) {
      const c = { total: 0, solid: 0, likely: 0, possible: 0, open: 0, proposed: 0 };
      for (const tr of rows) {
        if (tr.dataset.francois !== "true") continue;
        c.total++;
        if (tr.dataset.tier === "none") c.open++;
        else if (c[tr.dataset.tier] !== undefined) c[tr.dataset.tier]++;
      }
      sum.total.textContent = c.total;
      sum.solid.textContent = c.solid;
      sum.likely.textContent = c.likely;
      sum.possible.textContent = c.possible;
      sum.open.textContent = c.open;
      sum.proposed.textContent = c.proposed;
    } else {
      sum.total.textContent = all.total;
      sum.solid.textContent = all.solid;
      sum.likely.textContent = all.likely;
      sum.possible.textContent = all.possible;
      sum.open.textContent = all.open;
      sum.proposed.textContent = all.proposed;
    }
  }
  function update() {
    if (d && dout) dout.textContent = (d.disabled || +d.value >= +d.max) ? "all" : "\u2264 " + d.value + " km";
    const query = norm(q.value.trim());
    let n = 0;
    for (const tr of rows) {
      const show = (!query || tr.dataset.nsearch.includes(query)) &&
        (s.value === "all" || tr.dataset.tier === s.value) &&
        (!f.checked || tr.dataset.francois === "true") &&
        (!d || d.disabled || +d.value >= +d.max || (tr.dataset.dist !== undefined && +tr.dataset.dist <= +d.value));
      tr.hidden = !show;
      if (show) n++;
    }
    count.textContent = n + " of " + rows.length + " candidates";
    empty.hidden = n !== 0;
    stats();
  }
  [q, s, f, d].forEach((el) => { if (el) el.addEventListener("input", update); });
  // Distance of each baptism place from Montréal, from the same coordinates
  // the maps use. Until the data arrives the slider stays disabled and
  // nothing is filtered by distance.
  const MTL = [45.5017, -73.5673];
  const MERGE = { "Sorel-Tracy": "Sorel", "L'Acadie, Saint-Jean-sur-Richelieu": "L'Acadie" };
  const hav = (a, b) => {
    const p1 = a[0] * Math.PI / 180, p2 = b[0] * Math.PI / 180;
    const dp = p2 - p1, dl = (b[1] - a[1]) * Math.PI / 180;
    const h = Math.sin(dp / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2;
    return 2 * 6371 * Math.asin(Math.sqrt(h));
  };
  if (d) {
    fetch((window.GG_BASE || "") + "/assets/data/places.json")
      .then((r) => (r.ok ? r.json() : null))
      .then((places) => {
        if (!places) return;
        const dist = {};
        for (const k in places) dist[k] = hav(MTL, places[k]);
        rows.forEach((tr) => {
          const p = MERGE[tr.dataset.place] || tr.dataset.place;
          if (dist[p] !== undefined) tr.dataset.dist = Math.round(dist[p]);
        });
        d.disabled = false;
        update();
      })
      .catch(() => {});
  }
  update();
})();
