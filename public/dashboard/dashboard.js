(function () {
  document.querySelectorAll(".menu-item.has-sub > .menu-link").forEach(function (link) {
    link.addEventListener("click", function (event) {
      event.preventDefault();
      link.parentElement.classList.toggle("open");
    });
  });

  var user = document.querySelector(".navbar__user");
  var avatar = document.querySelector(".user-dropdown__btn");
  avatar.addEventListener("click", function () {
    user.classList.toggle("open");
  });
  document.addEventListener("click", function (event) {
    if (!user.contains(event.target)) user.classList.remove("open");
  });

  var cookie = document.querySelector(".cookie-consent-banner");
  cookie.querySelectorAll("button").forEach(function (button) {
    button.addEventListener("click", function () {
      cookie.remove();
    });
  });
})();
