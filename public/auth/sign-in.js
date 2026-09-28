(function () {
  var params = new URLSearchParams(window.location.search);
  var note = document.querySelector(".welcome-note");
  if (note && params.get("welcome") === "1") note.hidden = false;
  if (note && params.get("reset") === "1") {
    note.textContent = "Your password was updated. Sign in with the new one.";
    note.hidden = false;
  }

  var form = document.getElementById("formAuthentication");
  var email = document.getElementById("email");
  var password = document.getElementById("password");
  var toggle = document.querySelector(".password-toggle");

  toggle.addEventListener("click", function () {
    var show = password.type === "password";
    password.type = show ? "text" : "password";
    toggle.setAttribute("aria-label", show ? "Hide password" : "Show password");
    toggle.classList.toggle("is-visible", show);
  });

  function mark(input) {
    input.classList.toggle("is-invalid", input.value.trim() === "");
  }

  email.addEventListener("input", function () { mark(email); });
  password.addEventListener("input", function () { mark(password); });

  function feedback(input, message) {
    var box = input.parentElement.querySelector(".invalid-feedback");
    input.classList.toggle("is-invalid", message !== "");
    if (box) box.textContent = message;
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    mark(email);
    mark(password);
    feedback(email, email.value.trim() === "" ? "Please enter your email" : "");
    feedback(password, password.value.trim() === "" ? "Please enter your password" : "");
    if (email.value.trim() === "") {
      email.focus();
      return;
    }
    if (password.value.trim() === "") {
      password.focus();
      return;
    }
    fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: email.value.trim(),
        password: password.value
      })
    }).then(function (response) {
      return response.json().catch(function () { return {}; }).then(function (data) {
        if (!response.ok) {
          feedback(password, data.error || "Incorrect email or password");
          password.focus();
          return;
        }
        window.location.href = "/dashboard";
      });
    }).catch(function () {
      feedback(password, "Could not sign in. Try again.");
    });
  });
})();
