(() => {
  const q = document.getElementById("search"),
    s = document.getElementById("status"),
    f = document.getElementById("francois"),
    rows = [...document.querySelectorAll("#results tr")],
    count = document.getElementById("count"),
    empty = document.getElementById("empty"),
    sum = {
      total: document.getElementById("sum-total"),
      excluded: document.getElementById("sum-excluded"),
      alternatives: document.getElementById("sum-alternatives"),
      proposed: document.getElementById("sum-proposed")
    },
    all = sum.total ? {
      total: sum.total.textContent,
      excluded: sum.excluded.textContent,
      alternatives: sum.alternatives.textContent,
      proposed: sum.proposed.textContent
    } : null;
  // Accent- and apostrophe-insensitive matching: "Francois" finds "François",
  // "Chateauguay" finds "Châteauguay".
  const norm = (x) => x.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/’/g, "'").toLocaleLowerCase();
  rows.forEach((tr) => { tr.dataset.nsearch = norm(tr.dataset.search || ""); });
  function stats() {
    if (!all) return;
    if (f.checked) {
      let t = 0, e = 0, a = 0, p = 0;
      for (const tr of rows) {
        if (tr.dataset.francois !== "true") continue;
        t++;
        if (tr.dataset.category === "excluded") e++;
        else if (tr.dataset.category === "proposed") p++;
        else if (tr.dataset.category === "qualified" || tr.dataset.category === "unresolved") a++;
      }
      sum.total.textContent = t;
      sum.excluded.textContent = e;
      sum.alternatives.textContent = a;
      sum.proposed.textContent = p;
    } else {
      sum.total.textContent = all.total;
      sum.excluded.textContent = all.excluded;
      sum.alternatives.textContent = all.alternatives;
      sum.proposed.textContent = all.proposed;
    }
  }
  function update() {
    const query = norm(q.value.trim());
    let n = 0;
    for (const tr of rows) {
      const show = (!query || tr.dataset.nsearch.includes(query)) &&
        (s.value === "all" || tr.dataset.category === s.value) &&
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
