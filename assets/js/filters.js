(() => {
  const q = document.getElementById("search"),
    s = document.getElementById("status"),
    f = document.getElementById("francois"),
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
    const query = norm(q.value.trim());
    let n = 0;
    for (const tr of rows) {
      const show = (!query || tr.dataset.nsearch.includes(query)) &&
        (s.value === "all" || tr.dataset.tier === s.value) &&
        (!f.checked || tr.dataset.francois === "true");
      tr.hidden = !show;
      if (show) n++;
    }
    count.textContent = n + " of " + rows.length + " candidates";
    empty.hidden = n !== 0;
    stats();
  }
  [q, s, f].forEach((el) => el.addEventListener("input", update));
  update();
})();
