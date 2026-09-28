(function () {
  var form = document.getElementById("formAuthentication");
  var first = document.getElementById("first_name");
  var last = document.getElementById("last_name");
  var email = document.getElementById("email");

  function messageFor(input) {
    var value = input.value.trim();
    if (input === first && value === "") return "Please enter first name";
    if (input === last && value === "") return "Please enter last name";
    if (input === email) {
      if (value === "") return "Please enter your email";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "Please enter valid email address";
    }
    return "";
  }

  function show(input) {
    var box = form.querySelector('.invalid-feedback[data-for="' + input.id + '"]');
    var message = messageFor(input);
    input.classList.toggle("is-invalid", message !== "");
    box.textContent = message;
  }

  [first, last, email].forEach(function (input) {
    input.addEventListener("input", function () { show(input); });
  });

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    [first, last, email].forEach(show);
    var invalid = [first, last, email].find(function (input) {
      return input.classList.contains("is-invalid");
    });
    if (invalid) invalid.focus();
  });
})();
