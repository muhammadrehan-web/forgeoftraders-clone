(function () {
  var style = document.createElement("style");
  style.textContent = ".taken-challenges{display:flex;flex-direction:column;gap:12px;margin-top:8px}.taken-challenge{border:1px solid rgba(194,150,53,.45);border-radius:12px;padding:16px 18px;background:#121618}.taken-challenge h3{margin:0 0 6px;color:#c29635;font-size:18px}.taken-challenge p{margin:0;color:#d7d3cb}.taken-challenge p+p{margin-top:4px;color:#9aa3a7}";
  document.head.appendChild(style);

  function money(value) {
    return "$" + Number(value || 0).toLocaleString("en-US");
  }

  function renderDashboards(data) {
    var empty = Array.prototype.find.call(document.querySelectorAll("p"), function (node) {
      return node.textContent.trim() === "No dashboards found";
    });
    if (!empty) return;
    if (!data.challenges.length) return;
    var list = document.createElement("div");
    list.className = "taken-challenges";
    data.challenges.forEach(function (item) {
      var card = document.createElement("article");
      card.className = "taken-challenge";
      var title = document.createElement("h3");
      title.textContent = item.evaluationType;
      var detail = document.createElement("p");
      detail.textContent = money(item.accountSize) + " · " + item.platform;
      var who = document.createElement("p");
      who.textContent = "Taken by " + data.takenBy;
      card.appendChild(title);
      card.appendChild(detail);
      card.appendChild(who);
      list.appendChild(card);
    });
    empty.replaceWith(list);
  }

  function renderFeed(data) {
    var copy = document.querySelector(".feed-copy");
    if (!copy || !data.challenges.length) return;
    var lines = copy.querySelectorAll("p");
    if (lines.length < 2) return;
    var latest = data.challenges[0];
    lines[0].textContent = latest.evaluationType;
    lines[1].textContent = money(latest.accountSize) + " taken by " + data.takenBy;
  }

  fetch("/api/challenges").then(function (response) {
    return response.json().catch(function () { return {}; }).then(function (data) {
      if (!response.ok || !data.challenges) return;
      renderDashboards(data);
      renderFeed(data);
    });
  }).catch(function () {});
})();
