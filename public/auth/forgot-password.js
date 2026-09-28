(function () {
  var form = document.getElementById("formAuthentication");
  var email = document.getElementById("email");
  var note = document.getElementById("reset-note");

  function feedback(message) {
    var box = email.parentElement.querySelector(".invalid-feedback");
    email.classList.toggle("is-invalid", message !== "");
    if (box) box.textContent = message;
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    var value = email.value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      feedback("Please enter a valid email");
      email.focus();
      return;
    }
    feedback("");
    var button = form.querySelector("button[type='submit']");
    button.disabled = true;
    fetch("/api/auth/forgot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: value })
    }).then(function (response) {
      return response.json().catch(function () { return {}; }).then(function (data) {
        button.disabled = false;
        if (!response.ok) {
          feedback(data.error || "Could not send the reset email. Try again.");
          return;
        }
        form.hidden = true;
        if (note) note.hidden = false;
      });
    }).catch(function () {
      button.disabled = false;
      feedback("Could not send the reset email. Try again.");
    });
  });
})();
