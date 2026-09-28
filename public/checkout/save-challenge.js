(function () {
  var saving = false;

  function text(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function labelFor(input) {
    if (!input || !input.id) return "";
    var label = document.querySelector('label[for="' + input.id + '"]');
    return label ? text(label.innerText) : "";
  }

  function selection() {
    var challenge = document.querySelector('input[name="challenge_id&evaluation_stage"]:checked');
    var evaluationType = "";
    if (challenge) {
      var value = challenge.value || "";
      var amp = value.indexOf("&");
      evaluationType = text(amp >= 0 ? value.slice(amp + 1) : value).replace(/\s*\(\d+\)\s*$/, "");
    }

    var balance = document.querySelector('input[name="balance"]:checked');
    var accountSize = Number(balance ? balance.value : (document.getElementById("selectedBalance") || {}).value);

    var platformInput = document.querySelector('input[name="platform_type"]:checked');
    var platform = labelFor(platformInput) || (document.getElementById("selectedPlatform") || {}).value || "Match-Trader";

    var fee = 0;
    if (challenge && challenge.dataset.balances) {
      try {
        var balances = JSON.parse(challenge.dataset.balances);
        var match = balances.find(function (item) { return Number(item.size) === accountSize; });
        if (match) fee = Number(match.price) || 0;
      } catch (error) {}
    }

    var addons = Array.prototype.map.call(
      document.querySelectorAll('input[name="add_on_type[]"]:checked'),
      labelFor
    ).filter(Boolean);

    return { evaluationType: evaluationType, accountSize: accountSize, platform: platform, fee: fee, addons: addons };
  }

  function note(message) {
    var box = document.querySelector(".checkout__form-buttons");
    if (!box) return;
    var el = document.getElementById("challenge-save-note");
    if (!el) {
      el = document.createElement("p");
      el.id = "challenge-save-note";
      el.style.margin = "12px 0 0";
      el.style.color = "#e64542";
      box.appendChild(el);
    }
    el.textContent = message;
  }

  function save(button) {
    if (saving) return;
    var picked = selection();
    if (!picked.evaluationType) {
      note("Select a challenge first.");
      return;
    }
    saving = true;
    if (button) button.disabled = true;
    fetch("/api/challenges", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(picked)
    }).then(function (response) {
      return response.json().catch(function () { return {}; }).then(function (data) {
        if (response.status === 401) {
          window.location.href = "/sign-in";
          return;
        }
        if (!response.ok) {
          saving = false;
          if (button) button.disabled = false;
          note(data.error || "Could not save this challenge.");
          return;
        }
        window.location.href = "/my-challenges";
      });
    }).catch(function () {
      saving = false;
      if (button) button.disabled = false;
      note("Could not save this challenge. Try again.");
    });
  }

  document.addEventListener("click", function (event) {
    var button = event.target && event.target.closest
      ? event.target.closest(".checkout__form-buttons button[type='submit']")
      : null;
    if (!button || !document.getElementById("selectedChallenge")) return;
    event.preventDefault();
    event.stopPropagation();
    if (event.stopImmediatePropagation) event.stopImmediatePropagation();
    save(button);
  }, true);

  document.addEventListener("submit", function (event) {
    var form = event.target;
    if (!form || !form.querySelector || !form.querySelector("#selectedChallenge")) return;
    event.preventDefault();
    event.stopPropagation();
    if (event.stopImmediatePropagation) event.stopImmediatePropagation();
    save(form.querySelector(".checkout__form-buttons button[type='submit']"));
  }, true);
})();
