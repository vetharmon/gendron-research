// Maps for the Gendron / Gendreau Research Atlas.
// Candidate pages: one pin per place named in that candidate's records.
// Dashboard: one pin per baptism place, sized by how many candidates share it.
// If Leaflet or the data files fail to load, the pages simply show no map.
(function () {
  if (!window.L) return;
  var base = window.GG_BASE || "";
  var MERGE = { "Sorel-Tracy": "Sorel", "L'Acadie, Saint-Jean-sur-Richelieu": "L'Acadie" };
  function canon(p) { return MERGE[p] || p; }

  function fetchJSON(path) {
    return fetch(path).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; });
  }

  function makeMap(el, zoom) {
    var map = L.map(el, { scrollWheelZoom: false });
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
      maxZoom: 17
    }).addTo(map);
    map.on("focus", function () { map.scrollWheelZoom.enable(); });
    map.on("blur", function () { map.scrollWheelZoom.disable(); });
    return map;
  }

  var TIER_COLORS = { solid: "#1e7d46", likely: "#2f6fb2", possible: "#e09f00", none: "#c0392b", proposed: "#b8860b" };
  var TIER_LABEL = { solid: "Solid", likely: "Likely", possible: "Possible", none: "Not eliminated", proposed: "Proposed" };
  var STRENGTH = { none: 0, possible: 1, likely: 2, proposed: 3, solid: 4 };
  function weakestTier(list) {
    var pool = list.filter(function (b) { return b.tier !== "proposed"; });
    if (!pool.length) return "proposed";
    return pool.reduce(function (a, b) { return STRENGTH[b.tier] < STRENGTH[a] ? b.tier : a; }, pool[0].tier);
  }

  function pin(map, latlon, html, color) {
    return L.circleMarker(latlon, {
      radius: 6, color: "#4a3208", weight: 1.5, fillColor: color || "#e8a33d", fillOpacity: 0.9
    }).addTo(map).bindPopup(html);
  }

  // ---- Candidate page map ----
  var candEl = document.getElementById("cand-map");
  if (candEl) {
    var cid = candEl.getAttribute("data-cid");
    var ctier = candEl.getAttribute("data-tier");
    Promise.all([fetchJSON(base + "/assets/data/places.json"), fetchJSON(base + "/assets/data/records.json")])
      .then(function (res) {
        var places = res[0], records = res[1];
        if (!places || !records || !records[cid]) { candEl.parentElement.style.display = "none"; return; }
        var byPlace = {};
        records[cid].forEach(function (r) {
          var p = canon(r.place);
          if (!places[p]) return;
          (byPlace[p] = byPlace[p] || []).push(r);
        });
        var names = Object.keys(byPlace);
        if (!names.length) { candEl.parentElement.style.display = "none"; return; }
        var map = makeMap(candEl);
        var bounds = [];
        names.forEach(function (p) {
          var lines = byPlace[p].map(function (r) {
            return r.type + (r.date ? " — " + r.date : "");
          });
          pin(map, places[p], "<strong>" + p + "</strong><br>" + lines.join("<br>"), TIER_COLORS[ctier]);
          bounds.push(places[p]);
        });
        if (bounds.length === 1) map.setView(bounds[0], 9);
        else map.fitBounds(bounds, { padding: [24, 24] });
      });
  }

  // ---- Dashboard map ----
  // Follows the register's filters: the "François only" checkbox and the
  // Assessment dropdown re-plot the
  // map with just the François candidates' baptism places and refits the view.
  var dashEl = document.getElementById("dash-map");
  if (dashEl && window.GG_BAPTISMS) {
    fetchJSON(base + "/assets/data/places.json").then(function (places) {
      if (!places) { dashEl.parentElement.style.display = "none"; return; }
      var map = makeMap(dashEl);
      var layer = L.layerGroup().addTo(map);
      var toggle = document.getElementById("francois");
      var statusSel = document.getElementById("status");
      var distEl = document.getElementById("dist");
      var MTL = [45.5017, -73.5673];
      function hav(a, b) {
        var p1 = a[0] * Math.PI / 180, p2 = b[0] * Math.PI / 180;
        var dp = p2 - p1, dl = (b[1] - a[1]) * Math.PI / 180;
        var h = Math.sin(dp / 2) * Math.sin(dp / 2) + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) * Math.sin(dl / 2);
        return 2 * 6371 * Math.asin(Math.sqrt(h));
      }
      var note = document.getElementById("map-note");
      function draw() {
        var onlyFr = !!(toggle && toggle.checked);
        var cat = statusSel ? statusSel.value : "all";
        var byPlace = {};
        var shown = 0;
        var maxKm = (distEl && !distEl.disabled) ? +distEl.value : null;
        var unlimited = (maxKm === null || maxKm >= +distEl.max);
        window.GG_BAPTISMS.forEach(function (b) {
          if (onlyFr && !b.fr) return;
          if (cat !== "all" && b.tier !== cat) return;
          if (!unlimited) {
            var bp = canon(b.place);
            if (!places[bp] || hav(MTL, places[bp]) > maxKm) return;
          }
          var p = canon(b.place);
          if (!places[p]) return;
          (byPlace[p] = byPlace[p] || []).push(b);
          shown++;
        });
        layer.clearLayers();
        var bounds = [];
        Object.keys(byPlace).forEach(function (p) {
          var list = byPlace[p];
          var links = list.slice(0, 10).map(function (b) {
            return '<a href="' + b.url + '">' + b.id + " · " + b.name + "</a> · " + (TIER_LABEL[b.tier] || b.tier);
          }).join("<br>");
          if (list.length > 10) links += "<br>… and " + (list.length - 10) + " more (see the table)";
          L.circleMarker(places[p], {
            radius: Math.min(6 + list.length, 16), color: "#4a3208", weight: 1.5,
            fillColor: TIER_COLORS[weakestTier(list)], fillOpacity: 0.8
          }).addTo(layer).bindPopup("<strong>" + p + "</strong> — " + list.length +
            (list.length === 1 ? " candidate" : " candidates") + "<br>" + links);
          bounds.push(places[p]);
        });
        if (places["Châteauguay"]) {
          L.marker(places["Châteauguay"], {
            icon: L.divIcon({ className: "map-star-wrap", html: '<span class="map-star">★</span>', iconSize: [26, 26], iconAnchor: [13, 13] }),
            keyboard: false
          }).addTo(layer).bindPopup("<strong>Châteauguay</strong> — Saint-Joachim parish. The proposed candidate, François Gendron (C127), was baptized here on 6 September 1823.");
        }
        if (bounds.length === 1) map.setView(bounds[0], 9);
        else if (bounds.length) map.fitBounds(bounds, { padding: [24, 24] });
        if (note) {
          var parts = [];
          if (onlyFr) parts.push("François only");
          if (!unlimited) parts.push("within " + maxKm + " km of Montréal");
          if (cat !== "all" && statusSel) parts.push(statusSel.options[statusSel.selectedIndex].text);
          note.hidden = parts.length === 0;
          if (parts.length) note.textContent = "Map filtered — " + parts.join(" · ") + ": " + shown + (shown === 1 ? " candidate" : " candidates") + ".";
        }
      }
      draw();
      if (toggle) toggle.addEventListener("change", draw);
      if (statusSel) statusSel.addEventListener("change", draw);
      if (distEl) distEl.addEventListener("input", draw);
    });
  }
})();
