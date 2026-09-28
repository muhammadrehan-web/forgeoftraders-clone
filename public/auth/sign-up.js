(function () {
  var page = document.querySelector(".auth__page--register");
  var form = document.getElementById("formAuthentication");
  var first = document.getElementById("first_name");
  var last = document.getElementById("last_name");
  var email = document.getElementById("email");
  var password = document.getElementById("password");
  var toggle = document.querySelector(".password-toggle");
  var heading = document.querySelector(".page__body h2");
  var step = "account";
  var savedEmail = "";

  function messageFor(input) {
    var value = input.value.trim();
    if (input === first && value === "") return "Please enter first name";
    if (input === last && value === "") return "Please enter last name";
    if (input === email) {
      if (value === "") return "Please enter your email";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "Please enter valid email address";
    }
    if (input === password) {
      if (value === "") return "Please enter password";
      if (value.length < 6) return "Password must be at least 6 characters";
    }
    return "";
  }

  function show(input, message) {
    var box = form.querySelector('.invalid-feedback[data-for="' + input.id + '"]');
    var text = message == null ? messageFor(input) : message;
    input.classList.toggle("is-invalid", text !== "");
    if (box) box.textContent = text;
  }

  [first, last, email, password].forEach(function (input) {
    input.addEventListener("input", function () { show(input); });
  });

  toggle.addEventListener("click", function () {
    var visible = password.type === "password";
    password.type = visible ? "text" : "password";
    toggle.setAttribute("aria-label", visible ? "Hide password" : "Show password");
    toggle.classList.toggle("is-visible", visible);
  });

  function post(url, body) {
    return fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    }).then(function (response) {
      return response.json().catch(function () { return {}; }).then(function (data) {
        return { ok: response.ok, status: response.status, data: data };
      });
    });
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    if (step === "account") {
      [first, last, email].forEach(function (input) { show(input); });
      var invalid = [first, last, email].find(function (input) {
        return input.classList.contains("is-invalid");
      });
      if (invalid) {
        invalid.focus();
        return;
      }
      post("/api/auth/register", {
        firstName: first.value.trim(),
        lastName: last.value.trim(),
        email: email.value.trim()
      }).then(function (result) {
        if (!result.ok) {
          show(email, result.data.error || "Could not save your account. Try again.");
          email.focus();
          return;
        }
        savedEmail = email.value.trim().toLowerCase();
        step = "password";
        page.classList.add("is-password");
        if (heading) heading.textContent = "Create a password for your account";
        password.focus();
      }).catch(function () {
        show(email, "Could not save your account. Try again.");
      });
      return;
    }

    show(password);
    if (password.classList.contains("is-invalid")) {
      password.focus();
      return;
    }
    post("/api/auth/password", {
      email: savedEmail,
      password: password.value
    }).then(function (result) {
      if (!result.ok) {
        show(password, result.data.error || "Could not save your password. Try again.");
        password.focus();
        return;
      }
      window.location.href = result.data.emailSent ? "/sign-in?welcome=1" : "/sign-in";
    }).catch(function () {
      show(password, "Could not save your password. Try again.");
    });
  });
})();
