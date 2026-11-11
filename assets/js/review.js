// Review form on candidate pages. The site is static, so a submission does
// not post anywhere by itself: it opens a prefilled GitHub issue on the
// (public) repository, or copies a plain-text summary the reviewer can
// paste wherever the team is working. Site updates are applied from those
// submissions.
(function () {
  var forms = document.querySelectorAll(".review-form");
  if (!forms.length) return;
  var REPO = "https://github.com/vetharmon/gendron-research";
  var TIER_LABEL = {
    solid: "Solid elimination",
    likely: "Likely elimination",
    possible: "Possible elimination",
    none: "Not eliminated",
    proposed: "Proposed identity"
  };
  forms.forEach(function (form) {
    var cid = form.getAttribute("data-cid");
    var title = form.getAttribute("data-title");
    var current = form.getAttribute("data-current");
    var done = form.querySelector(".rv-done");
    function summary() {
      var reviewer = form.querySelector('[name="reviewer"]').value;
      var tier = form.querySelector('[name="tier"]').value;
      var records = form.querySelector('[name="records"]').value.trim();
      var notes = form.querySelector('[name="notes"]').value.trim();
      return {
        heading: "Review " + cid + " — " + title,
        body:
          "Candidate: " + cid + " — " + title + "\n" +
          "Reviewer: " + reviewer + "\n" +
          "Current assessment: " + (TIER_LABEL[current] || current) + "\n" +
          "Proposed assessment: " + (TIER_LABEL[tier] || tier) + "\n\n" +
          "Records checked:\n" + (records || "(none listed)") + "\n\n" +
          "Notes / reasoning:\n" + (notes || "(none)")
      };
    }
    form.querySelector(".rv-issue").addEventListener("click", function () {
      var s = summary();
      var url = REPO + "/issues/new?title=" + encodeURIComponent(s.heading) +
        "&body=" + encodeURIComponent(s.body);
      window.open(url, "_blank", "noopener");
      if (done) { done.hidden = false; done.textContent = "Issue opened in a new tab — submit it there to file the review."; }
    });
    form.querySelector(".rv-copy").addEventListener("click", function () {
      var s = summary();
      var text = s.heading + "\n\n" + s.body;
      function ok() { if (done) { done.hidden = false; done.textContent = "Summary copied — paste it wherever the team is working."; } }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(ok, ok);
      } else { ok(); }
    });
  });
})();
