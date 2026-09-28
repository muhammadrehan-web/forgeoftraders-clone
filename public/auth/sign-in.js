(function () {
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

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    mark(email);
    mark(password);
    if (email.value.trim() === "") email.focus();
    else if (password.value.trim() === "") password.focus();
    else window.location.href = "/dashboard";
  });
})();
