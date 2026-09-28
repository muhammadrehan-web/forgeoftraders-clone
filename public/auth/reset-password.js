(function () {
  var form = document.getElementById("formAuthentication");
  var password = document.getElementById("password");
  var toggle = document.querySelector(".password-toggle");
  var token = new URLSearchParams(window.location.search).get("token") || "";

  toggle.addEventListener("click", function () {
    var show = password.type === "password";
    password.type = show ? "text" : "password";
    toggle.setAttribute("aria-label", show ? "Hide password" : "Show password");
    toggle.classList.toggle("is-visible", show);
  });

  function feedback(message) {
    var box = password.parentElement.querySelector(".invalid-feedback");
    password.classList.toggle("is-invalid", message !== "");
    if (box) box.textContent = message;
  }

  if (!token) feedback("This reset link is not valid.");

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    if (password.value.length < 6) {
      feedback("Password must be at least 6 characters");
      password.focus();
      return;
    }
    feedback("");
    fetch("/api/auth/reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: token, password: password.value })
    }).then(function (response) {
      return response.json().catch(function () { return {}; }).then(function (data) {
        if (!response.ok) {
          feedback(data.error || "Could not save the new password.");
          return;
        }
        window.location.href = "/sign-in?reset=1";
      });
    }).catch(function () {
      feedback("Could not save the new password.");
    });
  });
})();
