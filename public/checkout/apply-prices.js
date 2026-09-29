(function () {
  var catalog = [];

  function money(value) {
    var amount = Number(value);
    return amount.toFixed(2);
  }

  function applyBalances() {
    catalog.forEach(function (item) {
      var next = JSON.stringify(item.balances);
      document.querySelectorAll('[data-challenge-id="' + item.id + '"]').forEach(function (input) {
        if (input.dataset.balances !== next) input.dataset.balances = next;
      });
    });
  }

  function selectedPrice() {
    var challenge = document.querySelector('input[name="challenge_id&evaluation_stage"]:checked');
    if (!challenge || !challenge.dataset.balances) return null;
    var balance = document.querySelector('input[name="balance"]:checked');
    var hidden = document.getElementById("selectedBalance");
    var size = Number(balance ? balance.value : (hidden ? hidden.value : 0));
    var balances;
    try {
      balances = JSON.parse(challenge.dataset.balances);
    } catch (error) {
      return null;
    }
    var match = balances.find(function (row) { return Number(row.size) === size; });
    return match ? Number(match.price) : null;
  }

  function paint() {
    applyBalances();
    var price = selectedPrice();
    if (price == null || !Number.isFinite(price)) return;
    var text = money(price);
    var original = document.getElementById("original-price");
    if (original && original.textContent.trim() !== text) original.textContent = text;
    var hiddenPrice = document.getElementById("original_price");
    if (hiddenPrice && hiddenPrice.value !== String(price)) hiddenPrice.value = String(price);
    document.querySelectorAll(".right__info-rows p").forEach(function (row) {
      if (!/Evaluation Fee/i.test(row.textContent || "")) return;
      var span = row.querySelector("span:last-child");
      var label = "$" + text;
      if (span && span.textContent.trim() !== label) span.textContent = label;
    });
  }

  fetch("/api/prices")
    .then(function (response) { return response.json(); })
    .then(function (data) {
      catalog = data.challenges || [];
      paint();
      var card = document.getElementById("checkout-card");
      var parent = card && card.parentNode ? card.parentNode : document.body;
      new MutationObserver(function () { paint(); }).observe(parent, { childList: true, subtree: true });
    })
    .catch(function () {});

  document.addEventListener("change", function () { paint(); });
})();
